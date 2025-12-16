import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from './User.js';
import { BrainTool } from './BrainTool.js';

@Entity('tool_progress')
@Index(['userId', 'toolId'])
export class ToolProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column('uuid')
  toolId: string;

  @ManyToOne(() => BrainTool)
  @JoinColumn({ name: 'toolId' })
  tool: BrainTool;

  @Column('int', { default: 0 })
  completionCount: number; // How many times completed

  @Column('int', { default: 0 })
  totalMinutes: number; // Total time spent

  @Column('timestamp', { nullable: true })
  lastUsedAt: Date;

  @Column('int', { default: 0 })
  currentStreak: number; // Days in a row

  @Column('int', { default: 0 })
  longestStreak: number;

  @Column('boolean', { default: false })
  isMastered: boolean; // Achievement flag

  @Column('json', { nullable: true })
  sessionData: any; // Store recent session results

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
