import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, Index } from 'typeorm';
import { Session } from './Session.js';
import { User } from './User.js';

@Entity('session_attendance')
@Index(['sessionId', 'userId'])
export class SessionAttendance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  sessionId: string;

  @Column('uuid')
  userId: string;

  @Column('boolean', { default: false })
  attended: boolean;

  @CreateDateColumn()
  joinedAt: Date;

  @ManyToOne(() => Session, { onDelete: 'CASCADE', eager: false })
  session: Session;

  @ManyToOne(() => User, { onDelete: 'CASCADE', eager: false })
  user: User;
}
