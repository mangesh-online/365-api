import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from './User.js';

@Entity('activity_logs')
@Index(['userId', 'createdAt'])
export class ActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column({
    type: 'enum',
    enum: ['habit', 'course', 'post', 'badge', 'system', 'mindset'],
  })
  type: 'habit' | 'course' | 'post' | 'badge' | 'system' | 'mindset';

  @Column('text')
  content: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.activities, {
    onDelete: 'CASCADE',
    eager: false,
  })
  user: User;
}
