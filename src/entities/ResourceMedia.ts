import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('resource_media')
@Index(['mediaType'])
@Index(['category'])
export class ResourceMedia {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('enum', { enum: ['audio', 'video'] })
  mediaType: string;

  @Column('varchar', { length: 255 })
  title: string;

  @Column('varchar', { length: 100 })
  category: string; // Focus, Relaxation, Sleep, etc.

  @Column('text')
  description: string;

  @Column('varchar', { length: 500 })
  mediaUrl: string;

  @Column('varchar', { length: 500, nullable: true })
  thumbnailUrl: string;

  @Column('varchar', { length: 50 })
  duration: string; // "30 min", "1 hour"

  @Column('varchar', { length: 255, nullable: true })
  instructor: string;

  @Column('int', { default: 0 })
  viewCount: number;

  @Column('int', { default: 0 })
  playCount: number;

  @Column('decimal', { precision: 2, scale: 1, default: 0 })
  rating: number;

  @Column('json', { nullable: true })
  tags: string[];

  @Column('boolean', { default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
