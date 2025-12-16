import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { TribeChannel } from './TribeChannel.js';
import { User } from './User.js';
import { Tribe } from './Tribe.js';

export type MessageType = 'text' | 'image' | 'video' | 'file' | 'system';

export interface MessageReaction {
  userId: string;
  userName: string;
  emoji: string;
  createdAt: Date;
}

@Entity('tribe_messages')
@Index(['channelId', 'createdAt'])
@Index(['senderId'])
export class TribeMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'channel_id' })
  channelId: string;

  @Column('uuid', { name: 'tribe_id' })
  tribeId: string;

  @Column('uuid', { name: 'sender_id' })
  senderId: string;

  @Column('text')
  content: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'text',
    name: 'message_type',
  })
  messageType: MessageType;

  @Column('json', { nullable: true })
  attachments: {
    url: string;
    name: string;
    type: string;
    size?: number;
    thumbnailUrl?: string;
  }[];

  @Column('json', { nullable: true })
  reactions: MessageReaction[];

  @Column('boolean', { default: false, name: 'is_edited' })
  isEdited: boolean;

  @Column('timestamp', { nullable: true, name: 'edited_at' })
  editedAt: Date;

  @Column('uuid', { nullable: true, name: 'reply_to_id' })
  replyToId: string;

  @Column('boolean', { default: false, name: 'is_pinned' })
  isPinned: boolean;

  @Column('json', { nullable: true })
  mentions: string[]; // Array of user IDs

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => TribeChannel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'channel_id' })
  channel: TribeChannel;

  @ManyToOne(() => Tribe, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tribe_id' })
  tribe: Tribe;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'sender_id' })
  sender: User;
}
