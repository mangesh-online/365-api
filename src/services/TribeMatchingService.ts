/**
 * TRIBE MATCHING SERVICE
 *
 * Sophisticated algorithm to match users to tribes based on:
 * 1. Quiz answers and scoring
 * 2. User interests
 * 3. Goal alignment
 * 4. Learning style compatibility
 * 5. Personality trait compatibility
 * 6. Engagement patterns
 *
 * Scoring Formula:
 * Final Score = (Goal Match × 0.40) + (Interest Match × 0.25) + (Learning Style × 0.15) + (Personality × 0.15) + (Engagement × 0.05)
 *
 * Result: 0-100 score per tribe
 * Recommendation: 70+ = Highly recommended, 50-69 = Recommended, < 50 = Not recommended
 */

import { GoalType } from '../entities/Tribe.js';
import { TribeGoal } from '../entities/PersonalityQuiz.js';

export interface UserProfile {
  userId: string;
  primaryGoal: GoalType;
  secondaryGoals?: GoalType[];
  interests: string[];
  learningStyle: 'visual' | 'auditory' | 'reading' | 'kinesthetic' | 'mixed';
  motivation: 'achievement' | 'community' | 'growth' | 'purpose' | 'autonomy';
  commitment: 'casual' | 'moderate' | 'serious' | 'obsessed';
  personality: {
    introvert: number; // 0 (intro) to 10 (extro)
    detailOriented: number; // 0 (big picture) to 10 (detail)
    planner: number; // 0 (spontaneous) to 10 (planner)
  };
  experience: 'beginner' | 'intermediate' | 'advanced';
  challengeArea: string;
  preferredCommunityStyle: string;
}

export interface TribeProfile {
  id: string;
  name: string;
  goal: TribeGoal;
  interests: string[];
  description: string;
  membersCount: number;
  activityLevel: 'low' | 'medium' | 'high';
  preferredLearningStyle?: string;
  rules?: string;
  isVerified: boolean;
  avgEngagement: number;
}

export interface MatchResult {
  tribeId: string;
  tribeName: string;
  matchScore: number; // 0-100
  matchPercentage: string; // e.g., "82%"
  recommendation: 'highly_recommended' | 'recommended' | 'marginal';
  matchBreakdown: {
    goalMatch: number;
    interestMatch: number;
    learningStyleMatch: number;
    personalityMatch: number;
    engagementMatch: number;
  };
  reasonsToJoin: string[]; // Top 3 reasons why this user should join
  reasonsNotToJoin?: string[]; // Potential concerns
}

export class TribeMatchingService {
  /**
   * Calculate match score between user and tribe
   * Main entry point for matching algorithm
   */
  static calculateMatchScore(
    userProfile: UserProfile,
    tribeProfile: TribeProfile,
    userAnswerWeights?: Record<TribeGoal, number>
  ): MatchResult {
    // Calculate individual match components
    const goalMatch = this.calculateGoalMatch(
      userProfile,
      tribeProfile,
      userAnswerWeights
    );
    const interestMatch = this.calculateInterestMatch(
      userProfile.interests,
      tribeProfile.interests
    );
    const learningStyleMatch = this.calculateLearningStyleMatch(
      userProfile.learningStyle,
      tribeProfile.preferredLearningStyle
    );
    const personalityMatch = this.calculatePersonalityMatch(
      userProfile,
      tribeProfile
    );
    const engagementMatch = this.calculateEngagementMatch(
      userProfile.commitment,
      tribeProfile.activityLevel
    );

    // Weighted formula
    const matchScore =
      goalMatch * 0.4 +
      interestMatch * 0.25 +
      learningStyleMatch * 0.15 +
      personalityMatch * 0.15 +
      engagementMatch * 0.05;

    // Determine recommendation tier
    let recommendation: 'highly_recommended' | 'recommended' | 'marginal' =
      'marginal';
    if (matchScore >= 75) {
      recommendation = 'highly_recommended';
    } else if (matchScore >= 60) {
      recommendation = 'recommended';
    }

    // Generate reasons
    const reasonsToJoin = this.generateReasonsToJoin(
      userProfile,
      tribeProfile,
      {
        goalMatch,
        interestMatch,
        learningStyleMatch,
        personalityMatch,
        engagementMatch,
      }
    );

    return {
      tribeId: tribeProfile.id,
      tribeName: tribeProfile.name,
      matchScore: Math.round(matchScore),
      matchPercentage: `${Math.round(matchScore)}%`,
      recommendation,
      matchBreakdown: {
        goalMatch: Math.round(goalMatch),
        interestMatch: Math.round(interestMatch),
        learningStyleMatch: Math.round(learningStyleMatch),
        personalityMatch: Math.round(personalityMatch),
        engagementMatch: Math.round(engagementMatch),
      },
      reasonsToJoin,
    };
  }

