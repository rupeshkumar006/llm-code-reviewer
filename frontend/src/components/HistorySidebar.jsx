import { useState, useEffect, useRef } from 'react';
import { reviewAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Star, StarOff, Trash2, Tag, Edit2, Search, Filter,
  Code2, Clock, Check, X, Plus
} from 'lucide-react';
import toast from 'react-hot-toast';

const LANGUAGES = ['All', 'java', 'python', 'javascript', 'typescript', 'cpp', 'go', 'rust', 'sql', 'php', 'ruby'];

// Language tag color mapping
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

function ScoreChip({ score }) {
  const val = Number(score) || 0;
  
  // Score-based background colors
  let bgColor, textColor;
  if (val >= 90) {
    bgColor = '#22c55e'; textColor = '#fff';
  } else if (val >= 70) {
    bgColor = '#22d3ee'; textColor = '#000';
  } else if (val >= 40) {
    bgColor = '#f97316'; textColor = '#fff';
  } else {
    bgColor = '#ef4444'; textColor = '#fff';
  }

  return (
    <span 
      className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold"
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      {val}
    </span>
  );
}

function LanguageTag({ language }) {
  const color = LANGUAGE_COLORS[language?.toLowerCase()] || '#64748b';
  return (
    <span 
      className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold"
      style={{ backgroundColor: `${color}20`, color: color, border: `1px solid ${color}30` }}
    >
      {language}
    </span>
  );
}

