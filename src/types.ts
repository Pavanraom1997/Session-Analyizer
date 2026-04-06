export interface EngagementSegment {
  startTime: number;
  endTime: number;
  score: number;
}

export interface SessionAnalytics {
  id: string;
  timestamp: string;
  duration: number; // in seconds
  studentEngagement: number; // 0-100
  understandingLevel: number; // 0-100
  teacherQuality: number; // 0-100
  participationLevel: number; // 0-100
  politenessScore: number; // 0-100
  topicCompletion: number; // 0-100
  success: boolean;
  timeline: TimelineEvent[];
  maxEngagementSegment: EngagementSegment;
  leastEngagementSegment: EngagementSegment;
  videoUrl?: string;
  metrics: {
    speakingTimeRatio: number; // student/teacher
    eyeGazeAttention: number; // percentage
    interactionCount: number;
    keywordMatches: string[];
  };
}

export interface TimelineEvent {
  time: number; // seconds
  type: 'engagement_drop' | 'interaction' | 'topic_switch' | 'question_asked';
  description: string;
  value: number;
}
