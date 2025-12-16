import { Response, Router } from 'express';
import { AppDataSource } from '../database.js';
import { BrainTool } from '../entities/BrainTool.js';
import { ToolProgress } from '../entities/ToolProgress.js';
import { ResourceBook } from '../entities/ResourceBook.js';
import { UserBookProgress } from '../entities/UserBookProgress.js';
import { ResourceTemplate } from '../entities/ResourceTemplate.js';
import { ResourceMedia } from '../entities/ResourceMedia.js';
import { UserFavorites } from '../entities/UserFavorites.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { Course } from '../entities/Course.js';
import { CourseEnrollment } from '../entities/CourseEnrollment.js';

const brainToolRepo = AppDataSource.getRepository(BrainTool);
const toolProgressRepo = AppDataSource.getRepository(ToolProgress);
const bookRepo = AppDataSource.getRepository(ResourceBook);
const bookProgressRepo = AppDataSource.getRepository(UserBookProgress);
const templateRepo = AppDataSource.getRepository(ResourceTemplate);
const mediaRepo = AppDataSource.getRepository(ResourceMedia);
const favoritesRepo = AppDataSource.getRepository(UserFavorites);
const courseRepo = AppDataSource.getRepository(Course);
const enrollmentRepo = AppDataSource.getRepository(CourseEnrollment);

// ========== BRAIN TOOLS ==========

export const getAllBrainTools = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const tools = await brainToolRepo.find({ where: { isActive: true }, order: { category: 'ASC' } });
    
    // Get user progress for each tool
    const toolsWithProgress = await Promise.all(
      tools.map(async (tool) => {
        const progress = await toolProgressRepo.findOne({
          where: { userId, toolId: tool.id },
        });
        return {
          ...tool,
          completionCount: progress?.completionCount || 0,
          totalMinutes: progress?.totalMinutes || 0,
          lastUsedAt: progress?.lastUsedAt,
          isMastered: progress?.isMastered || false,
        };
      })
    );

    res.json(toolsWithProgress);
  } catch (err) {
    console.error('Error fetching brain tools:', err);
    res.status(500).json({ error: 'Failed to fetch brain tools' });
  }
};

export const startBrainTool = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { toolId } = req.params;
    const userId = req.userId!;

    const tool = await brainToolRepo.findOne({ where: { id: toolId } });
    if (!tool) {
      return res.status(404).json({ error: 'Tool not found' });
    }

    // Create or update progress
    let progress = await toolProgressRepo.findOne({ where: { userId, toolId } });
    
    if (!progress) {
      progress = toolProgressRepo.create({
        userId,
        toolId,
        completionCount: 0,
        totalMinutes: 0,
      });
    }

    progress.lastUsedAt = new Date();
    await toolProgressRepo.save(progress);

    res.json({ success: true, progress });
  } catch (err) {
    console.error('Error starting brain tool:', err);
    res.status(500).json({ error: 'Failed to start brain tool' });
  }
};

export const completeBrainTool = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { toolId } = req.params;
    const { durationMinutes, sessionData } = req.body;
    const userId = req.userId!;

    let progress = await toolProgressRepo.findOne({ where: { userId, toolId } });
    
    if (!progress) {
      progress = toolProgressRepo.create({
        userId,
        toolId,
        completionCount: 1,
        totalMinutes: durationMinutes || 0,
        lastUsedAt: new Date(),
        sessionData,
      });
    } else {
      progress.completionCount += 1;
      progress.totalMinutes += durationMinutes || 0;
      progress.lastUsedAt = new Date();
      progress.sessionData = sessionData;

      // Check if mastered (e.g., 20+ completions)
      if (progress.completionCount >= 20) {
        progress.isMastered = true;
      }
    }

    await toolProgressRepo.save(progress);

    // Update tool usage count
    await brainToolRepo.increment({ id: toolId }, 'usageCount', 1);

    res.json({ success: true, progress });
  } catch (err) {
    console.error('Error completing brain tool:', err);
    res.status(500).json({ error: 'Failed to complete brain tool' });
  }
};

// ========== BOOKS ==========

export const getAllBooks = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const books = await bookRepo.find({ where: { isActive: true }, order: { category: 'ASC' } });
    
    // Get user progress for each book
    const booksWithProgress = await Promise.all(
      books.map(async (book) => {
        const progress = await bookProgressRepo.findOne({
          where: { userId, bookId: book.id },
        });
        return {
          ...book,
          tags: typeof book.tags === 'string' ? JSON.parse(book.tags) : book.tags,
          keyInsights: typeof book.keyInsights === 'string' ? JSON.parse(book.keyInsights) : book.keyInsights,
          status: progress?.status || 'not-started',
          currentPage: progress?.currentPage || 0,
          progressPercent: progress?.progressPercent || 0,
          isFavorite: progress?.isFavorite || false,
        };
      })
    );

    res.json(booksWithProgress);
  } catch (err) {
    console.error('Error fetching books:', err);
    res.status(500).json({ error: 'Failed to fetch books' });
  }
};

