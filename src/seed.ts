import { DataSource } from 'typeorm';
import { Resource } from './entities/Resource.js';
import { Session } from './entities/Session.js';
import { Course } from './entities/Course.js';
import { Lesson } from './entities/Lesson.js';
import { CourseResource } from './entities/CourseResource.js';
import { seedBrainToolsData } from './seedBrainTools.js';
import { seedSessionsData } from './seedSessions.js';

export async function seedInitialData(AppDataSource: DataSource) {
  const resourceRepo = AppDataSource.getRepository(Resource);
  const sessionRepo = AppDataSource.getRepository(Session);
  const courseRepo = AppDataSource.getRepository(Course);
  const lessonRepo = AppDataSource.getRepository(Lesson);
  const courseResourceRepo = AppDataSource.getRepository(CourseResource);

  // Seed brain tools and resources
  try {
    await seedBrainToolsData();
  } catch (err) {
    console.warn('⚠️ Brain tools seed failed:', err);
  }

  // Seed sessions
  try {
    await seedSessionsData();
  } catch (err) {
    console.warn('⚠️ Sessions seed failed:', err);
  }

  const rCount = await resourceRepo.count();
  if (rCount === 0) {
    const resources = [
      {
        title: '365 Habit Journal',
        type: 'PDF',
        category: 'Tools',
        description: 'A printable tracker to visualize your daily wins.',
        previewContent: '# 365 Habit Journal\n\n## Weekly Reflection\n\n1. What was your biggest win this week?\n',
      },
      {
        title: 'Morning Routine Planner',
        type: 'Template',
        category: 'Productivity',
        description: 'The exact protocol to win the morning.',
        previewContent: 'AM ROUTINE PROTOCOL:\n\n[ ] 06:00 - Hydrate (500ml)\n',
      },
      {
        title: 'Deep Focus Meditation',
        type: 'Audio',
        category: 'Mindset',
        description: 'Binaural beats to help you enter flow state immediately.',
        audioSrc: 'https://cdn.pixabay.com/download/audio/2022/03/24/audio_089e0b4804.mp3'
      }
    ];

    for (const r of resources) {
      const ent = resourceRepo.create(r as any);
      await resourceRepo.save(ent);
    }
    console.log('🔹 Seeded resources');
  }

  const sCount = await sessionRepo.count();
  if (sCount === 0) {
    const sessions = [
      {
        title: 'Weekly Accountability Meetup',
        date: 'Sunday, Nov 30',
        time: '10:00 AM IST',
        type: 'Weekly Meetup',
        image: 'https://picsum.photos/seed/meetup/300/200',
        status: 'Upcoming',
        description: 'A one hour group check-in and planning session.'
      },
      {
        title: 'Productivity Masterclass: Time Blocking',
        date: 'Saturday, Dec 6',
        time: '6:00 PM IST',
        type: 'Masterclass',
        image: 'https://picsum.photos/seed/master/300/200',
        status: 'Upcoming',
        description: 'Tactical session on time blocking for deep work.'
      }
    ];

    for (const s of sessions) {
      const ent = sessionRepo.create(s as any);
      await sessionRepo.save(ent);
    }
    console.log('🔹 Seeded sessions');
  }

  // Seed courses with lessons and resources
  const courseCount = await courseRepo.count();
  if (courseCount === 0) {
    // Create a test course
    const course = courseRepo.create({
      title: 'The 365 Days Challenge: Build Unstoppable Habits',
      description: 'Learn how to build lasting habits that compound daily. Transform your life in 365 days with practical strategies and accountability.',
      category: 'Personal Development',
      instructor: 'James Clear',
      image: 'https://picsum.photos/seed/course1/600/400',
      overview: 'This comprehensive course teaches you the science and practice of habit formation. You will learn:\n\n• How habits work and why they are the compound interest of self-improvement\n• The habit loop: cue, routine, reward\n• Strategies to make habits obvious, attractive, easy, and satisfying\n• How to stack habits for exponential results\n• Real-world case studies of successful 365-day challengers',
      notes: '📌 Important Tips:\n• Start small - a 2 minute habit is better than no habit\n• Track your progress daily\n• Use the Accountability page to mark lessons complete\n• Join the community for support and motivation\n• Remember: motivation follows action, not the other way around',
    });

    const savedCourse = await courseRepo.save(course);
    console.log('✅ Seeded course:', savedCourse.id);

    // Create lessons for the course
    const lessons = [
      {
        courseId: savedCourse.id,
        title: 'Introduction to the Science of Habits',
        description: 'Understand how habits work at a neurological level and why they are the cornerstone of personal transformation.',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        duration: 15,
        order: 1,
        type: 'Video' as const,
      },
      {
        courseId: savedCourse.id,
        title: 'The Three-Part Habit Loop',
        description: 'Deep dive into cue, routine, and reward. Learn how to identify and leverage the habit loop in your own life.',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        duration: 18,
        order: 2,
        type: 'Video' as const,
      },
      {
        courseId: savedCourse.id,
        title: 'Making Habits Obvious: Design Your Environment',
        description: 'Your environment shapes your behavior. Learn how to make desired habits obvious and undesired habits invisible.',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        documentUrl: 'https://example.com/habit-setup-guide.pdf',
        duration: 20,
        order: 3,
        type: 'Video' as const,
      },
      {
        courseId: savedCourse.id,
        title: 'Making Habits Attractive: Temptation Bundling',
        description: 'Pair habits you want with activities you enjoy. Discover the power of temptation bundling to make habits more appealing.',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        duration: 16,
        order: 4,
        type: 'Video' as const,
      },
    ];

    for (const lesson of lessons) {
      const lessonEnt = lessonRepo.create(lesson);
      await lessonRepo.save(lessonEnt);
    }

    // Update total lessons count
    savedCourse.totalLessons = lessons.length;
    await courseRepo.save(savedCourse);

    // Create course resources
    const resources = [
      {
        courseId: savedCourse.id,
        title: 'Atomic Habits Summary',
        description: 'Key takeaways and actionable insights from the bestselling book.',
        fileUrl: 'https://example.com/atomic-habits-summary.pdf',
        fileName: 'atomic-habits-summary.pdf',
        type: 'PDF' as const,
        fileSizeKB: 2500,
        order: 0,
      },
      {
        courseId: savedCourse.id,
        title: 'Habit Tracking Template',
        description: 'Excel template to track your daily habits for 365 days.',
        fileUrl: 'https://example.com/habit-tracker.xlsx',
        fileName: 'habit-tracker.xlsx',
        type: 'XLSX' as const,
        fileSizeKB: 150,
        order: 1,
      },
      {
        courseId: savedCourse.id,
        title: 'Daily Habit Checklist',
        description: 'Printable checklist for tracking habits during your 365-day challenge.',
        fileUrl: 'https://example.com/daily-checklist.pdf',
        fileName: 'daily-checklist.pdf',
        type: 'PDF' as const,
        fileSizeKB: 500,
        order: 2,
      },
    ];

    for (const res of resources) {
      const resEnt = courseResourceRepo.create(res);
      await courseResourceRepo.save(resEnt);
    }

    console.log('✅ Seeded lessons and resources');
  }
}

