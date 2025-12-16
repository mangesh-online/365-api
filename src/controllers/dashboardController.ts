import { Request, Response } from 'express';
import { AppDataSource } from '../database.js';
import { User } from '../entities/User.js';
import { Habit } from '../entities/Habit.js';
import { HabitLog } from '../entities/HabitLog.js';
import { MoodEntry } from '../entities/MoodEntry.js';
import { JournalEntry } from '../entities/JournalEntry.js';
import { ActivityLog } from '../entities/ActivityLog.js';
import { CourseEnrollment } from '../entities/CourseEnrollment.js';
import { Between, MoreThan } from 'typeorm';

interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
}

/**
 * Get comprehensive dashboard overview
 */
export const getDashboardOverview = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userRepo = AppDataSource.getRepository(User);
    const habitRepo = AppDataSource.getRepository(Habit);
    const habitLogRepo = AppDataSource.getRepository(HabitLog);
    const moodRepo = AppDataSource.getRepository(MoodEntry);
    const activityRepo = AppDataSource.getRepository(ActivityLog);

    // Get user data
    const user = await userRepo.findOne({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get habits
    const habits = await habitRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' }
    });

    // Get today's habit completions
    const todayLogs = await habitLogRepo.find({
      where: {
        userId,
        completedAt: Between(today, tomorrow)
      }
    });

    const completedHabitIds = new Set(todayLogs.map(log => log.habitId));

    // Calculate streaks for each habit
    const habitsWithProgress = await Promise.all(habits.map(async (habit) => {
      const logs = await habitLogRepo.find({
        where: { habitId: habit.id, userId },
        order: { completedAt: 'DESC' }
      });

      // Calculate current streak
      let streak = 0;
      let checkDate = new Date();
      checkDate.setHours(0, 0, 0, 0);

      for (const log of logs) {
        const logDate = new Date(log.completedAt);
        logDate.setHours(0, 0, 0, 0);
        
        if (logDate.getTime() === checkDate.getTime()) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else if (logDate.getTime() < checkDate.getTime()) {
          break;
        }
      }

      // Get last 7 days progress
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekLogs = await habitLogRepo.find({
        where: {
          habitId: habit.id,
          userId,
          completedAt: MoreThan(weekAgo)
        }
      });

      const weeklyProgress = Array(7).fill(false);
      weekLogs.forEach(log => {
        const daysDiff = Math.floor((today.getTime() - new Date(log.completedAt).getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff >= 0 && daysDiff < 7) {
          weeklyProgress[6 - daysDiff] = true;
        }
      });

      return {
        ...habit,
        completed: completedHabitIds.has(habit.id),
        streak,
        totalCompletions: logs.length,
        weeklyProgress
      };
    }));

    // Get today's mood
    const todayMood = await moodRepo.findOne({
      where: {
        userId,
        createdAt: Between(today, tomorrow)
      },
      order: { createdAt: 'DESC' }
    });

    // Get recent activities
    const recentActivities = await activityRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 10
    });

    // Calculate completion stats
    const completedToday = todayLogs.length;
    const totalHabits = habits.length;
    const completionRate = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;

    // Get week stats
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekLogs = await habitLogRepo.find({
      where: {
        userId,
        completedAt: MoreThan(weekAgo)
      }
    });

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        level: user.level,
        xp: user.xp,
        plan: user.plan
      },
      habits: habitsWithProgress,
      todayMood,
      recentActivities,
      stats: {
        completedToday,
        totalHabits,
        completionRate,
        weeklyTotal: weekLogs.length,
        currentStreak: user.currentStreak || 0,
        longestStreak: user.longestStreak || 0
      }
    });
  } catch (error) {
    console.error('[Dashboard] Error getting overview:', error);
    res.status(500).json({ message: 'Failed to get dashboard overview' });
  }
};

/**
 * Get dashboard stats
 */
