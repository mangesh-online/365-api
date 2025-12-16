import { Request, Response } from 'express';
import { AppDataSource } from '../database.js';
import { Resource } from '../entities/Resource.js';
import { Session } from '../entities/Session.js';
import { Course } from '../entities/Course.js';
import { Lesson } from '../entities/Lesson.js';
import { BrainTool } from '../entities/BrainTool.js';
import { ResourceBook } from '../entities/ResourceBook.js';
import { ResourceTemplate } from '../entities/ResourceTemplate.js';
import { ResourceMedia } from '../entities/ResourceMedia.js';
import { User } from '../entities/User.js';
import { CourseEnrollment } from '../entities/CourseEnrollment.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const resourceRepository = AppDataSource.getRepository(Resource);
const sessionRepository = AppDataSource.getRepository(Session);
const courseRepository = AppDataSource.getRepository(Course);
const lessonRepository = AppDataSource.getRepository(Lesson);
const brainToolRepository = AppDataSource.getRepository(BrainTool);
const bookRepository = AppDataSource.getRepository(ResourceBook);
const templateRepository = AppDataSource.getRepository(ResourceTemplate);
const mediaRepository = AppDataSource.getRepository(ResourceMedia);
const userRepository = AppDataSource.getRepository(User);
const enrollmentRepository = AppDataSource.getRepository(CourseEnrollment);

// ============ RESOURCES ============

export const getResources = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const resources = await resourceRepository.find({
      order: { createdAt: 'DESC' },
    });
    res.json(resources);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch resources' });
  }
};

export const createResource = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, description, category, type, downloadUrl, audioSrc, previewContent } = req.body;

    if (!title || !category || !type) {
      res.status(400).json({ error: 'Title, category, and type are required' });
      return;
    }

    const resource = resourceRepository.create({
      title,
      description,
      category,
      type,
      downloadUrl,
      audioSrc,
      previewContent,
    });

    const saved = await resourceRepository.save(resource);
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create resource' });
  }
};

export const updateResource = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { resourceId } = req.params;
    const { title, description, category, type, downloadUrl, audioSrc, previewContent } = req.body;

    const resource = await resourceRepository.findOne({
      where: { id: resourceId },
    });

    if (!resource) {
      res.status(404).json({ error: 'Resource not found' });
      return;
    }

    if (title) resource.title = title;
    if (description) resource.description = description;
    if (category) resource.category = category;
    if (type) resource.type = type;
    if (downloadUrl) resource.downloadUrl = downloadUrl;
    if (audioSrc) resource.audioSrc = audioSrc;
    if (previewContent) resource.previewContent = previewContent;

    const updated = await resourceRepository.save(resource);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update resource' });
  }
};

export const deleteResource = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { resourceId } = req.params;
    const resource = await resourceRepository.findOne({
      where: { id: resourceId },
    });

    if (!resource) {
      res.status(404).json({ error: 'Resource not found' });
      return;
    }

    await resourceRepository.remove(resource);
    res.json({ message: 'Resource deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete resource' });
  }
};

// ============ SESSIONS ============

export const getSessions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const sessions = await sessionRepository.find({
      order: { scheduledAt: 'DESC' },
    });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
};

export const createSession = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, description, scheduledAt, duration, instructorName, maxAttendees, zoomUrl, image } = req.body;

    if (!title || !scheduledAt) {
      res.status(400).json({ error: 'Title and scheduledAt are required' });
      return;
    }

    const session = sessionRepository.create({
      title,
      description,
      scheduledAt: new Date(scheduledAt),
      duration,
      instructorName,
      maxAttendees,
      zoomUrl,
      image,
    });

    const saved = await sessionRepository.save(session);
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create session' });
  }
};

export const updateSession = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { title, description, scheduledAt, duration, instructorName, maxAttendees, zoomUrl, image } = req.body;

    const session = await sessionRepository.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    if (title) session.title = title;
    if (description) session.description = description;
    if (scheduledAt) session.scheduledAt = new Date(scheduledAt);
    if (duration) session.duration = duration;
    if (instructorName) session.instructorName = instructorName;
    if (maxAttendees) session.maxAttendees = maxAttendees;
    if (zoomUrl) session.zoomUrl = zoomUrl;
    if (image) session.image = image;

    const updated = await sessionRepository.save(session);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update session' });
  }
};

