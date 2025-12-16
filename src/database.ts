import 'dotenv/config';
import { DataSource } from 'typeorm';
import { User } from './entities/User.js';
import { Habit } from './entities/Habit.js';
import { HabitLog } from './entities/HabitLog.js';
import { Community } from './entities/Community.js';
import { Comment } from './entities/Comment.js';
import { Share } from './entities/Share.js';
import { EngagementStat } from './entities/EngagementStat.js';
import { Course } from './entities/Course.js';
import { CourseEnrollment } from './entities/CourseEnrollment.js';
import { Lesson } from './entities/Lesson.js';
import { LessonProgress } from './entities/LessonProgress.js';
import { MoodEntry } from './entities/MoodEntry.js';
import { JournalEntry } from './entities/JournalEntry.js';
import { ActivityLog } from './entities/ActivityLog.js';
import { Resource } from './entities/Resource.js';
import { Session } from './entities/Session.js';
import { SessionAttendance } from './entities/SessionAttendance.js';
import { SessionRSVP } from './entities/SessionRSVP.js';
import { SessionActivity } from './entities/SessionActivity.js';
import { Tribe } from './entities/Tribe.js';
import { TribeMember } from './entities/TribeMember.js';
import { TribeJoinRequest } from './entities/TribeJoinRequest.js';
import { TribeEvent } from './entities/TribeEvent.js';
import { TribeChannel } from './entities/TribeChannel.js';
import { TribeMessage } from './entities/TribeMessage.js';
import { UserInterest } from './entities/UserInterest.js';
import { PersonalityQuiz } from './entities/PersonalityQuiz.js';
import { TribeQuizAnswer } from './entities/TribeQuizAnswer.js';
import { CourseResource } from './entities/CourseResource.js';
import { UserSettings } from './entities/UserSettings.js';
import { UserProfileView } from './entities/UserProfileView.js';
import { Follow } from './entities/Follow.js';
import { Conversation } from './entities/Conversation.js';
import { Message } from './entities/Message.js';
import { BrainTool } from './entities/BrainTool.js';
import { ToolProgress } from './entities/ToolProgress.js';
import { ResourceBook } from './entities/ResourceBook.js';
import { UserBookProgress } from './entities/UserBookProgress.js';
import { ResourceTemplate } from './entities/ResourceTemplate.js';
import { ResourceMedia } from './entities/ResourceMedia.js';
import { UserFavorites } from './entities/UserFavorites.js';
import { CommunityRole } from './entities/CommunityRole.js';
import { PostReaction } from './entities/PostReaction.js';
import { ModerationLog } from './entities/ModerationLog.js';

const DATABASE_URL = process.env.DATABASE_URL || '';
const inferredType = DATABASE_URL.startsWith('mysql') ? 'mysql' : DATABASE_URL.startsWith('postgres') || DATABASE_URL.startsWith('postgresql') ? 'postgres' : 'postgres';

export const AppDataSource = new DataSource({
  // TypeORM expects a specific driver name; infer from DATABASE_URL
  type: (inferredType as any),
  url: DATABASE_URL,
  synchronize: false, // Disabled - use initDatabase() for first-time setup
  logging: false,
  entities: [
    User,
    Habit,
    HabitLog,
    Community,
    Comment,
    Share,
    EngagementStat,
    Course,
    CourseEnrollment,
    CourseResource,
    Lesson,
    LessonProgress,
    MoodEntry,
    JournalEntry,
    ActivityLog,
    // New content-driven entities
    Resource,
    Session,
    SessionAttendance,
    SessionRSVP,
    SessionActivity,
    // Tribe and community expansion entities
    Tribe,
    TribeMember,
    TribeJoinRequest,
    TribeEvent,
    TribeChannel,
    TribeMessage,
    UserInterest,
    PersonalityQuiz,
    TribeQuizAnswer,
    UserSettings,
    UserProfileView,
    Follow,
    Conversation,
    Message,
    BrainTool,
    ToolProgress,
    ResourceBook,
    UserBookProgress,
    ResourceTemplate,
    ResourceMedia,
    UserFavorites,
    CommunityRole,
    PostReaction,
    ModerationLog,
  ],
  migrations: ['src/migrations/*.ts'],
  subscribers: [],
});
