import { Request, Response } from 'express';
import { AppDataSource } from '../database.js';
import { Session } from '../entities/Session.js';
import { SessionAttendance } from '../entities/SessionAttendance.js';
import { SessionRSVP } from '../entities/SessionRSVP.js';
import { SessionActivity } from '../entities/SessionActivity.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const sessionRepo = AppDataSource.getRepository(Session);
const attendanceRepo = AppDataSource.getRepository(SessionAttendance);
const rsvpRepo = AppDataSource.getRepository(SessionRSVP);
const activityRepo = AppDataSource.getRepository(SessionActivity);

// Helper function to parse JSON fields
const parseSessionJSON = (session: Session) => ({
  ...session,
  topics: typeof session.topics === 'string' ? JSON.parse(session.topics as any) : session.topics,
  learningOutcomes: typeof session.learningOutcomes === 'string' ? JSON.parse(session.learningOutcomes as any) : session.learningOutcomes,
  tags: typeof session.tags === 'string' ? JSON.parse(session.tags as any) : session.tags,
});

export const getAllSessions = async (req: Request, res: Response) => {
  try {
    const sessions = await sessionRepo.find({ order: { date: 'ASC' } });
    const parsedSessions = sessions.map(parseSessionJSON);
    res.json(parsedSessions);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
};

export const getUpcomingSessions = async (req: Request, res: Response) => {
  try {
    const sessions = await sessionRepo.find({ where: { status: 'Upcoming' }, order: { date: 'ASC' } });
    const parsedSessions = sessions.map(parseSessionJSON);
    res.json(parsedSessions);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch upcoming sessions' });
  }
};

export const attendSession = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const session = await sessionRepo.findOne({ where: { id: sessionId } });
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const existing = await attendanceRepo.findOne({ where: { sessionId, userId: req.userId } });
    if (existing) {
      existing.attended = true;
      const saved = await attendanceRepo.save(existing);
      return res.json(saved);
    }

    const attendance = attendanceRepo.create({ sessionId, userId: req.userId, attended: true });
    const saved = await attendanceRepo.save(attendance);
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: 'Failed to record attendance' });
  }
};

// RSVP to a session
export const rsvpSession = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = req.userId!;

    const session = await sessionRepo.findOne({ where: { id: sessionId } });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Check if already RSVP'd
    const existing = await rsvpRepo.findOne({ where: { sessionId, userId } });
    if (existing) {
      if (existing.status === 'cancelled') {
        existing.status = 'confirmed';
        await rsvpRepo.save(existing);
        session.currentRSVPs += 1;
        await sessionRepo.save(session);
      }
      return res.json({ rsvp: existing, session });
    }

    // Check capacity
    const status = session.currentRSVPs >= session.maxParticipants ? 'waitlist' : 'confirmed';
    
    const rsvp = rsvpRepo.create({
      sessionId,
      userId,
      status
    });
    
    await rsvpRepo.save(rsvp);

    if (status === 'confirmed') {
      session.currentRSVPs += 1;
      await sessionRepo.save(session);
    }

    res.status(201).json({ rsvp, session });
  } catch (err) {
    console.error('RSVP error:', err);
    res.status(500).json({ error: 'Failed to RSVP' });
  }
};

// Cancel RSVP
export const cancelRSVP = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = req.userId!;

    const rsvp = await rsvpRepo.findOne({ where: { sessionId, userId } });
    if (!rsvp) {
      return res.status(404).json({ error: 'RSVP not found' });
    }

    if (rsvp.status === 'confirmed') {
      const session = await sessionRepo.findOne({ where: { id: sessionId } });
      if (session) {
        session.currentRSVPs = Math.max(0, session.currentRSVPs - 1);
        await sessionRepo.save(session);
      }
    }

    rsvp.status = 'cancelled';
    await rsvpRepo.save(rsvp);

    res.json({ message: 'RSVP cancelled', rsvp });
  } catch (err) {
    console.error('Cancel RSVP error:', err);
    res.status(500).json({ error: 'Failed to cancel RSVP' });
  }
};

// Get user's RSVPs
export const getUserRSVPs = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const rsvps = await rsvpRepo.find({ 
      where: { userId },
      order: { createdAt: 'DESC' }
    });
    res.json(rsvps);
  } catch (err) {
    console.error('Get RSVPs error:', err);
    res.status(500).json({ error: 'Failed to fetch RSVPs' });
  }
};

// Get session RSVPs (for admin/host)
export const getSessionRSVPs = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const rsvps = await rsvpRepo.find({ 
      where: { sessionId },
      order: { createdAt: 'ASC' }
    });
    res.json(rsvps);
  } catch (err) {
    console.error('Get session RSVPs error:', err);
    res.status(500).json({ error: 'Failed to fetch session RSVPs' });
  }
};

// Get live sessions
export const getLiveSessions = async (req: Request, res: Response) => {
  try {
    const sessions = await sessionRepo.find({ 
      where: { status: 'Live' }, 
      order: { createdAt: 'DESC' } 
    });
    const parsedSessions = sessions.map(parseSessionJSON);
    res.json(parsedSessions);
  } catch (err) {
    console.error('Get live sessions error:', err);
    res.status(500).json({ error: 'Failed to fetch live sessions' });
  }
};