  /**
   * PRIMARY FACTOR: Goal Alignment (40% weight)
   * Scores how well tribe's goal matches user's goals
   */
  private static calculateGoalMatch(
    userProfile: UserProfile,
    tribeProfile: TribeProfile,
    userAnswerWeights?: Record<TribeGoal, number>
  ): number {
    let score = 0;

    // Check primary goal match (highest weight)
    if (userProfile.primaryGoal === tribeProfile.goal) {
      score += 70; // 70 points for primary goal match
    } else if (
      userProfile.secondaryGoals &&
      userProfile.secondaryGoals.includes(tribeProfile.goal)
    ) {
      score += 40; // 40 points for secondary goal match
    } else {
      score += 10; // 10 points for any other goal (better than nothing)
    }

    // If we have quiz answer weights, use them for more precision
    if (userAnswerWeights && userAnswerWeights[tribeProfile.goal]) {
      const answerWeight = userAnswerWeights[tribeProfile.goal];
      const answerScore = (answerWeight / 10) * 20; // Normalize to 0-20 points
      score += answerScore;
    }

    // Commitment level boost
    // Users with higher commitment are more likely to match with active tribes
    const commitmentBoost =
      userProfile.commitment === 'obsessed'
        ? 15
        : userProfile.commitment === 'serious'
          ? 10
          : userProfile.commitment === 'moderate'
            ? 5
            : 0;
    score += commitmentBoost;

    return Math.min(score, 100); // Cap at 100
  }

  /**
   * SECONDARY FACTOR: Interest Overlap (25% weight)
   * Scores how many interests are shared
   */
  private static calculateInterestMatch(
    userInterests: string[],
    tribeInterests: string[]
  ): number {
    if (!userInterests || !tribeInterests) {
      return 50; // Neutral if either has no interests
    }

    if (userInterests.length === 0) {
      return 50;
    }

    // Count matching interests
    const matches = userInterests.filter((interest) =>
      tribeInterests
        .map((i) => i.toLowerCase())
        .includes(interest.toLowerCase())
    ).length;

    // Calculate overlap percentage
    const overlapPercentage = (matches / userInterests.length) * 100;

    // Bonus for exact match on all interests
    if (overlapPercentage === 100) {
      return 100;
    }

    // Bonus for at least 50% overlap
    if (overlapPercentage >= 50) {
      return 80 + (overlapPercentage - 50) * 0.4; // 80-100
    }

    // Some overlap is better than none
    return overlapPercentage * 0.8; // 0-80
  }

  /**
   * TERTIARY FACTOR: Learning Style Match (15% weight)
   * Scores compatibility of learning preferences
   */
  private static calculateLearningStyleMatch(
    userLearningStyle: string,
    tribeLearningStyle?: string
  ): number {
    // If tribe doesn't specify, give neutral score
    if (!tribeLearningStyle || tribeLearningStyle === 'mixed') {
      return 70;
    }

    // Perfect match
    if (
      userLearningStyle.toLowerCase() ===
      tribeLearningStyle.toLowerCase()
    ) {
      return 100;
    }

    // Partial matches (related learning styles)
    const partialMatches: Record<string, string[]> = {
      visual: ['mixed'], // Visual learners also do well in mixed
      auditory: ['mixed'],
      reading: ['visual', 'mixed'], // Reading pairs well with visual
      kinesthetic: ['mixed', 'auditory'], // Kinesthetic + community interaction
      mixed: ['visual', 'auditory', 'reading', 'kinesthetic'], // Mixed works with all
    };

    if (
      partialMatches[userLearningStyle]?.includes(
        tribeLearningStyle.toLowerCase()
      )
    ) {
      return 80;
    }

    // No match but can still benefit
    return 60;
  }

