import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { User } from './User.js';

export type ProficiencyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

@Entity('user_interests')
@Unique(['userId', 'interest'])
@Index(['userId'])
@Index(['interest'])
@Index(['proficiency'])
export class UserInterest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column('varchar', { length: 100 })
  interest: string; // e.g., 'weight-loss', 'meditation', 'python-programming'

  @Column({
    type: 'enum',
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    default: 'beginner',
  })
  proficiency: ProficiencyLevel;

  @Column('int', { default: 1 })
  weight: number; // Higher weight = more interested (1-10)

  @Column('boolean', { default: false })
  isPrimary: boolean; // Main interest for tribe recommendations

  @Column('simple-array', { nullable: true })
  matchedTribes?: string[]; // IDs of tribes matching this interest

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.interests, {
    onDelete: 'CASCADE',
    eager: false,
  })
  user: User;
}
