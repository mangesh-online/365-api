import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from './User.js';
import { PersonalityQuiz } from './PersonalityQuiz.js';

@Entity('tribe_quiz_answers')
@Index(['userId', 'quizId'])
@Index(['userId'])
export class TribeQuizAnswer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column('uuid')
  quizId: string;

  @Column('uuid')
  questionId: string; // Reference to question in PersonalityQuiz.questions array

  @Column('text', { nullable: true })
  answer: string; // User's answer (can be JSON string for complex answers)

  @Column('int')
  answerScore: number; // Score from the selected option

  @Column('simple-json', { nullable: true })
  matchScores: {
    health?: number;
    fitness?: number;
    learning?: number;
    career?: number;
    mindfulness?: number;
    relationships?: number;
    financial?: number;
    creative?: number;
    personal_growth?: number;
    spirituality?: number;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
    eager: false,
  })
  user: User;

  @ManyToOne(() => PersonalityQuiz, (quiz) => quiz.answers, {
    onDelete: 'CASCADE',
    eager: false,
  })
  quiz: PersonalityQuiz;
}
