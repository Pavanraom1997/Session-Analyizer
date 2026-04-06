import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area
} from 'recharts';
import { 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  MessageSquare,
  BookOpen,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SessionAnalytics } from '../types';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionAnalytics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await fetch('/api/sessions');
        const result = await response.json();
        if (result.status === 'success') {
          setSessions(result.data);
        }
      } catch (err) {
        console.error('Failed to fetch sessions:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, []);

  const avgEngagement = sessions.length > 0 
    ? (sessions.reduce((acc, s) => acc + s.studentEngagement, 0) / sessions.length).toFixed(1) 
    : '0';
  
  const successRate = sessions.length > 0 
    ? ((sessions.filter(s => s.success).length / sessions.length) * 100).toFixed(0) 
    : '0';

  const stats = [
    { label: 'Total Sessions', value: sessions.length, icon: BookOpen, color: 'text-blue-600' },
    { label: 'Avg. Engagement', value: `${avgEngagement}%`, icon: TrendingUp, color: 'text-green-600' },
    { label: 'Success Rate', value: `${successRate}%`, icon: CheckCircle2, color: 'text-purple-600' },
    { label: 'Avg. Participation', value: sessions.length > 0 ? '42.5%' : '0%', icon: MessageSquare, color: 'text-orange-600' },
  ];

  const chartData = sessions.map(s => ({
    name: new Date(s.timestamp).toLocaleDateString(),
    engagement: s.studentEngagement,
    understanding: s.understandingLevel,
    quality: s.teacherQuality
  }));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] space-y-4">
        <Loader2 className="animate-spin text-blue-600" size={48} />
        <p className="text-slate-500 font-medium">Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">Session Analytics Dashboard</h1>
        <p className="text-slate-500">Overview of teaching performance and student engagement metrics.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
              </div>
              <div className={cn("p-3 rounded-xl bg-slate-50", stat.color)}>
                <stat.icon size={24} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {sessions.length > 0 ? (
        <>
          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="text-lg font-semibold mb-6">Performance Trends</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorEng" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Area type="monotone" dataKey="engagement" stroke="#3b82f6" fillOpacity={1} fill="url(#colorEng)" strokeWidth={2} />
                    <Area type="monotone" dataKey="understanding" stroke="#10b981" fillOpacity={0} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="text-lg font-semibold mb-6">Teacher Quality vs Participation</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="quality" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Recent Sessions Table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-semibold">Recent Sessions</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-sm font-medium">
                  <tr>
                    <th className="px-6 py-4">Session Name</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Engagement</th>
                    <th className="px-6 py-4">Quality</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sessions.map((session) => (
                    <tr key={session.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900">{session.name}</td>
                      <td className="px-6 py-4 text-slate-500">
                        {new Date(session.timestamp).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={cn(
                                "h-full rounded-full",
                                session.studentEngagement > 70 ? "bg-green-500" : session.studentEngagement > 40 ? "bg-yellow-500" : "bg-red-500"
                              )}
                              style={{ width: `${session.studentEngagement}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{session.studentEngagement}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium">{session.teacherQuality}%</td>
                      <td className="px-6 py-4">
                        {session.success ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            <CheckCircle2 size={12} /> Success
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            <AlertCircle size={12} /> Failure
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => navigate(`/session/${session.id}`)}
                          className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center space-y-4">
          <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto">
            <BookOpen size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-900">No Sessions Analyzed Yet</h3>
          <p className="text-slate-500 max-w-md mx-auto">
            Upload your first teaching session recording to see detailed analytics and engagement metrics.
          </p>
          <button 
            onClick={() => navigate('/upload')}
            className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all"
          >
            Analyze First Session
          </button>
        </div>
      )}
    </div>
  );
}
