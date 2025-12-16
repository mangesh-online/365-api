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
import { Tribe } from './Tribe.js';
import { User } from './User.js';

export type ChannelType = 'text' | 'voice';

@Entity('tribe_channels')
@Index(['tribeId', 'createdAt'])
export class TribeChannel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'tribe_id' })
  tribeId: string;

  @Column('varchar', { length: 100 })
  name: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'text',
    name: 'channel_type',
  })
  channelType: ChannelType;

  @Column('int', { default: 0, name: 'message_count' })
  messageCount: number;

  @Column('json', { nullable: true })
  settings: {
    slowMode?: number; // seconds between messages
    membersOnly?: boolean;
    [key: string]: any;
  };

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Tribe, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tribe_id' })
  tribe: Tribe;
}
