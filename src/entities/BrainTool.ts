import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User.js';

@Entity('brain_tools')
@Index(['category'])
@Index(['level'])
export class BrainTool {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', { length: 255 })
  toolId: string; // Unique identifier like 'breathing', 'pomodoro'

  @Column('varchar', { length: 255 })
  name: string;

  @Column('varchar', { length: 100 })
  category: string; // nervous-system, focus-flow, mental-wellness, etc.

  @Column('varchar', { length: 50 })
  level: string; // Beginner, Intermediate, Advanced

  @Column('varchar', { length: 50 })
  duration: string; // "5 min", "25 min", etc.

  @Column('text')
  description: string;

  @Column('text')
  science: string; // Scientific backing explanation

  @Column('varchar', { length: 100 })
  icon: string; // Icon name

  @Column('varchar', { length: 100 })
  color: string; // Color theme

  @Column('json', { nullable: true })
  config: any; // Tool-specific configuration (e.g., breathing cycles, timer settings)

  @Column('boolean', { default: true })
  isActive: boolean;

  @Column('int', { default: 0 })
  usageCount: number; // Track how many times it's been used

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
