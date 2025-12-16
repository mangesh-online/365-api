import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Lesson } from './Lesson.js';
import { CourseEnrollment } from './CourseEnrollment.js';
import { CourseResource } from './CourseResource.js';

@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar')
  title: string;

  @Column('text')
  description: string;

  @Column('varchar')
  category: string;

  @Column('varchar', { nullable: true })
  instructor: string;

  @Column('varchar', { nullable: true })
  image: string;

  @Column('longtext', { nullable: true })
  overview: string;

  @Column('longtext', { nullable: true })
  notes: string;

  @Column('int', { default: 0 })
  totalLessons: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Lesson, (lesson) => lesson.course, { cascade: true })
  lessons: Lesson[];

  @OneToMany(() => CourseResource, (resource) => resource.course, { cascade: true })
  resources: CourseResource[];

  @OneToMany(() => CourseEnrollment, (enrollment) => enrollment.course, { cascade: true })
  enrollments: CourseEnrollment[];
}
