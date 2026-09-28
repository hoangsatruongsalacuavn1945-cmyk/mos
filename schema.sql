-- ============================================================================
-- MOS MASTER PLATFORM - NORMALIZED POSTGRESQL SCHEMA
-- ============================================================================
-- Normalized tables as specified:
-- 1. `users` (id, email, password_hash, role)
-- 2. `questions` (id, subject, type, content, metadata)
-- 3. `attempts` (id, user_id, exam_id, score, started_at, completed_at)
-- 4. `exam_results` (id, attempt_id, question_id, is_correct, user_answer)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. TABLE: users
-- ============================================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin')),
    full_name VARCHAR(150),
    student_code VARCHAR(50) UNIQUE,
    classroom VARCHAR(100),
    assigned_teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
    streak_days INT NOT NULL DEFAULT 1 CHECK (streak_days >= 0),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
    last_active_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_student_code ON users(student_code);
CREATE INDEX idx_users_classroom ON users(classroom);
CREATE INDEX idx_users_assigned_teacher ON users(assigned_teacher_id);

-- ============================================================================
-- 2. TABLE: questions
-- ============================================================================
-- Normalized table storing the question pool.
-- `content`: Contains the main prompt / question statement
-- `metadata`: JSONB containing options, domain info, difficulty, points, 
--             and the shielded secrets (correct_answer, official_ribbon_path, explanation).
CREATE TABLE questions (
    id VARCHAR(64) PRIMARY KEY,
    subject VARCHAR(50) NOT NULL CHECK (subject IN ('word', 'excel', 'powerpoint', 'mixed')),
    type VARCHAR(50) NOT NULL DEFAULT 'multiple-choice' CHECK (type IN ('multiple-choice', 'scenario-task', 'ribbon-locate', 'shortcut-drill')),
    content TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_questions_subject ON questions(subject);
CREATE INDEX idx_questions_type ON questions(type);
CREATE INDEX idx_questions_active ON questions(is_active);
CREATE INDEX idx_questions_metadata_domain ON questions USING gin ((metadata -> 'domain_id'));

-- ============================================================================
-- 3. TABLE: attempts
-- ============================================================================
-- Represents an exam or practice attempt taken by a student.
CREATE TABLE attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exam_id VARCHAR(100) NOT NULL, -- e.g. 'mock-excel-2026-01', 'mo-200-final'
    score INT NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 1000),
    started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ,
    status VARCHAR(50) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'timed_out', 'terminated_cheating')),
    time_spent_seconds INT NOT NULL DEFAULT 0 CHECK (time_spent_seconds >= 0),
    total_questions INT NOT NULL DEFAULT 25 CHECK (total_questions > 0),
    correct_count INT NOT NULL DEFAULT 0 CHECK (correct_count >= 0),
    passed BOOLEAN NOT NULL DEFAULT FALSE,
    violations_count INT NOT NULL DEFAULT 0 CHECK (violations_count >= 0),
    anti_cheat_logs JSONB NOT NULL DEFAULT '[]'::jsonb,
    draft_answers JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_attempts_user ON attempts(user_id);
CREATE INDEX idx_attempts_exam ON attempts(exam_id);
CREATE INDEX idx_attempts_status ON attempts(status);
CREATE INDEX idx_attempts_score ON attempts(score DESC, time_spent_seconds ASC);
CREATE INDEX idx_attempts_completed_at ON attempts(completed_at DESC);

-- ============================================================================
-- 4. TABLE: exam_results
-- ============================================================================
-- Granular normalized per-question outcome for each attempt.
CREATE TABLE exam_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
    question_id VARCHAR(64) NOT NULL REFERENCES questions(id) ON DELETE RESTRICT,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    user_answer TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_attempt_question UNIQUE (attempt_id, question_id)
);

CREATE INDEX idx_exam_results_attempt ON exam_results(attempt_id);
CREATE INDEX idx_exam_results_question ON exam_results(question_id);
CREATE INDEX idx_exam_results_is_correct ON exam_results(is_correct);

-- ============================================================================
-- 5. SECURITY: ROW LEVEL SECURITY & SANITIZED VIEWS
-- ============================================================================

-- Secure view for student-facing queries:
-- Strips correct_answer and explanation out of metadata on the database engine level!
CREATE OR REPLACE VIEW v_student_questions AS
SELECT 
    id,
    subject,
    type,
    content,
    (metadata - 'correct_answer' - 'official_ribbon_path' - 'explanation' - 'shortcut_tip') AS metadata,
    is_active
FROM questions
WHERE is_active = TRUE;

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_results ENABLE ROW LEVEL SECURITY;

-- Auto-update timestamps trigger
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();

CREATE TRIGGER trg_questions_updated
BEFORE UPDATE ON questions
FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();
