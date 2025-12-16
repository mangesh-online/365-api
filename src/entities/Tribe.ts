import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from './User.js';
import { TribeMember } from './TribeMember.js';

export type GoalType = 'health' | 'fitness' | 'learning' | 'career' | 'mindfulness' | 'relationships' | 'financial' | 'creative' | 'personal_growth' | 'spirituality';
export type LearningStyle = 'visual' | 'auditory' | 'reading' | 'kinesthetic' | 'mixed';

@Entity('tribes')
@Index(['creatorId', 'createdAt'])
@Index(['goalType'])
@Index(['isPublic'])
export class Tribe {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  creatorId: string;

  @Column('varchar', { length: 100 })
  name: string;

  @Column('text')
  description: string;

  @Column('text', { nullable: true })
  banner: string; // URL to banner image

  @Column('text', { nullable: true })
  icon: string; // URL to tribe icon

  @Column('varchar', { nullable: true })
  image: string; // URL to tribe avatar/logo

  @Column('varchar', { nullable: true })
  coverImage: string; // URL to tribe cover photo

  @Column('varchar', { length: 100, nullable: true })
  category: string; // Tribe category (e.g., 'Fitness', 'Mindfulness')

  @Column({
    type: 'enum',
    enum: ['health', 'fitness', 'learning', 'career', 'mindfulness', 'relationships', 'financial', 'creative', 'personal_growth', 'spirituality'],
  })
  goalType: GoalType;

  @Column('simple-array', { nullable: true })
  interests: string[]; // e.g., ['weight-loss', 'nutrition', 'gym-training']

  @Column('simple-array', { nullable: true })
  tags: string[]; // Custom tags for discovery

  @Column({
    type: 'enum',
    enum: ['visual', 'auditory', 'reading', 'kinesthetic', 'mixed'],
    nullable: true,
  })
  preferredLearningStyle?: LearningStyle;

  @Column('int', { default: 0 })
  membersCount!: number;

  @Column('int', { default: 0 })
  postCount: number;

  @Column('boolean', { default: true })
  isPublic: boolean; // Public tribes are discoverable

  @Column('boolean', { default: false })
  isVerified: boolean; // Verified tribes by admins

  @Column('text', { nullable: true })
  rules: string; // Community guidelines

  @Column('text', { nullable: true })
  welcomeMessage: string; // Message shown to new members

  @Column('text', { nullable: true })
  goals: string; // Tribe goals and objectives

  @Column('text', { nullable: true })
  milestones: string; // Tribe milestones and achievements

  @Column('text', { nullable: true })
  resources: string; // Recommended resources for members

  @Column('simple-array', { nullable: true })
  membershipQuestions: string[]; // Questions for join requests

  @Column('simple-json', { nullable: true })
  metadata: {
    avgEngagement?: number;
    activityLevel?: 'low' | 'medium' | 'high';
    moderated?: boolean;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.createdTribes, {
    onDelete: 'CASCADE',
    eager: false,
  })
  creator: User;

  @OneToMany(() => TribeMember, (member) => member.tribe, { cascade: true })
  members: TribeMember[];
}
