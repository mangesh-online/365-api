import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from './User.js';

@Entity('conversations')
@Index(['user1Id', 'user2Id'], { unique: true })
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  user1Id: string;

  @Column({ type: 'uuid' })
  user2Id: string;

  @Column({ type: 'uuid', nullable: true })
  lastMessageId: string;

  @Column({ type: 'text', nullable: true })
  lastMessageText: string;

  @Column({ type: 'timestamp', nullable: true })
  lastMessageAt: Date;

  @Column({ type: 'int', default: 0 })
  user1UnreadCount: number;

  @Column({ type: 'int', default: 0 })
  user2UnreadCount: number;

  @Column({ type: 'boolean', default: false })
  user1Pinned: boolean;

  @Column({ type: 'boolean', default: false })
  user2Pinned: boolean;

  @Column({ type: 'boolean', default: false })
  user1Archived: boolean;

  @Column({ type: 'boolean', default: false })
  user2Archived: boolean;

  @Column({ type: 'boolean', default: false })
  user1Muted: boolean;

  @Column({ type: 'boolean', default: false })
  user2Muted: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user1Id' })
  user1: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user2Id' })
  user2: User;
}
