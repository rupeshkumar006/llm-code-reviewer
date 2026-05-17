import { useEffect, useState } from 'react';
import { reviewAPI } from '../services/api';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import ReviewComparison from '../components/ReviewComparison';
import { useAuth } from '../context/AuthContext';
import { BarChart3, GitCompare, Lock, Zap, TrendingUp, Code2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

// Language color mapping matching HistorySidebar
const LANGUAGE_COLORS = {
  java: '#7c3aed',
  javascript: '#ca8a04',
  python: '#0284c7',
  cpp: '#dc2626',
  typescript: '#2563eb',
  go: '#0891b2',
  sql: '#ea580c',
  ruby: '#db2777',
};

const TABS = [
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'compare', label: 'Compare Reviews', icon: GitCompare },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { isPro, user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('analytics');
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({ streak: 0, improvement: 0, topLang: 'N/A', topLangCount: 0 });
  const [last5Scores, setLast5Scores] = useState([]);
  const [last7Days, setLast7Days] = useState([false, false, false, false, false, false, false]);

  useEffect(() => {
    document.title = "Analytics · CodeReviewer";
    if (authLoading || !user) return;
    
    const fetchHistory = async (retryCount = 0) => {
      console.log('[Dashboard] fetchHistory start. retry:', retryCount);
      try {
        const res = await reviewAPI.getHistory({});
        const data = res.data;
        console.log('[Dashboard] API SUCCESS:', data.length, 'items');
        setHistory(data);

        if (data.length > 0) {
          const avgScore = Math.round(data.reduce((acc, r) => acc + (r.score || 0), 0) / data.length);

          const langCounts = data.reduce((acc, r) => {
            acc[r.language] = (acc[r.language] || 0) + 1;
            return acc;
          }, {});
          const sortedLangs = Object.entries(langCounts).sort((a, b) => b[1] - a[1]);
          const topLang = sortedLangs[0][0];
          const topLangCount = sortedLangs[0][1];

          // Calculate streak from review dates
          const reviewDates = new Set(data.map(r => new Date(r.createdAt).toISOString().split('T')[0]));
          let streak = 0;
          const today = new Date();
          for (let i = 0; i < 30; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            if (reviewDates.has(dateStr)) {
              streak++;
            } else if (i > 0) {
              break;
            }
          }

          // Last 7 days activity
          const days = [];
          for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            days.push(reviewDates.has(dateStr));
          }
          setLast7Days(days);

          // Last 5 scores for sparkline
          const scores = data.slice(0, 5).reverse().map(r => ({ value: r.score || 0 }));
          setLast5Scores(scores);

          setStats({
            streak: streak || 0, 
            avgScore,
            topLang: topLang.charAt(0).toUpperCase() + topLang.slice(1),
            topLangCount
          });
        }
      } catch (err) {
        const status = err.response?.status;
        const backendError = err.response?.data?.error || err.message;
        console.warn('[Dashboard] API ERROR:', status || 'Network Error', backendError);
        
        // Silent retry for 401/403 or network errors, up to 2 times
        if ((status === 401 || status === 403 || !err.response) && retryCount < 2) {
          const delay = 1000 * (retryCount + 1);
          console.log(`[Dashboard] Silent retry #${retryCount + 1} in ${delay}ms...`);
          setTimeout(() => fetchHistory(retryCount + 1), delay);
        }
      }
    };

    fetchHistory();
  }, [user?.id, authLoading]);

  const topLangColor = LANGUAGE_COLORS[stats.topLang?.toLowerCase()] || '#6366f1';

  if (!authLoading && !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] text-center px-4 bg-[var(--bg-primary)] transition-colors duration-300">
        <div className="text-6xl mb-4">📊</div>
        <h2 className="text-xl font-bold text-white mb-2">
          Your Analytics Dashboard
        </h2>
        <p className="text-dark-400 mb-6 max-w-sm">
          Sign in to track your code quality over time, view 
          bug trends, and compare reviews.
        </p>
        <button 
          onClick={() => navigate('/login')} 
          className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-medium transition-all shadow-glow-sm hover:shadow-glow-primary"
        >
          Sign In to View Analytics
        </button>
        <p className="text-dark-600 text-sm mt-4">
          Don't have an account? 
          <Link to="/register" className="text-orange-500 hover:text-orange-400 ml-1 font-bold">
            Create one free
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] transition-colors duration-300 animate-zoom-in">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <BarChart3 size={24} className="text-orange-500" />
            Dashboard
          </h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            Welcome back, {user?.displayName || 'Developer'}
          </p>
        </div>

        {/* Your Progress Cards — Enhanced */}
        <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Streak Card */}
          <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] hover:border-orange-500/50 shadow-sm group transition-all duration-200 flex flex-col justify-between min-h-[140px]">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                <Zap size={24} fill="currentColor" />
              </div>
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-black text-[var(--text-primary)] leading-tight">{stats.streak}</span>
                  <span className="text-sm font-bold text-[var(--text-muted)]">{stats.streak === 1 ? 'Day' : 'Days'}</span>
                </div>
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest font-bold mt-0.5">Current Streak</p>
              </div>
            </div>
            
            <div className="pt-3 border-t border-[var(--border)] flex flex-col gap-2">
              <div className="flex justify-between items-center text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">
                <span>This Week's Activity</span>
                <span className="text-orange-500 font-mono font-bold">{last7Days.filter(Boolean).length} / 7 Active</span>
              </div>
              <div className="flex items-center justify-between gap-1.5 pt-0.5">
                {last7Days.map((active, i) => {
                  const d = new Date();
                  d.setDate(d.getDate() - (6 - i));
                  const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
                  return (
                    <div key={i} className="flex flex-col items-center gap-1 flex-1">
                      <span className="text-[9px] text-[var(--text-muted)] font-medium select-none">{dayLabel}</span>
                      <div
                        className={`w-full h-1.5 rounded-full transition-all ${
                          active ? 'bg-orange-500 shadow-glow-xs' : 'bg-[var(--bg-surface-2)] border border-[var(--border)]'
                        }`}
                        title={`${dayLabel}: ${active ? 'Active' : 'No reviews'}`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Average Quality Score Card */}
          <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] hover:border-orange-500/50 shadow-sm group transition-all duration-200 flex flex-col justify-between min-h-[140px]">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                <TrendingUp size={24} />
              </div>
              <div className="flex-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-black text-[var(--text-primary)] leading-tight">
                    {stats.avgScore || 0}%
                  </span>
                  <span className="text-sm font-bold text-[var(--text-muted)]">Quality</span>
                </div>
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest font-bold mt-0.5">Average Quality Score</p>
              </div>
            </div>

            <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">Recent Trend</span>
                <span className="text-[11px] text-[var(--text-muted)] font-medium mt-0.5">Last 5 reviews</span>
              </div>
              {last5Scores.length >= 2 ? (
                <div className="w-24 h-8 opacity-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={last5Scores}>
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#10b981" 
                        strokeWidth={2} 
                        dot={false} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <span className="text-xs text-[var(--text-muted)] italic font-light">Need more data</span>
              )}
            </div>
          </div>

          {/* Most Reviewed Card */}
          <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] hover:border-orange-500/50 shadow-sm group transition-all duration-200 flex flex-col justify-between min-h-[140px]">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                <Code2 size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: topLangColor }} />
                  <span className="text-3xl font-black text-[var(--text-primary)] leading-tight">{stats.topLang}</span>
                </div>
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest font-bold mt-0.5">Most Reviewed</p>
              </div>
            </div>

            <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">Review Volume</span>
                <span className="text-[11px] text-[var(--text-muted)] font-medium mt-0.5">Total processed</span>
              </div>
              <span className="text-sm font-mono font-bold text-[var(--text-primary)] bg-[var(--bg-surface-2)] px-2.5 py-1 rounded-lg border border-[var(--border)]">
                {stats.topLangCount} reviews
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-[var(--bg-surface)] p-1.5 rounded-2xl border border-[var(--border)] w-fit">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                activeTab === key 
                  ? 'bg-orange-500 text-white shadow-glow-sm scale-[1.02]' 
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-2)]'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'analytics' && <AnalyticsDashboard />}
        {activeTab === 'compare' && (
          <ReviewComparison history={history} />
        )}
      </div>
    </div>
  );
}
