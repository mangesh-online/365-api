import { Request, Response } from 'express';
import { AppDataSource } from '../database.js';
import { PersonalityQuiz } from '../entities/PersonalityQuiz.js';
import { TribeQuizAnswer } from '../entities/TribeQuizAnswer.js';
import { User } from '../entities/User.js';
import { Tribe } from '../entities/Tribe.js';
import { TRIBE_PERSONALITY_QUIZ } from '../constants/TribeQuiz.js';
import { TribeMatchingService } from '../services/TribeMatchingService.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

// ============================================
// QUIZ RETRIEVAL (Public)
// ============================================

/**
 * Get the current active quiz with all questions and options
 */
export const getQuiz = async (req: Request, res: Response) => {
  try {
    // For now, return the hardcoded quiz from constants
    // In production, would fetch from database
    res.json({
      success: true,
      data: TRIBE_PERSONALITY_QUIZ,
      totalQuestions: TRIBE_PERSONALITY_QUIZ.questions.length,
      estimatedTime: TRIBE_PERSONALITY_QUIZ.estimatedTimeMinutes,
    });
  } catch (error) {
    console.error('Error fetching quiz:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch quiz' });
  }
};

/**
 * Get current quiz version
 */
export const getQuizVersion = async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      version: TRIBE_PERSONALITY_QUIZ.version,
      updatedAt: new Date('2024-01-01'), // Update as needed
    });
  } catch (error) {
    console.error('Error fetching quiz version:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch quiz version' });
  }
};

// ============================================
// QUIZ SUBMISSION & MATCHING (Authenticated)
// ============================================

/**
 * Submit quiz answers and get tribe recommendations
 */
export const submitQuiz = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { answers } = req.body;

    // Validate answers
    if (!answers || typeof answers !== 'object') {
      res.status(400).json({
        success: false,
        message: 'Invalid request. Expected answers object.',
      });
      return;
    }

    const userRepository = AppDataSource.getRepository(User);
    const tribeRepository = AppDataSource.getRepository(Tribe);
    const tribeQuizAnswerRepository = AppDataSource.getRepository(TribeQuizAnswer);

    // Get user with interests
    const user = await userRepository.findOne({
      where: { id: userId },
      relations: ['interests'],
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // Store quiz answers in database
    const answerPromises = Object.entries(answers).map(([questionId, answer]) => {
      let score = 0;

      // Find the question in the quiz
      const question = TRIBE_PERSONALITY_QUIZ.questions.find(
        (q) => q.id === questionId
      );

      if (!question) {
        return null; // Skip if question not found
      }

      // Calculate score based on answer
      if (question.type === 'single_choice' && typeof answer === 'string') {
        const option = question.options?.find((opt) => opt.id === answer);
        score = option?.value || 0;
      } else if (
        question.type === 'multiple_choice' &&
        Array.isArray(answer)
      ) {
        score = answer.reduce((sum, ans) => {
          const option = question.options?.find((opt) => opt.id === ans);
          return sum + (option?.value || 0);
        }, 0);
      } else if (question.type === 'scale') {
        score = parseInt(answer as string) || 0;
      }

      const quizAnswer = tribeQuizAnswerRepository.create({
        userId,
        quizId: 'default-quiz', // Would be actual quiz ID
        questionId,
        answer: Array.isArray(answer) ? JSON.stringify(answer) : String(answer),
        answerScore: score,
      });

      return tribeQuizAnswerRepository.save(quizAnswer);
    });

    await Promise.all(answerPromises.filter(Boolean));

    // Build user profile from quiz answers
    const userProfile = TribeMatchingService.buildUserProfileFromQuizAnswers(
      userId,
      answers
    );

    // Calculate answer weights for goal matching
    const answerWeights =
      TribeMatchingService.extractAnswerWeights(answers);

    // Get all public tribes
    const tribes = await tribeRepository
      .createQueryBuilder('tribe')
      .where('tribe.isPublic = :isPublic', { isPublic: true })
      .leftJoinAndSelect('tribe.members', 'members')
      .getMany();

    // Convert to TribeProfile format and rank
    const tribeProfiles = tribes.map((c) => ({
      id: c.id,
      name: c.name,
      goal: c.goalType,
      interests: c.interests || [],
      description: c.description,
      membersCount: c.membersCount,
      activityLevel: c.metadata?.activityLevel || 'medium',
      preferredLearningStyle: c.preferredLearningStyle,
      rules: c.rules,
      isVerified: c.isVerified,
      avgEngagement: c.metadata?.avgEngagement || 5,
    }));

    // Get top 5 matches
    const matches = TribeMatchingService.rankTribes(
      userProfile,
      tribeProfiles,
      answerWeights,
      5
    );

    // Get user's current tribes to avoid recommending them
    const userTribes = new Set(
      user.tribesMemberships?.map((m) => m.tribeId) || []
    );

    // Filter out tribes user is already in
    const recommendedMatches = matches.filter(
      (m) => !userTribes.has(m.tribeId)
    );

    res.json({
      success: true,
      message: 'Quiz submitted successfully',
      userProfile,
      recommendations: recommendedMatches.slice(0, 5),
      totalMatches: recommendedMatches.length,
    });
  } catch (error) {
    console.error('Error submitting quiz:', error);
    res.status(500).json({ success: false, message: 'Failed to submit quiz' });
  }
};

/**
 * Get a user's last quiz results and recommendations
 */
