import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from './User.js';
import { Tribe } from './Tribe.js';

export type ModActionType = 
  | 'ban_user' 
  | 'unban_user' 
  | 'delete_post' 
  | 'pin_post' 
  | 'unpin_post' 
  | 'remove_member' 
  | 'assign_role' 
  | 'revoke_role'
  | 'edit_tribe'
  | 'lock_post'
  | 'unlock_post';

@Entity('moderation_logs')
@Index(['tribeId', 'createdAt'])
@Index(['moderatorId'])
@Index(['targetUserId'])
@Index(['actionType'])
export class ModerationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tribeId: string;

  @Column('uuid', { nullable: true })
  moderatorId: string | null;

  @Column('uuid', { nullable: true })
  targetUserId?: string; // User affected by the action

  @Column('uuid', { nullable: true })
  targetPostId?: string; // Post affected by the action

  @Column({
    type: 'enum',
    enum: [
      'ban_user',
      'unban_user',
      'delete_post',
      'pin_post',
      'unpin_post',
      'remove_member',
      'assign_role',
      'revoke_role',
      'edit_tribe',
      'lock_post',
      'unlock_post',
    ],
  })
  actionType: ModActionType;

  @Column('text')
  reason: string;

  @Column('simple-json', { nullable: true })
  metadata?: any; // Additional context about the action

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Tribe, { onDelete: 'CASCADE' })
  tribe: Tribe;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  moderator: User | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  targetUser?: User;
}