  /**
   * PERSONALITY COMPATIBILITY (15% weight)
   * Scores personality trait alignment
   */
  private static calculatePersonalityMatch(
    userProfile: UserProfile,
    tribeProfile: TribeProfile
  ): number {
    let score = 50; // Start with neutral

    // Introvert/Extrovert compatibility
    // Extroverts prefer high-activity tribes
    // Introverts prefer moderate-activity tribes
    if (userProfile.personality.introvert < 3) {
      // Extrovert
      if (tribeProfile.activityLevel === 'high') {
        score += 20;
      } else if (tribeProfile.activityLevel === 'medium') {
        score += 10;
      }
    } else if (userProfile.personality.introvert > 7) {
      // Introvert
      if (tribeProfile.activityLevel === 'low' || tribeProfile.activityLevel === 'medium') {
        score += 20;
      }
    } else {
      // Ambivert - comfortable with any activity level
      score += 15;
    }

    // Planning style compatibility
    // Planners appreciate structured tribes
    // Spontaneous people prefer flexible tribes
    if (userProfile.personality.planner > 6) {
      // Planner - prefers rules and structure
      if (tribeProfile.rules) {
        score += 10;
      }
    } else if (userProfile.personality.planner < 4) {
      // Spontaneous - less concerned with rigid structure
      score += 10;
    }

    // Experience level compatibility
    // Beginners benefit from expert-led tribes
    // Advanced users appreciate peer tribes
    if (userProfile.experience === 'beginner') {
      if (tribeProfile.isVerified) {
        score += 15; // Verified tribes have better content
      }
    }

    return Math.min(score, 100);
  }

  /**
   * ENGAGEMENT MATCH (5% weight)
   * Scores alignment of user commitment and tribe activity level
   */
  private static calculateEngagementMatch(
    userCommitment: string,
    tribeActivityLevel: string
  ): number {
    const engagementMap: Record<string, Record<string, number>> = {
      casual: { low: 90, medium: 60, high: 30 },
      moderate: { low: 60, medium: 90, high: 60 },
      serious: { low: 40, medium: 80, high: 100 },
      obsessed: { low: 20, medium: 70, high: 100 },
    };

    return engagementMap[userCommitment]?.[tribeActivityLevel] || 50;
  }

  /**
   * Generate human-readable reasons why user should join tribe
   */
  private static generateReasonsToJoin(
    userProfile: UserProfile,
    tribeProfile: TribeProfile,
    scores: {
      goalMatch: number;
      interestMatch: number;
      learningStyleMatch: number;
      personalityMatch: number;
      engagementMatch: number;
    }
  ): string[] {
    const reasons: string[] = [];

    // Top reason: Goal alignment
    if (scores.goalMatch > 80) {
      reasons.push(
        `Perfectly aligned with your ${tribeProfile.goal} goals`
      );
    } else if (scores.goalMatch > 60) {
      reasons.push(`Supports your ${tribeProfile.goal} journey`);
    }

    // Interest alignment
    if (scores.interestMatch > 80) {
      reasons.push('Shares your core interests and passions');
    }

    // Community style
    if (tribeProfile.activityLevel === 'high') {
      reasons.push('Very active community for daily engagement');
    } else if (tribeProfile.activityLevel === 'medium') {
      reasons.push('Balanced activity level with consistent support');
    }

    // Verified status
    if (tribeProfile.isVerified) {
      reasons.push(
        'Verified and high-quality community with trusted content'
      );
    }

    // High engagement
    if (tribeProfile.avgEngagement > 7) {
      reasons.push('High member engagement and supportive atmosphere');
    }

    // Limit to 3 main reasons
    return reasons.slice(0, 3);
  }

  /**
   * Get top N matching tribes for a user
   * Useful for tribe discovery page and recommendations
   */
  static rankTribes(
    userProfile: UserProfile,
    allTribes: TribeProfile[],
    userAnswerWeights?: Record<TribeGoal, number>,
    limit: number = 5
  ): MatchResult[] {
    const matches = allTribes
      .map((tribe) =>
        this.calculateMatchScore(userProfile, tribe, userAnswerWeights)
      )
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);