export const deleteSession = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const session = await sessionRepository.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    await sessionRepository.remove(session);
    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete session' });
  }
};

// ============ COURSES ============

export const getCourses = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const courses = await courseRepository.find({
      relations: ['lessons', 'resources'],
      order: { createdAt: 'DESC' },
    });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
};

export const createCourse = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, description, category, instructor, image, overview, notes, lessons, resources } = req.body;

    if (!title) {
      res.status(400).json({ error: 'Title is required' });
      return;
    }

    // Create course first
    const course = courseRepository.create({
      title,
      description,
      category,
      instructor,
      image,
      overview,
      notes,
      totalLessons: lessons?.length || 0,
    });

    const savedCourse = await courseRepository.save(course);

    // Add lessons if provided
    if (lessons && Array.isArray(lessons) && lessons.length > 0) {
      const lessonEntities = lessons.map((lesson: any, index: number) =>
        lessonRepository.create({
          courseId: savedCourse.id,
          title: lesson.title || `Lesson ${index + 1}`,
          description: lesson.description,
          videoUrl: lesson.videoUrl,
          documentUrl: lesson.documentUrl,
          transcription: lesson.transcription,
          duration: lesson.duration,
          order: lesson.order || index + 1,
          type: 'Video',
        })
      );

      await lessonRepository.save(lessonEntities);

      // Update totalLessons
      savedCourse.totalLessons = lessonEntities.length;
      await courseRepository.save(savedCourse);
    }

    // Add resources if provided
    if (resources && Array.isArray(resources) && resources.length > 0) {
      const courseResourceRepository = AppDataSource.getRepository('CourseResource');
      const resourceEntities = resources.map((resource: any, index: number) =>
        courseResourceRepository.create({
          courseId: savedCourse.id,
          title: resource.title,
          description: resource.description,
          fileUrl: resource.fileUrl,
          fileName: resource.fileName,
          type: resource.type || 'PDF',
          fileSizeKB: resource.fileSizeKB,
          order: resource.order || index,
        })
      );

      await courseResourceRepository.save(resourceEntities);
    }

    // Return course with lessons and resources
    const fullCourse = await courseRepository.findOne({
      where: { id: savedCourse.id },
      relations: ['lessons', 'resources'],
    });

    res.status(201).json(fullCourse);
  } catch (error) {
    console.error('Course creation error:', error);
    res.status(500).json({ error: 'Failed to create course' });
  }
};

