import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from './User.js';

@Entity('journal_entries')
@Index(['userId', 'createdAt'])
export class JournalEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column({
    type: 'enum',
    enum: ['Morning', 'Evening', 'CBT', 'Freestyle'],
  })
  type: 'Morning' | 'Evening' | 'CBT' | 'Freestyle';

  @Column('simple-json')
  prompts: { question: string; answer: string }[];

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.journals, {
    onDelete: 'CASCADE',
    eager: false,
  })
  user: User;
}
