import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, getDocs, query, where, doc, setDoc, limit } from 'firebase/firestore';
import { Question, MOSSubject } from '../types/mos';
import { THEORY_QUESTIONS } from '../data/theoryQuestions';
import { shuffleArray } from '../utils/shuffle';

export interface QuizQuestionItem {
  id: string;
  subject: 'word' | 'excel' | 'powerpoint';
  domainId: string;
  domainName: string;
  difficulty: 'easy' | 'medium' | 'hard';
  title: string;
  scenario?: string;
  options: {
    id: string;
    text: string;
  }[];
  correctAnswer: string;
  explanation: string;
  officialRibbonPath: string;
  shortcutTip?: string;
  points: number;
}

// Seed initial set of questions to Firestore if collection is empty
export async function seedQuestionsToFirestoreIfEmpty(): Promise<void> {
  try {
    const questionsRef = collection(db, 'questions');
    const snap = await getDocs(query(questionsRef, limit(3)));
    
    if (snap.empty) {
      console.log('[Firestore] Seeding initial questions to collection "questions"...');
      // Take first 18 curated questions across Word, Excel, PowerPoint
      const seedList = THEORY_QUESTIONS.slice(0, 18);
      for (const q of seedList) {
        const docRef = doc(db, 'questions', q.id);
        await setDoc(docRef, {
          id: q.id,
          subject: q.subject,
          domainId: q.domainId,
          domainName: q.domainName,
          difficulty: q.difficulty,
          title: q.title,
          scenario: q.scenario || '',
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          officialRibbonPath: q.officialRibbonPath || '',
          shortcutTip: q.shortcutTip || '',
          points: q.points || 20,
          updatedAt: new Date().toISOString(),
        });
      }
      console.log('[Firestore] Successfully seeded questions to collection "questions".');
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'questions');
  }
}

// Fetch multiple choice questions directly from Firestore
export async function fetchQuestionsFromFirestore(
  subject: 'word' | 'excel' | 'powerpoint' | 'all' = 'all',
  maxQuestions: number = 10
): Promise<QuizQuestionItem[]> {
  try {
    // Attempt auto-seed if first time running
    await seedQuestionsToFirestoreIfEmpty();

    const questionsRef = collection(db, 'questions');
    let qQuery = query(questionsRef, limit(maxQuestions));

    if (subject !== 'all') {
      qQuery = query(questionsRef, where('subject', '==', subject), limit(maxQuestions));
    }

    const snapshot = await getDocs(qQuery);
    const firestoreQuestions: QuizQuestionItem[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as QuizQuestionItem;
      firestoreQuestions.push({
        id: docSnap.id,
        subject: data.subject,
        domainId: data.domainId || 'general',
        domainName: data.domainName || 'Tổng quan',
        difficulty: data.difficulty || 'medium',
        title: data.title,
        scenario: data.scenario,
        options: data.options || [],
        correctAnswer: data.correctAnswer,
        explanation: data.explanation || '',
        officialRibbonPath: data.officialRibbonPath || '',
        shortcutTip: data.shortcutTip || '',
        points: data.points || 20,
      });
    });

    // If Firestore has results, uniformly shuffle and return requested count
    if (firestoreQuestions.length > 0) {
      return shuffleArray(firestoreQuestions).slice(0, maxQuestions);
    }

    // Fallback to local THEORY_QUESTIONS if remote collection is still populating
    const filtered = subject === 'all' 
      ? THEORY_QUESTIONS 
      : THEORY_QUESTIONS.filter(q => q.subject === subject);

    return filtered
      .slice(0, maxQuestions)
      .map(q => ({
        id: q.id,
        subject: q.subject,
        domainId: q.domainId,
        domainName: q.domainName,
        difficulty: q.difficulty,
        title: q.title,
        scenario: q.scenario,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        officialRibbonPath: q.officialRibbonPath,
        shortcutTip: q.shortcutTip,
        points: q.points,
      }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'questions');
    
    const filtered = subject === 'all' 
      ? THEORY_QUESTIONS 
      : THEORY_QUESTIONS.filter(q => q.subject === subject);

    return filtered.slice(0, maxQuestions).map(q => ({
      id: q.id,
      subject: q.subject,
      domainId: q.domainId,
      domainName: q.domainName,
      difficulty: q.difficulty,
      title: q.title,
      scenario: q.scenario,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      officialRibbonPath: q.officialRibbonPath,
      shortcutTip: q.shortcutTip,
      points: q.points,
    }));
  }
}

// Save Quiz score and student answers directly to Firestore collection 'quiz_scores'
export async function saveQuizScoreToFirestore(scoreData: {
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  score: number;
  total: number;
  percentage: number;
  passed: boolean;
  userAnswers: Record<string, string>;
}): Promise<string> {
  const scoreId = `quiz_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const path = `quiz_scores/${scoreId}`;
  try {
    const docRef = doc(db, 'quiz_scores', scoreId);
    await setDoc(docRef, {
      id: scoreId,
      ...scoreData,
      createdAt: new Date().toISOString(),
    });
    return scoreId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    return scoreId;
  }
}
