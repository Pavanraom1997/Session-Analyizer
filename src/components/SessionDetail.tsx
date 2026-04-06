import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { 
  ArrowLeft, 
  Clock, 
  User, 
  Activity, 
  CheckCircle2, 
  AlertCircle,
  MessageSquare,
  Eye,
  Smile,
  Mic,
  Loader2,
  Play,
  X
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { SessionAnalytics } from '../types';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';

export default function SessionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<SessionAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoModal, setVideoModal] = useState<{ isOpen: boolean; startTime: number }>({ isOpen: false, startTime: 0 });

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch(`/api/sessions/${id}`);
        const result = await response.json();
        if (result.status === 'success') {
          setSession(result.data);
        } else {
          setError(result.message);
        }
      } catch (err) {
        setError('Failed to load session data');
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] space-y-4">
        <Loader2 className="animate-spin text-blue-600" size={48} />
        <p className="text-slate-500 font-medium">Loading analysis results...</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] space-y-4">
        <AlertCircle className="text-red-500" size={48} />
        <p className="text-slate-900 font-bold text-xl">Session Not Found</p>
        <p className="text-slate-500">{error || 'The requested analysis could not be retrieved.'}</p>
        <button 
          onClick={() => navigate('/')}
          className="px-6 py-2 bg-blue-600 text-white rounded-xl font-semibold"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const radarData = [
    { subject: 'Engagement', A: session.studentEngagement, fullMark: 100 },
    { subject: 'Understanding', A: session.understandingLevel, fullMark: 100 },
    { subject: 'Quality', A: session.teacherQuality, fullMark: 100 },
    { subject: 'Participation', A: session.participationLevel, fullMark: 100 },
    { subject: 'Politeness', A: session.politenessScore, fullMark: 100 },
    { subject: 'Completion', A: session.topicCompletion, fullMark: 100 },
  ];

  const timelineData = Array.from({ length: 60 }, (_, i) => ({
    time: i,
    engagement: Math.max(0, Math.min(100, session.studentEngagement + Math.sin(i / 5) * 20 + (Math.random() - 0.5) * 10))
  }));

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Video Modal */}
      {videoModal.isOpen && session.videoUrl && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-900 rounded-3xl overflow-hidden max-w-4xl w-full relative shadow-2xl"
          >
            <button 
              onClick={() => setVideoModal({ ...videoModal, isOpen: false })}
              className="absolute top-4 right-4 text-white/50 hover:text-white z-10 p-2 bg-black/20 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
            <div className="aspect-video w-full bg-black">
              <video 
                src={`${session.videoUrl}#t=${videoModal.startTime}`}
                controls 
                autoPlay
                className="w-full h-full"
              />
            </div>
            <div className="p-6 text-white">
              <h4 className="text-xl font-bold mb-1">{session.name}</h4>
              <p className="text-slate-400">Playing from {formatTime(videoModal.startTime)}</p>
            </div>
          </motion.div>
        </div>
      )}

      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/')}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{session.name}</h1>
            <p className="text-slate-500">ID: {session.id} • {new Date(session.timestamp).toLocaleString()}</p>
          </div>
        </div>
        <div className={cn(
          "px-4 py-2 rounded-xl font-semibold flex items-center gap-2",
          session.success ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
        )}>
          {session.success ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          {session.success ? 'Session Successful' : 'Session Needs Review'}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Key Metrics */}
        <div className="lg:col-span-2 space-y-8">
          {/* Timeline Chart */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-semibold">Engagement Timeline</h3>
              <div className="flex gap-4 text-sm">
                <span className="flex items-center gap-1 text-slate-500">
                  <div className="w-3 h-3 bg-blue-500 rounded-full" /> Student Attention
                </span>
              </div>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} label={{ value: 'Time (mins)', position: 'insideBottom', offset: -5 }} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line type="monotone" dataKey="engagement" stroke="#3b82f6" strokeWidth={3} dot={false} />
                  {session.timeline.map((event, i) => (
                    <Line 
                      key={i}
                      type="monotone" 
                      dataKey={() => event.value} 
                      stroke="transparent"
                      label={(props: any) => {
                        const { x, y } = props;
                        // Map event time to chart index
                        const chartIndex = Math.floor((event.time / session.duration) * 60);
                        if (Math.abs(props.index - chartIndex) < 1) {
                          return (
                            <g>
                              <circle cx={x} cy={y} r={4} fill={event.type === 'engagement_drop' ? '#ef4444' : '#10b981'} />
                              <text x={x} y={y - 10} textAnchor="middle" fontSize={10} fill="#64748b">{event.description}</text>
                            </g>
                          );
                        }
                        return null;
                      }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Feature Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Signal Features</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Mic size={18} /></div>
                    <span className="text-slate-700">Speaking Ratio</span>
                  </div>
                  <span className="font-bold">{(session.metrics.speakingTimeRatio * 100).toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-50 text-green-600 rounded-lg"><Eye size={18} /></div>
                    <span className="text-slate-700">Eye Gaze Attention</span>
                  </div>
                  <span className="font-bold">{session.metrics.eyeGazeAttention}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><MessageSquare size={18} /></div>
                    <span className="text-slate-700">Interactions</span>
                  </div>
                  <span className="font-bold">{session.metrics.interactionCount}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">OCR Topic Extraction</h4>
              <div className="flex flex-wrap gap-2">
                {session.metrics.keywordMatches.map(kw => (
                  <span key={kw} className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-full text-sm text-slate-600">
                    {kw}
                  </span>
                ))}
              </div>
              <div className="mt-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-500">Syllabus Coverage</span>
                  <span className="font-bold">{session.topicCompletion}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: `${session.topicCompletion}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Scoring Summary */}
        <div className="space-y-8">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-semibold mb-6 text-center">Score Profile</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="#f1f5f9" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar
                    name="Session"
                    dataKey="A"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.5}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl">
            <h3 className="text-xl font-bold mb-6">Rule-Based Insights</h3>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="p-2 bg-white/10 rounded-xl h-fit"><Smile size={20} /></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h5 className="font-semibold">Max Engagement</h5>
                    <button 
                      onClick={() => setVideoModal({ isOpen: true, startTime: session.maxEngagementSegment.startTime })}
                      className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg flex items-center gap-1 transition-colors"
                    >
                      <Play size={12} /> View
                    </button>
                  </div>
                  <p className="text-sm text-slate-400 mt-1">
                    Peak at {formatTime(session.maxEngagementSegment.startTime)}. 
                    Score: {session.maxEngagementSegment.score}%
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="p-2 bg-white/10 rounded-xl h-fit"><AlertCircle size={20} className="text-orange-400" /></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h5 className="font-semibold text-orange-400">Least Engagement</h5>
                    <button 
                      onClick={() => setVideoModal({ isOpen: true, startTime: session.leastEngagementSegment.startTime })}
                      className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded-lg flex items-center gap-1 transition-colors"
                    >
                      <Play size={12} /> View
                    </button>
                  </div>
                  <p className="text-sm text-slate-400 mt-1">
                    Drop at {formatTime(session.leastEngagementSegment.startTime)}. 
                    Score: {session.leastEngagementSegment.score}%
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="p-2 bg-white/10 rounded-xl h-fit"><Activity size={20} /></div>
                <div>
                  <h5 className="font-semibold">Teaching Quality</h5>
                  <p className="text-sm text-slate-400 mt-1">Teacher maintained high politeness score. Speaking ratio suggests a balanced dialogue.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