export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const habitLogRepo = AppDataSource.getRepository(HabitLog);
    const moodRepo = AppDataSource.getRepository(MoodEntry);
    const journalRepo = AppDataSource.getRepository(JournalEntry);
    const enrollmentRepo = AppDataSource.getRepository(CourseEnrollment);

    // Get 30-day stats
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      habitCompletions,
      moodEntries,
      journalEntries,
      courseProgress
    ] = await Promise.all([
      habitLogRepo.count({
        where: {
          userId,
          completedAt: MoreThan(thirtyDaysAgo)
        }
      }),
      moodRepo.count({
        where: {
          userId,
          createdAt: MoreThan(thirtyDaysAgo)
        }
      }),
      journalRepo.count({
        where: {
          userId,
          createdAt: MoreThan(thirtyDaysAgo)
        }
      }),
      enrollmentRepo.find({
        where: { userId }
      })
    ]);

    const averageProgress = courseProgress.length > 0
      ? Math.round(courseProgress.reduce((sum, e) => sum + e.progress, 0) / courseProgress.length)
      : 0;

    res.json({
      habitCompletions,
      moodEntries,
      journalEntries,
      coursesEnrolled: courseProgress.length,
      averageCourseProgress: averageProgress
    });
  } catch (error) {
    console.error('[Dashboard] Error getting stats:', error);
    res.status(500).json({ message: 'Failed to get dashboard stats' });
  }
};

/**
 * Get weekly progress data
 */
export const getWeeklyProgress = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const habitLogRepo = AppDataSource.getRepository(HabitLog);
    const moodRepo = AppDataSource.getRepository(MoodEntry);

    // Get last 7 days
    const weekData = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const [habitCount, moods] = await Promise.all([
        habitLogRepo.count({
          where: {
            userId,
            completedAt: Between(date, nextDay)
          }
        }),
        moodRepo.find({
          where: {
            userId,
            createdAt: Between(date, nextDay)
          }
        })
      ]);

      const avgEnergy = moods.length > 0
        ? Math.round(moods.reduce((sum, m) => sum + m.energyLevel, 0) / moods.length)
        : null;

      weekData.push({
        date: date.toISOString().split('T')[0],
        day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()],
        habitCompletions: habitCount,
        energyLevel: avgEnergy,
        moodLogged: moods.length > 0
      });
    }

    res.json({ weekData });
  } catch (error) {
    console.error('[Dashboard] Error getting weekly progress:', error);
    res.status(500).json({ message: 'Failed to get weekly progress' });
  }
};

/**
 * Get achievements and badges
 */
export const getAchievements = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userRepo = AppDataSource.getRepository(User);
    const habitLogRepo = AppDataSource.getRepository(HabitLog);
    const moodRepo = AppDataSource.getRepository(MoodEntry);
    const journalRepo = AppDataSource.getRepository(JournalEntry);

    const user = await userRepo.findOne({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const [
      totalHabitCompletions,
      totalMoodEntries,
      totalJournalEntries
    ] = await Promise.all([
      habitLogRepo.count({ where: { userId } }),
      moodRepo.count({ where: { userId } }),
      journalRepo.count({ where: { userId } })
    ]);

    // Define achievements
    const achievements = [
      {
        id: 'first_habit',
        title: 'First Step',
        description: 'Complete your first habit',
        icon: '🎯',
        unlocked: totalHabitCompletions > 0,
        progress: Math.min(100, totalHabitCompletions * 100)
      },
      {
        id: 'habit_streak_7',
        title: '7-Day Warrior',
        description: 'Maintain a 7-day streak',
        icon: '🔥',
        unlocked: (user.currentStreak || 0) >= 7,
        progress: Math.min(100, ((user.currentStreak || 0) / 7) * 100)
      },
      {
        id: 'habit_streak_30',
        title: 'Month Master',
        description: 'Maintain a 30-day streak',
        icon: '💪',
        unlocked: (user.currentStreak || 0) >= 30,
        progress: Math.min(100, ((user.currentStreak || 0) / 30) * 100)
      },
      {
        id: 'mood_tracker',
        title: 'Self-Aware',
        description: 'Log your mood 7 times',
        icon: '🎭',
        unlocked: totalMoodEntries >= 7,
        progress: Math.min(100, (totalMoodEntries / 7) * 100)
      },
      {
        id: 'journaler',
        title: 'Journaling Guru',
        description: 'Write 10 journal entries',
        icon: '📔',
        unlocked: totalJournalEntries >= 10,
        progress: Math.min(100, (totalJournalEntries / 10) * 100)
      },
      {
        id: 'level_5',
        title: 'Rising Star',
        description: 'Reach level 5',
        icon: '⭐',
        unlocked: user.level >= 5,
        progress: Math.min(100, (user.level / 5) * 100)
      },
      {
        id: 'level_10',
        title: 'Elite Member',
        description: 'Reach level 10',
        icon: '👑',
        unlocked: user.level >= 10,
        progress: Math.min(100, (user.level / 10) * 100)
      },
      {
        id: 'habit_100',
        title: 'Century Club',
        description: 'Complete 100 habits',
        icon: '💯',
        unlocked: totalHabitCompletions >= 100,
        progress: Math.min(100, (totalHabitCompletions / 100) * 100)
      }
    ];

    const unlockedCount = achievements.filter(a => a.unlocked).length;

    res.json({
      achievements,
      total: achievements.length,
      unlocked: unlockedCount,
      percentComplete: Math.round((unlockedCount / achievements.length) * 100)
    });
  } catch (error) {
    console.error('[Dashboard] Error getting achievements:', error);
    res.status(500).json({ message: 'Failed to get achievements' });
  }
};

