import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from './User.js';
import { Tribe } from './Tribe.js';

@Entity('tribe_join_requests')
@Index(['tribeId', 'status'])
@Index(['userId', 'tribeId'], { unique: true })
export class TribeJoinRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column('uuid')
  tribeId: string;

  @Column('simple-json', { nullable: true })
  answers: { question: string; answer: string }[];

  @Column({
    type: 'enum',
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  })
  status: 'pending' | 'approved' | 'rejected';

  @CreateDateColumn()
  requestedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Tribe, { onDelete: 'CASCADE' })
  tribe: Tribe;
}
