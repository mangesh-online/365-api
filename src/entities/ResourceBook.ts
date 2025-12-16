import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('resource_books')
@Index(['category'])
export class ResourceBook {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', { length: 255 })
  title: string;

  @Column('varchar', { length: 255 })
  author: string;

  @Column('varchar', { length: 100 })
  category: string; // Psychology, Productivity, Health, etc.

  @Column('text', { nullable: true })
  description: string;

  @Column('decimal', { precision: 2, scale: 1, default: 0 })
  rating: number;

  @Column('varchar', { length: 20 })
  emoji: string;

  @Column('int')
  pages: number;

  @Column('varchar', { length: 50 })
  readTime: string; // "8h", "12h"

  @Column('json')
  tags: string[]; // ['habits', 'behavior']

  @Column('varchar', { length: 500, nullable: true })
  coverImage: string;

  @Column('varchar', { length: 500, nullable: true })
  purchaseLink: string;

  @Column('boolean', { default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
