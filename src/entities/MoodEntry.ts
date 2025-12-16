import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from './User.js';

@Entity('mood_entries')
@Index(['userId', 'createdAt'])
export class MoodEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column({
    type: 'enum',
    enum: ['Great', 'Good', 'Neutral', 'Low', 'Stressed'],
  })
  mood: 'Great' | 'Good' | 'Neutral' | 'Low' | 'Stressed';

  @Column('int')
  energyLevel: number; // 1-10

  @Column('text', { nullable: true })
  note: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.moods, {
    onDelete: 'CASCADE',
    eager: false,
  })
  user: User;
}
