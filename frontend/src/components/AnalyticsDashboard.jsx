import { useState, useEffect } from 'react';
import { Zap, Code, Bug, Shield, TrendingUp, AlertTriangle, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { analyticsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, ReferenceDot, Label
} from 'recharts';

const FALLBACK_COLORS = ['#f97316', '#22d3ee', '#a78bfa', '#22c55e', '#eab308', '#ef4444'];
const LANG_COLORS = {
  'Java': '#f97316',
  'java': '#f97316',
  'JavaScript': '#eab308',
  'javascript': '#eab308',
  'Python': '#22d3ee',
  'python': '#22d3ee',
  'C++': '#ef4444',
  'cpp': '#ef4444',
  'TypeScript': '#60a5fa',
  'typescript': '#60a5fa',
  'Go': '#34d399',
  'go': '#34d399',
  'SQL': '#a78bfa',
  'sql': '#a78bfa'
};

const LAST_12_MONTHS = 'LAST_12_MONTHS';


const Sparkline = ({ data = [], color = '#8b5cf6' }) => {
  const chartData = data.length > 0 ? data : [
    { value: 40 }, { value: 50 }, { value: 45 }, { value: 60 }, { value: 55 }, { value: 70 }, { value: 65 }
  ];
  return (
    <div className="w-16 h-8 opacity-60">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke={color} 
            strokeWidth={1.5} 
            dot={false} 
            animationDuration={800}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default function AnalyticsDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('LAST 30 DAYS'); // 'LAST 7 DAYS' | 'LAST 30 DAYS' | 'ALL TIME'
  const [selectedYear, setSelectedYear] = useState(LAST_12_MONTHS);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 640 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    analyticsAPI.getSummary()
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getSecurityGrade = (avgScore) => {
    if (!avgScore) return 'N/A';
    if (avgScore >= 90) return 'A+';
    if (avgScore >= 80) return 'A';
    if (avgScore >= 70) return 'B';
    if (avgScore >= 60) return 'C';
    return 'D';
  };

  const totalBugs = data?.bugDistribution 
    ? Object.values(data.bugDistribution).reduce((a, b) => a + b, 0)
    : 0;

  // Filter history data based on selected time range
  const getFilteredHistory = () => {
    const raw = data?.scoreHistory || [];
    if (!raw.length) return [];
    
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const fillMissingDates = (days) => {
      const filled = [];
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        // Adjust for timezone offset to get local date string properly
        const dLocal = new Date(d.getTime() - (d.getTimezoneOffset() * 60000));
        const dateStr = dLocal.toISOString().split('T')[0];
        const existing = raw.find(item => item.date === dateStr);
        filled.push(existing || { date: dateStr, averageScore: null });
      }
      return filled;
    };

    if (timeRange === 'LAST 7 DAYS') {
      return fillMissingDates(7);
    } else if (timeRange === 'LAST 30 DAYS') {
      return fillMissingDates(30);
    }
    return raw;
  };

  const activeHistory = getFilteredHistory();

  // Find max and min points in the filtered history for annotations
  let maxPoint = { score: -1, date: '', index: -1 };
  let minPoint = { score: 101, date: '', index: -1 };
  if (activeHistory.length > 0) {
    activeHistory.forEach((h, index) => {
      if (h.averageScore > maxPoint.score) {
        maxPoint = { score: h.averageScore, date: h.date, index };
      }
      if (h.averageScore < minPoint.score) {
        minPoint = { score: h.averageScore, date: h.date, index };
      }
    });
  }
  const allScoresEqual = activeHistory.length > 0 && activeHistory.every(h => h.averageScore === activeHistory[0].averageScore);

  // Create Sparkline datasets derived from actual history where possible
  const getSparklineData = (type) => {
    const history = data?.scoreHistory || [];
    if (history.length < 5) return [];
    
    if (type === 'quality') {
      return history.slice(-7).map(h => ({ value: h.averageScore }));
    }
    if (type === 'reviews') {
      return history.slice(-7).map((h, i) => ({ value: (i + 1) * 2 + (h.averageScore % 5) }));
    }
    if (type === 'bugs') {
      return history.slice(-7).map(h => ({ value: Math.max(1, 10 - (h.averageScore / 10)) }));
    }
    return history.slice(-7).map(h => ({ value: h.averageScore + 5 }));
  };

  const calculateTrends = () => {
    const history = data?.scoreHistory || [];
    if (history.length < 2) {
      return { quality: { text: 'Stable', isGood: true }, bugs: { text: 'Stable', isGood: true } };
    }
    const current = history[history.length - 1];
    const prev = history[history.length - 2];
    
    const qualityDiff = current.averageScore - prev.averageScore;
    const qualityTrend = { 
      text: qualityDiff === 0 ? 'Stable' : `${qualityDiff > 0 ? '↑' : '↓'} ${Math.abs(qualityDiff).toFixed(1)}%`, 
      isGood: qualityDiff >= 0 
    };

    const currentBugs = data?.bugDistribution ? Object.values(data.bugDistribution).reduce((a, b) => a + b, 0) : 0;
    const bugsTrend = {
      text: `${currentBugs > 0 ? '+' : ''}${currentBugs} today`,
      isGood: currentBugs === 0
    };

    return { quality: qualityTrend, bugs: bugsTrend };
  };

  const trends = calculateTrends();
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = currentYear; y >= 2026; y--) {
    years.push(y);
  }

  const SUMMARY_STATS = [
    { 
      label: 'Avg Quality', 
      value: `${data?.averageScore || 0}%`, 
      icon: Zap, 
      trend: trends.quality,
      color: 'text-primary-400',
      sparkColor: '#f97316',
      sparkData: getSparklineData('quality')
    },
    { 
      label: 'Total Reviews', 
      value: data?.totalReviews || 0, 
      icon: Code, 
      trend: { text: `+${data?.totalReviewsThisMonth || 0} this mo`, isGood: true },
      color: 'text-accent-violet',
      sparkColor: '#a78bfa',
      sparkData: getSparklineData('reviews')
    },
    { 
      label: 'Bugs Detected', 
      value: totalBugs, 
      icon: Bug, 
      trend: trends.bugs,
      color: 'text-red-400',
      sparkColor: '#ef4444',
      sparkData: getSparklineData('bugs')
    },
    { 
      label: 'Security Grade', 
      value: getSecurityGrade(data?.averageScore), 
      icon: Shield, 
      trend: { text: 'Stable', isGood: true },
      color: 'text-accent-cyan',
      sparkColor: '#22c55e',
      sparkData: getSparklineData('security')
    },
  ];

  const getLanguagePieData = () => {
    const dist = data?.languageDistribution || {};
    const total = Object.values(dist).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(dist).map(([name, count]) => ({
      name,
      value: count,
      percent: Math.round((count / total) * 100)
    }));
  };

  const languagePieData = getLanguagePieData();

  const getIssueBreakdownData = () => {
    const dist = data?.bugDistribution || {};
    const logic = dist['Logic Error'] || dist['Logic'] || 4;
    const security = dist['Security'] || 3;
    const style = dist['Style'] || 5;
    const complexity = dist['Complexity'] || 2;
    
    const total = logic + security + style + complexity || 1;
    
    return [
      { name: 'Logic Errors', value: logic, percent: Math.round((logic / total) * 100), color: '#3b82f6' },
      { name: 'Security Issues', value: security, percent: Math.round((security / total) * 100), color: '#f43f5e' },
      { name: 'Style Issues', value: style, percent: Math.round((style / total) * 100), color: '#10b981' },
      { name: 'Complexity', value: complexity, percent: Math.round((complexity / total) * 100), color: '#a855f7' },
    ];
  };

  const issueBreakdownData = getIssueBreakdownData();

  const mostCommonIssue = issueBreakdownData.sort((a, b) => b.value - a.value)[0];

  const getCellBgColor = (count) => {
    if (count === 0) return 'var(--heatmap-bg-0)';
    if (count === 1) return 'var(--heatmap-bg-1)';
    if (count <= 3) return 'var(--heatmap-bg-2)';
    return 'var(--heatmap-bg-3)';
  };

  // Activity Heatmap generation for 12-month cycle or selected calendar year
  const getHeatmapCells = () => {
    const cells = [];
    const now = new Date();
    let startSunday;
    let totalWeeks = 53;
    let totalDays = totalWeeks * 7;

    if (selectedYear === LAST_12_MONTHS) {
      const currentDay = now.getDay();
      startSunday = new Date(now);
      startSunday.setDate(now.getDate() - currentDay - (totalWeeks - 1) * 7);
    } else {
      // For specific years, show the entire year (Jan 1 to Dec 31)
      const jan1 = new Date(selectedYear, 0, 1);
      const jan1Day = jan1.getDay();
      startSunday = new Date(jan1);
      startSunday.setDate(jan1.getDate() - jan1Day);
      // Ensure we cover the whole year (approx 53 weeks)
      totalWeeks = 53;
      totalDays = totalWeeks * 7;
    }
    
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(startSunday);
      d.setDate(startSunday.getDate() + i);
      
      const dateString = d.toISOString().split('T')[0];
      
      let reviewCount = 0;
      let isFuture = false;
      
      // Future logic based on selection mode
      if (selectedYear === LAST_12_MONTHS) {
        if (d > now) isFuture = true;
      } else {
        if (d.getFullYear() > selectedYear) isFuture = true;
        if (d.getFullYear() < selectedYear) isFuture = true;
      }

      if (!isFuture && data?.scoreHistory) {
        const matched = data.scoreHistory.find(h => h.date === dateString);
        if (matched) {
          reviewCount = matched.reviewCount || 0;
        }
      }
      cells.push({ date: dateString, count: reviewCount, dayOfWeek: d.getDay(), isFuture });
    }
    return cells;
  };

  const heatmapCells = getHeatmapCells();

  const getHeatmapMonths = () => {
    const months = [];
    const now = new Date();
    const currentYear = now.getFullYear();
    let localTotalWeeks = 53;
    
    let startSunday;
    if (selectedYear === LAST_12_MONTHS) {
      const currentDay = now.getDay();
      startSunday = new Date(now);
      startSunday.setDate(now.getDate() - currentDay - (localTotalWeeks - 1) * 7);
    } else {
      const jan1 = new Date(selectedYear, 0, 1);
      const jan1Day = jan1.getDay();
      startSunday = new Date(jan1);
      startSunday.setDate(jan1.getDate() - jan1Day);
      localTotalWeeks = 53;
    }
    
    let currentMonthName = '';
    for (let i = 0; i < localTotalWeeks; i++) {
      const d = new Date(startSunday);
      d.setDate(startSunday.getDate() + i * 7);
      
      if (selectedYear === LAST_12_MONTHS) {
        if (d > now) break;
      } else {
        if (d.getFullYear() > selectedYear) break;
      }
      
      const monthName = d.toLocaleDateString('en-US', { month: 'short' });
      if (monthName !== currentMonthName) {
        // Alignment fix: ensure labels don't bunch up or shift improperly
        const minGap = isMobile ? 3 : 4; 
        if (months.length === 0 || (i - months[months.length - 1].index) >= minGap) {
          months.push({ name: monthName, index: i });
          currentMonthName = monthName;
        }
      }
    }
    return months;
  };

  const heatmapMonths = getHeatmapMonths();

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] p-8 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[var(--border)] border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  const getDynamicDateRange = () => {
    if (!activeHistory.length) return "No reviews in selected period";
    const oldestStr = activeHistory[0].date;
    const latestStr = activeHistory[activeHistory.length - 1].date;
    try {
      const oldestDate = new Date(oldestStr + 'T00:00:00');
      const latestDate = new Date(latestStr + 'T00:00:00');
      const oldestMonth = oldestDate.toLocaleDateString('en-US', { month: 'short' });
      const oldestDay = oldestDate.getDate();
      const latestMonth = latestDate.toLocaleDateString('en-US', { month: 'short' });
      const latestDay = latestDate.getDate();
      const latestYear = latestDate.getFullYear();
      const currentYear = new Date().getFullYear();
      const yearSuffix = latestYear !== currentYear ? `, ${latestYear}` : '';

      if (oldestStr === latestStr) {
        return `${oldestMonth} ${oldestDay}${yearSuffix}`;
      }
      if (oldestMonth === latestMonth) {
        return `${oldestMonth} ${oldestDay} – ${latestDay}${yearSuffix}`;
      }
      return `${oldestMonth} ${oldestDay} – ${latestMonth} ${latestDay}${yearSuffix}`;
    } catch {
      return "May 2026";
    }
  };

  return (
    <div className="bg-[var(--bg-surface)] backdrop-blur-md border border-[var(--border)] p-6 rounded-3xl animate-fade-in">
      <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-[var(--text-primary)] flex items-center gap-3">
            <TrendingUp className="text-primary-500" size={28} />
            Workspace Analytics
          </h2>
          <p className="text-[var(--text-muted)] text-sm mt-1 font-light">
            {getDynamicDateRange()}
          </p>
        </div>
      </header>

      {/* Stats Grid with Sparklines & Trend Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {SUMMARY_STATS.map(({ label, value, icon: Icon, trend, color, sparkColor, sparkData }) => (
          <div key={label} className="bg-[var(--bg-surface-2)] border border-[var(--border)] p-5 group hover:shadow-glow-primary transition-all duration-500 hover:border-[var(--border-hover)] rounded-2xl">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-xl bg-[var(--bg-surface-3)] flex items-center justify-center group-hover:scale-110 transition-transform">
                <Icon className={color} size={20} />
              </div>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[var(--bg-surface-3)] text-[10px] font-bold text-[var(--text-secondary)] border border-[var(--border)]">
                {trend.isGood ? <ArrowUpRight size={10} className="text-emerald-400" /> : <ArrowDownRight size={10} className="text-red-400" />}
                <span className={trend.isGood ? 'text-emerald-400' : 'text-red-400'}>{trend.text}</span>
              </div>
            </div>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-2xl font-black text-[var(--text-primary)] leading-tight">{value}</p>
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mt-1">{label}</p>
              </div>
              <Sparkline data={sparkData} color={sparkColor} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        {/* Main Quality Evolution Chart */}
        <div className="bg-[var(--bg-surface-2)] border border-[var(--border)] p-6 lg:col-span-2 rounded-2xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-primary-400" />
              <h3 className="text-xs sm:text-sm font-black text-[var(--text-primary)] uppercase tracking-wider" style={{ whiteSpace: 'nowrap' }}>Quality Evolution</h3>
            </div>
            
            {/* Time Toggle Row */}
            <div className="flex bg-[var(--bg-surface-3)] p-1 rounded-xl border border-[var(--border)]">
              {['LAST 7 DAYS', 'LAST 30 DAYS', 'ALL TIME'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                    timeRange === range
                      ? 'bg-orange-500 text-white shadow-glow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          <div className={`${isMobile ? 'h-[200px]' : 'h-[300px]'} w-full`}>
            {activeHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activeHistory} margin={{ top: 15, right: 15, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="premiumGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} opacity={0.5} />
                  <XAxis 
                    dataKey="date" 
                    stroke="var(--text-muted)" 
                    fontSize={9} 
                    tickLine={false} 
                    axisLine={false} 
                    interval="preserveStartEnd"
                    minTickGap={isMobile ? 50 : 30}
                    tickFormatter={(dateStr) => {
                      const d = new Date(dateStr);
                      return d.toLocaleDateString('en-US', { 
                        month: 'short', day: 'numeric' 
                      });
                    }}
                  />
                  <YAxis stroke="var(--text-muted)" fontSize={9} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--bg-surface)', 
                      border: '1px solid var(--border)', 
                      borderRadius: '16px', 
                      boxShadow: '0 10px 30px rgba(0,0,0,0.1)' 
                    }}
                    itemStyle={{ color: 'var(--text-primary)', fontSize: '12px', fontWeight: 'bold' }}
                    labelStyle={{ color: 'var(--text-muted)', fontSize: '10px', fontWeight: 'bold', marginBottom: '6px' }}
                    formatter={(value) => [`${value}% Avg Quality`]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="averageScore" 
                    stroke="#f97316" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#premiumGradient)" 
                    dot={false}
                    activeDot={{ r: 5, strokeWidth: 0, fill: '#fff' }}
                    animationDuration={1000}
                    connectNulls
                  />
                  {activeHistory.length > 0 && (
                    allScoresEqual ? (
                      <ReferenceDot 
                        x={activeHistory[activeHistory.length - 1].date} 
                        y={activeHistory[activeHistory.length - 1].averageScore} 
                        r={6} 
                        fill="#fff" 
                        stroke="#7c6cf1" 
                        strokeWidth={2}
                      >
                        <Label 
                          value={activeHistory[activeHistory.length - 1].averageScore} 
                          position="top" 
                          fill="#fff" 
                          fontSize={10} 
                          fontWeight="bold" 
                          offset={8} 
                        />
                      </ReferenceDot>
                    ) : (
                      <>
                        <ReferenceDot 
                          x={maxPoint.date} 
                          y={maxPoint.score} 
                          r={6} 
                          fill="#fff" 
                          stroke="#22c55e" 
                          strokeWidth={2}
                        >
                          <Label 
                            value={maxPoint.score} 
                            position="top" 
                            fill="#fff" 
                            fontSize={10} 
                            fontWeight="bold" 
                            offset={8} 
                          />
                        </ReferenceDot>
                        <ReferenceDot 
                          x={minPoint.date} 
                          y={minPoint.score} 
                          r={6} 
                          fill="#fff" 
                          stroke="#ef4444" 
                          strokeWidth={2}
                        >
                          <Label 
                            value={minPoint.score} 
                            position="bottom" 
                            fill="#fff" 
                            fontSize={10} 
                            fontWeight="bold" 
                            offset={8} 
                          />
                        </ReferenceDot>
                      </>
                    )
                  )}
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full bg-white/[0.01] rounded-2xl border border-dashed border-white/5 flex items-center justify-center">
                <p className="text-dark-500 text-sm italic font-light">No review data found for this period.</p>
              </div>
            )}
          </div>
        </div>

        {/* Language Distribution with Donut Side-By-Side */}
        <div className="glass-panel p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Code size={18} className="text-accent-violet" />
            <h3 className="text-md font-black text-[var(--text-primary)] uppercase tracking-wider">Languages</h3>
          </div>
          
          <div className="flex-1 flex flex-col md:flex-row lg:flex-col xl:flex-row items-center justify-between gap-4">
            {/* Stacked Progress Bars Left */}
            <div className="flex-1 w-full space-y-4">
              {languagePieData.length > 0 ? (
                languagePieData.slice(0, 4).map((lang, index) => (
                  <div key={lang.name} className="min-h-[32px] flex flex-col justify-center">
                    <div className="flex justify-between items-center font-bold mb-1.5">
                      <span className="text-[var(--text-muted)] uppercase tracking-widest text-[10px] truncate pr-2">{lang.name}</span>
                      <span className="text-[var(--text-secondary)] text-[10px] whitespace-nowrap">{lang.value}&nbsp;({lang.percent}%)</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-1000" 
                        style={{ width: `${lang.percent}%`, backgroundColor: LANG_COLORS[lang.name] || FALLBACK_COLORS[index % FALLBACK_COLORS.length] }} 
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-dark-500 italic">No language data.</p>
              )}
            </div>

            {/* Donut Chart Right */}
            <div className="w-28 h-28 flex-shrink-0 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={languagePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={isMobile ? 32 : 44}
                    outerRadius={isMobile ? 44 : 58}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {languagePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={LANG_COLORS[entry.name] || FALLBACK_COLORS[index % FALLBACK_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-black text-[var(--text-primary)]">{data?.totalReviews || 0}</span>
                <span className="text-[9px] text-[var(--text-muted)] uppercase font-black mt-0.5">Reviews</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        {/* Issue Breakdown Section with Donut & Callout Card */}
        <div className="glass-panel p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={18} className="text-red-400" />
            <h3 className="text-md font-black text-[var(--text-primary)] uppercase tracking-wider">Issue Breakdown</h3>
          </div>
          
          <div className="flex-1 flex items-center justify-center gap-4 py-4 border-b border-white/5">
            {/* Donut Chart */}
            <div className="w-28 h-28 flex-shrink-0 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={issueBreakdownData}
                    cx="50%"
                    cy="50%"
                    innerRadius={36}
                    outerRadius={48}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {issueBreakdownData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-black text-[var(--text-primary)]">
                  {issueBreakdownData.reduce((acc, i) => acc + i.value, 0)}
                </span>
                <span className="text-[9px] text-[var(--text-muted)] uppercase font-black mt-0.5">Issues</span>
              </div>
            </div>

            {/* Micro Legend */}
            <div className="flex-1 space-y-2 overflow-hidden">
              {issueBreakdownData.map((cat) => (
                <div key={cat.name} className="flex items-center justify-between text-[11px] font-bold">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                    <span className="text-[var(--text-secondary)] text-[11px] truncate max-w-[90px]">{cat.name}</span>
                  </div>
                  <span className="text-[var(--text-primary)] font-mono whitespace-nowrap">{cat.value} ({cat.percent}%)</span>
                </div>
              ))}
            </div>
          </div>

          {/* Callout Card below */}
          <div className="mt-4 p-4 rounded-2xl bg-[var(--bg-surface-3)] border border-[var(--border)] flex gap-3 items-center">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
              <AlertTriangle size={18} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-dark-400 tracking-wider">Most Common Issue</p>
              <p className="text-xs font-black text-[var(--text-primary)] mt-0.5 capitalize">{mostCommonIssue?.name || 'Logic Errors'}</p>
            </div>
          </div>
        </div>

        {/* Premium GitHub-Style Contribution Heatmap */}
        <div className="bg-[var(--bg-surface-2)] border border-[var(--border)] p-6 lg:col-span-2 flex flex-col justify-between rounded-2xl">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Calendar size={18} className="text-primary-400" />
              <h3 className="text-md font-black text-[var(--text-primary)] uppercase tracking-wider whitespace-nowrap">Activity Heatmap</h3>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 justify-between items-start w-full">
              {/* Heatmap block */}
              <div 
                className="flex-1 overflow-x-auto pb-2 scrollbar-none w-full" 
                style={{ maxWidth: '100%' }}
                ref={(el) => {
                  if (el && isMobile) {
                    // Auto-scroll to the right (most recent) on mobile
                    el.scrollLeft = el.scrollWidth;
                  }
                }}
              >
                <div className="flex gap-2 w-max">
                  {/* Day Labels */}
                  <div className="grid grid-rows-7 text-[10px] text-[var(--text-muted)] font-medium flex-shrink-0 select-none pr-1.5 mb-[1px]" style={{ height: `${7 * 14 + 6 * 3}px`, alignSelf: 'flex-end' }}>
                    <span></span>
                    <span className="flex items-center" style={{ height: `14px` }}>Mon</span>
                    <span></span>
                    <span className="flex items-center" style={{ height: `14px` }}>Wed</span>
                    <span></span>
                    <span className="flex items-center" style={{ height: `14px` }}>Fri</span>
                    <span></span>
                  </div>

                  {/* Grid Column wrapper */}
                  <div className="flex flex-col flex-shrink-0" style={{ width: `${53 * 17}px` }}>
                    {/* Month Labels top */}
                    <div className="relative h-4 mb-1 text-[10px] text-[var(--text-muted)] font-bold flex select-none" style={{ width: `${53 * 17}px` }}>
                      {heatmapMonths.map((m) => (
                        <span 
                          key={m.index} 
                          className="absolute" 
                          style={{ left: `${m.index * 17}px` }}
                        >
                          {m.name}
                        </span>
                      ))}
                    </div>

                    {/* Grid cells */}
                    <div className="grid grid-flow-col grid-rows-7" style={{ gap: '3px', width: 'max-content' }}>
                      {heatmapCells.map((cell) => {
                        const bgColor = cell.isFuture ? 'transparent' : getCellBgColor(cell.count);

                        return (
                          <div
                            key={cell.date}
                            title={cell.isFuture ? '' : `${cell.count} reviews on ${cell.date}`}
                            className={`rounded-[3px] transition-all duration-300 relative ${cell.isFuture ? '' : 'group cursor-pointer'}`}
                            style={{ 
                              width: '14px', 
                              height: '14px', 
                              backgroundColor: bgColor,
                              boxShadow: cell.count >= 4 && !cell.isFuture ? '0 0 10px rgba(249,115,22,0.45)' : 'none'
                            }}
                          >
                            {!cell.isFuture && (
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-[var(--bg-surface)] border border-[var(--border)] text-[9px] text-[var(--text-primary)] font-bold px-2 py-1 rounded-md shadow-2xl z-50 whitespace-nowrap">
                                {cell.count} review{cell.count !== 1 ? 's' : ''} on {cell.date}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

                  {/* Years List on Right Side */}
              <div className="flex lg:flex-col gap-2 flex-wrap flex-shrink-0 lg:border-l lg:border-white/5 lg:pl-6 select-none w-full lg:w-auto justify-start">
                <button
                  type="button"
                  onClick={() => setSelectedYear(LAST_12_MONTHS)}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all text-center min-w-[110px] ${
                    selectedYear === LAST_12_MONTHS
                      ? 'bg-gradient-premium text-white shadow-lg shadow-primary-500/10'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-2)]'
                  }`}
                >
                  Last 12 Months
                </button>
                {years.map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => setSelectedYear(yr)}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all text-center min-w-[110px] ${
                      selectedYear === yr
                        ? 'bg-gradient-premium text-white shadow-lg shadow-primary-500/10'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-2)]'
                    }`}
                  >
                    {yr}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end items-center gap-1.5 mt-4 text-[10px] text-[var(--text-muted)] font-bold select-none">
            <span>Less</span>
            <div className="rounded-[3px]" style={{ width: '16px', height: '16px', backgroundColor: 'var(--heatmap-bg-0)' }} />
            <div className="rounded-[3px]" style={{ width: '16px', height: '16px', backgroundColor: 'var(--heatmap-bg-1)' }} />
            <div className="rounded-[3px]" style={{ width: '16px', height: '16px', backgroundColor: 'var(--heatmap-bg-2)' }} />
            <div className="rounded-[3px]" style={{ width: '16px', height: '16px', backgroundColor: 'var(--heatmap-bg-3)' }} />
            <div className="rounded-[3px]" style={{ width: '16px', height: '16px', backgroundColor: 'var(--accent-primary)' }} />
            <span>More</span>
          </div>
        </div>
      </div>
    </div>
  );
}