export const updateCourse = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { courseId } = req.params;
    const { title, description, category, instructor, image, overview, notes, lessons, resources } = req.body;

    const course = await courseRepository.findOne({
      where: { id: courseId },
      relations: ['lessons', 'resources'],
    });

    if (!course) {
      res.status(404).json({ error: 'Course not found' });
      return;
    }

    // Update course fields
    if (title !== undefined) course.title = title;
    if (description !== undefined) course.description = description;
    if (category !== undefined) course.category = category;
    if (instructor !== undefined) course.instructor = instructor;
    if (image !== undefined) course.image = image;
    if (overview !== undefined) course.overview = overview;
    if (notes !== undefined) course.notes = notes;

    // Set lesson count before saving
    if (lessons && Array.isArray(lessons)) {
      course.totalLessons = lessons.length;
    }

    // STEP 1: Save the course first (ensure it's persisted before adding lessons)
    const updated = await courseRepository.save(course);
    console.log('Course saved:', updated.id);

    // STEP 2: Handle lessons update (only after course is saved)
    if (lessons && Array.isArray(lessons)) {
      // Delete existing lessons
      try {
        const deleteResult = await lessonRepository.delete({ courseId: updated.id });
        console.log('Deleted lessons:', deleteResult.affected);
      } catch (delErr) {
        console.error('Error deleting lessons:', delErr);
        throw delErr;
      }

      // Add new lessons
      if (lessons.length > 0) {
        const lessonEntities = lessons.map((lesson: any, index: number) => {
          console.log('Creating lesson for course:', updated.id);
          return lessonRepository.create({
            courseId: updated.id,
            title: lesson.title || `Lesson ${index + 1}`,
            description: lesson.description || '',
            videoUrl: lesson.videoUrl || '',
            documentUrl: lesson.documentUrl || '',
            transcription: lesson.transcription || '',
            duration: lesson.duration || 0,
            order: lesson.order || index + 1,
            type: 'Video',
          });
        });

        try {
          const saved = await lessonRepository.save(lessonEntities);
          console.log('Saved lessons:', saved.length);
        } catch (saveErr) {
          console.error('Error saving lessons:', saveErr);
          throw saveErr;
        }
      }
    }

    // STEP 3: Handle resources update
    if (resources !== undefined && Array.isArray(resources)) {
      const courseResourceRepository = AppDataSource.getRepository('CourseResource');
      
      // Delete existing resources
      try {
        await courseResourceRepository.delete({ courseId: updated.id });
        console.log('Deleted resources');
      } catch (delErr) {
        console.error('Error deleting resources:', delErr);
        throw delErr;
      }

      // Add new resources
      if (resources.length > 0) {
        const resourceEntities = resources.map((resource: any, index: number) =>
          courseResourceRepository.create({
            courseId: updated.id,
            title: resource.title,
            description: resource.description,
            fileUrl: resource.fileUrl,
            fileName: resource.fileName,
            type: resource.type || 'PDF',
            fileSizeKB: resource.fileSizeKB,
            order: resource.order || index,
          })
        );

        try {
          await courseResourceRepository.save(resourceEntities);
          console.log('Saved resources:', resourceEntities.length);
        } catch (saveErr) {
          console.error('Error saving resources:', saveErr);
          throw saveErr;
        }
      }
    }

    // STEP 4: Return updated course with lessons and resources
    const fullCourse = await courseRepository.findOne({
      where: { id: updated.id },
      relations: ['lessons', 'resources'],
    });

    res.json(fullCourse);
  } catch (error) {
    console.error('Course update error:', error);
    res.status(500).json({ error: 'Failed to update course', details: (error as any).message });
  }
};

export const deleteCourse = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { courseId } = req.params;
    const course = await courseRepository.findOne({
      where: { id: courseId },
    });

    if (!course) {
      res.status(404).json({ error: 'Course not found' });
      return;
    }

    await courseRepository.remove(course);
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete course' });
  }
};

// ============ ADDITIONAL SESSION METHODS ============

export const getSession = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const session = await sessionRepository.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    res.json(session);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch session' });
  }
};

export const toggleSessionFeatured = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const session = await sessionRepository.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    session.featured = !session.featured;
    const updated = await sessionRepository.save(session);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle featured status' });
  }
};

// ============ ADDITIONAL COURSE METHODS ============

export const getCourse = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { courseId } = req.params;
    const course = await courseRepository.findOne({
      where: { id: courseId },
      relations: ['lessons', 'resources'],
    });

    if (!course) {
      res.status(404).json({ error: 'Course not found' });
      return;
    }

    res.json(course);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch course' });
  }
};

export const createLesson = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { courseId } = req.params;
    const { title, description, videoUrl, documentUrl, transcription, duration, order, type } = req.body;

    if (!title) {
      res.status(400).json({ error: 'Title is required' });
      return;
    }

    const course = await courseRepository.findOne({
      where: { id: courseId },
    });

    if (!course) {
      res.status(404).json({ error: 'Course not found' });
      return;
    }

    const lesson = lessonRepository.create({
      courseId,
      title,
      description,
      videoUrl,
      documentUrl,
      transcription,
      duration,
      order,
      type: type || 'Video',
    });

    const saved = await lessonRepository.save(lesson);
    
    // Update total lessons count
    course.totalLessons = (course.totalLessons || 0) + 1;
    await courseRepository.save(course);

    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create lesson' });
  }
};

