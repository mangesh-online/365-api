import { Response } from 'express';
import { AppDataSource } from '../database.js';
import { Habit } from '../entities/Habit.js';
import { HabitLog } from '../entities/HabitLog.js';
import { ActivityLog } from '../entities/ActivityLog.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const habitRepository = AppDataSource.getRepository(Habit);
const habitLogRepository = AppDataSource.getRepository(HabitLog);
const activityRepository = AppDataSource.getRepository(ActivityLog);

export const getHabits = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const habits = await habitRepository.find({
      where: { userId: req.userId },
      order: { createdAt: 'DESC' },
    });

    // Calculate weeklyProgress for each habit (last 7 days)
    const habitsWithProgress = await Promise.all(
      habits.map(async (habit: Habit) => {
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const logs = await habitLogRepository.find({
          where: {
            habitId: habit.id,
          },
          order: { completedAt: 'ASC' },
        });

        // Filter logs from last 7 days
        const recentLogs = logs.filter((log: HabitLog) => {
          const logDate = new Date(log.completedAt);
          return logDate >= sevenDaysAgo && logDate <= now;
        });

        // Create a map of dates with completion status
        const logsByDate: { [key: string]: boolean } = {};
        recentLogs.forEach((log: HabitLog) => {
          const dateStr = new Date(log.completedAt).toDateString();
          logsByDate[dateStr] = log.completed;
        });

        // Build 7-day progress array
        const weeklyProgress: boolean[] = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          const dateStr = date.toDateString();
          weeklyProgress.push(logsByDate[dateStr] || false);
        }

        return { ...habit, weeklyProgress };
      })
    );

    res.json(habitsWithProgress);
  } catch (error) {
    console.error('Error fetching habits:', error);
    res.status(500).json({ error: 'Failed to fetch habits' });
  }
};

export const createHabit = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, category, frequency, timeOfDay } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Habit name is required' });
      return;
    }

    const habit = habitRepository.create({
      userId: req.userId,
      name,
      category: category || 'Productivity',
      frequency: frequency || 'Daily',
      timeOfDay: timeOfDay || 'Anytime',
      completed: false,
      streak: 0,
      bestStreak: 0,
      totalCompletions: 0,
    });

    const savedHabit = await habitRepository.save(habit);
    await activityRepository.save(
      activityRepository.create({
        userId: req.userId,
        type: 'habit',
        content: `Started tracking new habit: ${name}`,
      })
    );

    res.status(201).json(savedHabit);
  } catch (error) {
    console.error('Error creating habit:', error);
    res.status(500).json({ error: 'Failed to create habit' });
  }
};

export const toggleHabit = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const habit = await habitRepository.findOne({ where: { id } });

    if (!habit) {
      res.status(404).json({ error: 'Habit not found' });
      return;
    }

    if (habit.userId !== req.userId) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    const today = new Date();
    const todayStr = today.toDateString();

    // Find log for today for this specific user
    const logs = await habitLogRepository.find({ 
      where: { 
        habitId: habit.id,
        userId: req.userId!
      } 
    });
    const todayLog = logs.find(l => new Date(l.completedAt).toDateString() === todayStr);

    let xpGained = 0;

    if (todayLog) {
      // Untoggle
      await habitLogRepository.remove(todayLog);
      habit.completed = false;
      if (habit.streak > 0) habit.streak -= 1;
      habit.totalCompletions -= 1;
    } else {
      // Toggle - Create new log entry
      const log = habitLogRepository.create({
        habitId: habit.id,
        userId: req.userId!, // Add userId to the log
        completed: true,
        completedAt: new Date(),
      });
      await habitLogRepository.save(log);
      
      habit.completed = true;
      habit.streak += 1;
      if (habit.streak > habit.bestStreak) habit.bestStreak = habit.streak;
      habit.totalCompletions += 1;

      // Calculate XP gained (base 10 XP + bonus for streak)
      xpGained = 10 + Math.min(habit.streak, 30); // Max 40 XP (10 base + 30 bonus)

      // Log activity
      await activityRepository.save(
        activityRepository.create({
          userId: req.userId,
          type: 'habit',
          content: `Completed habit: ${habit.name}`,
        })
      );
    }

    await habitRepository.save(habit);
    res.json({ habit, xpGained });
  } catch (error) {
    console.error('Error toggling habit:', error);
    res.status(500).json({ error: 'Failed to toggle habit' });
  }
};

export const deleteHabit = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const habit = await habitRepository.findOne({ where: { id } });

    if (!habit) {
      res.status(404).json({ error: 'Habit not found' });
      return;
    }

    if (habit.userId !== req.userId) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    await habitRepository.remove(habit);
    res.json({ message: 'Habit deleted' });
  } catch (error) {
    console.error('Error deleting habit:', error);
    res.status(500).json({ error: 'Failed to delete habit' });
  }
};

export const getHabitLogs = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const habit = await habitRepository.findOne({ where: { id } });

    if (!habit) {
      res.status(404).json({ error: 'Habit not found' });
      return;
    }

    if (habit.userId !== req.userId) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    const logs = await habitLogRepository.find({
      where: { habitId: id, userId: req.userId },
      order: { completedAt: 'DESC' },
    });

    res.json(logs);
  } catch (error) {
    console.error('Error fetching habit logs:', error);
    res.status(500).json({ error: 'Failed to fetch habit logs' });
  }
};
