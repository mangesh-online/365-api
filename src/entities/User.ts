import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Habit } from './Habit.js';
import { Community } from './Community.js';
import { MoodEntry } from './MoodEntry.js';
import { JournalEntry } from './JournalEntry.js';
import { ActivityLog } from './ActivityLog.js';
import { CourseEnrollment } from './CourseEnrollment.js';
import { Tribe } from './Tribe.js';
import { TribeMember } from './TribeMember.js';
import { UserInterest } from './UserInterest.js';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', { unique: true })
  email: string;

  @Column('varchar')
  name: string;

  @Column('varchar', { nullable: true })
  password: string;

  @Column('varchar', { nullable: true })
  avatar: string;

  @Column('varchar', { nullable: true })
  coverPhoto: string;

  @Column('text', { nullable: true })
  bio: string;

  @Column('varchar', { nullable: true })
  location: string;

  @Column('varchar', { nullable: true })
  website: string;

  @Column('varchar', { nullable: true })
  twitter: string;

  @Column('varchar', { nullable: true })
  instagram: string;

  @Column('varchar', { nullable: true })
  linkedin: string;

  @Column('varchar', { nullable: true })
  phone: string;

  @Column('date', { nullable: true })
  dateOfBirth: Date;

  @Column('varchar', { nullable: true })
  gender: string;

  @Column('varchar', { default: 'Free' })
  plan: 'Free' | 'Monthly' | 'Annual';

  @Column('int', { default: 0 })
  xp: number;

  @Column('int', { default: 1 })
  level: number;

  @Column('int', { default: 0 })
  currentStreak: number;

  @Column('int', { default: 0 })
  longestStreak: number;

  @Column('varchar', { nullable: true })
  googleId: string;

  @Column('boolean', { default: false })
  isAdmin: boolean;

  @CreateDateColumn()
  joinDate: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Habit, (habit) => habit.user, { cascade: true })
  habits: Habit[];

  @OneToMany(() => Community, (post) => post.user, { cascade: true })
  posts: Community[];

  @OneToMany(() => MoodEntry, (mood) => mood.user, { cascade: true })
  moods: MoodEntry[];

  @OneToMany(() => JournalEntry, (journal) => journal.user, { cascade: true })
  journals: JournalEntry[];

  @OneToMany(() => ActivityLog, (activity) => activity.user, { cascade: true })
  activities: ActivityLog[];

  @OneToMany(() => CourseEnrollment, (enrollment) => enrollment.user, { cascade: true })
  enrollments: CourseEnrollment[];

  @OneToMany(() => Tribe, (tribe) => tribe.creator, { cascade: true })
  createdTribes: Tribe[];

  @OneToMany(() => TribeMember, (member) => member.user, { cascade: true })
  tribesMemberships: TribeMember[];

  @OneToMany(() => UserInterest, (interest) => interest.user, { cascade: true })
  interests: UserInterest[];
}
