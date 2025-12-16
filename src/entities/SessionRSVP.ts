import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index, ManyToOne } from 'typeorm';
import { Session } from './Session.js';
import { User } from './User.js';

@Entity('session_rsvps')
@Index(['sessionId', 'userId'], { unique: true })
@Index(['sessionId', 'status'])
export class SessionRSVP {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  sessionId: string;

  @Column('uuid')
  userId: string;

  @Column({ type: 'enum', enum: ['confirmed', 'cancelled', 'waitlist'], default: 'confirmed' })
  status: 'confirmed' | 'cancelled' | 'waitlist';

  @Column('boolean', { default: false })
  attended: boolean;

  @Column('text', { nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Session, { onDelete: 'CASCADE' })
  session: Session;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;
}
