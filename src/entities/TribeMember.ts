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
import { Tribe } from './Tribe.js';

export type TribeRole = 'member' | 'moderator' | 'admin' | 'creator';

@Entity('tribe_members')
@Unique(['userId', 'tribeId'])
@Index(['tribeId', 'joinedAt'])
@Index(['userId'])
@Index(['role'])
export class TribeMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column('uuid')
  tribeId: string;

  @Column({
    type: 'enum',
    enum: ['member', 'moderator', 'admin', 'creator'],
    default: 'member',
  })
  role: TribeRole;

  @Column('boolean', { default: false })
  isAdmin: boolean; // Redundant with role but useful for quick checks

  @Column('int', { default: 0 })
  contributionScore: number; // Points based on posts, engagement, etc.

  @Column('simple-array', { nullable: true })
  badges: string[]; // ['top-contributor', 'helpful', 'consistent'] etc.

  @Column('text', { nullable: true })
  bio: string; // Tribe-specific bio

  @Column('boolean', { default: false })
  isMuted: boolean; // Muted members can't post/comment

  @Column('boolean', { default: false })
  isBanned: boolean; // Banned members can't access tribe

  @CreateDateColumn()
  joinedAt: Date;

  @Column('timestamp', { nullable: true })
  bannedAt?: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.tribesMemberships, {
    onDelete: 'CASCADE',
    eager: false,
  })
  user: User;

  @ManyToOne(() => Tribe, (tribe) => tribe.members, {
    onDelete: 'CASCADE',
    eager: false,
  })
  tribe: Tribe;
}