export default function HistorySidebar({ onSelectReview, selectedId, refreshTrigger, onNewReview }) {
  const { user, loading: authLoading } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterLang, setFilterLang] = useState('All');
  const [filterScore, setFilterScore] = useState({ min: '', max: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editLabel, setEditLabel] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [showBulk, setShowBulk] = useState(false);

  const isFetching = useRef(false);

  const fetchHistory = async (retryCount = 0) => {
    if (isFetching.current) {
      console.log('[HistorySidebar] Already fetching, skipping.');
      return;
    }
    
    console.log('[HistorySidebar] fetchHistory start. trigger:', refreshTrigger, 'retry:', retryCount);
    if (!user) return;

    isFetching.current = true;
    setLoading(true);
    
    try {
      const params = {};
      if (search) params.keyword = search;
      if (filterLang !== 'All') params.language = filterLang;
      if (filterScore.min) params.minScore = filterScore.min;
      if (filterScore.max) params.maxScore = filterScore.max;

      const res = await reviewAPI.getHistory(params);
      console.log('[HistorySidebar] API SUCCESS:', res.data.length, 'items');
      setHistory(res.data);
      setLoading(false);
      isFetching.current = false;
    } catch (err) {
      const status = err.response?.status;
      const backendError = err.response?.data?.error || err.message;
      console.warn('[HistorySidebar] API ERROR:', status || 'Network Error', backendError);

      // Silent retry for auth (401/403) or network errors, up to 2 times
      if ((status === 401 || status === 403 || !err.response) && retryCount < 2) {
        const delay = 1000 * (retryCount + 1);
        console.log(`[HistorySidebar] Silent retry #${retryCount + 1} in ${delay}ms...`);
        isFetching.current = false; // Allow retry to proceed
        setTimeout(() => fetchHistory(retryCount + 1), delay);
      } else {
        // Only show toast if it's a persistent non-auth error and not a simple load failure
        if (status && status !== 401 && status !== 403) {
          toast.error('History failed to load');
        }
        setLoading(false);
        isFetching.current = false;
      }
    }
  };

  useEffect(() => { 
    console.log('[HistorySidebar] useEffect triggered. refreshTrigger:', refreshTrigger);
    fetchHistory(); 
  }, [user?.id, search, filterLang, filterScore, refreshTrigger]);

  const handleFavourite = async (e, review) => {
    e.stopPropagation();
    try {
      await reviewAPI.update(review.id, { favourite: !review.favourite });
      setHistory(h => h.map(r => r.id === review.id ? { ...r, favourite: !r.favourite } : r));
    } catch { toast.error('Failed to update'); }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!confirm('Delete this review?')) return;
    try {
      await reviewAPI.delete(id);
      setHistory(h => h.filter(r => r.id !== id));
      toast.success('Review deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selected.size} reviews?`)) return;
    try {
      await Promise.all([...selected].map(id => reviewAPI.delete(id)));
      setHistory(h => h.filter(r => !selected.has(r.id)));
      setSelected(new Set());
      setShowBulk(false);
      toast.success(`Deleted ${selected.size} reviews`);
    } catch { toast.error('Failed to bulk delete'); }
  };

  const handleRename = async (id) => {
    try {
      await reviewAPI.update(id, { label: editLabel });
      setHistory(h => h.map(r => r.id === id ? { ...r, label: editLabel } : r));
      setEditingId(null);
    } catch { toast.error('Failed to rename'); }
  };

  const toggleSelect = (e, id) => {
    e.stopPropagation();
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
    setShowBulk(next.size > 0);
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    if (diff < 86400000) return 'Today';
    if (diff < 172800000) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="h-full flex flex-col glass-panel-solid">
      <div className="p-3 border-b border-[var(--border)]">
        <button
          onClick={onNewReview}
          className="w-full mb-3 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold transition-all hover:scale-[1.02] shadow-glow-sm"
        >
          <Plus size={14} />
          New Review
        </button>

        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <Clock size={14} className="text-primary-500" />
            History
            <span className="text-xs text-[var(--text-muted)] font-normal">({history.length})</span>
          </h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            title="Filter by language"
            className={`p-1.5 rounded-lg transition-colors ${
              showFilters || filterLang !== 'All' 
                ? 'bg-primary-500/10 text-primary-500 border border-primary-500/20' 
                : 'hover:bg-[var(--bg-surface-2)] text-[var(--text-muted)]'
            }`}
          >
            <Filter size={14} />
          </button>
        </div>

        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search code, labels..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg
                       bg-[var(--bg-surface-2)] border border-[var(--border)]
                       text-[var(--text-primary)] placeholder:text-[var(--text-muted)]
                       focus:outline-none focus:ring-1 focus:ring-primary-500/30"
          />
        </div>

        {showFilters && (
          <div className="mt-2 space-y-2 animate-slide-up">
            <select
              value={filterLang}
              onChange={e => setFilterLang(e.target.value)}
              className="w-full px-2 py-1.5 text-xs rounded-lg bg-[var(--bg-surface-2)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none"
            >
              {LANGUAGES.map(l => <option key={l} value={l}>{l === 'All' ? 'All Languages' : l}</option>)}
            </select>
            <div className="flex gap-1.5">
              <input
                type="number" placeholder="Min" value={filterScore.min}
                onChange={e => setFilterScore(p => ({ ...p, min: e.target.value }))}
                className="w-1/2 px-2 py-1.5 text-xs rounded-lg bg-[var(--bg-surface-2)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none"
              />
              <input
                type="number" placeholder="Max" value={filterScore.max}
                onChange={e => setFilterScore(p => ({ ...p, max: e.target.value }))}
                className="w-1/2 px-2 py-1.5 text-xs rounded-lg bg-[var(--bg-surface-2)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {showBulk && (
        <div className="flex items-center justify-between px-3 py-2 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800/30">
          <span className="text-xs text-accent-rose font-medium">{selected.size} selected</span>
          <button onClick={handleBulkDelete} className="text-xs text-accent-rose hover:underline font-medium">
            Delete All
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-3 space-y-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="skeleton h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-[var(--bg-surface-2)] flex items-center justify-center mb-4 relative">
                <Code2 size={32} className="text-[var(--text-muted)]" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary-500 rounded-full border-2 border-[var(--bg-surface-2)]" />
              </div>
              <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">No reviews yet</p>
              <p className="text-xs text-[var(--text-muted)] max-w-[160px] mx-auto mb-6">
                Your reviews will appear here after your first analysis
              </p>
              <div className="flex flex-col items-center gap-2 text-primary-500 animate-bounce mt-6">
                <span className="text-[10px] font-bold uppercase tracking-widest">Start Here</span>
                <X size={16} className="rotate-45" />
              </div>
            </div>
        ) : (
          <div className="p-2 space-y-1">
            {history.filter(review => {
              if (search) {
                const term = search.toLowerCase();
                const labelMatch = (review.label || '').toLowerCase().includes(term);
                const langMatch = (review.language || '').toLowerCase().includes(term);
                return labelMatch || langMatch;
              }
              return true;
            }).map(review => (
              <div
                key={review.id}
                onClick={() => onSelectReview(review)}
                className={`relative p-2.5 rounded-lg cursor-pointer group transition-all duration-200 card-hover
                  ${selectedId === review.id
                    ? 'bg-[var(--bg-surface-2)] border border-orange-500/50'
                    : 'hover:bg-[var(--bg-surface-2)] border border-transparent'
                  }`}
              >
                <div className="flex items-start justify-between gap-1 mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <input
                      type="checkbox"
                      checked={selected.has(review.id)}
                      onChange={() => {}}
                      onClick={e => toggleSelect(e, review.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity w-3 h-3 rounded accent-primary-500 flex-shrink-0"
                    />
                    {editingId === review.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          value={editLabel}
                          onChange={e => setEditLabel(e.target.value)}
                          onClick={e => e.stopPropagation()}
                          autoFocus
                          className="text-xs px-1.5 py-0.5 rounded border border-primary-600 bg-[var(--bg-surface-2)] text-[var(--text-primary)] w-24 focus:outline-none"
                        />
                        <button onClick={e => { e.stopPropagation(); handleRename(review.id); }} className="text-accent-emerald"><Check size={12} /></button>
                        <button onClick={e => { e.stopPropagation(); setEditingId(null); }} className="text-accent-rose"><X size={12} /></button>
                      </div>
                    ) : (
                      <span className="text-xs font-medium text-[var(--text-primary)] truncate">
                        {review.label || `${review.language} review`}
                      </span>
                    )}
                  </div>
                  <ScoreChip score={review.score} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <LanguageTag language={review.language} />
                    <span className="text-[10px] text-[var(--text-muted)]">{formatDate(review.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={e => handleFavourite(e, review)}
                      className={`p-1 rounded transition-colors ${review.favourite ? 'text-amber-500' : 'text-[var(--text-muted)] hover:text-amber-500'}`}
                    >
                      {review.favourite ? <Star size={11} fill="currentColor" /> : <Star size={11} />}
                    </button>
                    <button
                      onClick={e => handleDelete(e, review.id)}
                      className="p-1 rounded text-[var(--text-muted)] hover:text-accent-rose transition-colors"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
