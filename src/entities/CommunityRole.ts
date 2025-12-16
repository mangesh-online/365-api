import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from './User.js';
import { Tribe } from './Tribe.js';

export type RoleType = 'owner' | 'admin' | 'moderator' | 'member';

export interface RolePermissions {
  canManageMembers: boolean;
  canEditTribe: boolean;
  canDeletePosts: boolean;
  canPinPosts: boolean;
  canBanMembers: boolean;
  canManageRoles: boolean;
  canManageEvents: boolean;
  canViewAnalytics: boolean;
}

@Entity('community_roles')
@Index(['tribeId', 'userId'], { unique: true })
@Index(['roleType'])
export class CommunityRole {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tribeId: string;

  @Column('uuid')
  userId: string;

  @Column({
    type: 'enum',
    enum: ['owner', 'admin', 'moderator', 'member'],
    default: 'member',
  })
  roleType: RoleType;

  @Column('simple-json', { nullable: true })
  permissions?: RolePermissions;

  @Column('text', { nullable: true })
  customTitle?: string; // e.g., "Community Champion", "Senior Moderator"

  @Column('varchar', { length: 50, nullable: true })
  badgeColor?: string; // Hex color for role badge

  @CreateDateColumn()
  assignedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Tribe, { onDelete: 'CASCADE' })
  tribe: Tribe;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;
}
