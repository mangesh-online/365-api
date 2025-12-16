import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Lesson } from './Lesson.js';
import { CourseEnrollment } from './CourseEnrollment.js';

@Entity('lesson_progress')
@Index(['enrollmentId', 'lessonId'])
export class LessonProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  enrollmentId: string;

  @Column('uuid')
  lessonId: string;

  @Column('boolean', { default: false })
  completed: boolean;

  @Column('int', { default: 0 })
  progress: number; // 0-100

  @CreateDateColumn()
  startedAt: Date;

  @Column('timestamp', { nullable: true })
  completedAt: Date;

  @ManyToOne(() => CourseEnrollment, (enrollment) => enrollment.lessonProgress, {
    onDelete: 'CASCADE',
    eager: false,
  })
  enrollment: CourseEnrollment;

  @ManyToOne(() => Lesson, (lesson) => lesson.progress, {
    onDelete: 'CASCADE',
    eager: false,
  })
  lesson: Lesson;
}