export const updateLesson = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { courseId, lessonId } = req.params;
    const { title, description, videoUrl, documentUrl, transcription, duration, order, type } = req.body;

    const lesson = await lessonRepository.findOne({
      where: { id: lessonId, courseId },
    });

    if (!lesson) {
      res.status(404).json({ error: 'Lesson not found' });
      return;
    }

    if (title !== undefined) lesson.title = title;
    if (description !== undefined) lesson.description = description;
    if (videoUrl !== undefined) lesson.videoUrl = videoUrl;
    if (documentUrl !== undefined) lesson.documentUrl = documentUrl;
    if (transcription !== undefined) lesson.transcription = transcription;
    if (duration !== undefined) lesson.duration = duration;
    if (order !== undefined) lesson.order = order;
    if (type !== undefined) lesson.type = type;

    const updated = await lessonRepository.save(lesson);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update lesson' });
  }
};

export const deleteLesson = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { courseId, lessonId } = req.params;
    const lesson = await lessonRepository.findOne({
      where: { id: lessonId, courseId },
    });

    if (!lesson) {
      res.status(404).json({ error: 'Lesson not found' });
      return;
    }

    await lessonRepository.remove(lesson);
    
    // Update total lessons count
    const course = await courseRepository.findOne({
      where: { id: courseId },
    });
    if (course) {
      course.totalLessons = Math.max((course.totalLessons || 1) - 1, 0);
      await courseRepository.save(course);
    }

    res.json({ message: 'Lesson deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete lesson' });
  }
};

// ============ BRAIN TOOLS ============

export const getBrainTools = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { category } = req.query;
    const where: any = {};
    if (category) where.category = category;

    const tools = await brainToolRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
    res.json(tools);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch brain tools' });
  }
};

export const createBrainTool = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, description, category, icon, audioUrl, previewContent } = req.body;

    if (!title || !category) {
      res.status(400).json({ error: 'Title and category are required' });
      return;
    }

    const tool = brainToolRepository.create({
      title,
      description,
      category,
      icon,
      audioUrl,
      previewContent,
    });

    const saved = await brainToolRepository.save(tool);
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create brain tool' });
  }
};

export const updateBrainTool = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { toolId } = req.params;
    const { title, description, category, icon, audioUrl, previewContent } = req.body;

    const tool = await brainToolRepository.findOne({
      where: { id: toolId },
    });

    if (!tool) {
      res.status(404).json({ error: 'Brain tool not found' });
      return;
    }

    if (title !== undefined) tool.title = title;
    if (description !== undefined) tool.description = description;
    if (category !== undefined) tool.category = category;
    if (icon !== undefined) tool.icon = icon;
    if (audioUrl !== undefined) tool.audioUrl = audioUrl;
    if (previewContent !== undefined) tool.previewContent = previewContent;

    const updated = await brainToolRepository.save(tool);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update brain tool' });
  }
};

export const deleteBrainTool = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { toolId } = req.params;
    const tool = await brainToolRepository.findOne({
      where: { id: toolId },
    });

    if (!tool) {
      res.status(404).json({ error: 'Brain tool not found' });
      return;
    }

    await brainToolRepository.remove(tool);
    res.json({ message: 'Brain tool deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete brain tool' });
  }
};

// ============ BOOKS ============

export const getBooks = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { category } = req.query;
    const where: any = {};
    if (category) where.category = category;

    const books = await bookRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
    res.json(books);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch books' });
  }
};

export const createBook = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, author, description, category, coverUrl, downloadUrl, rating } = req.body;

    if (!title || !author) {
      res.status(400).json({ error: 'Title and author are required' });
      return;
    }

    const book = bookRepository.create({
      title,
      author,
      description,
      category,
      coverUrl,
      downloadUrl,
      rating,
    });

    const saved = await bookRepository.save(book);
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create book' });
  }
};

export const updateBook = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { bookId } = req.params;
    const { title, author, description, category, coverUrl, downloadUrl, rating } = req.body;

    const book = await bookRepository.findOne({
      where: { id: bookId },
    });

    if (!book) {
      res.status(404).json({ error: 'Book not found' });
      return;
    }

    if (title !== undefined) book.title = title;
    if (author !== undefined) book.author = author;
    if (description !== undefined) book.description = description;
    if (category !== undefined) book.category = category;
    if (coverUrl !== undefined) book.coverUrl = coverUrl;
    if (downloadUrl !== undefined) book.downloadUrl = downloadUrl;
    if (rating !== undefined) book.rating = rating;

    const updated = await bookRepository.save(book);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update book' });
  }
};

