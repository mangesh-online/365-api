import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { Tribe } from './Tribe.js';
import { User } from './User.js';

export type EventType = 'virtual' | 'in-person' | 'hybrid';
export type EventStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

export interface EventAttendee {
  userId: string;
  userName: string;
  userAvatar?: string;
  rsvpStatus: 'going' | 'maybe' | 'not_going';
  rsvpAt: Date;
}

@Entity('tribe_events')
@Index(['tribeId', 'eventDate'])
@Index(['creatorId'])
@Index(['status'])
export class TribeEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'tribe_id' })
  tribeId: string;

  @Column('uuid', { name: 'creator_id' })
  creatorId: string;

  @Column('varchar', { length: 200 })
  title: string;

  @Column('text')
  description: string;

  @Column('timestamp', { name: 'event_date' })
  eventDate: Date;

  @Column('varchar', { length: 10, nullable: true, name: 'event_time' })
  eventTime: string; // HH:MM format

  @Column('int', { nullable: true, name: 'duration_minutes' })
  durationMinutes: number;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'virtual',
    name: 'event_type',
  })
  eventType: EventType;

  @Column('varchar', { length: 500, nullable: true })
  location: string; // Physical location or meeting link

  @Column('varchar', { length: 500, nullable: true, name: 'meeting_link' })
  meetingLink: string; // Video call link for virtual events

  @Column({
    type: 'varchar',
    length: 20,
    default: 'upcoming',
  })
  status: EventStatus;

  @Column('int', { default: 0, name: 'max_attendees' })
  maxAttendees: number; // 0 means unlimited

  @Column('text', { nullable: true })
  tags: string; // Comma-separated tags

  @Column('text', { nullable: true, name: 'cover_image' })
  coverImage: string;

  @Column('json', { nullable: true })
  attendees: EventAttendee[];

  @Column('int', { default: 0, name: 'attendee_count' })
  attendeeCount: number;

  @Column('json', { nullable: true })
  metadata: {
    reminder?: boolean;
    reminderSent?: boolean;
    requiresApproval?: boolean;
    isRecurring?: boolean;
    recurringPattern?: string;
    [key: string]: any;
  };

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Tribe, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tribe_id' })
  tribe: Tribe;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'creator_id' })
  creator: User;
}
