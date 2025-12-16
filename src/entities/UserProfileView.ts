import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './User.js';

@Entity('user_profile_views')
export class UserProfileView {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  profileOwnerId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'profileOwnerId' })
  profileOwner: User;

  @Column('uuid', { nullable: true })
  viewerId: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'viewerId' })
  viewer: User;

  @Column('varchar', { nullable: true })
  viewerIp: string;

  @CreateDateColumn()
  viewedAt: Date;
}
