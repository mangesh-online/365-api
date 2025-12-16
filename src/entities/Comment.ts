import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Community } from './Community.js';
import { User } from './User.js';

@Entity('comments')
@Index(['postId', 'createdAt'])
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  postId: string;

  @Column('uuid')
  userId: string;

  @Column('uuid', { nullable: true })
  parentId?: string; // For threaded replies

  @Column('text')
  content: string;

  @Column('int', { default: 0 })
  likes: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Community, (post) => post.comments, {
    onDelete: 'CASCADE',
    eager: false,
  })
  post: Community;

  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
    eager: false,
  })
  user: User;

  @ManyToOne(() => Comment, (comment) => comment.replies, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  parent?: Comment;

  @OneToMany(() => Comment, (comment) => comment.parent)
  replies: Comment[];
}
