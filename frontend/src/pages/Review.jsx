import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import CodeEditor from '../components/CodeEditor';
import ReviewPanel from '../components/ReviewPanel';
import HistorySidebar from '../components/HistorySidebar';
import LanguageSelector from '../components/LanguageSelector';
import DiffViewer from '../components/DiffViewer';
import ExportButton from '../components/ExportButton';
import ExampleCodeButton from '../components/ExampleCodeButton';
import { reviewAPI, streamReview } from '../services/api';
import { Play, PanelLeftClose, PanelLeft, GitBranch, X, HelpCircle, Lock } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

const DEFAULT_CODE = `// Paste your code here or drop a file
// Supports: Java, Python, JavaScript, TypeScript, C++, Go, Rust, SQL, PHP, Ruby

function calculateDiscount(price, userType) {
  var discount = 0;
  if (userType == "admin") {
    discount = 0.5;
  } else if (userType == "member") {
    discount = 0.2;
  }
  return price - (price * discount);
}

// Example with some intentional issues for demo:
function fetchUser(userId) {
  var query = "SELECT * FROM users WHERE id = " + userId; // SQL injection risk
  var password = "admin123"; // hardcoded secret
  console.log("Fetching user: " + userId);
}
`;

const detectLanguage = (code) => {
  const patterns = {
    java: [
      /import\s+java\./, /public\s+class\s+\w+/, /public\s+static\s+void\s+main/,
      /System\.out\.print/, /\.equals\(/, /new\s+\w+\(/, /private\s+\w+\s+\w+/,
      /protected\s+\w+\s+\w+/, /throws\s+\w+Exception/, /instanceof\s+\w+/,
    ],
    python: [
      /def\s+\w+\s*\(/, /import\s+\w+/, /if\s+__name__\s*==/, /print\s*\(/,
      /:\s*$/, /elif\s+/, /lambda\s+\w+/, /#.*$/m, /self\.\w+/, /:\s*\n/m,
    ],
    typescript: [
      /:\s*(string|number|boolean|any|void|never|unknown|object)\b/,
      /interface\s+\w+\s*\{/, /type\s+\w+\s*=/, /as\s+\w+/, /<\w+>/, /readonly\s+\w+/,
    ],
    javascript: [
      /function\s+\w+\s*\(/, /const\s+\w+\s*=/, /let\s+\w+\s*=/, /=>\s*[{(]/,
      /console\.(log|error|warn)\(/, /import\s+.*\s+from\s+['"]/, /require\s*\(/,
      /document\./, /window\./, /\.then\(/, /async\s+function/,
    ],
    cpp: [
      /#include\s*</, /std::/, /cout\s*<</, /cin\s*>>/, /int\s+main\s*\(/,
      /namespace\s+\w+/, /template\s*</, /nullptr/, /::\w+/,
    ],
    go: [
      /^package\s+\w+/m, /func\s+\w+\s*\(/, /fmt\.Print/, /:=\s*/, /var\s+\w+\s+\w+/,
      /import\s+\(/, /go\s+func/, /make\s*\(/, /defer\s+/,
    ],
    rust: [
      /fn\s+main\s*\(/, /let\s+mut\s+/, /println!\(/, /use\s+std::/, /impl\s+\w+/,
      /enum\s+\w+\s*\{/, /match\s+\w+/, /->\s*Result/, /unwrap\(\)/,
    ],
    php: [
      /^<\?php/m, /\$\w+\s*=/, /echo\s+/, /function\s+\w+/, /->\w+/, /::\w+\s*\(/,
    ],
    sql: [
      /\bSELECT\b[\s\S]*?\bFROM\b/i, /\bINSERT\s+INTO\b/i, /\bUPDATE\b[\s\S]*?\bSET\b/i,
      /\bCREATE\s+(TABLE|PROCEDURE|DATABASE|VIEW|INDEX|FUNCTION)\b/i, /\bDROP\s+(TABLE|PROCEDURE|DATABASE|VIEW|INDEX)\b/i, 
      /\bWHERE\b/i, /\bDECLARE\s+@/i, /\bEXECUTE\s+/i, /\bSET\s+@/i, /--.*$/m, /\bBEGIN\b[\s\S]*?\bEND\b/i
    ],
    ruby: [
      /def\s+\w+/, /class\s+\w+/, /rescue\s+(=>\s*\w+)?/, /puts\s+/,
      /\.\bnew\b/, /\bend\b/, /require\s+['"]/, /attr_(accessor|reader|writer)/,
      /module\s+\w+/, /#.*$/m, /\bdo\b/, /\s@\w+/, /\s:\w+/, /#\{.*\}/
    ],
  };

  let bestLang = null;
  let bestScore = 0;

  for (const [lang, regexList] of Object.entries(patterns)) {
    const score = regexList.filter(r => r.test(code)).length;
    if (score > bestScore) {
      bestScore = score;
      bestLang = lang;
    }
  }

  return bestScore >= 1 ? bestLang : null;
};
export default function Review() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [code, setCode] = useState(DEFAULT_CODE);
  const [language, setLanguage] = useState('javascript');
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [streamStatus, setStreamStatus] = useState('');
  const [showSidebar, setShowSidebar] = useState(() => {
    if (!user) return false;
    return typeof window !== 'undefined' ? window.innerWidth >= 1024 : true;
  });
  const [showDiff, setShowDiff] = useState(false);
  const [selectedHistoryId, setSelectedHistoryId] = useState(null);
  const [refreshHistory, setRefreshHistory] = useState(0);
  const [activeTab, setActiveTab] = useState('editor'); // 'editor' | 'results' | 'history'

  // Guest Mode states
  const [guestCount, setGuestCount] = useState(() => {
    return parseInt(sessionStorage.getItem('guestReviews') || '0');
  });
  const [showWelcome, setShowWelcome] = useState(false);

  // Remaining Reviews Counter & Language Mismatch Dismiss state
  const [remainingReviews, setRemainingReviews] = useState(undefined);
  const [dismissMismatch, setDismissMismatch] = useState(false);

  const fetchRemaining = async () => {
    try {
      const res = await reviewAPI.getRemaining();
      setRemainingReviews(res.data.remaining);
      window.dispatchEvent(new CustomEvent('remaining-reviews-updated', { detail: res.data.remaining }));
    } catch {}
  };

  useEffect(() => {
    document.title = "Review · CodeReviewer";
    if (user) {
      fetchRemaining();
    }

    // Guest first visit check
    if (!user) {
      const hasVisited = sessionStorage.getItem('hasVisitedReview');
      if (!hasVisited) {
        setShowWelcome(true);
        sessionStorage.setItem('hasVisitedReview', 'true');
        const timer = setTimeout(() => setShowWelcome(false), 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [user]);

  useEffect(() => {
    setDismissMismatch(false);
  }, [code]);

  const handleReview = async () => {
    if (user && remainingReviews === 0) {
      toast.error('You have 0 reviews remaining. Please upgrade to continue.');
      return;
    }

    const cleanedCode = code
      .split('\n')
      .filter(line => !line.startsWith('// Paste your code here') && !line.startsWith('// Supports:'))
      .join('\n')
      .trim();

    if (!cleanedCode) {
      toast.error('Please enter some code to review');
      return;
    }

    handleStreamReview(cleanedCode);
  };

  const incrementGuestCount = () => {
    if (!user) {
      const newCount = guestCount + 1;
      setGuestCount(newCount);
      sessionStorage.setItem('guestReviews', newCount.toString());
    }
  };

  const handleStreamReview = (codeToReview) => {
    setStreaming(true);
    setReview(null);
    setStreamStatus('Connecting to AI...');

    streamReview(
      { code: codeToReview, language },
      {
        onStatus: (data) => setStreamStatus(data.message || 'Analyzing...'),
        onChunk: () => setStreamStatus('AI is writing the review...'),
        onResult: (data) => {
          setReview(data);
          setStreamStatus('');
          setStreaming(false);

          if (data.languageMismatch && data.detectedLanguage) {
            toast.error(`Language mismatch! Detected ${data.detectedLanguage} but ${language} was selected.`, {
              duration: 5000,
              icon: '⚠️'
            });
            setLanguage(data.detectedLanguage.toLowerCase());
          } else {
            toast.success('Review complete!');
          }
          
          if (user) {
            console.log('[Review] Triggering history refresh (Stream)');
            setRefreshHistory(prev => prev + 1);
            fetchRemaining();
          } else {
            incrementGuestCount();
          }
          setActiveTab('results');
        },
        onError: (err) => {
          setStreaming(false);
          setStreamStatus('');
          toast.error(err || 'Stream failed');
        },
        onComplete: () => {
          setStreaming(false);
          setStreamStatus('');
          fetchRemaining();
        },
      }
    );
  };

  const handleHistorySelect = useCallback(async (historyItem) => {
    setSelectedHistoryId(historyItem.id);
    if (typeof window !== 'undefined') {
      if (window.innerWidth < 1024) setShowSidebar(false);
    }
    setActiveTab('editor');
    try {
      const res = await reviewAPI.getById(historyItem.id);
      setReview(res.data);
      setCode(res.data.code || '');
      setLanguage(res.data.language || 'javascript');
      setShowDiff(false);
      setTimeout(() => window.__codeEditorApplyDecorations?.(), 200);
    } catch {
      toast.error('Failed to load review');
    }
  }, []);

  const handleNewReview = useCallback(() => {
    setSelectedHistoryId(null);
    setReview(null);
    setCode(DEFAULT_CODE);
    setLanguage('javascript');
    setShowDiff(false);
    setActiveTab('editor');
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setShowSidebar(false);
    }
  }, []);

  const handleAcceptAll = useCallback(() => {
    if (review?.refactoredCode) {
      setCode(review.refactoredCode);
      setShowDiff(false);
      toast.success('Refactored code applied to editor');
    }
  }, [review]);

  const handleRejectAll = useCallback(() => {
    setShowDiff(false);
  }, []);

  const handleLoadExample = useCallback((exampleCode, exampleLang) => {
    setCode(exampleCode);
    setLanguage(exampleLang);
    setReview(null);
    setShowDiff(false);
    toast.success(`Loaded ${exampleLang} example`);
  }, []);

  const isLoading = loading || streaming;

  const { state } = useLocation();
  const fromAuth = state?.fromAuth;

  return (
    <div className={`flex h-[calc(100vh-4rem)] ${fromAuth ? '' : 'animate-zoom-in'} bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-hidden relative transition-colors duration-300`}>
      <div className="fixed inset-0 bg-gradient-premium opacity-50 pointer-events-none" />

      {/* History sidebar - Desktop relative, Tablet absolute overlay, Mobile hidden (uses tab) */}
      {user && (
        <div 
          className={`hidden sm:block fixed md:absolute lg:relative z-50 lg:z-10 h-full border-r border-[var(--border)] bg-[var(--bg-primary)] lg:bg-transparent backdrop-blur-xl transition-all duration-300 ease-in-out overflow-hidden shadow-2xl lg:shadow-none
            ${showSidebar ? 'w-60 opacity-100' : 'w-0 opacity-0'}`}
        >
          <div className="w-60 h-full">
            <HistorySidebar
              onSelectReview={handleHistorySelect}
              selectedId={selectedHistoryId}
              refreshTrigger={refreshHistory}
              onNewReview={handleNewReview}
            />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col min-w-0 h-full">
        {/* Mobile Tabs */}
        <div className="flex sm:hidden border-b border-[var(--border)] bg-[var(--bg-surface)] p-1 gap-1 flex-shrink-0">
          {[
            { id: 'editor', label: 'Editor' },
            { id: 'results', label: 'Results' },
            ...(user ? [{ id: 'history', label: 'History' }] : []),
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === tab.id
                  ? 'bg-orange-500 text-white shadow-glow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 px-4 py-3 sm:py-2.5 border-b border-[var(--border)] bg-[var(--bg-primary)] backdrop-blur-md flex-shrink-0 relative z-[100] overflow-visible justify-between sm:justify-start">
          {/* Row 1 on mobile / Left group on desktop */}
          <div className="animate-slide-in-left flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto overflow-visible">
            {user && (
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="hidden sm:flex p-2 rounded-lg hover:bg-white/10 transition-colors text-dark-400 hover:text-white"
                title={showSidebar ? 'Hide history' : 'Show history'}
              >
                {showSidebar ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
              </button>
            )}
            <div className="flex items-center gap-2 flex-1 sm:flex-initial overflow-visible">
              <LanguageSelector value={language} onChange={setLanguage} />
              <ExampleCodeButton onSelect={handleLoadExample} />
            </div>
          </div>

          <div className="hidden sm:block flex-1" />

          {/* Row 2 on mobile / Right group on desktop */}
          <div className="flex items-center gap-2 flex-nowrap w-full sm:w-auto justify-end overflow-visible">
            {review?.refactoredCode && (
              <button
                onClick={() => setShowDiff(!showDiff)}
                disabled={isLoading}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  showDiff 
                    ? 'bg-primary-500/10 text-primary-500 border border-primary-500/20' 
                    : 'bg-[var(--bg-surface-2)] text-[var(--text-secondary)] border border-[var(--border)] hover:bg-[var(--bg-surface-3)]'
                } ${isLoading ? 'opacity-40 pointer-events-none' : ''}`}
              >
                <GitBranch size={16} />
                <span className="hidden sm:inline ml-1.5">{showDiff ? 'Hide Diff' : 'Diff View'}</span>
              </button>
            )}

            <div className={isLoading ? 'opacity-40 pointer-events-none' : ''}>
              <ExportButton 
                reviewId={review?.id} 
                code={review?.refactoredCode} 
                disabled={!user || !review?.id}
                tooltip={
                  !user 
                    ? "Sign in to export reviews" 
                    : !review?.id 
                      ? "Run a review to export" 
                      : undefined
                }
              />
            </div>

            {/* Review button — takes remaining space on mobile */}
            <button
              onClick={handleReview}
              disabled={isLoading || (user && remainingReviews === 0)}
              title={user && remainingReviews === 0 ? 'Upgrade to continue' : undefined}
              className={`flex items-center gap-2 flex-1 sm:flex-initial min-w-0 sm:min-w-[140px] justify-center px-4 py-3 sm:py-2 rounded-xl font-bold text-white text-[13px] min-h-[44px] sm:min-h-0
                bg-gradient-to-r from-primary-600 via-primary-500 to-accent-violet
                hover:shadow-glow-primary transition-all duration-300 relative group
                ${user && remainingReviews === 0 ? '!bg-none bg-red-950/20 text-red-500 border border-red-500/30 hover:scale-100' : ''}
                ${isLoading ? 'animate-pulse-glow opacity-90' : 'hover:scale-105 active:scale-95'}
              `}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {streaming ? 'Streaming...' : 'Analysing...'}
                </>
               ) : user && remainingReviews === 0 ? (
                <>
                  <HelpCircle size={14} />
                  Locked (0 Left)
                </>
              ) : (
                <>
                  <Play size={16} fill="currentColor" />
                  Review Code
                </>
              )}

              {user && remainingReviews === 0 && (
                <div className="absolute bottom-full mb-2 hidden group-hover:block bg-[var(--bg-surface)] border border-red-500/30 text-red-500 text-[10px] font-bold py-1 px-2 rounded-lg shadow-2xl whitespace-nowrap animate-slide-up z-50">
                  Upgrade to continue
                </div>
              )}
            </button>
          </div>
        </div>

        {isLoading && (
          <div className="h-1 w-full bg-[var(--bg-surface-2)] overflow-hidden">
            <div className="h-full bg-primary-500 animate-progress-indefinite shadow-glow-primary" />
          </div>
        )}

        {/* Guest Welcome Banner */}
        {showWelcome && (
          <div className="bg-[var(--bg-surface-2)] border-l-4 border-orange-500 p-3 text-sm text-[var(--text-secondary)] flex justify-between items-center animate-slide-down">
            <span>
              👋 Try it free — no account needed. 
              <Link to="/register" className="text-orange-500 ml-1 font-bold">Sign in</Link> to save history and export reports.
            </span>
            <button onClick={() => setShowWelcome(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] ml-4">✕</button>
          </div>
        )}

        {/* Guest Review Limit Prompt Banner */}
        {!user && guestCount >= 3 && (
          <div className="animate-slide-in-left mx-4 mt-3 bg-[var(--bg-surface-2)] border border-orange-500 rounded-lg p-3 flex items-center justify-between animate-slide-down">
            <span className="text-sm text-[var(--text-secondary)]">
              You've used <span className="font-bold text-[var(--text-primary)]">{guestCount}</span> free reviews. 
              <Link to="/login" className="text-orange-500 ml-1 font-bold">Sign in for unlimited reviews</Link> and to save your history.
            </span>
            <button 
              onClick={() => navigate('/login')} 
              className="bg-orange-500 text-white px-3 py-1 rounded text-sm ml-4 whitespace-nowrap font-bold hover:bg-orange-600 transition-colors"
            >
              Sign In
            </button>
          </div>
        )}

        {/* Language Mismatch Warning Banner */}
        {!dismissMismatch && (() => {
          const detected = detectLanguage(code);
          if (detected && detected !== language) {
            return (
              <div className="mx-4 mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-slide-down">
                <div className="flex items-center gap-3 text-amber-400 text-xs sm:text-sm">
                  <span className="text-xl">⚠️</span>
                  <p>
                    Detected <span className="font-bold uppercase">{detected}</span> code but <span className="font-bold uppercase">{language}</span> is selected.
                    Switch to {detected}?
                  </p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button 
                    onClick={() => {
                      setLanguage(detected);
                      setDismissMismatch(true);
                    }}
                    className="w-full sm:w-auto px-6 py-2 sm:py-1.5 rounded-lg bg-amber-500 text-dark-900 text-xs font-bold hover:bg-amber-400 transition-colors text-center"
                  >
                    YES
                  </button>
                  <button 
                    onClick={() => setDismissMismatch(true)}
                    className="p-2 sm:p-1.5 rounded-lg hover:bg-white/5 text-dark-400 hover:text-white transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            );
          }
          return null;
        })()}

        {streaming && streamStatus && (
          <div className="px-4 py-2 bg-primary-500/10 border-b border-primary-500/20 animate-fade-in">
            <div className="flex items-center gap-2 text-sm text-primary-400">
              <div className="w-2 h-2 rounded-full bg-primary-500 animate-ping" />
              {streamStatus}
            </div>
          </div>
        )}

        {/* Editor / Diff / Panel area - Responsive layout */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          {/* Left: Editor area */}
          <div className={`w-full md:w-[60%] lg:flex-1 flex flex-col min-w-0 h-full relative z-[1] ${
            activeTab === 'editor' ? 'flex' : 'hidden sm:flex'
          }`}>
            {!showDiff ? (
              <div className="flex-1 p-3 flex flex-col min-h-0 overflow-hidden">
                <CodeEditor
                  code={code}
                  onCodeChange={setCode}
                  language={language}
                  onLanguageChange={setLanguage}
                  bugs={review?.bugs || []}
                  securityIssues={review?.security || []}
                />
              </div>
            ) : review?.refactoredCode && (
              <div className="flex-1 p-3 animate-fade-in flex flex-col min-h-0 overflow-hidden">
                <DiffViewer
                  original={code}
                  modified={review.refactoredCode}
                  language={language}
                  onAcceptAll={handleAcceptAll}
                  onRejectAll={handleRejectAll}
                />
              </div>
            )}
          </div>

          {/* Right: Review results panel */}
          <div className={`w-full md:w-[40%] lg:w-[420px] h-full flex-shrink-0 border-t md:border-t-0 md:border-l border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden ${
            activeTab === 'results' ? 'flex' : 'hidden sm:flex'
          }`}>
            <ReviewPanel
              review={review}
              loading={isLoading}
              onLineClick={(line) => window.__codeEditorScrollToLine?.(line)}
            />
          </div>

          {/* Mobile History tab panel */}
          {user && (
            <div className={`w-full h-full overflow-hidden sm:hidden ${
              activeTab === 'history' ? 'block' : 'hidden'
            }`}>
              <HistorySidebar
                onSelectReview={handleHistorySelect}
                selectedId={selectedHistoryId}
                refreshTrigger={refreshHistory}
                onNewReview={handleNewReview}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
