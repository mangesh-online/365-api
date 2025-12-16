import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import * as courseController from '../controllers/courseController.js';

const router = Router();

// Get All Courses
router.get('/', courseController.getAllCourses);

// Get User's Enrollments
router.get('/user/enrollments', authMiddleware, courseController.getUserEnrollments);

// Enroll in Course
router.post('/:courseId/enroll', authMiddleware, courseController.enrollInCourse);

// Get Course Detail
router.get('/:courseId', courseController.getCourseDetail);

// Mark Lesson as Complete
router.post('/:courseId/lessons/:lessonId/complete', authMiddleware, courseController.completeLesson);

export default router;
