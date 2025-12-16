import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index, ManyToOne } from 'typeorm';
import { Session } from './Session.js';

@Entity('session_activities')
@Index(['userId', 'createdAt'])
@Index(['sessionId', 'type'])
@Index(['type', 'createdAt'])
export class SessionActivity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', { nullable: true })
  sessionId: string;

  @Column('varchar')
  userId: string;

  @Column('varchar')
  userName: string;

  @Column('varchar', { nullable: true })
  userAvatar: string;

  @Column({ type: 'enum', enum: ['rsvp', 'cancel_rsvp', 'join', 'leave', 'question', 'complete', 'recording_watch', 'share'] })
  type: 'rsvp' | 'cancel_rsvp' | 'join' | 'leave' | 'question' | 'complete' | 'recording_watch' | 'share';

  @Column('text')
  content: string;

  @Column('json', { nullable: true })
  metadata: any;

  @ManyToOne(() => Session, { onDelete: 'CASCADE', nullable: true })
  session: Session;

  @CreateDateColumn()
  createdAt: Date;
}