export const deleteBook = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { bookId } = req.params;
    const book = await bookRepository.findOne({
      where: { id: bookId },
    });

    if (!book) {
      res.status(404).json({ error: 'Book not found' });
      return;
    }

    await bookRepository.remove(book);
    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete book' });
  }
};

// ============ TEMPLATES ============

export const getTemplates = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { type, category } = req.query;
    const where: any = {};
    if (type) where.type = type;
    if (category) where.category = category;

    const templates = await templateRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
};

export const createTemplate = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description, type, category, previewUrl, downloadUrl, content } = req.body;

    if (!name || !type) {
      res.status(400).json({ error: 'Name and type are required' });
      return;
    }

    const template = templateRepository.create({
      name,
      description,
      type,
      category,
      previewUrl,
      downloadUrl,
      content,
    });

    const saved = await templateRepository.save(template);
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create template' });
  }
};

export const updateTemplate = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { templateId } = req.params;
    const { name, description, type, category, previewUrl, downloadUrl, content } = req.body;

    const template = await templateRepository.findOne({
      where: { id: templateId },
    });

    if (!template) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }

    if (name !== undefined) template.name = name;
    if (description !== undefined) template.description = description;
    if (type !== undefined) template.type = type;
    if (category !== undefined) template.category = category;
    if (previewUrl !== undefined) template.previewUrl = previewUrl;
    if (downloadUrl !== undefined) template.downloadUrl = downloadUrl;
    if (content !== undefined) template.content = content;

    const updated = await templateRepository.save(template);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update template' });
  }
};

export const deleteTemplate = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { templateId } = req.params;
    const template = await templateRepository.findOne({
      where: { id: templateId },
    });

    if (!template) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }

    await templateRepository.remove(template);
    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete template' });
  }
};

// ============ MEDIA (Audio/Video) ============

export const getMedia = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { type, category } = req.query;
    const where: any = {};
    if (type) where.type = type; // 'audio' or 'video'
    if (category) where.category = category;

    const media = await mediaRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
    res.json(media);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch media' });
  }
};

export const createMedia = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, description, type, category, url, thumbnailUrl, duration } = req.body;

    if (!title || !type || !url) {
      res.status(400).json({ error: 'Title, type, and url are required' });
      return;
    }

    const media = mediaRepository.create({
      title,
      description,
      type,
      category,
      url,
      thumbnailUrl,
      duration,
    });

    const saved = await mediaRepository.save(media);
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create media' });
  }
};

export const updateMedia = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { mediaId } = req.params;
    const { title, description, type, category, url, thumbnailUrl, duration } = req.body;

    const media = await mediaRepository.findOne({
      where: { id: mediaId },
    });

    if (!media) {
      res.status(404).json({ error: 'Media not found' });
      return;
    }

    if (title !== undefined) media.title = title;
    if (description !== undefined) media.description = description;
    if (type !== undefined) media.type = type;
    if (category !== undefined) media.category = category;
    if (url !== undefined) media.url = url;
    if (thumbnailUrl !== undefined) media.thumbnailUrl = thumbnailUrl;
    if (duration !== undefined) media.duration = duration;

    const updated = await mediaRepository.save(media);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update media' });
  }
};

export const deleteMedia = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { mediaId } = req.params;
    const media = await mediaRepository.findOne({
      where: { id: mediaId },
    });

    if (!media) {
      res.status(404).json({ error: 'Media not found' });
      return;
    }

    await mediaRepository.remove(media);
    res.json({ message: 'Media deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete media' });
  }
};

// ============ USERS ============

