import { useState, useEffect } from 'react';
import { reviewAPI } from '../services/api';
import { GitCompare, ArrowRight, TrendingUp, TrendingDown, Minus, Zap, Shield, HelpCircle, Code, AlertTriangle } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import toast from 'react-hot-toast';

export default function ReviewComparison({ history }) {
  const [idA, setIdA] = useState('');
  const [idB, setIdB] = useState('');
  const [reviewA, setReviewA] = useState(null);
  const [reviewB, setReviewB] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expandedSummaryIds, setExpandedSummaryIds] = useState({});
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 640 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSummary = (id) => {
    setExpandedSummaryIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const fetchReview = async (id) => {
    const res = await reviewAPI.getById(id);
    return res.data;
  };

  const handleCompare = async () => {
    if (!idA || !idB || idA === idB) {
      toast.error('Please select two different reviews');
      return;
    }
    setLoading(true);
    try {
      const [a, b] = await Promise.all([fetchReview(idA), fetchReview(idB)]);
      setReviewA(a);
      setReviewB(b);
    } catch {
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const getComplexityScore = (rev) => {
    if (!rev) return 0;
    if (typeof rev.complexity === 'object') {
      return rev.complexity?.score ?? 0;
    }
    return rev.complexity ?? 0;
  };

  // Deltas (Review B minus Review A)
  const scoreDelta = reviewA && reviewB ? reviewB.score - reviewA.score : null;
  const bugsDelta = reviewA && reviewB ? (reviewB.bugs?.length ?? 0) - (reviewA.bugs?.length ?? 0) : null;
  const securityDelta = reviewA && reviewB ? (reviewB.security?.length ?? 0) - (reviewA.security?.length ?? 0) : null;
  const complexityDelta = reviewA && reviewB ? getComplexityScore(reviewB) - getComplexityScore(reviewA) : null;

  const DeltaBadge = ({ delta }) => {
    if (delta === null || delta === undefined || delta === 0) return null;
    const text = delta > 0 ? `+${delta}` : `${delta}`;
    let colorClass = 'bg-[var(--bg-surface-2)] border-[var(--border)] text-[var(--text-muted)]'; // Zero (Gray)
    if (delta > 0) {
      colorClass = 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'; // Positive (Green)
    } else if (delta < 0) {
      colorClass = 'bg-red-500/10 border-red-500/20 text-red-500'; // Negative (Red)
    }
    return (
      <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full font-black flex items-center gap-0.5 border ${colorClass}`}>
        {text}
      </span>
    );
  };

  // Generate radar dataset comparing 5 axes: Quality Score, Security Health, Bug Minimization, Complexity Index, Coding Style
  const getRadarData = () => {
    if (!reviewA || !reviewB) return [];

    const scoreA = reviewA.score || 0;
    const secA = Math.max(0, 100 - (reviewA.security?.length ?? reviewA.securityIssues?.length ?? 0) * 20);
    const bugA = Math.max(0, 100 - (reviewA.bugs?.length ?? 0) * 15);
    const compA = Math.max(0, 100 - (getComplexityScore(reviewA) * 10));
    const styleA = reviewA.styleScore ?? (reviewA.bestPractices ? Math.max(40, 100 - reviewA.bestPractices.length * 8) : Math.round((reviewA.score || 0) * 0.9));

    const scoreB = reviewB.score || 0;
    const secB = Math.max(0, 100 - (reviewB.security?.length ?? reviewB.securityIssues?.length ?? 0) * 20);
    const bugB = Math.max(0, 100 - (reviewB.bugs?.length ?? 0) * 15);
    const compB = Math.max(0, 100 - (getComplexityScore(reviewB) * 10));
    const styleB = reviewB.styleScore ?? (reviewB.bestPractices ? Math.max(40, 100 - reviewB.bestPractices.length * 8) : Math.round((reviewB.score || 0) * 0.9));

    return [
      { metric: 'Quality Score', A: reviewA.score, B: reviewB.score },
      { metric: 'Security Health', A: secA, B: secB },
      { metric: 'Bug Minimization', A: bugA, B: bugB },
      { metric: 'Complexity Index', A: compA, B: compB },
      { metric: 'Coding Style', A: styleA, B: styleB }
    ];
  };

  const radarData = getRadarData();

  return (
    <div className="mt-8 bg-[var(--bg-surface)] backdrop-blur-md border border-[var(--border)] p-6 rounded-3xl animate-fade-in shadow-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-primary-500/10 text-primary-500">
          <GitCompare size={22} />
        </div>
        <div>
          <h3 className="text-xl font-black text-[var(--text-primary)]">Compare Reviews</h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Select two reviews to compare scores, bugs, and security side by side.</p>
        </div>
      </div>

      {/* Selectors Row */}
      <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
        <select
          value={idA}
          onChange={e => setIdA(e.target.value)}
          className="w-full min-w-[200px] relative z-50 sm:flex-1 px-4 py-3 text-sm rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all custom-scrollbar cursor-pointer"
        >
          <option value="" className="bg-[var(--bg-surface)]">Review A (Older)</option>
          {history.filter(r => r.score > 0).map(r => (
            <option key={r.id} value={r.id} className="bg-[var(--bg-surface)]">
              {r.language.charAt(0).toUpperCase() + r.language.slice(1)} Review · {new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · Score: {r.score}
            </option>
          ))}
        </select>

        <div className="p-2.5 rounded-full bg-[var(--bg-surface-2)] border border-[var(--border)] text-[var(--text-muted)] hidden sm:block">
          <ArrowRight size={18} />
        </div>

        <select
          value={idB}
          onChange={e => setIdB(e.target.value)}
          className="w-full min-w-[200px] relative z-50 sm:flex-1 px-4 py-3 text-sm rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all custom-scrollbar cursor-pointer"
        >
          <option value="" className="bg-[var(--bg-surface)]">Review B (Newer)</option>
          {history.filter(r => r.score > 0).map(r => (
            <option key={r.id} value={r.id} className="bg-[var(--bg-surface)]">
              {r.language.charAt(0).toUpperCase() + r.language.slice(1)} Review · {new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · Score: {r.score}
            </option>
          ))}
        </select>

        <button
          onClick={handleCompare}
          disabled={loading}
          className="btn-primary w-full sm:w-auto text-xs font-black uppercase tracking-widest px-8 py-3.5 disabled:opacity-50 min-h-[44px]"
        >
          {loading ? 'Comparing...' : 'Compare'}
        </button>
      </div>

      {/* Comparison Results Area */}
      {reviewA && reviewB && (
        <div className="animate-fade-in space-y-8">
          {/* Main Quality Delta banner */}
          {scoreDelta !== null && (
            <div className={`flex flex-col items-center justify-center p-6 rounded-2xl border transition-all duration-500 ${
              scoreDelta > 0 
                ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400 shadow-glow-emerald/5'
                : scoreDelta < 0 
                ? 'bg-red-500/5 border-red-500/20 text-red-400 shadow-glow-red/5'
                : 'bg-[var(--bg-surface-2)] border border-[var(--border)] text-[var(--text-muted)]'
            }`}>
              <div className="flex items-center gap-3 mb-1.5">
                {scoreDelta > 0 ? <TrendingUp size={24} className="animate-bounce" />
                 : scoreDelta < 0 ? <TrendingDown size={24} />
                 : <Minus size={24} />}
                <span className="text-3xl font-black">
                  {scoreDelta > 0 ? '+' : ''}{scoreDelta} Points
                </span>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest opacity-80">
                {scoreDelta > 0 ? 'Quality Improvement' : scoreDelta < 0 ? 'Quality Regression' : 'No Significant Change'}
              </span>
            </div>
          )}

          {/* Side-by-side card details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[['Review A (Older)', reviewA, idA], ['Review B (Newer)', reviewB, idB]].map(([label, review, id], idx) => (
              <div
                key={id}
                className={`p-6 rounded-2xl border transition-all duration-300 ${
                  idx === 1 && scoreDelta > 0
                    ? 'border-emerald-500/30 bg-emerald-500/[0.03] shadow-lg shadow-emerald-500/5'
                    : 'border-[var(--border)] bg-[var(--bg-surface-2)]'
                }`}
              >
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-[var(--border)]">
                  <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">{label}</span>
                  <span className="px-2.5 py-1 rounded bg-[var(--bg-surface-2)] text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-wider border border-[var(--border)]">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Score Ring / display */}
                <div className="flex items-end gap-2 mb-6">
                  <span className={`text-6xl font-black leading-none tracking-tighter ${
                    review.score >= 80 ? 'text-emerald-400'
                    : review.score >= 50 ? 'text-amber-400'
                    : 'text-red-400'
                  }`}>{review.score}</span>
                  <span className="text-sm font-bold text-[var(--text-muted)] mb-1.5">/ 100</span>
                </div>

                {/* Grid stats comparing details */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border)] flex flex-col justify-between h-20">
                    <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
                      <Code size={12} />
                      <p className="text-[9px] font-black uppercase tracking-wider">Language</p>
                    </div>
                    <p className="text-sm font-black text-[var(--text-primary)] capitalize">{review.language}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border)] flex flex-col justify-between h-20">
                    <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
                      <AlertTriangle size={12} />
                      <p className="text-[9px] font-black uppercase tracking-wider">Bugs</p>
                    </div>
                    <div className="flex items-center">
                      <p className="text-sm font-black text-red-400">{review.bugs?.length ?? 0}</p>
                      {idx === 1 && <DeltaBadge delta={bugsDelta} />}
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border)] flex flex-col justify-between h-20">
                    <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
                      <Shield size={12} />
                      <p className="text-[9px] font-black uppercase tracking-wider">Security</p>
                    </div>
                    <div className="flex items-center">
                      <p className="text-sm font-black text-orange-400">{review.security?.length ?? 0}</p>
                      {idx === 1 && <DeltaBadge delta={securityDelta} />}
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border)] flex flex-col justify-between h-20">
                    <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
                      <Zap size={12} />
                      <p className="text-[9px] font-black uppercase tracking-wider">Complexity</p>
                    </div>
                    <div className="flex items-center">
                      <p className="text-sm font-black text-primary-400">{getComplexityScore(review)}</p>
                      {idx === 1 && <DeltaBadge delta={complexityDelta} />}
                    </div>
                  </div>
                </div>

                {/* Card summary */}
                {review.summary && (() => {
                  const isLong = review.summary.length > 300;
                  const isExpanded = expandedSummaryIds[review.id];
                  const displayText = isLong && !isExpanded 
                    ? review.summary.slice(0, 300) + '...' 
                    : review.summary;
                  return (
                    <div className="p-4 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border)] flex flex-col">
                      <p style={{ color: 'var(--text-muted)', fontSize: '11px', letterSpacing: '0.08em' }} className="font-bold uppercase mb-2">AI SUMMARY</p>
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed pl-3" style={{ lineHeight: '1.6', borderLeft: '3px solid #f97316' }}>
                        {displayText}
                      </p>
                      {isLong && (
                        <button
                          onClick={() => toggleSummary(review.id)}
                          className="text-[10px] font-bold text-primary-400 hover:text-primary-300 transition-colors mt-2 uppercase tracking-wider text-left w-fit"
                        >
                          {isExpanded ? 'Show less' : 'Read more'}
                        </button>
                      )}
                    </div>
                  );
                })()}
              </div>
            ))}
          </div>

          {/* Radar Chart Visual Overlay */}
          <div className="glass-panel p-6 flex flex-col items-center">
            <div className="w-full flex items-center gap-2 mb-6 border-b border-[var(--border)] pb-3">
              <GitCompare size={18} className="text-primary-400" />
              <h4 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-wider">METRICS COMPARISON</h4>
            </div>

            <div className={`w-full ${isMobile ? 'h-[220px]' : 'h-[320px]'} max-w-lg`}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius={isMobile ? 70 : 110} data={radarData}>
                  <PolarGrid stroke="var(--border)" opacity={0.5} />
                  <PolarAngleAxis dataKey="metric" stroke="var(--text-muted)" fontSize={10} fontWeight="bold" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="var(--text-muted)" fontSize={9} />
                  <Radar 
                    name="Review A (Older)" 
                    dataKey="A" 
                    stroke="#f97316" 
                    fill="#f97316" 
                    fillOpacity={0.25} 
                  />
                  <Radar 
                    name="Review B (Newer)" 
                    dataKey="B" 
                    stroke="#22d3ee" 
                    fill="#22d3ee" 
                    fillOpacity={0.25} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--bg-surface)', 
                      border: '1px solid var(--border)', 
                      borderRadius: '12px' 
                    }}
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)' }}
                    labelStyle={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle" 
                    wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', pt: 10 }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
