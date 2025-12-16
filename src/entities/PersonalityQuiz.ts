import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { TribeQuizAnswer } from './TribeQuizAnswer.js';

export type QuestionType = 'single_choice' | 'multiple_choice' | 'scale' | 'text';
export type TribeGoal = 'health' | 'fitness' | 'learning' | 'career' | 'mindfulness' | 'relationships' | 'financial' | 'creative' | 'personal_growth' | 'spirituality';

export interface QuizOption {
  id: string;
  text: string;
  value: number; // Score/weight for this option
  tribeWeights?: {
    [key in TribeGoal]?: number; // How much this option aligns with each tribe goal
  };
}

export interface QuizQuestion {
  id: string;
  question: string;
  description?: string;
  type: QuestionType;
  options?: QuizOption[];
  minValue?: number; // For scale questions
  maxValue?: number;
  minLabel?: string; // For scale: "Low"
  maxLabel?: string; // For scale: "High"
  order: number;
  isRequired: boolean;
  category?: string; // e.g., 'learning_style', 'goals', 'interests', 'lifestyle'
}

@Entity('personality_quizzes')
@Index(['version'])
export class PersonalityQuiz {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', { length: 100 })
  title: string;

  @Column('text')
  description: string;

  @Column('int', { default: 1 })
  version: number; // Allow multiple versions of the quiz

  @Column('boolean', { default: true })
  isActive: boolean;

  @Column('int', { default: 0 })
  estimatedTimeMinutes: number; // How long to complete

  @Column('simple-json')
  questions: QuizQuestion[]; // Array of questions with their options and scoring

  @Column('simple-json', { nullable: true })
  scoringWeights: {
    [key in TribeGoal]?: number; // Base weight for each tribe goal
  };

  @Column('simple-json', { nullable: true })
  metadata: {
    totalQuestions?: number;
    categories?: string[];
    lastReviewDate?: Date;
    createdBy?: string; // Admin who created this version
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => TribeQuizAnswer, (answer) => answer.quiz)
  answers: TribeQuizAnswer[];
}
