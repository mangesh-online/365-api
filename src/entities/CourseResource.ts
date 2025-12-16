import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Course } from './Course.js';

@Entity('course_resources')
@Index(['courseId'])
export class CourseResource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  courseId: string;

  @Column('varchar')
  title: string;

  @Column('varchar', { nullable: true })
  description: string;

  @Column('varchar')
  fileUrl: string;

  @Column('varchar')
  fileName: string;

  @Column('varchar', { default: 'PDF' })
  type: 'PDF' | 'DOC' | 'PPTX' | 'XLSX' | 'ZIP' | 'OTHER';

  @Column('int', { nullable: true })
  fileSizeKB: number;

  @Column('int', { default: 0 })
  order: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Course, (course) => course.resources, {
    onDelete: 'CASCADE',
    eager: false,
  })
  course: Course;
}
