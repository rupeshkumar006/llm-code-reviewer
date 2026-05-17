import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Code2, Sun, Moon, Monitor, LogOut, User, ChevronDown,
  BarChart3, Shield, Menu, X, Clock
} from 'lucide-react';

const themes = [
  { key: 'dark', icon: Moon, label: 'Dark' },
  { key: 'light', icon: Sun, label: 'Light' },
  { key: 'system', icon: Monitor, label: 'System' },
];

export default function Navbar({ remainingReviews }) {
  const { user, logout, isAuthenticated, isPro } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const fromSignout = location.state?.fromSignout;
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [scrolled, setScrolled] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // Track scroll position for navbar border glow
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);

    if (newTheme === 'dark' || (newTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleLogout = () => {
    setIsExiting(true);
    document.getElementById('app-content')?.classList.add('animate-slide-out-left');
    setTimeout(() => {
      logout();
      navigate('/login', { state: { fromSignout: true } });
    }, 600);
  };

  return (
    <nav 
      className="sticky top-0 z-[100] w-full h-16 px-6 transition-all duration-300"
      style={{
        background: 'var(--bg-primary)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        boxShadow: scrolled ? '0 4px 20px rgba(0, 0, 0, 0.05)' : 'none'
      }}
    >
      <div className="max-w-screen-2xl mx-auto h-full flex items-center justify-between">
        {/* Logo */}
        <Link to="/" onClick={() => setShowMobileMenu(false)} className="flex items-center gap-3 group">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center shadow-glow-sm group-hover:shadow-glow-primary transition-all duration-500 group-hover:scale-110">
              <Code2 size={22} className="text-white" />
            </div>
            <div className="absolute -inset-1 rounded-xl bg-orange-500/20 blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <span className="hidden sm:inline text-2xl font-black tracking-tight text-[var(--text-primary)] group-hover:text-orange-500 transition-colors">
            CodeReviewer<span className="text-orange-500">.</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link to="/review" className="text-sm font-bold text-[var(--text-secondary)] hover:text-orange-500 transition-colors flex items-center gap-2">
            <Code2 size={18} /> Review
          </Link>
          <Link to="/dashboard" className="text-sm font-bold text-[var(--text-secondary)] hover:text-orange-500 transition-colors flex items-center gap-2">
            <BarChart3 size={18} /> Analytics
          </Link>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 sm:gap-4 h-full">
          {/* Review Counter */}
          {isAuthenticated && remainingReviews !== undefined && (
            <div 
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-2)] text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]"
              title={`You have ${remainingReviews === -1 ? 'unlimited' : remainingReviews} AI reviews remaining`}
            >
              <Clock size={14} className={remainingReviews === 0 ? 'text-red-500' : 'text-orange-500'} />
              <span>
                {remainingReviews === -1 ? (
                  <span className="text-green-500">Unlimited</span>
                ) : (
                  <><span className={remainingReviews === 0 ? 'text-red-400' : 'text-orange-500'}>{remainingReviews}</span> Left</>
                )}
              </span>
            </div>
          )}

          {/* Theme Toggle */}
          <button
            onClick={() => handleTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-xl bg-[var(--bg-surface-2)] hover:bg-[var(--bg-surface-3)] text-[var(--text-secondary)] hover:text-orange-500 transition-all border border-[var(--border)] active:scale-95 shrink-0"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <div className="h-6 w-px bg-[var(--border)] mx-1 hidden sm:block" />

          {/* User Section */}
          {isAuthenticated ? (
            <div className="relative flex items-center h-full">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1 rounded-full hover:bg-[var(--bg-surface-2)] transition-all group"
              >
                {user?.profilePicture ? (
                  <img src={user.profilePicture} alt="" className="w-8 h-8 rounded-full border border-[var(--border)] group-hover:border-orange-500/50 transition-colors" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-[10px] font-black shadow-glow-sm group-hover:scale-105 transition-transform">
                    {user?.displayName?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
                <ChevronDown size={14} className={`text-[var(--text-muted)] transition-transform duration-300 ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>

              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-[100]" onClick={() => setShowUserMenu(false)} />
                  <div className="absolute right-0 top-full mt-2 w-64 bg-[var(--bg-surface)] p-2 z-[110] animate-slide-up shadow-2xl border border-[var(--border)] rounded-2xl backdrop-blur-2xl">
                    <div className="px-4 py-3 border-b border-[var(--border)] mb-1">
                      <p className="font-bold text-[var(--text-primary)] truncate text-sm">{user?.displayName}</p>
                      <p className="text-xs text-[var(--text-muted)] truncate">{user?.email}</p>
                      {user?.createdAt && (
                        <p className="text-[10px] text-[var(--text-muted)] mt-1.5 flex items-center gap-1.5">
                          <Clock size={10} />
                          Member since {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold rounded-xl text-red-500 hover:bg-red-500/5 transition-colors group"
                    >
                      <LogOut size={16} className="group-hover:-translate-x-0.5 transition-transform" /> <span className="hover-underline-expand">Sign Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 h-full">
              <div 
                className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/5 border border-orange-500/10 text-[10px] font-bold uppercase tracking-widest text-orange-500/80 cursor-help"
                title="Guest Mode: Progress and review history will not be saved."
              >
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                Guest
              </div>
              <Link to="/login" className="px-3 py-2 text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] hover:text-orange-500 transition-colors shrink-0">
                <span className="hover-underline-expand">Sign In</span>
              </Link>
            </div>
          )}

          <button
            className="md:hidden p-2 rounded-xl bg-[var(--bg-surface-2)] hover:bg-[var(--bg-surface-3)] text-[var(--text-secondary)] border border-[var(--border)] active:scale-95 shrink-0"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            {showMobileMenu ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div className="absolute top-16 left-0 w-full bg-[var(--bg-primary)] border-b border-[var(--border)] p-4 flex flex-col gap-4 shadow-2xl z-[100] sm:hidden animate-slide-down">
          {/* User Info Card inside Mobile Menu */}
          <div className="flex flex-col gap-2.5 p-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface-2)]">
            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  {user?.profilePicture ? (
                    <img src={user.profilePicture} alt="" className="w-10 h-10 rounded-full border border-[var(--border)]" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-black shadow-glow-sm">
                      {user?.displayName?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-[var(--text-primary)] text-sm truncate">{user?.displayName}</p>
                    <p className="text-[11px] text-[var(--text-muted)] truncate">{user?.email}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-[var(--bg-surface-3)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)]">
                    <User size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-[var(--text-primary)] text-sm">Guest Mode</p>
                    <p className="text-[11px] text-[var(--text-muted)] font-light">Sign in to save progress</p>
                  </div>
                </>
              )}
            </div>
            
            <div className="h-px bg-[var(--border)] my-1" />
            
            <div 
              className="flex items-center justify-between text-xs font-medium text-[var(--text-secondary)] cursor-help"
              title={!isAuthenticated ? "Guest Mode: Progress and review history will not be saved." : undefined}
            >
              <span>Account Type</span>
              {isAuthenticated ? (
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  isPro 
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white' 
                    : 'bg-[var(--bg-surface-3)] border border-[var(--border)] text-[var(--text-primary)]'
                }`}>
                  {isPro ? 'PRO' : 'FREE'}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/10 border border-orange-500/20 text-orange-500">
                  GUEST
                </span>
              )}
            </div>

            {isAuthenticated && remainingReviews !== undefined && (
              <div className="flex items-center justify-between text-xs font-medium text-[var(--text-secondary)]">
                <span>AI Reviews</span>
                <span className="font-bold">
                  {remainingReviews === -1 ? (
                    <span className="text-green-500">Unlimited</span>
                  ) : (
                    <><span className="text-orange-500">{remainingReviews}</span> Left</>
                  )}
                </span>
              </div>
            )}
          </div>

          {isAuthenticated ? (
            <>
              <Link 
                to="/review" 
                onClick={() => setShowMobileMenu(false)}
                className="flex items-center gap-3 px-4 py-3.5 text-sm font-bold text-[var(--text-primary)] bg-[var(--bg-surface-2)] rounded-xl hover:bg-[var(--bg-surface-3)]"
              >
                <Code2 size={18} className="text-orange-500" />
                Review Workspace
              </Link>
              <Link 
                to="/dashboard" 
                onClick={() => setShowMobileMenu(false)}
                className="flex items-center gap-3 px-4 py-3.5 text-sm font-bold text-[var(--text-primary)] bg-[var(--bg-surface-2)] rounded-xl hover:bg-[var(--bg-surface-3)]"
              >
                <BarChart3 size={18} className="text-orange-500" />
                Analytics Dashboard
              </Link>
            </>
          ) : (
            <div className="flex flex-col gap-3">
              <Link 
                to="/review" 
                onClick={() => setShowMobileMenu(false)}
                className="flex items-center gap-3 px-4 py-3.5 text-sm font-bold text-[var(--text-primary)] bg-[var(--bg-surface-2)] rounded-xl hover:bg-[var(--bg-surface-3)]"
              >
                <Code2 size={18} className="text-orange-500" />
                Review Workspace
              </Link>
              {!isAuthPage && (
                <Link 
                  to="/login" 
                  onClick={() => setShowMobileMenu(false)}
                  className="btn-secondary py-3.5 text-center rounded-xl font-bold text-sm"
                >
                  Sign In
                </Link>
              )}
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