// Get past sessions with recordings
export const getPastSessions = async (req: Request, res: Response) => {
  try {
    const { limit } = req.query;
    const sessions = await sessionRepo.find({ 
      where: { status: 'Past' }, 
      order: { date: 'DESC' },
      take: limit ? parseInt(limit as string) : undefined
    });
    const parsedSessions = sessions.map(parseSessionJSON);
    res.json(parsedSessions);
  } catch (err) {
    console.error('Get past sessions error:', err);
    res.status(500).json({ error: 'Failed to fetch past sessions' });
  }
};

// Get session stats for user
export const getSessionStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    
    const totalSessions = await sessionRepo.count();
    const upcomingSessions = await sessionRepo.count({ where: { status: 'Upcoming' } });
    const liveSessions = await sessionRepo.count({ where: { status: 'Live' } });
    const pastSessions = await sessionRepo.count({ where: { status: 'Past' } });
    
    const userRSVPs = await rsvpRepo.find({ where: { userId } });
    const totalRSVPs = userRSVPs.length;
    const totalAttended = userRSVPs.filter(r => r.attended).length;
    
    // Calculate streak
    const attendedRSVPs = userRSVPs
      .filter(r => r.attended)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    
    for (let i = 0; i < attendedRSVPs.length; i++) {
      tempStreak++;
      if (tempStreak > longestStreak) longestStreak = tempStreak;
      
      // Check if there's a gap
      if (i < attendedRSVPs.length - 1) {
        const current = new Date(attendedRSVPs[i].createdAt);
        const next = new Date(attendedRSVPs[i + 1].createdAt);
        const diffDays = Math.floor((current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays > 7) {
          if (i === 0) currentStreak = tempStreak;
          tempStreak = 0;
        }
      }
    }
    
    if (tempStreak > 0 && currentStreak === 0) currentStreak = tempStreak;
    
    const stats = {
      totalSessions,
      upcomingSessions,
      liveSessions,
      pastSessions,
      totalAttended,
      totalRSVPs,
      currentStreak,
      longestStreak,
      hoursWatched: totalAttended * 1.5, // Estimate
      certificatesEarned: Math.floor(totalAttended / 10),
    };
    
    res.json(stats);
  } catch (err) {
    console.error('Get session stats error:', err);
    res.status(500).json({ error: 'Failed to fetch session stats' });
  }
};

// Get activity feed
export const getActivityFeed = async (req: Request, res: Response) => {
  try {
    const { limit } = req.query;
    const activities = await activityRepo.find({ 
      order: { createdAt: 'DESC' },
      take: limit ? parseInt(limit as string) : 20
    });
    res.json(activities);
  } catch (err) {
    console.error('Get activity feed error:', err);
    res.status(500).json({ error: 'Failed to fetch activity feed' });
  }
};

// Get session recommendations for user
export const getRecommendations = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { limit } = req.query;
    
    // Get user's RSVP history to understand preferences
    const userRSVPs = await rsvpRepo.find({ 
      where: { userId },
      relations: ['session']
    });
    
    // Get all upcoming sessions
    const upcomingSessions = await sessionRepo.find({ 
      where: { status: 'Upcoming' },
      order: { date: 'ASC' }
    });
    
    // Simple recommendation logic: prefer categories user has attended before
    const attendedCategories = new Set(
      userRSVPs
        .filter(r => r.attended)
        .map(r => (r as any).session?.category)
        .filter(Boolean)
    );
    
    const recommendations = upcomingSessions
      .map(session => {
        const parsedSession = parseSessionJSON(session);
        let matchScore = 50; // Base score
        
        // Boost score for matching categories
        if (attendedCategories.has(session.category)) {
          matchScore += 30;
        }
        
        // Boost for featured sessions
        if (session.featured) {
          matchScore += 10;
        }
        
        // Boost for difficulty matching user level
        if (userRSVPs.length < 3 && session.difficulty === 'Beginner') {
          matchScore += 10;
        } else if (userRSVPs.length >= 10 && session.difficulty === 'Advanced') {
          matchScore += 10;
        }
        
        const reasons = [];
        if (attendedCategories.has(session.category)) {
          reasons.push(`You've enjoyed ${session.category} sessions before`);
        }
        if (session.featured) {
          reasons.push('Featured session');
        }
        if (session.difficulty === 'Beginner') {
          reasons.push('Perfect for getting started');
        }
        
        return {
          session: parsedSession,
          matchScore,
          reasons
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit ? parseInt(limit as string) : 5);
    
    res.json(recommendations);
  } catch (err) {
    console.error('Get recommendations error:', err);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
};

// Create session activity
export const createActivity = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionId, type, content, metadata } = req.body;
    const userId = req.userId!;
    
    // Get user info (in real app, fetch from user table)
    const userName = 'User'; // TODO: Fetch from user table
    
    const activity = activityRepo.create({
      sessionId,
      userId,
      userName,
      type,
      content,
      metadata
    });
    
    const saved = await activityRepo.save(activity);
    res.status(201).json(saved);
  } catch (err) {
    console.error('Create activity error:', err);
    res.status(500).json({ error: 'Failed to create activity' });
  }
};
