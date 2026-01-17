
import type { LucideIcon } from 'lucide-react';

export interface Question {
  id: number;
  topic: string;
  question: string;
  sourceText: string;
}

export type IconName = 'BookOpen' | 'Shield' | 'Target';

export interface Test {
  id: string;
  name: string;
  icon: IconName;
  color: 'blue' | 'red' | 'yellow' | 'green' | 'purple';
  questions: Question[];
}

export interface GradedResult {
  score: number;
  feedback: string;
  correction: string;
}

export interface QuizResult extends GradedResult {
  questionId: number;
  questionText: string;
  userAnswer: string;
}
