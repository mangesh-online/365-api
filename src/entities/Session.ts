import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('sessions')
@Index(['status', 'date'])
@Index(['category'])
@Index(['featured'])
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar')
  title: string;

  @Column('varchar', { nullable: true })
  type: string;

  @Column('varchar', { nullable: true })
  category: string; // Mindset, Productivity, Health, Business, Relationships, Finance, Personal Growth

  @Column('varchar', { nullable: true })
  date: string;

  @Column('varchar', { nullable: true })
  time: string;

  @Column('varchar', { nullable: true })
  image: string;

  @Column({ type: 'enum', enum: ['Upcoming', 'Live', 'Past'], default: 'Upcoming' })
  status: 'Upcoming' | 'Live' | 'Past';

  @Column('text', { nullable: true })
  description: string;

  @Column('varchar', { nullable: true })
  recordingUrl: string;

  @Column('varchar', { nullable: true })
  hostId: string;

  @Column('varchar', { nullable: true })
  hostName: string;

  @Column('varchar', { nullable: true })
  hostAvatar: string;

  @Column('text', { nullable: true })
  hostBio: string;

  @Column('json', { nullable: true })
  topics: string[]; // JSON array of topics

  @Column('json', { nullable: true })
  learningOutcomes: string[]; // JSON array of outcomes

  @Column('json', { nullable: true })
  tags: string[]; // JSON array of tags

  @Column('int', { default: 100 })
  maxParticipants: number;

  @Column('int', { default: 0 })
  currentRSVPs: number;

  @Column('varchar', { nullable: true })
  zoomLink: string;

  @Column('varchar', { nullable: true })
  zoomMeetingId: string;

  @Column('varchar', { nullable: true })
  zoomPasscode: string;

  @Column('int', { nullable: true })
  durationMinutes: number;

  @Column({ type: 'enum', enum: ['Beginner', 'Intermediate', 'Advanced'], nullable: true })
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';

  @Column('boolean', { default: false })
  featured: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