    return matches;
  }

  /**
   * Build user profile from quiz answers
   * Converts raw quiz responses to structured UserProfile
   */
  static buildUserProfileFromQuizAnswers(
    userId: string,
    quizAnswers: Record<string, string | string[]>
  ): UserProfile {
    // Mapping quiz question IDs to user profile fields
    const q1Answer = quizAnswers['q1'] as string;
    const q2Answers = quizAnswers['q2'] as string[];
    const q3Answer = quizAnswers['q3'] as string;
    const q4Answer = quizAnswers['q4'] as string;
    const q5Answer = quizAnswers['q5'] as string;
    const q6Answer = quizAnswers['q6'] as string;
    const q7Answer = quizAnswers['q7'] as string;
    const q8Answer = quizAnswers['q8'] as string;
    const q9Answer = quizAnswers['q9'] as string;
    const q10Answer = quizAnswers['q10'] as string;
    const q11Answer = quizAnswers['q11'] as string;
    const q18Answers = quizAnswers['q18'] as string[];

    // Map question answers to goal types
    const goalMap: Record<string, TribeGoal> = {
      q1_health: 'health',
      q1_fitness: 'fitness',
      q1_learning: 'learning',
      q1_career: 'career',
      q1_mindfulness: 'mindfulness',
      q1_relationships: 'relationships',
      q1_financial: 'financial',
      q1_creative: 'creative',
      q1_purpose: 'personal_growth',
    };

    const primaryGoal = (goalMap[q1Answer] || 'personal_growth') as TribeGoal;

    // Extract interests from q2 (multiple choice)
    const interestMap: Record<string, string> = {
      q2_nutrition: 'nutrition',
      q2_workout: 'fitness-training',
      q2_sleep: 'sleep-optimization',
      q2_stress: 'stress-management',
      q2_meditation: 'meditation',
      q2_programming: 'programming',
      q2_language: 'language-learning',
      q2_business: 'entrepreneurship',
      q2_finance: 'personal-finance',
      q2_relationships: 'relationships',
      q2_creative: 'creative-arts',
      q2_spirituality: 'spirituality',
    };

    const interests = (q2Answers || [])
      .map((ans) => interestMap[ans])
      .filter(Boolean);

    // Commitment level
    const commitmentMap: Record<string, 'casual' | 'moderate' | 'serious' | 'obsessed'> = {
      q3_casual: 'casual',
      q3_moderate: 'moderate',
      q3_serious: 'serious',
      q3_obsessed: 'obsessed',
    };
    const commitment = (commitmentMap[q3Answer] || 'moderate') as 'casual' | 'moderate' | 'serious' | 'obsessed';

    // Learning style
    const learningStyleMap: Record<string, 'visual' | 'auditory' | 'reading' | 'kinesthetic' | 'mixed'> = {
      q4_visual: 'visual',
      q4_auditory: 'auditory',
      q4_reading: 'reading',
      q4_kinesthetic: 'kinesthetic',
      q4_mixed: 'mixed',
    };
    const learningStyle = (learningStyleMap[q4Answer] || 'mixed') as 'visual' | 'auditory' | 'reading' | 'kinesthetic' | 'mixed';

    // Motivation
    const motivationMap: Record<string, 'achievement' | 'community' | 'growth' | 'purpose' | 'autonomy'> = {
      q7_achievement: 'achievement',
      q7_community: 'community',
      q7_growth: 'growth',
      q7_purpose: 'purpose',
      q7_autonomy: 'autonomy',
    };
    const motivation = (motivationMap[q7Answer] || 'growth') as 'achievement' | 'community' | 'growth' | 'purpose' | 'autonomy';

    // Personality traits (q9, q10 map to personality scores)
    const introvertScore: Record<string, number> = {
      q9_introvert: 2,
      q9_ambivert: 5,
      q9_extrovert: 8,
    };

    const detailScore: Record<string, number> = {
      q10_details: 8,
      q10_balanced: 5,
      q10_big_picture: 2,
    };

    const plannerScore: Record<string, number> = {
      q6_planner: 8,
      q6_hybrid: 5,
      q6_spontaneous: 2,
    };

    // Experience
    const experienceMap: Record<string, 'beginner' | 'intermediate' | 'advanced'> = {
      q11_beginner: 'beginner',
      q11_intermediate: 'intermediate',
      q11_advanced: 'advanced',
    };
    const experience = (experienceMap[q11Answer] || 'beginner') as 'beginner' | 'intermediate' | 'advanced';

    return {
      userId,
      primaryGoal,
      interests,
      commitment,
      learningStyle,
      motivation,
      experience,
      personality: {
        introvert: introvertScore[q9Answer] || 5,
        detailOriented: detailScore[q10Answer] || 5,
        planner: plannerScore[q6Answer] || 5,
      },
      preferredCommunityStyle: q5Answer,
      challengeArea: quizAnswers['q15'] as string,
    };
  }

  /**
   * Calculate cumulative score weights from quiz answers
   * Returns the raw scores from quiz answers to use in goal matching
   */
  static extractAnswerWeights(
    quizAnswers: Record<string, string | string[]>
  ): Record<TribeGoal, number> {
    // This would be populated by summing tribeWeights from each answer
    // Implementation depends on having access to the quiz definition
    // For now, return zeros (will be calculated in actual implementation)
    return {
      health: 0,
      fitness: 0,
      learning: 0,
      career: 0,
      mindfulness: 0,
      relationships: 0,
      financial: 0,
      creative: 0,
      personal_growth: 0,
      spirituality: 0,
    };
  }
}

export default TribeMatchingService;
