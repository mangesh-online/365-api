import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Community } from './Community.js';
import { User } from './User.js';

export type EngagementAction = 'like' | 'comment' | 'share' | 'comment_like';

@Entity('engagement_stats')
@Index(['postId', 'userId', 'action'])
@Index(['postId', 'action'])
@Index(['userId', 'createdAt'])
export class EngagementStat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  postId: string;

  @Column('uuid')
  userId: string;

  @Column({
    type: 'enum',
    enum: ['like', 'comment', 'share', 'comment_like'],
  })
  action: EngagementAction;

  @Column({ type: 'text', nullable: true })
  metadata: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Community, { onDelete: 'CASCADE', eager: false })
  post: Community;

  @ManyToOne(() => User, { onDelete: 'CASCADE', eager: false })
  user: User;
}
