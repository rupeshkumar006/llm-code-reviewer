import { useState, useEffect, useRef } from 'react';
import { Zap, AlertCircle, Shield, Star, Lightbulb, ChevronRight, ChevronDown, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const ScoreRing = ({ score }) => {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const [currentOffset, setCurrentOffset] = useState(circumference);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentOffset(offset);
    }, 150);
    return () => clearTimeout(timer);
  }, [score, offset, circumference]);

  const getSeverity = (s) => {
    if (s >= 90) return { label: 'Excellent', color: 'text-[#22c55e] border-[#22c55e]/30 bg-[#22c55e]/5', hex: '#22c55e' };
    if (s >= 70) return { label: 'Good', color: 'text-[#22d3ee] border-[#22d3ee]/30 bg-[#22d3ee]/5', hex: '#22d3ee' };
    if (s >= 40) return { label: 'Poor', color: 'text-[#f97316] border-[#f97316]/30 bg-[#f97316]/5', hex: '#f97316' };
    return { label: 'Critical', color: 'text-[#ef4444] border-[#ef4444]/30 bg-[#ef4444]/5', hex: '#ef4444' };
  };

  const severity = getSeverity(score);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div className="relative" style={{ marginBottom: '16px' }}>
        <svg className="w-44 h-44 transform -rotate-90">
          <circle
            cx="88"
            cy="88"
            r={radius}
            fill="transparent"
            stroke="var(--bg-surface-3)"
            strokeWidth="10"
          />
          <circle
            cx="88"
            cy="88"
            r={radius}
            fill="transparent"
            stroke={severity.hex}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={currentOffset}
            strokeLinecap="round"
            className="transition-all duration-[1200ms] ease-out"
            style={{ filter: `drop-shadow(0 0 8px ${severity.hex}60)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-black text-[var(--text-primary)] drop-shadow-md tracking-tighter">{score}</span>
          <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mt-1">Score</span>
        </div>
      </div>
      
      <div 
        className={`px-4 py-1.5 rounded-full border text-xs font-black uppercase tracking-wider shadow-sm ${severity.color}`}
        style={{ marginTop: '10px', marginBottom: '4px' }}
      >
        {severity.label}
      </div>
    </div>
  );
};

function IssueCard({ issue, type, index, onLineClick }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const severity = (issue.severity || 'Medium').toUpperCase();
  const line = issue.line || 1;

  const colors = {
    CRITICAL: { bg: 'bg-red-500', text: 'text-red-400', border: 'border-red-500/20 bg-red-500/5 hover:bg-red-500/10', hex: '#f43f5e' },
    HIGH: { bg: 'bg-orange-500', text: 'text-orange-400', border: 'border-orange-500/20 bg-orange-500/5 hover:bg-orange-500/10', hex: '#f97316' },
    MEDIUM: { bg: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10', hex: '#f59e0b' },
    LOW: { bg: 'bg-blue-500', text: 'text-blue-400', border: 'border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10', hex: '#3b82f6' },
  };

  const color = colors[severity] || colors.MEDIUM;
  const isSecurity = type === 'security';
  const title = isSecurity ? (issue.vulnerability || 'Security Issue') : (issue.vulnerability || 'Potential Bug');
  const desc = issue.description;

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(issue.fix || '');
    setCopied(true);
    toast.success('Suggested fix copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      onClick={() => onLineClick(line)}
      className="group relative transition-all duration-300 cursor-pointer overflow-hidden bg-[var(--bg-surface-2)] hover:bg-[var(--bg-surface-3)] border border-[var(--border)]"
      style={{
        marginBottom: '12px',
        padding: '14px',
        borderRadius: '10px',
        borderLeft: `3px solid ${color.hex}`
      }}
    >
      {/* Card Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div className="flex items-center gap-2">
          {/* #N Badge */}
          <span className="flex items-center justify-center px-2 py-0.5 rounded bg-[var(--bg-surface-2)] text-[10px] font-bold text-[var(--text-secondary)] border border-[var(--border)]">
            #{index}
          </span>
          {/* LINE N Chip */}
          <span className="flex items-center justify-center px-2 py-0.5 rounded bg-[var(--bg-surface-2)] text-[10px] font-bold text-[var(--text-muted)] border border-[var(--border)]">
            LINE {line}
          </span>
        </div>
        {/* Severity Pill */}
        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${color.text} ${color.border}`}>
          {severity}
        </span>
      </div>

      {/* Title */}
      <h5 
        className="text-[var(--text-primary)] group-hover:text-orange-500 transition-colors"
        style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}
      >
        {title}
      </h5>

      {/* Description */}
      <p style={{ fontSize: '12px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
        {desc}
      </p>

      {/* Expandable "See fix ->" Accordion Trigger */}
      {issue.fix && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          className="mt-3 flex items-center gap-1.5 text-xs font-bold text-primary-500 hover:text-primary-600 transition-colors bg-[var(--bg-surface-3)] px-2.5 py-1.5 rounded-lg border border-[var(--border)]"
        >
          <span>{expanded ? 'Hide fix' : 'See fix →'}</span>
        </button>
      )}

      {/* Suggested Fix Expandable Block */}
      {expanded && issue.fix && (
        <div className="mt-3.5 pt-3.5 border-t border-[var(--border)] animate-fade-in" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-400 uppercase tracking-widest">
              {isSecurity ? <Shield size={12} /> : <Lightbulb size={12} />}
              Suggested Fix
            </div>
              <button 
                onClick={handleCopy}
                className="p-1 rounded bg-[var(--bg-surface-3)] hover:bg-[var(--bg-surface-2)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                title="Copy suggested fix"
              >
              {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            </button>
          </div>
          <pre className="text-xs text-[var(--text-primary)] font-mono leading-relaxed bg-[var(--bg-primary)] p-3.5 rounded-xl border border-[var(--border)] overflow-x-auto max-w-full">
            <code>{issue.fix}</code>
          </pre>
        </div>
      )}
    </div>
  );
}

