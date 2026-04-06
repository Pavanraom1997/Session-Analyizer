import { SessionAnalytics } from './types';

export const MOCK_SESSIONS: SessionAnalytics[] = [
  {
    id: '1',
    timestamp: '2026-04-05T10:00:00Z',
    duration: 3600,
    studentEngagement: 82,
    understandingLevel: 75,
    teacherQuality: 90,
    participationLevel: 65,
    politenessScore: 95,
    topicCompletion: 100,
    success: true,
    maxEngagementSegment: { startTime: 300, endTime: 600, score: 95 },
    leastEngagementSegment: { startTime: 1800, endTime: 2100, score: 40 },
    timeline: [
      { time: 300, type: 'topic_switch', description: 'Introduction to Calculus', value: 100 },
      { time: 1200, type: 'interaction', description: 'Student asked about limits', value: 80 },
      { time: 1800, type: 'engagement_drop', description: 'Student distracted for 2 mins', value: 40 },
      { time: 2400, type: 'interaction', description: 'Quiz session started', value: 95 },
    ],
    metrics: {
      speakingTimeRatio: 0.35,
      eyeGazeAttention: 88,
      interactionCount: 12,
      keywordMatches: ['Derivative', 'Limit', 'Function', 'Slope'],
    }
  },
  {
    id: '2',
    timestamp: '2026-04-05T14:30:00Z',
    duration: 2400,
    studentEngagement: 45,
    understandingLevel: 30,
    teacherQuality: 60,
    participationLevel: 20,
    politenessScore: 80,
    topicCompletion: 40,
    success: false,
    maxEngagementSegment: { startTime: 100, endTime: 400, score: 80 },
    leastEngagementSegment: { startTime: 1500, endTime: 1800, score: 0 },
    timeline: [
      { time: 100, type: 'topic_switch', description: 'Algebra Basics', value: 100 },
      { time: 600, type: 'engagement_drop', description: 'Long silence from student', value: 20 },
      { time: 1500, type: 'engagement_drop', description: 'Camera turned off', value: 0 },
    ],
    metrics: {
      speakingTimeRatio: 0.05,
      eyeGazeAttention: 30,
      interactionCount: 2,
      keywordMatches: ['Variable', 'Equation'],
    }
  }
];
