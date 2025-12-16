import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './User.js';

@Entity('user_settings')
export class UserSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  // Privacy Settings
  @Column('boolean', { default: true })
  profilePublic: boolean;

  @Column('boolean', { default: true })
  showEmail: boolean;

  @Column('boolean', { default: true })
  showActivity: boolean;

  @Column('boolean', { default: true })
  showTribes: boolean;

  // Notification Settings
  @Column('boolean', { default: true })
  emailNotifications: boolean;

  @Column('boolean', { default: true })
  postLikeNotifications: boolean;

  @Column('boolean', { default: true })
  commentNotifications: boolean;

  @Column('boolean', { default: true })
  tribeInviteNotifications: boolean;

  @Column('boolean', { default: true })
  habitReminderNotifications: boolean;

  @Column('boolean', { default: false })
  weeklyDigest: boolean;

  @Column('boolean', { default: false })
  monthlyReport: boolean;

  // Communication Preferences
  @Column('boolean', { default: true })
  marketingEmails: boolean;

  @Column('boolean', { default: true })
  productUpdates: boolean;

  @Column('varchar', { default: 'daily' })
  digestFrequency: 'realtime' | 'daily' | 'weekly' | 'never';

  // App Settings
  @Column('varchar', { default: 'light' })
  theme: 'light' | 'dark' | 'auto';

  @Column('varchar', { default: 'en' })
  language: string;

  @Column('varchar', { default: 'America/New_York' })
  timezone: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
