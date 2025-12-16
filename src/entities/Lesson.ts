import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  Index,
  UpdateDateColumn,
} from 'typeorm';
import { Course } from './Course.js';
import { LessonProgress } from './LessonProgress.js';

@Entity('lessons')
@Index(['courseId'])
export class Lesson {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  courseId: string;

  @Column('varchar')
  title: string;

  @Column('text', { nullable: true })
  description: string;

  @Column('varchar', { default: 'Video' })
  type: 'Video' | 'Text' | 'Quiz';

  @Column('text', { nullable: true })
  content: string;

  @Column('varchar', { nullable: true })
  videoUrl: string;

  @Column('varchar', { nullable: true })
  documentUrl: string;

  @Column('longtext', { nullable: true })
  transcription: string;

  @Column('int', { nullable: true })
  duration: number;

  @Column('int', { default: 0 })
  order: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Course, (course) => course.lessons, {
    onDelete: 'CASCADE',
    eager: false,
  })
  course: Course;

  @OneToMany(() => LessonProgress, (progress) => progress.lesson, { cascade: true })
  progress: LessonProgress[];
}
