import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from './User.js';
import { ResourceBook } from './ResourceBook.js';

@Entity('user_book_progress')
@Index(['userId', 'bookId'])
export class UserBookProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column('uuid')
  bookId: string;

  @ManyToOne(() => ResourceBook)
  @JoinColumn({ name: 'bookId' })
  book: ResourceBook;

  @Column('enum', { enum: ['not-started', 'reading', 'completed'], default: 'not-started' })
  status: string;

  @Column('int', { default: 0 })
  currentPage: number;

  @Column('decimal', { precision: 3, scale: 2, default: 0 })
  progressPercent: number;

  @Column('timestamp', { nullable: true })
  startedAt: Date;

  @Column('timestamp', { nullable: true })
  completedAt: Date;

  @Column('text', { nullable: true })
  notes: string;

  @Column('int', { nullable: true })
  userRating: number;

  @Column('boolean', { default: false })
  isFavorite: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
