/**
 * EXPERT PERSONALITY QUIZ FOR TRIBE MATCHING
 *
 * This quiz is designed to match users to tribes based on:
 * 1. Primary Goals (Health, Fitness, Learning, Career, Mindfulness, Relationships, Financial, Creative, Personal Growth, Spirituality)
 * 2. Learning Styles (Visual, Auditory, Reading, Kinesthetic, Mixed)
 * 3. Motivation Drivers (Achievement, Community, Growth, Purpose, Autonomy)
 * 4. Personality Traits (Extrovert/Introvert, Planner/Spontaneous, Detail-oriented/Big picture)
 * 5. Time Availability & Commitment Level
 * 6. Specific Interests within goals
 *
 * Scoring: Each answer is weighted to influence tribe matching
 */

export const TRIBE_PERSONALITY_QUIZ = {
  version: 1,
  title: "Find Your Perfect Tribe",
  description: "Answer 18 quick questions to discover tribes that align with your goals, interests, and learning style.",
  estimatedTimeMinutes: 5,
  
  questions: [
    // === SECTION 1: PRIMARY GOALS (Questions 1-3) ===
    {
      id: "q1",
      order: 1,
      question: "What's your primary reason for joining 365Days?",
      description: "Choose the one that resonates most with you right now",
      type: "single_choice",
      category: "primary_goal",
      isRequired: true,
      options: [
        {
          id: "q1_health",
          text: "Improve my physical and mental health",
          value: 10,
          tribeWeights: {
            health: 10,
            fitness: 8,
            mindfulness: 7,
            personal_growth: 5
          }
        },
        {
          id: "q1_fitness",
          text: "Get fit and build muscle/lose weight",
          value: 10,
          tribeWeights: {
            fitness: 10,
            health: 7,
            personal_growth: 5
          }
        },
        {
          id: "q1_learning",
          text: "Learn new skills and expand knowledge",
          value: 10,
          tribeWeights: {
            learning: 10,
            career: 6,
            creative: 5,
            personal_growth: 7
          }
        },
        {
          id: "q1_career",
          text: "Advance my career and professional goals",
          value: 10,
          tribeWeights: {
            career: 10,
            learning: 7,
            personal_growth: 6,
            financial: 6
          }
        },
        {
          id: "q1_mindfulness",
          text: "Find peace, practice mindfulness, and reduce stress",
          value: 10,
          tribeWeights: {
            mindfulness: 10,
            health: 8,
            spirituality: 7,
            personal_growth: 6
          }
        },
        {
          id: "q1_relationships",
          text: "Improve relationships and social connections",
          value: 10,
          tribeWeights: {
            relationships: 10,
            personal_growth: 7,
            mindfulness: 4
          }
        },
        {
          id: "q1_financial",
          text: "Achieve financial stability and growth",
          value: 10,
          tribeWeights: {
            financial: 10,
            career: 7,
            personal_growth: 6
          }
        },
        {
          id: "q1_creative",
          text: "Express creativity and pursue artistic goals",
          value: 10,
          tribeWeights: {
            creative: 10,
            personal_growth: 8,
            learning: 6
          }
        },
        {
          id: "q1_purpose",
          text: "Find purpose and spiritual growth",
          value: 10,
          tribeWeights: {
            spirituality: 10,
            mindfulness: 8,
            personal_growth: 9,
            relationships: 5
          }
        }
      ]
    },

    {
      id: "q2",
      order: 2,
      question: "Which areas are you interested in improving? (Select all that apply)",
      description: "Check all that apply to your journey",
      type: "multiple_choice",
      category: "interests",
      isRequired: true,
      options: [
        {
          id: "q2_nutrition",
          text: "Nutrition and diet",
          value: 8,
          tribeWeights: {
            health: 8,
            fitness: 6
          }
        },
        {
          id: "q2_workout",
          text: "Exercise and workouts",
          value: 8,
          tribeWeights: {
            fitness: 9,
            health: 5
          }
        },
        {
          id: "q2_sleep",
          text: "Sleep quality and recovery",
          value: 7,
          tribeWeights: {
            health: 8,
            mindfulness: 6
          }
        },
        {
          id: "q2_stress",
          text: "Stress management and anxiety",
          value: 8,
          tribeWeights: {
            mindfulness: 9,
            health: 7
          }
        },
        {
          id: "q2_meditation",
          text: "Meditation and mindfulness practices",
          value: 8,
          tribeWeights: {
            mindfulness: 10,
            spirituality: 8
          }
        },
        {
          id: "q2_programming",
          text: "Programming and tech skills",
          value: 8,
          tribeWeights: {
            learning: 9,
            career: 8
          }
        },
        {
          id: "q2_language",
          text: "Language learning",
          value: 7,
          tribeWeights: {
            learning: 9,
            career: 5
          }
        },
        {
          id: "q2_business",
          text: "Business and entrepreneurship",
          value: 8,
          tribeWeights: {
            career: 9,
            financial: 8,
            learning: 6
          }
        },
        {
          id: "q2_finance",
          text: "Personal finance and investing",
          value: 8,
          tribeWeights: {
            financial: 10,
            career: 5
          }
        },
        {
          id: "q2_relationships",
          text: "Relationships and communication",
          value: 8,
          tribeWeights: {
            relationships: 10,
            personal_growth: 7
          }
        },
        {
          id: "q2_creative",
          text: "Creative pursuits (art, music, writing)",
          value: 8,
          tribeWeights: {
            creative: 10,
            personal_growth: 8
          }
        },
        {
          id: "q2_spirituality",
          text: "Spirituality and philosophy",
          value: 8,
          tribeWeights: {
            spirituality: 10,
            mindfulness: 7
          }
        }
      ]
    },

    {
      id: "q3",
      order: 3,
      question: "How committed are you to your goals?",
      description: "Be honest about your availability and dedication",
      type: "single_choice",
      category: "commitment",
      isRequired: true,
      options: [
        {
          id: "q3_casual",
          text: "Just exploring, no major commitment yet",
          value: 5,
          tribeWeights: {
            health: 3,
            fitness: 3,
            learning: 4,
            career: 2,
            mindfulness: 4,
            relationships: 4,
            financial: 2,
            creative: 4,
            personal_growth: 3,
            spirituality: 4
          }
        },
        {
          id: "q3_moderate",
          text: "2-3 hours per week for my goals",
          value: 7,
          tribeWeights: {
            health: 6,
            fitness: 7,
            learning: 7,
            career: 5,
            mindfulness: 7,
            relationships: 6,
            financial: 5,
            creative: 7,
            personal_growth: 6,
            spirituality: 7
          }
        },
        {
          id: "q3_serious",
          text: "5+ hours per week, I'm serious about this",
          value: 9,
          tribeWeights: {
            health: 9,
            fitness: 9,
            learning: 9,
            career: 9,
            mindfulness: 8,
            relationships: 7,
            financial: 8,
            creative: 9,
            personal_growth: 9,
            spirituality: 8
          }
        },
        {
          id: "q3_obsessed",
          text: "This is my top priority, 10+ hours weekly",
          value: 10,
          tribeWeights: {
            health: 10,
            fitness: 10,
            learning: 10,
            career: 10,
            mindfulness: 9,
            relationships: 8,
            financial: 9,
            creative: 10,
            personal_growth: 10,
            spirituality: 9
          }
        }
      ]
    },

    // === SECTION 2: LEARNING STYLE (Questions 4-5) ===
    {
      id: "q4",
      order: 4,
      question: "How do you learn best?",
      description: "Understanding your learning style helps match you with similar people",
      type: "single_choice",
      category: "learning_style",
      isRequired: true,
      options: [
        {
          id: "q4_visual",
          text: "Visual (charts, diagrams, videos, infographics)",
          value: 8,
          tribeWeights: {
            learning: 8,
            creative: 7
          }
        },
        {
          id: "q4_auditory",
          text: "Auditory (podcasts, discussions, lectures)",
          value: 8,
          tribeWeights: {
            learning: 8,
            relationships: 6
          }
        },
        {
          id: "q4_reading",
          text: "Reading & writing (books, articles, notes)",
          value: 8,
          tribeWeights: {
            learning: 9,
            creative: 6
          }
        },
        {
          id: "q4_kinesthetic",
          text: "Kinesthetic (hands-on, practice, doing)",
          value: 8,
          tribeWeights: {
            fitness: 8,
            learning: 8,
            creative: 7
          }
        },
        {
          id: "q4_mixed",
          text: "Mixed (combination of all styles)",
          value: 7,
          tribeWeights: {
            learning: 7,
            personal_growth: 7
          }
        }
      ]
    },

    {
      id: "q5",
      order: 5,
      question: "What's your preferred way to engage with a community?",
      description: "How do you like to interact with others?",
      type: "single_choice",
      category: "community_style",
      isRequired: true,
      options: [
        {
          id: "q5_observe",
          text: "I like to observe and learn from others",
          value: 6,
          tribeWeights: {
            learning: 8,
            mindfulness: 6
          }
        },
        {
          id: "q5_share",
          text: "I prefer sharing my knowledge and helping others",
          value: 8,
          tribeWeights: {
            relationships: 8,
            career: 6,
            personal_growth: 7
          }
        },
        {
          id: "q5_discuss",
          text: "I enjoy in-depth discussions and debates",
          value: 8,
          tribeWeights: {
            learning: 8,
            relationships: 7
          }
        },
        {
          id: "q5_accountability",
          text: "I need accountability and regular check-ins",
          value: 8,
          tribeWeights: {
            fitness: 7,
            relationships: 8,
            personal_growth: 8
          }
        },
        {
          id: "q5_solo",
          text: "I'm more of a solo learner but like periodic tips",
          value: 5,
          tribeWeights: {
            learning: 6,
            mindfulness: 7
          }
        }
      ]
    },

    // === SECTION 3: PERSONALITY & MOTIVATION (Questions 6-8) ===
    {
      id: "q6",
      order: 6,
      question: "How do you approach goals?",
      description: "Your planning style",
      type: "single_choice",
      category: "planning_style",
      isRequired: true,
      options: [
        {
          id: "q6_planner",
          text: "I'm a planner - detailed roadmap, milestones, tracking",
          value: 8,
          tribeWeights: {
            career: 8,
            learning: 7,
            personal_growth: 8
          }
        },
        {
          id: "q6_hybrid",
          text: "Hybrid - some planning, but flexible and adaptable",
          value: 7,
          tribeWeights: {
            learning: 7,
            personal_growth: 7,
            mindfulness: 6
          }
        },
        {
          id: "q6_spontaneous",
          text: "Spontaneous - I adapt as I go, no rigid plans",
          value: 6,
          tribeWeights: {
            creative: 8,
            personal_growth: 6
          }
        }
      ]
    },

    {
      id: "q7",
      order: 7,
      question: "What motivates you most?",
      description: "Your primary driver",
      type: "single_choice",
      category: "motivation",
      isRequired: true,
      options: [
        {
          id: "q7_achievement",
          text: "Achieving goals and seeing measurable progress",
          value: 9,
          tribeWeights: {
            career: 8,
            fitness: 8,
            learning: 8,
            personal_growth: 8
          }
        },
        {
          id: "q7_community",
          text: "Community support and accountability",
          value: 8,
          tribeWeights: {
            relationships: 9,
            fitness: 7,
            health: 7,
            personal_growth: 7
          }
        },
        {
          id: "q7_growth",
          text: "Personal growth and self-improvement",
          value: 8,
          tribeWeights: {
            personal_growth: 10,
            learning: 8,
            mindfulness: 7
          }
        },
        {
          id: "q7_purpose",
          text: "Finding purpose and deeper meaning",
          value: 8,
          tribeWeights: {
            spirituality: 10,
            mindfulness: 8,
            personal_growth: 9
          }
        },
        {
          id: "q7_autonomy",
          text: "Independence and doing things my way",
          value: 7,
          tribeWeights: {
            creative: 8,
            learning: 7,
            career: 7
          }
        }
      ]
    },

    {
      id: "q8",
      order: 8,
      question: "How do you typically handle challenges?",
      description: "Your resilience approach",
      type: "single_choice",
      category: "resilience",
      isRequired: true,
      options: [
        {
          id: "q8_analytical",
          text: "Analyze, problem-solve, find logical solutions",
          value: 8,
          tribeWeights: {
            learning: 8,
            career: 8
          }
        },
        {
          id: "q8_supportive",
          text: "Seek advice from mentors or community",
          value: 8,
          tribeWeights: {
            relationships: 9,
            personal_growth: 8
          }
        },
        {
          id: "q8_mindful",
          text: "Take a step back, meditate, find perspective",
          value: 8,
          tribeWeights: {
            mindfulness: 9,
            spirituality: 8
          }
        },
        {
          id: "q8_action",
          text: "Push through with determination and action",
          value: 8,
          tribeWeights: {
            fitness: 8,
            career: 8,
            personal_growth: 8
          }
        }
      ]
    },

    // === SECTION 4: PERSONALITY TRAITS (Questions 9-10) ===
    {
      id: "q9",
      order: 9,
      question: "Are you more introverted or extroverted?",
      description: "Your social energy preference",
      type: "single_choice",
      category: "personality",
      isRequired: true,
      options: [
        {
          id: "q9_introvert",
          text: "Introvert - I recharge alone, one-on-one conversations",
          value: 6,
          tribeWeights: {
            learning: 7,
            mindfulness: 7,
            creative: 7
          }
        },
        {
          id: "q9_ambivert",
          text: "Ambivert - I enjoy both social and alone time equally",
          value: 7,
          tribeWeights: {
            personal_growth: 8,
            learning: 7,
            relationships: 7
          }
        },
        {
          id: "q9_extrovert",
          text: "Extrovert - I thrive in group settings and discussions",
          value: 8,
          tribeWeights: {
            relationships: 9,
            fitness: 7,
            learning: 7,
            career: 7
          }
        }
      ]
    },

    {
      id: "q10",
      order: 10,
      question: "What's your attention to detail level?",
      description: "Big picture vs. fine details",
      type: "single_choice",
      category: "detail_orientation",
      isRequired: true,
      options: [
        {
          id: "q10_details",
          text: "Detail-oriented - precision and accuracy matter",
          value: 7,
          tribeWeights: {
            learning: 8,
            career: 8,
            financial: 8
          }
        },
        {
          id: "q10_balanced",
          text: "Balanced - I focus on important details, not everything",
          value: 7,
          tribeWeights: {
            personal_growth: 8,
            learning: 7,
            career: 7
          }
        },
        {
          id: "q10_big_picture",
          text: "Big picture - I focus on overall vision and strategy",
          value: 7,
          tribeWeights: {
            creative: 8,
            spirituality: 7,
            personal_growth: 8
          }
        }
      ]
    },

    // === SECTION 5: EXPERIENCE LEVEL (Questions 11-13) ===
    {
      id: "q11",
      order: 11,
      question: "What's your experience level in your primary interest?",
      description: "Be realistic about where you're starting from",
      type: "single_choice",
      category: "experience",
      isRequired: true,
      options: [
        {
          id: "q11_beginner",
          text: "Complete beginner - just starting out",
          value: 8,
          tribeWeights: {
            learning: 9,
            health: 8,
            fitness: 8,
            mindfulness: 8,
            creative: 8,
            personal_growth: 9
          }
        },
        {
          id: "q11_intermediate",
          text: "Some experience - I've made progress",
          value: 8,
          tribeWeights: {
            learning: 8,
            fitness: 8,
            career: 7,
            personal_growth: 8
          }
        },
        {
          id: "q11_advanced",
          text: "Advanced - I'm quite experienced",
          value: 7,
          tribeWeights: {
            career: 9,
            learning: 7,
            creative: 8
          }
        }
      ]
    },

    {
      id: "q12",
      order: 12,
      question: "How long have you been working on your primary goal?",
      description: "Your journey timeline",
      type: "single_choice",
      category: "goal_history",
      isRequired: true,
      options: [
        {
          id: "q12_new",
          text: "This is new for me (less than 1 month)",
          value: 8,
          tribeWeights: {
            learning: 8,
            personal_growth: 8
          }
        },
        {
          id: "q12_growing",
          text: "I've been at it for 1-6 months",
          value: 8,
          tribeWeights: {
            fitness: 8,
            learning: 7,
            personal_growth: 8
          }
        },
        {
          id: "q12_established",
          text: "I've been consistent for 6+ months",
          value: 8,
          tribeWeights: {
            career: 8,
            fitness: 8,
            health: 8
          }
        }
      ]
    },

    {
      id: "q13",
      order: 13,
      question: "How do you measure success?",
      description: "What counts as progress to you?",
      type: "single_choice",
      category: "success_metrics",
      isRequired: true,
      options: [
        {
          id: "q13_numbers",
          text: "Quantifiable metrics (pounds lost, hours logged, money earned)",
          value: 8,
          tribeWeights: {
            fitness: 8,
            financial: 9,
            career: 8
          }
        },
        {
          id: "q13_feeling",
          text: "How I feel (energy, confidence, peace of mind)",
          value: 8,
          tribeWeights: {
            health: 8,
            mindfulness: 9,
            personal_growth: 8
          }
        },
        {
          id: "q13_impact",
          text: "Impact on others (helping, inspiring, contributing)",
          value: 8,
          tribeWeights: {
            relationships: 9,
            career: 7,
            personal_growth: 8
          }
        },
        {
          id: "q13_progress",
          text: "Personal growth (learning, improving, evolving)",
          value: 8,
          tribeWeights: {
            personal_growth: 10,
            learning: 9,
            creative: 8
          }
        }
      ]
    },

    // === SECTION 6: LIFESTYLE & VALUES (Questions 14-18) ===
    {
      id: "q14",
      order: 14,
      question: "What's your current life situation?",
      description: "Helps match you with people in similar phases",
      type: "single_choice",
      category: "life_phase",
      isRequired: true,
      options: [
        {
          id: "q14_student",
          text: "Student or early career",
          value: 6,
          tribeWeights: {
            learning: 9,
            career: 7,
            personal_growth: 8
          }
        },
        {
          id: "q14_employed",
          text: "Employed full-time/part-time",
          value: 7,
          tribeWeights: {
            career: 8,
            health: 7,
            financial: 8
          }
        },
        {
          id: "q14_parent",
          text: "Parent or caregiver",
          value: 6,
          tribeWeights: {
            health: 7,
            relationships: 8,
            personal_growth: 7
          }
        },
        {
          id: "q14_entrepreneur",
          text: "Entrepreneur or self-employed",
          value: 7,
          tribeWeights: {
            career: 9,
            financial: 8,
            learning: 8
          }
        },
        {
          id: "q14_retired",
          text: "Retired or transitioning",
          value: 6,
          tribeWeights: {
            mindfulness: 8,
            spirituality: 8,
            creative: 7,
            personal_growth: 8
          }
        }
      ]
    },

    {
      id: "q15",
      order: 15,
      question: "What's your biggest challenge right now?",
      description: "Understanding your pain point helps find the right tribe",
      type: "single_choice",
      category: "challenge",
      isRequired: true,
      options: [
        {
          id: "q15_motivation",
          text: "Staying motivated and consistent",
          value: 8,
          tribeWeights: {
            relationships: 8,
            mindfulness: 6,
            personal_growth: 9
          }
        },
        {
          id: "q15_knowledge",
          text: "Lack of knowledge or guidance",
          value: 8,
          tribeWeights: {
            learning: 10,
            career: 8
          }
        },
        {
          id: "q15_time",
          text: "Time management and finding time",
          value: 7,
          tribeWeights: {
            mindfulness: 7,
            personal_growth: 8
          }
        },
        {
          id: "q15_support",
          text: "Lack of support or accountability",
          value: 8,
          tribeWeights: {
            relationships: 10,
            fitness: 8,
            health: 7
          }
        },
        {
          id: "q15_balance",
          text: "Work-life balance and burnout",
          value: 8,
          tribeWeights: {
            mindfulness: 9,
            health: 8,
            relationships: 7
          }
        }
      ]
    },

    {
      id: "q16",
      order: 16,
      question: "How do you prefer to receive feedback?",
      description: "Your feedback preference",
      type: "single_choice",
      category: "feedback_style",
      isRequired: true,
      options: [
        {
          id: "q16_direct",
          text: "Direct and honest, no sugar-coating",
          value: 8,
          tribeWeights: {
            career: 8,
            learning: 7
          }
        },
        {
          id: "q16_supportive",
          text: "Supportive with constructive criticism",
          value: 8,
          tribeWeights: {
            relationships: 8,
            personal_growth: 8
          }
        },
        {
          id: "q16_light",
          text: "Light and encouraging, focus on wins",
          value: 7,
          tribeWeights: {
            fitness: 7,
            health: 7,
            mindfulness: 7
          }
        },
        {
          id: "q16_mentor",
          text: "One-on-one mentorship and guidance",
          value: 8,
          tribeWeights: {
            learning: 8,
            career: 9,
            personal_growth: 8
          }
        }
      ]
    },

    {
      id: "q17",
      order: 17,
      question: "Which value resonates most with you?",
      description: "Your core value",
      type: "single_choice",
      category: "core_values",
      isRequired: true,
      options: [
        {
          id: "q17_excellence",
          text: "Excellence and continuous improvement",
          value: 8,
          tribeWeights: {
            career: 9,
            fitness: 8,
            learning: 9,
            creative: 8
          }
        },
        {
          id: "q17_community",
          text: "Community and connection",
          value: 8,
          tribeWeights: {
            relationships: 10,
            fitness: 7,
            personal_growth: 8
          }
        },
        {
          id: "q17_wellness",
          text: "Wellness and balance",
          value: 8,
          tribeWeights: {
            health: 9,
            mindfulness: 9,
            personal_growth: 8
          }
        },
        {
          id: "q17_autonomy",
          text: "Freedom and independence",
          value: 8,
          tribeWeights: {
            creative: 9,
            career: 8,
            financial: 7
          }
        },
        {
          id: "q17_purpose",
          text: "Purpose and meaning",
          value: 8,
          tribeWeights: {
            spirituality: 10,
            mindfulness: 8,
            personal_growth: 9
          }
        }
      ]
    },

    {
      id: "q18",
      order: 18,
      question: "What would make the perfect tribe for you?",
      description: "Your ideal tribe characteristics",
      type: "multiple_choice",
      category: "ideal_tribe",
      isRequired: true,
      options: [
        {
          id: "q18_active",
          text: "Very active community (daily posts and discussions)",
          value: 7,
          tribeWeights: {
            relationships: 8,
            fitness: 7,
            learning: 7
          }
        },
        {
          id: "q18_supportive",
          text: "Deeply supportive and encouraging",
          value: 8,
          tribeWeights: {
            relationships: 9,
            health: 8,
            mindfulness: 8,
            personal_growth: 8
          }
        },
        {
          id: "q18_expert",
          text: "Led by experts and experienced mentors",
          value: 8,
          tribeWeights: {
            learning: 9,
            career: 9
          }
        },
        {
          id: "q18_accountability",
          text: "Strong accountability and tracking systems",
          value: 8,
          tribeWeights: {
            fitness: 8,
            career: 7,
            personal_growth: 8
          }
        },
        {
          id: "q18_diverse",
          text: "Diverse backgrounds and perspectives",
          value: 7,
          tribeWeights: {
            learning: 8,
            relationships: 7,
            creative: 8
          }
        },
        {
          id: "q18_smallniche",
          text: "Small and niche with like-minded people",
          value: 7,
          tribeWeights: {
            creative: 8,
            spirituality: 8,
            personal_growth: 8
          }
        },
        {
          id: "q18_flexible",
          text: "Flexible with no rigid structure",
          value: 6,
          tribeWeights: {
            creative: 7,
            mindfulness: 6
          }
        }
      ]
    }
  ],

  // Base scoring weights for each goal type
  // These are used as starting points before individual question answers are factored in
  scoringWeights: {
    health: 1,
    fitness: 1,
    learning: 1,
    career: 1,
    mindfulness: 1,
    relationships: 1,
    financial: 1,
    creative: 1,
    personal_growth: 1,
    spirituality: 1
  },

  metadata: {
    totalQuestions: 18,
    categories: [
      'primary_goal',
      'interests',
      'commitment',
      'learning_style',
      'community_style',
      'planning_style',
      'motivation',
      'resilience',
      'personality',
      'detail_orientation',
      'experience',
      'goal_history',
      'success_metrics',
      'life_phase',
      'challenge',
      'feedback_style',
      'core_values',
      'ideal_tribe'
    ],
    createdBy: 'admin',
    lastReviewDate: new Date(),
    designNotes: `
      This quiz is designed with multiple layers:
      
      1. MULTI-DIMENSIONAL MATCHING
         - Primary goal (strongest weight)
         - Secondary interests
         - Learning style
         - Motivation drivers
         - Personality traits
      
      2. SCORING LOGIC
         - Each answer directly influences tribe scores via tribeWeights
         - Single choice answers: 1-10 scale
         - Multiple choice answers: cumulative scoring
         - Final score = Sum of all answer weights / Total possible weight × 100
      
      3. OPTIMAL MATCHES
         - Users are matched to 3-5 tribes per goal
         - Tribes with 70%+ compatibility are recommended
         - Users can join multiple tribes (no limit)
      
      4. UX FLOW
         - Quiz takes 3-5 minutes
         - Progress indicator (question X of 18)
         - No time limit (can save progress)
         - Results show top matching tribes with %
         - Option to skip tribes and redo quiz later
    `
  }
};

export default TRIBE_PERSONALITY_QUIZ;
