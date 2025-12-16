import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from './User.js';
import { Community } from './Community.js';

export type ReactionType = 'like' | 'love' | 'support' | 'celebrate' | 'insightful' | 'thinking';

@Entity('post_reactions')
@Index(['postId', 'userId'], { unique: true })
@Index(['reactionType'])
export class PostReaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  postId: string;

  @Column('uuid')
  userId: string;

  @Column({
    type: 'enum',
    enum: ['like', 'love', 'support', 'celebrate', 'insightful', 'thinking'],
    default: 'like',
  })
  reactionType: ReactionType;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Community, { onDelete: 'CASCADE' })
  post: Community;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;
}