/**
 * Get leaderboard preview (top 10 users)
 * Supports period filtering: week, month, alltime
 */
export const getLeaderboardPreview = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const period = (req.query.period as string) || 'week';
    const limit = parseInt(req.query.limit as string) || 10;

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'alltime':
        startDate = new Date(0); // Beginning of time
        break;
      default:
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
    }

    const userRepo = AppDataSource.getRepository(User);
    const habitLogRepo = AppDataSource.getRepository(HabitLog);
    const activityLogRepo = AppDataSource.getRepository(ActivityLog);

    // Get all users
    const allUsers = await userRepo.find({ 
      select: ['id', 'name', 'avatar', 'level', 'xp', 'currentStreak'] 
    });

    // Calculate XP for each user based on period
    const userXpData = await Promise.all(
      allUsers.map(async (user) => {
        let periodXp = 0;

        if (period === 'alltime') {
          // Use total XP from user table
          periodXp = user.xp || 0;
        } else {
          // Calculate XP from activities in the period
          const habitLogs = await habitLogRepo.count({
            where: {
              userId: user.id,
              completedAt: MoreThan(startDate),
              completed: true
            }
          });

          const activityLogs = await activityLogRepo.find({
            where: {
              userId: user.id,
              createdAt: MoreThan(startDate)
            }
          });

          // XP calculation:
          // - Each completed habit: 10 XP
          // - Course activity: 50 XP
          // - Post/comment: 5 XP
          // - Badge earned: 100 XP
          periodXp = habitLogs * 10;

          activityLogs.forEach(log => {
            switch (log.type) {
              case 'course':
                periodXp += 50;
                break;
              case 'badge':
                periodXp += 100;
                break;
              case 'post':
                periodXp += 5;
                break;
              case 'mindset':
                periodXp += 15;
                break;
              default:
                periodXp += 5;
            }
          });
        }

        return {
          userId: user.id,
          name: user.name,
          avatar: user.avatar || '',
          level: user.level || 1,
          xp: periodXp,
          streak: user.currentStreak || 0,
          totalXp: user.xp || 0 // Keep total XP for reference
        };
      })
    );

    // Sort by XP and assign ranks
    const sortedUsers = userXpData
      .filter(u => u.xp > 0 || period === 'alltime') // Only show users with activity (except alltime)
      .sort((a, b) => b.xp - a.xp);

    // Get top N users
    const topUsers = sortedUsers.slice(0, limit);

    // Find current user's rank
    const currentUserIndex = sortedUsers.findIndex(u => u.userId === userId);
    const currentUserRank = currentUserIndex + 1;
    const currentUserData = sortedUsers[currentUserIndex];

    // Format leaderboard response
    const leaderboard = topUsers.map((user, index) => ({
      rank: index + 1,
      userId: user.userId,
      name: user.name,
      avatar: user.avatar,
      level: user.level,
      xp: user.xp,
      streak: user.streak,
      isCurrentUser: user.userId === userId
    }));

    res.json({
      leaderboard,
      period,
      currentUser: currentUserData ? {
        rank: currentUserRank,
        userId: currentUserData.userId,
        name: currentUserData.name,
        avatar: currentUserData.avatar,
        level: currentUserData.level,
        xp: currentUserData.xp,
        streak: currentUserData.streak
      } : null,
      totalUsers: sortedUsers.length,
      periodStart: startDate.toISOString(),
      periodEnd: now.toISOString()
    });
  } catch (error) {
    console.error('[Dashboard] Error getting leaderboard:', error);
    res.status(500).json({ message: 'Failed to get leaderboard' });
  }
};