export const updateBookProgress = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { bookId } = req.params;
    const { status, currentPage, notes, userRating } = req.body;
    const userId = req.userId!;

    const book = await bookRepo.findOne({ where: { id: bookId } });
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    let progress = await bookProgressRepo.findOne({ where: { userId, bookId } });
    
    if (!progress) {
      progress = bookProgressRepo.create({
        userId,
        bookId,
        status: status || 'not-started',
        currentPage: currentPage || 0,
      });
    }

    if (status) progress.status = status;
    if (currentPage !== undefined) {
      progress.currentPage = currentPage;
      progress.progressPercent = (currentPage / book.pages) * 100;
    }
    if (notes) progress.notes = notes;
    if (userRating) progress.userRating = userRating;

    if (status === 'reading' && !progress.startedAt) {
      progress.startedAt = new Date();
    }
    if (status === 'completed' && !progress.completedAt) {
      progress.completedAt = new Date();
      progress.progressPercent = 100;
    }

    await bookProgressRepo.save(progress);

    res.json({ success: true, progress });
  } catch (err) {
    console.error('Error updating book progress:', err);
    res.status(500).json({ error: 'Failed to update book progress' });
  }
};

// ========== COURSES ==========

export const getAllCourses = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const courses = await courseRepo.find({ order: { title: 'ASC' } });
    
    // Get enrollment status for each course
    const coursesWithStatus = await Promise.all(
      courses.map(async (course) => {
        const enrollment = await enrollmentRepo.findOne({
          where: { userId, courseId: course.id },
        });
        return {
          ...course,
          isEnrolled: !!enrollment,
          progress: enrollment?.progress || 0,
        };
      })
    );

    res.json(coursesWithStatus);
  } catch (err) {
    console.error('Error fetching courses:', err);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
};

export const enrollInCourse = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { courseId } = req.params;
    const userId = req.userId!;

    const course = await courseRepo.findOne({ where: { id: courseId } });
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    let enrollment = await enrollmentRepo.findOne({ where: { userId, courseId } });
    
    if (!enrollment) {
      enrollment = enrollmentRepo.create({
        userId,
        courseId,
        enrolledAt: new Date(),
        progress: 0,
      });
      await enrollmentRepo.save(enrollment);
    }

    res.json({ success: true, enrollment });
  } catch (err) {
    console.error('Error enrolling in course:', err);
    res.status(500).json({ error: 'Failed to enroll in course' });
  }
};

// ========== TEMPLATES ==========

export const getAllTemplates = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const templates = await templateRepo.find({ where: { isActive: true }, order: { category: 'ASC' } });
    
    // Parse JSON fields
    const parsedTemplates = templates.map(template => ({
      ...template,
      features: typeof template.features === 'string' ? JSON.parse(template.features) : template.features,
    }));
    
    res.json(parsedTemplates);
  } catch (err) {
    console.error('Error fetching templates:', err);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
};

export const downloadTemplate = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { templateId } = req.params;

    const template = await templateRepo.findOne({ where: { id: templateId } });
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Increment download count
    template.downloadCount += 1;
    await templateRepo.save(template);

    res.json({ success: true, downloadUrl: template.downloadUrl });
  } catch (err) {
    console.error('Error downloading template:', err);
    res.status(500).json({ error: 'Failed to download template' });
  }
};

// ========== MEDIA (AUDIO/VIDEO) ==========

export const getAllMedia = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { type } = req.query; // 'audio' or 'video'
    const query: any = { isActive: true };
    if (type) query.mediaType = type;

    const media = await mediaRepo.find({ where: query, order: { category: 'ASC' } });
    
    // Parse JSON fields
    const parsedMedia = media.map(item => ({
      ...item,
      tags: typeof item.tags === 'string' ? JSON.parse(item.tags) : item.tags,
    }));
    
    res.json(parsedMedia);
  } catch (err) {
    console.error('Error fetching media:', err);
    res.status(500).json({ error: 'Failed to fetch media' });
  }
};

export const trackMediaPlay = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { mediaId } = req.params;

    const media = await mediaRepo.findOne({ where: { id: mediaId } });
    if (!media) {
      return res.status(404).json({ error: 'Media not found' });
    }

    // Increment play count
    media.playCount += 1;
    await mediaRepo.save(media);

    res.json({ success: true });
  } catch (err) {
    console.error('Error tracking media play:', err);
    res.status(500).json({ error: 'Failed to track media play' });
  }
};

// ========== FAVORITES ==========

export const getUserFavorites = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const favorites = await favoritesRepo.find({ where: { userId } });
    res.json(favorites);
  } catch (err) {
    console.error('Error fetching favorites:', err);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
};

export const toggleFavorite = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { resourceType, resourceId } = req.body;
    const userId = req.userId!;

    const existing = await favoritesRepo.findOne({
      where: { userId, resourceType, resourceId },
    });

    if (existing) {
      // Remove favorite
      await favoritesRepo.remove(existing);
      res.json({ success: true, isFavorite: false });
    } else {
      // Add favorite
      const favorite = favoritesRepo.create({
        userId,
        resourceType,
        resourceId,
      });
      await favoritesRepo.save(favorite);
      res.json({ success: true, isFavorite: true });
    }
  } catch (err) {
    console.error('Error toggling favorite:', err);
    res.status(500).json({ error: 'Failed to toggle favorite' });
  }
};