export const getQuizResults = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const resultUserId = req.params.resultUserId;

    // Check authorization
    if (userId !== resultUserId) { // Removed isAdmin check for now as it's not on req
      res.status(403).json({
        success: false,
        message: 'Not authorized to view these results',
      });
      return;
    }

    const tribeQuizAnswerRepository = AppDataSource.getRepository(TribeQuizAnswer);

    // Get most recent quiz answers for this user
    const answers = await tribeQuizAnswerRepository
      .createQueryBuilder('answer')
      .where('answer.userId = :userId', { userId: resultUserId })
      .orderBy('answer.createdAt', 'DESC')
      .take(18) // The quiz has 18 questions
      .getMany();

    if (answers.length === 0) {
      res.status(404).json({
        success: false,
        message: 'No quiz results found for this user',
      });
      return;
    }

    // Build answers object from database records
    const answersMap: Record<string, string | string[]> = {};
    answers.forEach((a) => {
      answersMap[a.questionId] = a.answer.startsWith('[')
        ? JSON.parse(a.answer)
        : a.answer;
    });

    // Recalculate profile and recommendations
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: resultUserId },
      relations: ['interests', 'tribesMemberships'],
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const userProfile = TribeMatchingService.buildUserProfileFromQuizAnswers(
      resultUserId,
      answersMap
    );
    const answerWeights = TribeMatchingService.extractAnswerWeights(answersMap);

    const tribeRepository = AppDataSource.getRepository(Tribe);
    const tribes = await tribeRepository
      .createQueryBuilder('tribe')
      .where('tribe.isPublic = :isPublic', { isPublic: true })
      .leftJoinAndSelect('tribe.members', 'members')
      .getMany();

    const tribeProfiles = tribes.map((c) => ({
      id: c.id,
      name: c.name,
      goal: c.goalType,
      interests: c.interests || [],
      description: c.description,
      membersCount: c.membersCount,
      activityLevel: c.metadata?.activityLevel || 'medium',
      preferredLearningStyle: c.preferredLearningStyle,
      rules: c.rules,
      isVerified: c.isVerified,
      avgEngagement: c.metadata?.avgEngagement || 5,
    }));

    const matches = TribeMatchingService.rankTribes(
      userProfile,
      tribeProfiles,
      answerWeights,
      5
    );

    const userTribeIds = new Set(
      user.tribesMemberships?.map((m) => m.tribeId) || []
    );
    const recommendedMatches = matches.filter(
      (m) => !userTribeIds.has(m.tribeId)
    );

    res.json({
      success: true,
      data: {
        userProfile,
        lastSubmittedAt: answers[0].createdAt,
        recommendations: recommendedMatches.slice(0, 5),
        totalMatches: recommendedMatches.length,
      },
    });
  } catch (error) {
    console.error('Error fetching quiz results:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch quiz results' });
  }
};

/**
 * Clear previous quiz answers and allow user to retake
 */
export const retakeQuiz = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const tribeQuizAnswerRepository = AppDataSource.getRepository(TribeQuizAnswer);

    // Delete all quiz answers for this user
    await tribeQuizAnswerRepository.delete({ userId });

    res.json({
      success: true,
      message: 'Quiz cleared. You can retake it now.',
    });
  } catch (error) {
    console.error('Error clearing quiz:', error);
    res.status(500).json({ success: false, message: 'Failed to clear quiz' });
  }
};

/**
 * Skip quiz and get generic tribe recommendations
 */
export const skipQuiz = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const userRepository = AppDataSource.getRepository(User);
    const tribeRepository = AppDataSource.getRepository(Tribe);

    const user = await userRepository.findOne({
      where: { id: userId },
      relations: ['interests', 'tribesMemberships'],
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // Get all public tribes sorted by member count
    const tribes = await tribeRepository
      .createQueryBuilder('tribe')
      .where('tribe.isPublic = :isPublic', { isPublic: true })
      .orderBy('tribe.membersCount', 'DESC')
      .take(5)
      .getMany();

    const userTribeIds = new Set(
      user.tribesMemberships?.map((m) => m.tribeId) || []
    );

    const recommendations = tribes
      .filter((c) => !userTribeIds.has(c.id))
      .slice(0, 5);

    res.json({
      success: true,
      message: 'Skipped quiz. Showing popular tribes.',
      data: recommendations,
    });
  } catch (error) {
    console.error('Error skipping quiz:', error);
    res.status(500).json({ success: false, message: 'Failed to skip quiz' });
  }
};

/**
 * Get quiz statistics (admin only)
 */
export const getQuizStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.isAdmin) {
      res.status(403).json({
        success: false,
        message: 'Admin access required',
      });
      return;
    }

    const tribeQuizAnswerRepository = AppDataSource.getRepository(TribeQuizAnswer);

    const totalResponses = await tribeQuizAnswerRepository.count();
    const uniqueUsers = await tribeQuizAnswerRepository
      .createQueryBuilder('answer')
      .select('COUNT(DISTINCT answer.userId)', 'count')
      .getRawOne();

    res.json({
      success: true,
      stats: {
        totalResponses,
        uniqueUsers: parseInt(uniqueUsers.count),
        quizVersion: TRIBE_PERSONALITY_QUIZ.version,
        questions: TRIBE_PERSONALITY_QUIZ.questions.length,
      },
    });
  } catch (error) {
    console.error('Error fetching quiz stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
};
