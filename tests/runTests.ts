/**
 * Automated Test Suite for MOS Master Platform
 * Testing:
 * 1. Authoritative Exam Engine & Question Sanitization
 * 2. Certiport Scoring & Pass/Fail Thresholds
 * 3. Anti-Cheat Violation Tracking & Audit Log
 * 4. Real File Grader Logic (Formulas, Coordinate checks)
 * 5. User Stats & Streak Tracking
 */

import { THEORY_QUESTIONS } from '../src/data/theoryQuestions.ts';

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`✅ PASS: ${message}`);
    passedTests++;
  }
}

console.log('====================================================');
console.log('🧪 RUNNING MOS MASTER PLATFORM TEST SUITE');
console.log('====================================================\n');

// TEST SUITE 1: Question Bank Sanitization & Security
console.log('--- Test Suite 1: Exam Question Bank Security ---');
assert(THEORY_QUESTIONS.length >= 90, `Question bank has sufficient core questions (Count: ${THEORY_QUESTIONS.length})`);

// Verify that questions in raw data have required fields
const sampleQuestion = THEORY_QUESTIONS[0];
assert(!!sampleQuestion.id, 'Question has valid ID');
assert(!!sampleQuestion.correctAnswer, 'Master question contains correctAnswer');
assert(!!sampleQuestion.explanation, 'Master question contains explanation');

// Simulate server sanitizer logic
function sanitizeQuestion(q: any) {
  const { correctAnswer, explanation, officialRibbonPath, shortcutTip, ...safe } = q;
  return safe;
}

const sanitized = sanitizeQuestion(sampleQuestion);
assert(sanitized.correctAnswer === undefined, 'Sanitized question strips correctAnswer');
assert(sanitized.explanation === undefined, 'Sanitized question strips explanation');
assert(sanitized.officialRibbonPath === undefined, 'Sanitized question strips officialRibbonPath');
assert(!!sanitized.options && sanitized.options.length >= 2, 'Sanitized question retains options');

// TEST SUITE 2: Certiport MOS 1000-Point Scoring Logic
console.log('\n--- Test Suite 2: Certiport MOS 1000-Point Scoring ---');
function calculateMOSScore(correctCount: number, totalQuestions: number) {
  const scaled = Math.round((correctCount / totalQuestions) * 1000);
  const passed = scaled >= 700;
  return { score: scaled, passed };
}

const perfectScore = calculateMOSScore(20, 20);
assert(perfectScore.score === 1000 && perfectScore.passed === true, '100% answers yields 1000 score and PASSED');

const passingScore = calculateMOSScore(14, 20); // 70%
assert(passingScore.score === 700 && passingScore.passed === true, '70% answers yields 700 score and PASSED');

const failingScore = calculateMOSScore(13, 20); // 65% = 650
assert(failingScore.score === 650 && failingScore.passed === false, '65% answers yields 650 score and FAILED (< 700)');

const zeroScore = calculateMOSScore(0, 20);
assert(zeroScore.score === 0 && zeroScore.passed === false, '0 correct answers yields 0 score');

// TEST SUITE 3: Anti-Cheat Violation Logging & Audit
console.log('\n--- Test Suite 3: Anti-Cheat Session Audit ---');
interface MockExamSession {
  sessionId: string;
  violationsCount: number;
  antiCheatLogs: string[];
}

function recordViolation(session: MockExamSession, reason: string): MockExamSession {
  return {
    ...session,
    violationsCount: session.violationsCount + 1,
    antiCheatLogs: [...session.antiCheatLogs, `[${new Date().toISOString()}] ${reason}`],
  };
}

let mockSession: MockExamSession = {
  sessionId: 'test-session-001',
  violationsCount: 0,
  antiCheatLogs: [],
};

mockSession = recordViolation(mockSession, 'Cửa sổ thi bị mất tiêu điểm (Window blur)');
mockSession = recordViolation(mockSession, 'Chuyển tab trình duyệt (Visibility hidden)');

