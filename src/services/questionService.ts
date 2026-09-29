import { db } from '../lib/firebase';
import { collection, getDocs, query, where, doc, setDoc, limit } from 'firebase/firestore';
import { Question, MOSSubject } from '../types/mos';
import { THEORY_QUESTIONS } from '../data/theoryQuestions';

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
      console.log('Seeding initial questions to Firestore...');
      // Take first 15 curated questions across Word, Excel, PowerPoint
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
      console.log('Successfully seeded questions to Firestore.');
    }
  } catch (err) {
    console.warn('Seeding check deferred or handled gracefully:', err);
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
    let qQuery = query(questionsRef, limit(maxQuestions * 2));

    if (subject !== 'all') {
      qQuery = query(questionsRef, where('subject', '==', subject), limit(maxQuestions * 2));
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

    // If Firestore has results, shuffle and return requested count
    if (firestoreQuestions.length > 0) {
      return firestoreQuestions
        .sort(() => 0.5 - Math.random())
        .slice(0, maxQuestions);
    }

    // Fallback to local THEORY_QUESTIONS if remote network is offline
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
    console.warn('Error fetching questions from Firestore, using local fallback:', error);
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
