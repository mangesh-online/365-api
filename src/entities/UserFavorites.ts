import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from './User.js';

@Entity('user_favorites')
@Index(['userId', 'resourceType', 'resourceId'], { unique: true })
export class UserFavorites {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column('enum', { enum: ['tool', 'book', 'course', 'template', 'audio', 'video'] })
  resourceType: string;

  @Column('uuid')
  resourceId: string;

  @CreateDateColumn()
  createdAt: Date;
}