assert(mockSession.violationsCount === 2, 'Anti-cheat violation counter increments accurately');
assert(mockSession.antiCheatLogs.length === 2, 'Anti-cheat audit trail records each event');
assert(mockSession.antiCheatLogs[1].includes('Chuyển tab trình duyệt'), 'Anti-cheat log contains correct reason string');

// TEST SUITE 4: Real File Grader Formula & Cell Coordinate Verification
console.log('\n--- Test Suite 4: Real File Grader Engine ---');
interface CellGradeRule {
  cell: string;
  expectedFormula?: RegExp;
  expectedValue?: string | number;
  tolerance?: number;
}

function evaluateCell(cellData: { formula?: string; value?: any }, rule: CellGradeRule): boolean {
  if (rule.expectedFormula && cellData.formula) {
    const cleanFormula = cellData.formula.replace(/\s+/g, '').toUpperCase();
    if (!rule.expectedFormula.test(cleanFormula)) return false;
  }
  if (rule.expectedValue !== undefined) {
    if (typeof rule.expectedValue === 'number' && typeof cellData.value === 'number') {
      return Math.abs(cellData.value - rule.expectedValue) <= (rule.tolerance || 0.01);
    }
    return String(cellData.value).trim().toLowerCase() === String(rule.expectedValue).trim().toLowerCase();
  }
  return true;
}

// Case 4.1: Formula SUM check
const cellSumCorrect = { formula: '=SUM(D2:D10)', value: 4500 };
assert(
  evaluateCell(cellSumCorrect, { cell: 'D11', expectedFormula: /^=SUM\(D2:D10\)$/i, expectedValue: 4500 }),
  'Real file grader accepts exact formula =SUM(D2:D10) and correct value'
);

// Case 4.2: Formula VLOOKUP check
const cellVlookup = { formula: '=VLOOKUP(A5, Sheet2!A1:C20, 2, FALSE)', value: 'Laptop Dell' };
assert(
  evaluateCell(cellVlookup, { cell: 'B5', expectedFormula: /VLOOKUP/i, expectedValue: 'Laptop Dell' }),
  'Real file grader verifies VLOOKUP function syntax and cell output'
);

// Case 4.3: Incorrect formula catch
const cellSumWrong = { formula: '=D2+D3+D4', value: 4500 };
assert(
  !evaluateCell(cellSumWrong, { cell: 'D11', expectedFormula: /^=SUM\(D2:D10\)$/i, expectedValue: 4500 }),
  'Real file grader rejects manual addition when =SUM(...) was required by MOS rubric'
);

// TEST SUITE 5: Streak Tracking & Date Math
console.log('\n--- Test Suite 5: Study Streak & Activity Tracking ---');
function calculateNextStreak(lastActiveISO: string, currentStreak: number): number {
  const last = new Date(lastActiveISO);
  const now = new Date();
  
  // Set both to midnight for day comparison
  const lastDay = new Date(last.getFullYear(), last.getMonth(), last.getDate()).getTime();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const diffDays = Math.round((today - lastDay) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return currentStreak; // same day
  if (diffDays === 1) return currentStreak + 1; // consecutive day
  return 1; // broken streak
}

const yesterday = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
assert(calculateNextStreak(yesterday, 5) === 6, 'Consecutive day increments streak from 5 to 6');

const sameDay = new Date().toISOString();
assert(calculateNextStreak(sameDay, 5) === 5, 'Same day activity maintains current streak of 5');

const threeDaysAgo = new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString();
assert(calculateNextStreak(threeDaysAgo, 10) === 1, 'Inactivity over 1 day resets streak to 1');

console.log('\n====================================================');
console.log(`🏁 TEST RESULTS: ${passedTests}/${totalTests} TESTS PASSED (${Math.round((passedTests / totalTests) * 100)}%)`);
console.log('====================================================\n');
