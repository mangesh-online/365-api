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
import type { HabitLog } from './HabitLog.js';

@Entity('habits')
@Index(['userId'])
export class Habit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column('varchar')
  name: string;

  @Column('boolean', { default: false })
  completed: boolean;

  @Column('int', { default: 0 })
  streak: number;

  @Column('int', { default: 0 })
  bestStreak: number;

  @Column('int', { default: 0 })
  totalCompletions: number;

  @Column({
    type: 'enum',
    enum: ['Health', 'Mindset', 'Business', 'Productivity'],
    default: 'Productivity',
  })
  category: 'Health' | 'Mindset' | 'Business' | 'Productivity';

  @Column('varchar', { default: 'Daily' })
  frequency: string;

  @Column('varchar', { nullable: true })
  timeOfDay: string;

  @Column('int', { nullable: true })
  lastEffortRating: number;

  @Column('boolean', { default: false })
  missedYesterday: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.habits, {
    onDelete: 'CASCADE',
    eager: false,
  })
  user: User;

  @OneToMany(() => import('./HabitLog.js').then(m => m.HabitLog), (log: any) => log.habit, { cascade: true })
  logs: HabitLog[];
}
