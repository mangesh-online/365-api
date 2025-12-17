import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('habit_logs')
@Index(['habitId', 'completedAt'])
@Index(['userId', 'completedAt'])
export class HabitLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  habitId: string;

  @Column('uuid')
  userId: string;

  @Column('boolean', { default: true })
  completed: boolean;

  @Column('text', { nullable: true })
  note: string;

  @CreateDateColumn()
  completedAt: Date;

  @ManyToOne(() => import('./Habit.js').then(m => m.Habit), (habit: any) => habit.logs, {
    onDelete: 'CASCADE',
    eager: false,
  })
  habit: any;
}
