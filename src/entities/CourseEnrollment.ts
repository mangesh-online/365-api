import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from './User.js';
import { Course } from './Course.js';
import { LessonProgress } from './LessonProgress.js';

@Entity('course_enrollments')
@Index(['userId', 'courseId'])
export class CourseEnrollment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column('uuid')
  courseId: string;

  @Column('int', { default: 0 })
  progress: number; // Calculated percentage

  @CreateDateColumn()
  enrolledAt: Date;

  @Column('timestamp', { nullable: true })
  completedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.enrollments, {
    onDelete: 'CASCADE',
    eager: false,
  })
  user: User;

  @ManyToOne(() => Course, (course) => course.enrollments, {
    onDelete: 'CASCADE',
    eager: false,
  })
  course: Course;

  @OneToMany(() => LessonProgress, (progress) => progress.enrollment, { cascade: true })
  lessonProgress: LessonProgress[];
}
