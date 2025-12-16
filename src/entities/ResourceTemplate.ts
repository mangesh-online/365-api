import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('resource_templates')
@Index(['category'])
export class ResourceTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', { length: 255 })
  title: string;

  @Column('varchar', { length: 100 })
  category: string; // Professional, Student, Personal, Creative

  @Column('text')
  description: string;

  @Column('varchar', { length: 50 })
  format: string; // Notion, Excel, PDF

  @Column('varchar', { length: 500 })
  downloadUrl: string;

  @Column('varchar', { length: 500, nullable: true })
  previewImage: string;

  @Column('int', { default: 0 })
  downloadCount: number;

  @Column('json')
  features: string[]; // List of template features

  @Column('boolean', { default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
