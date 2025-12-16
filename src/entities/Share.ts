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

@Entity('post_shares')
@Index(['postId', 'userId'])
@Index(['postId', 'createdAt'])
export class Share {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  postId: string;

  @Column('uuid')
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Community, { onDelete: 'CASCADE', eager: false })
  post: Community;

  @ManyToOne(() => User, { onDelete: 'CASCADE', eager: false })
  user: User;
}
