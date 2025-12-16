import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('resources')
@Index(['category'])
export class Resource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar')
  title: string;

  @Column('varchar')
  type: string;

  @Column('varchar')
  category: string;

  @Column('text', { nullable: true })
  description: string;

  @Column('text', { nullable: true })
  previewContent: string;

  @Column('varchar', { nullable: true })
  audioSrc: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
