import { Request, Response } from 'express';
import { AppDataSource } from '../database.js';
import { Course } from '../entities/Course.js';
import { CourseEnrollment } from '../entities/CourseEnrollment.js';
import { Lesson } from '../entities/Lesson.js';
import { LessonProgress } from '../entities/LessonProgress.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const courseRepository = AppDataSource.getRepository(Course);
const enrollmentRepository = AppDataSource.getRepository(CourseEnrollment);
const lessonRepository = AppDataSource.getRepository(Lesson);
const progressRepository = AppDataSource.getRepository(LessonProgress);

export const getAllCourses = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const courses = await courseRepository.find({
      relations: ['lessons', 'resources'],
    });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
};

export const getUserEnrollments = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const enrollments = await enrollmentRepository.find({
      where: { userId: req.userId },
      relations: ['course', 'course.lessons', 'lessonProgress'],
    });
    res.json(enrollments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch enrollments' });
  }
};

export const enrollInCourse = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { courseId } = req.params;
    const course = await courseRepository.findOne({ where: { id: courseId } });

    if (!course) {
      res.status(404).json({ error: 'Course not found' });
      return;
    }

    const existing = await enrollmentRepository.findOne({
      where: { userId: req.userId, courseId },
    });

    if (existing) {
      // Return 200 OK with the existing enrollment - not an error state
      res.status(200).json({ ...existing, alreadyEnrolled: true });
      return;
    }

    const enrollment = enrollmentRepository.create({
      userId: req.userId,
      courseId,
      progress: 0,
    });

    const savedEnrollment = await enrollmentRepository.save(enrollment);
    res.status(201).json(savedEnrollment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to enroll' });
  }
};

export const getCourseDetail = async (req: AuthenticatedRequest, res: Response) => {
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

export const completeLesson = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { courseId, lessonId } = req.params;

    const enrollment = await enrollmentRepository.findOne({
      where: { userId: req.userId, courseId },
    });

    if (!enrollment) {
      res.status(404).json({ error: 'Not enrolled in this course' });
      return;
    }

    let progress = await progressRepository.findOne({
      where: { enrollmentId: enrollment.id, lessonId },
    });

    if (progress) {
      progress.completed = true;
      progress.progress = 100;
      progress.completedAt = new Date();
    } else {
      progress = progressRepository.create({
        enrollmentId: enrollment.id,
        lessonId,
        completed: true,
        progress: 100,
        completedAt: new Date(),
      });
    }

    const savedProgress = await progressRepository.save(progress);

    // Update enrollment progress
    const allProgress = await progressRepository.find({
      where: { enrollmentId: enrollment.id },
    });
    const completedCount = allProgress.filter((p: any) => p.completed).length;
    const course = await courseRepository.findOne({ where: { id: courseId } });
    const courseProgress = Math.round((completedCount / (course?.totalLessons || 1)) * 100);

    enrollment.progress = courseProgress;
    if (courseProgress === 100) {
      enrollment.completedAt = new Date();
    }
    await enrollmentRepository.save(enrollment);

    res.json(savedProgress);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update lesson' });
  }
};
