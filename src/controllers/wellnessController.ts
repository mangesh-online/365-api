import { Response } from 'express';
import { AppDataSource } from '../database.js';
import { MoodEntry } from '../entities/MoodEntry.js';
import { JournalEntry } from '../entities/JournalEntry.js';
import { ActivityLog } from '../entities/ActivityLog.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const moodRepository = AppDataSource.getRepository(MoodEntry);
const journalRepository = AppDataSource.getRepository(JournalEntry);
const activityRepository = AppDataSource.getRepository(ActivityLog);

export const logMood = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { mood, energyLevel, note } = req.body;

    if (!mood || !energyLevel) {
      res.status(400).json({ error: 'Mood and energy level are required' });
      return;
    }

    const moodEntry = moodRepository.create({
      userId: req.userId,
      mood,
      energyLevel,
      note,
    });

    const saved = await moodRepository.save(moodEntry);

    await activityRepository.save(
      activityRepository.create({
        userId: req.userId,
        type: 'mindset',
        content: `Logged mood: ${mood}`,
      })
    );

    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ error: 'Failed to log mood' });
  }
};

export const getLatestMood = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const latest = await moodRepository.findOne({
      where: { userId: req.userId },
      order: { createdAt: 'DESC' },
    });

    res.json(latest || null);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch mood' });
  }
};

export const getMoodHistory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const moods = await moodRepository.find({
      where: { userId: req.userId },
      order: { createdAt: 'DESC' },
      take: 30,
    });

    res.json(moods);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch mood history' });
  }
};

export const createJournalEntry = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { type, prompts } = req.body;

    if (!type || !prompts) {
      res.status(400).json({ error: 'Type and prompts are required' });
      return;
    }

    const entry = journalRepository.create({
      userId: req.userId,
      type,
      prompts,
    });

    const saved = await journalRepository.save(entry);

    await activityRepository.save(
      activityRepository.create({
        userId: req.userId,
        type: 'mindset',
        content: `Completed ${type} journal entry`,
      })
    );

    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create journal entry' });
  }
};

export const getJournalHistory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const entries = await journalRepository.find({
      where: { userId: req.userId },
      order: { createdAt: 'DESC' },
      take: 30,
    });

    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch journal history' });
  }
};

export const deleteJournalEntry = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const entry = await journalRepository.findOne({
      where: { id, userId: req.userId },
    });

    if (!entry) {
      res.status(404).json({ error: 'Journal entry not found' });
      return;
    }

    await journalRepository.remove(entry);

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete journal entry' });
  }
};

export const getActivities = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const activities = await activityRepository.find({
      where: { userId: req.userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });

    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
};