export default function ReviewPanel({ review, loading, onLineClick }) {
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [bugsOpen, setBugsOpen] = useState(true);
  const [secOpen, setSecOpen] = useState(true);
  const [codeCopied, setCodeCopied] = useState(false);
  const [codeOpen, setCodeOpen] = useState(false);
  const [showScrollHint, setShowScrollHint] = useState(false);
  const scrollRef = useRef(null);

  // Show scroll hint when review loads, fade after 3s or on scroll
  useEffect(() => {
    if (review) {
      setShowScrollHint(true);
      const timer = setTimeout(() => setShowScrollHint(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [review?.id]);

  const handlePanelScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 20;
    setShowScrollHint(!isAtBottom);
  };

  const filterSeverities = (list) => {
    if (!list) return [];
    if (severityFilter === 'ALL') return list;
    return list.filter(item => (item.severity || 'Medium').toUpperCase() === severityFilter);
  };

  const filteredBugs = filterSeverities(review?.bugs);
  const filteredSecurity = filterSeverities(review?.security);

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 space-y-6 animate-fade-in">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-primary-500/10 border-t-primary-500 rounded-full animate-spin shadow-glow-primary" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Zap size={24} className="text-primary-500 animate-pulse" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-lg font-black text-[var(--text-primary)] mb-1">🤖 AI is analysing your code...</p>
          <p className="text-xs text-[var(--text-muted)] animate-pulse font-medium">Usually takes 10-20 seconds</p>
        </div>
        <div className="w-48 h-1 bg-[var(--bg-surface-3)] rounded-full overflow-hidden">
          <div className="h-full bg-primary-500 animate-progress-indefinite shadow-glow-primary" />
        </div>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 animate-fade-in">
        <div className="font-mono text-left py-6 w-full max-w-[320px] bg-[var(--bg-surface-2)] rounded-xl border border-[var(--border)] whitespace-nowrap" style={{ overflowX: 'hidden', width: '100%', paddingLeft: '16px', paddingRight: '16px' }}>
          <p className="text-[var(--text-muted)] mb-4 text-[11px] sm:text-sm" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>// drop your code in the editor</p>
          <p className="mb-2.5 text-[11px] sm:text-sm" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}><span className="text-[#f97316]">→</span> <span className="text-[var(--text-secondary)]">select a language</span></p>
          <p className="mb-2.5 text-[11px] sm:text-sm" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}><span className="text-[#f97316]">→</span> <span className="text-[var(--text-secondary)]">click Review Code</span></p>
          <p className="mb-2.5 text-[11px] sm:text-sm" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}><span className="text-[#f97316]">→</span> <span className="text-[var(--text-secondary)]">get bugs, security issues, quality score</span></p>
        </div>
        
        <div className="mt-8 grid grid-cols-2 gap-4 w-full max-w-[320px]">
          <div className="p-4 rounded-2xl bg-[var(--bg-surface-2)] border border-[var(--border)] text-left">
            <div className="text-primary-500 mb-2"><Star size={16} fill="currentColor" /></div>
            <p className="text-[10px] font-bold text-[var(--text-primary)] uppercase tracking-wider mb-1">Quality</p>
            <p className="text-[11px] text-[var(--text-muted)] leading-tight">AI-driven scoring & insights</p>
          </div>
          <div className="p-4 rounded-2xl bg-[var(--bg-surface-2)] border border-[var(--border)] text-left">
            <div className="text-accent-rose mb-2"><AlertCircle size={16} /></div>
            <p className="text-[10px] font-bold text-[var(--text-primary)] uppercase tracking-wider mb-1">Security</p>
            <p className="text-[11px] text-[var(--text-muted)] leading-tight">OWASP risk detection</p>
          </div>
        </div>
      </div>
    );
  }

  const handleCopyRefactored = () => {
    navigator.clipboard.writeText(review.refactoredCode || '');
    setCodeCopied(true);
    toast.success('Refactored code copied!');
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const filterTabs = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

  // Metrics breakdown score parsing
  const rawQuality = review?.score;
  const qualityScore = isNaN(rawQuality) || rawQuality == null
    ? 0
    : Math.max(0, Math.min(100, rawQuality));
  
  let securityPenalty = 0;
  (review?.security || []).forEach(issue => {
    const sev = (issue.severity || '').toUpperCase();
    if (sev === 'CRITICAL') securityPenalty += 25;
    else if (sev === 'HIGH') securityPenalty += 15;
    else if (sev === 'MEDIUM') securityPenalty += 10;
    else securityPenalty += 5;
  });
  const calculatedSecurity = 100 - securityPenalty;
  const securityScore = isNaN(calculatedSecurity) || calculatedSecurity == null
    ? 0
    : Math.max(0, Math.min(100, Math.max(30, calculatedSecurity)));

  const rawComplexityObj = review?.complexity;
  const rawComplexity = typeof rawComplexityObj === 'object' && rawComplexityObj !== null 
    ? rawComplexityObj.score 
    : rawComplexityObj;
  const complexityScore = isNaN(rawComplexity) || rawComplexity == null
    ? 0
    : Math.max(0, Math.min(100, 100 - (rawComplexity * 10)));

  const calculatedStyle = 100 - (review?.bestPractices || []).length * 8;
  const styleScore = isNaN(calculatedStyle) || calculatedStyle == null
    ? 0
    : Math.max(0, Math.min(100, Math.max(40, calculatedStyle)));

  const subScores = [
    { label: 'Quality', value: qualityScore, color: 'bg-emerald-500' },
    { label: 'Security', value: securityScore, color: 'bg-primary-500' },
    { label: 'Complexity', value: complexityScore, color: 'bg-indigo-500' },
    { label: 'Style', value: styleScore, color: 'bg-accent-violet' },
  ];

  return (
    <div 
      ref={scrollRef}
      onScroll={handlePanelScroll}
      className="animate-fade-in scroll-smooth custom-scrollbar relative"
      style={{ height: '100%', overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '20px' }}
    >
      {/* Score Ring Section */}
      <ScoreRing score={review.score} />

      {/* Metrics Breakdown Section */}
      <div style={{ marginTop: '20px', marginBottom: '20px' }}>
        <p className="text-[10px] font-black uppercase tracking-widest text-dark-400 mb-4">Metrics Breakdown</p>
        {subScores.map((sub) => (
          <div key={sub.label} style={{ marginBottom: '14px' }} className="group">
            <div style={{ display: 'flex', justifyContent: 'space-between' }} className="text-xs font-bold">
              <span className="text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">{sub.label}</span>
              <span className="text-[var(--text-primary)] font-mono">{sub.value}%</span>
            </div>
            <div 
              className="w-full bg-[var(--bg-surface-3)] overflow-hidden p-[1px]"
              style={{ height: '6px', borderRadius: '3px', marginTop: '6px' }}
            >
              <div 
                className={`h-full ${sub.color}`}
                style={{ width: `${sub.value}%`, borderRadius: '3px', transition: 'width 1000ms ease-out' }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* AI Summary Blockquote Section */}
      {review.summary && (
        <div 
          className="rounded-2xl bg-gradient-to-r from-primary-500/[0.04] to-accent-violet/[0.04] border border-primary-500/20 relative overflow-visible group shadow-inner"
          style={{ margin: '20px 0', padding: '14px 16px' }}
        >
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500" />
          <p 
            className="text-[var(--text-primary)] italic font-medium pl-2"
            style={{ fontSize: '13px', lineHeight: '1.7' }}
          >
            "{review.summary}"
          </p>
        </div>
      )}

      {/* Filter Row Section */}
      <div 
        className="flex gap-1 overflow-x-auto scrollbar-none"
        style={{ margin: '16px 0 12px 0' }}
      >
        {filterTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setSeverityFilter(tab)}
            className={`transition-all duration-300 flex-shrink-0 border font-black uppercase tracking-wider ${
              severityFilter === tab
                ? 'bg-primary-500 text-white border-primary-500/50 shadow-glow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] border-transparent bg-[var(--bg-surface-2)]'
            }`}
            style={{ padding: '4px 12px', fontSize: '12px', borderRadius: '20px' }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Bugs Section */}
      <div>
        <button
          onClick={() => setBugsOpen(!bugsOpen)}
          className="w-full flex items-center justify-between uppercase text-[var(--text-muted)] py-1 border-b border-[var(--border)] group"
          style={{ marginTop: '20px', marginBottom: '10px', fontSize: '11px', letterSpacing: '0.5px', fontWeight: '600' }}
        >
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-glow-sm" />
            Potential Bugs ({filteredBugs.length})
          </span>
          <ChevronDown size={14} className={`text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-transform duration-300 ${bugsOpen ? '' : '-rotate-90'}`} />
        </button>
        
        {bugsOpen && (
          <div className="space-y-3.5 animate-slide-up">
            {filteredBugs.length > 0 ? (
              filteredBugs.map((bug, i) => (
                <IssueCard key={i} index={i + 1} issue={bug} type="bug" onLineClick={onLineClick} />
              ))
            ) : (
              <p className="text-xs text-dark-400 italic py-2">
                No {severityFilter === 'ALL' ? '' : severityFilter.toLowerCase() + ' '}issues found.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Security Section */}
      <div>
        <button
          onClick={() => setSecOpen(!secOpen)}
          className="w-full flex items-center justify-between uppercase text-[var(--text-muted)] py-1 border-b border-[var(--border)] group"
          style={{ marginTop: '20px', marginBottom: '10px', fontSize: '11px', letterSpacing: '0.5px', fontWeight: '600' }}
        >
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-500 shadow-glow-sm" />
            Security Risks ({filteredSecurity.length})
          </span>
          <ChevronDown size={14} className={`text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-transform duration-300 ${secOpen ? '' : '-rotate-90'}`} />
        </button>
        
        {secOpen && (
          <div className="space-y-3.5 animate-slide-up">
            {filteredSecurity.length > 0 ? (
              filteredSecurity.map((sec, i) => (
                <IssueCard key={i} index={i + 1} issue={sec} type="security" onLineClick={onLineClick} />
              ))
            ) : (
              <p className="text-xs text-dark-400 italic py-2">
                No {severityFilter === 'ALL' ? '' : severityFilter.toLowerCase() + ' '}issues found.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Best Practices Recommendations */}
      {review.bestPractices?.length > 0 && (
        <div>
          <h4 
            className="uppercase text-[var(--text-muted)] pb-1 border-b border-[var(--border)] flex items-center gap-2"
            style={{ marginTop: '20px', marginBottom: '10px', fontSize: '11px', letterSpacing: '0.5px', fontWeight: '600' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-glow-sm" />
            Recommendations
          </h4>
          <div className="space-y-2.5">
            {review.bestPractices.map((bp, i) => (
              <div key={i} className="flex items-start gap-3 text-[13px] text-[var(--text-secondary)] font-light p-2.5 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border)] hover:bg-[var(--bg-surface-3)] transition-colors" style={{ paddingBottom: '14px', marginBottom: '14px', borderLeft: '2px solid var(--border)' }}>
                <span style={{ color: '#f97316', fontSize: '16px', fontWeight: 'bold', lineHeight: '1' }} className="mt-1 flex-shrink-0">›</span>
                <span style={{ lineHeight: '1.75' }}>{bp}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Refactored Code Section */}
      {review.refactoredCode && (
        <div>
          <button
            onClick={() => setCodeOpen(!codeOpen)}
            className="w-full flex items-center justify-between uppercase text-dark-400 py-1 border-b border-white/5 group"
            style={{ marginTop: '20px', marginBottom: '10px', fontSize: '11px', letterSpacing: '0.5px', fontWeight: '600' }}
          >
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-violet shadow-glow-sm" />
              Refactored Code Summary
            </span>
            <ChevronDown size={14} className={`text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-transform duration-300 ${codeOpen ? '' : '-rotate-90'}`} />
          </button>
          
          {codeOpen && (
            <div className="space-y-3.5 animate-slide-up relative bg-[var(--bg-surface-2)] p-4 rounded-2xl border border-[var(--border)]">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] text-dark-400 uppercase tracking-widest font-bold">Suggested Refactoring</span>
                <button
                  onClick={handleCopyRefactored}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--bg-surface-3)] hover:bg-[var(--bg-surface)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all font-bold border border-[var(--border)]"
                >
                  {codeCopied ? (
                    <>
                      <Check size={12} className="text-emerald-400" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      Copy Code
                    </>
                  )}
                </button>
              </div>
              <pre className="text-xs text-[var(--text-primary)] font-mono leading-relaxed bg-[var(--bg-primary)] p-3 rounded-xl border border-[var(--border)] overflow-x-auto max-h-60 custom-scrollbar">
                <code>{review.refactoredCode}</code>
              </pre>
            </div>
          )}
        </div>
      )}

      <div 
        className="pointer-events-none sticky bottom-0 left-0 right-0"
        style={{
          height: '48px',
          background: 'linear-gradient(to top, var(--bg-surface) 0%, transparent 100%)',
          marginTop: '-48px',
          position: 'sticky',
          bottom: 0
        }}
      />
    </div>
  );
}
