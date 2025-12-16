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
import { User } from './User.js';
import { Comment } from './Comment.js';
import { Share } from './Share.js';

export interface MediaItem {
  id: string;
  type: 'photo' | 'video';
  url: string;
  thumbnailUrl?: string;
  duration?: number; // For videos
  uploadedAt: Date;
}

export interface Mention {
  userId: string;
  userName: string;
}

export interface EventDetails {
  title: string;
  date: string;
  location: string;
}

@Entity('community_posts')
@Index(['userId', 'createdAt'])
@Index(['tribeId', 'createdAt'])
@Index(['hashtags'])
export class Community {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column('varchar', { length: 200, nullable: true })
  title?: string; // Post title for better structure

  @Column('text')
  content: string;

  @Column({
    type: 'enum',
    enum: ['General', 'Win', 'Help', 'Mindset'],
    default: 'General',
  })
  category: 'General' | 'Win' | 'Help' | 'Mindset';

  @Column('varchar', { nullable: true })
  image: string; // Legacy single image field (kept for backward compatibility)

  @Column('simple-json', { nullable: true })
  media?: MediaItem[]; // Array of photos/videos

  @Column('simple-array', { nullable: true })
  hashtags?: string[]; // e.g., ['fitness', 'weight-loss', 'motivation']

  @Column('simple-json', { nullable: true })
  mentions?: Mention[]; // Tagged users

  @Column('simple-json', { nullable: true })
  eventDetails?: EventDetails;

  @Column('uuid', { nullable: true })
  tribeId?: string; // Post associated with a tribe

  @Column('int', { default: 0 })
  likes: number;

  @Column('int', { default: 0 })
  views: number;

  @Column('simple-json', { nullable: true })
  reactions: { type: 'Proud' | 'Support' | 'Same'; count: number }[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.posts, {
    onDelete: 'CASCADE',
    eager: false,
  })
  user: User;

  @OneToMany(() => Comment, (comment) => comment.post, { cascade: true })
  comments: Comment[];

  @OneToMany(() => Share, (share) => share.post, { cascade: true })
  shares: Share[];
}