export const getUsers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, role } = req.query;
    const where: any = {};
    if (status) where.status = status;
    if (role) where.role = role;

    const users = await userRepository.find({
      where,
      order: { createdAt: 'DESC' },
      select: ['id', 'email', 'name', 'avatar', 'isAdmin', 'status', 'createdAt'],
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

export const getUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const user = await userRepository.findOne({
      where: { id: userId },
      select: ['id', 'email', 'name', 'avatar', 'isAdmin', 'status', 'createdAt', 'bio', 'location'],
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

export const updateUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { name, email, bio, location, avatar } = req.body;

    const user = await userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (bio !== undefined) user.bio = bio;
    if (location !== undefined) user.location = location;
    if (avatar !== undefined) user.avatar = avatar;

    const updated = await userRepository.save(user);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
};

export const toggleUserAdmin = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const user = await userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    user.isAdmin = !user.isAdmin;
    const updated = await userRepository.save(user);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle admin status' });
  }
};

export const banUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const user = await userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    user.status = 'banned';
    const updated = await userRepository.save(user);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to ban user' });
  }
};

export const unbanUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const user = await userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    user.status = 'active';
    const updated = await userRepository.save(user);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to unban user' });
  }
};

export const deleteUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.params;
    
    // Prevent admin from deleting themselves
    if (req.user?.id === userId) {
      res.status(400).json({ error: 'Cannot delete your own account' });
      return;
    }

    const user = await userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    await userRepository.remove(user);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

// ============ DASHBOARD ============

export const getDashboardStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const [
      totalUsers,
      totalSessions,
      totalCourses,
      totalEnrollments,
      activeUsers,
    ] = await Promise.all([
      userRepository.count(),
      sessionRepository.count(),
      courseRepository.count(),
      enrollmentRepository.count(),
      userRepository.count({ where: { status: 'active' } }),
    ]);

    res.json({
      totalUsers,
      totalSessions,
      totalCourses,
      totalEnrollments,
      totalPosts: 0, // Placeholder
      activeUsers,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};

export const getRecentActivity = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const [recentUsers, recentEnrollments] = await Promise.all([
      userRepository.find({
        order: { createdAt: 'DESC' },
        take: 5,
        select: ['id', 'name', 'email', 'avatar', 'createdAt'],
      }),
      enrollmentRepository.find({
        relations: ['user', 'course'],
        order: { enrolledAt: 'DESC' },
        take: 5,
      }),
    ]);

    res.json({
      recentUsers,
      recentPosts: [], // Placeholder
      recentEnrollments,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch recent activity' });
  }
};

// ============ ANALYTICS ============

export const getUserAnalytics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { period = '30d' } = req.query;
    
    // Get user stats by date (simplified - you can enhance with date ranges)
    const totalUsers = await userRepository.count();
    const activeUsers = await userRepository.count({ where: { status: 'active' } });
    const bannedUsers = await userRepository.count({ where: { status: 'banned' } });
    const adminUsers = await userRepository.count({ where: { isAdmin: true } });

    res.json({
      totalUsers,
      activeUsers,
      bannedUsers,
      adminUsers,
      period,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user analytics' });
  }
};

export const getContentAnalytics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { period = '30d' } = req.query;
    
    const [
      totalSessions,
      totalCourses,
      totalBooks,
      totalTemplates,
      totalMedia,
      totalBrainTools,
      totalEnrollments,
    ] = await Promise.all([
      sessionRepository.count(),
      courseRepository.count(),
      bookRepository.count(),
      templateRepository.count(),
      mediaRepository.count(),
      brainToolRepository.count(),
      enrollmentRepository.count(),
    ]);

    res.json({
      totalSessions,
      totalCourses,
      totalBooks,
      totalTemplates,
      totalMedia,
      totalBrainTools,
      totalPosts: 0, // Placeholder
      totalEnrollments,
      period,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch content analytics' });
  }
};

// ============ SETTINGS ============

export const getSettings = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Return default settings (you can add a Settings table later)
    res.json({
      siteName: '365 Club',
      siteDescription: 'Mental Wellness Community',
      maintenanceMode: false,
      allowRegistration: true,
      requireEmailVerification: false,
      maxUploadSize: 10, // MB
      featuresEnabled: {
        sessions: true,
        courses: true,
        resources: true,
        community: true,
        tribes: true,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
};

export const updateSettings = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // For now, just return the settings (you can add database persistence later)
    const settings = req.body;
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
};
