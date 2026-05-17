import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { analyticsAPI } from '../services/api';
import {
  Code2, Zap, Shield, BarChart3, ArrowRight, CheckCircle2,
  Star, GitBranch, Lock
} from 'lucide-react';

const FEATURES = [
  {
    icon: Zap,
    title: 'Instant AI Review',
    desc: 'Paste your code, hit Review, get a detailed report with bugs, security issues, and a quality score in under 20 seconds.',
    color: 'from-orange-500/20 to-orange-600/5',
  },
  {
    icon: Shield,
    title: 'Security Analysis',
    desc: 'Detects OWASP Top 10 vulnerabilities: SQL injection, XSS, hardcoded secrets, and more.',
    color: 'from-orange-500/20 to-orange-600/5',
  },
  {
    icon: GitBranch,
    title: 'Refactor Suggestions',
    desc: 'AI-generated refactored code following DRY, SOLID, and clean code principles with inline diff view.',
    color: 'from-orange-500/20 to-orange-600/5',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    desc: 'Track your score trends, bug distribution, language breakdown, and contribution heatmap over time.',
    color: 'from-orange-500/20 to-orange-600/5',
  },
  {
    icon: Lock,
    title: 'Secure & Private',
    desc: 'JWT authentication, role-based access, and shareable read-only review links. Your code stays on your server.',
    color: 'from-orange-500/20 to-orange-600/5',
  },
  {
    icon: Code2,
    title: '10+ Languages',
    desc: 'Java, Python, JavaScript, TypeScript, Go, Rust, C++, SQL, PHP, Ruby — with full Monaco editor support.',
    color: 'from-orange-500/20 to-orange-600/5',
  },
];

function AnimatedCounter({ value, duration = 2000, suffix = '' }) {
  const [count, setCount] = useState(0);
  const [ref, setRef] = useState(null);

  useEffect(() => {
    if (!ref) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let start = 0;
          const end = parseInt(value);
          if (start === end) return;

          let totalMiliseconds = duration;
          let incrementTime = (totalMiliseconds / end);

          let timer = setInterval(() => {
            start += 1;
            setCount(start);
            if (start === end) clearInterval(timer);
          }, incrementTime);
          
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(ref);
    return () => observer.disconnect();
  }, [ref, value, duration]);

  return <span ref={setRef}>{count}{suffix}</span>;
}

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [totalReviews, setTotalReviews] = useState(0);

  useEffect(() => {
    document.title = "CodeReviewer";
    if (isAuthenticated) {
      analyticsAPI.getSummary()
        .then(res => {
          if (res.data?.totalReviews) {
            setTotalReviews(res.data.totalReviews);
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated]);

  const STATS = [
    { value: 10, label: 'Languages', suffix: '+' },
    { value: 100, label: 'Quality Score', suffix: '' },
    { value: 10, label: 'Security Checks', suffix: '+' },
    { value: isAuthenticated && totalReviews ? totalReviews : 10, label: 'Reviews Done', suffix: isAuthenticated && totalReviews ? '' : '+' },
  ];

  const heroFeature = FEATURES[0];
  const remainingFeatures = FEATURES.slice(1);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-hidden selection:bg-primary-500/30 transition-colors duration-300 animate-zoom-in">
      {/* Hero Section */}
      <section className="relative pt-[72px] pb-24 px-6 overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 40% at 50% 0%, rgba(249, 115, 22, 0.07) 0%, transparent 60%)' }} />
        {/* Decorative elements */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[120px] animate-pulse-soft" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-orange-500/5 rounded-full blur-[100px] animate-pulse-soft" />

        <div className="text-center relative z-10 pt-16 sm:pt-24 px-6">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-[var(--bg-surface-2)] border border-[var(--border)] mb-10 animate-fade-in shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-xs sm:text-sm font-mono text-[var(--text-secondary)] tracking-tight">
              // We found your bug before production did.
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold leading-[1.1] mb-8 animate-slide-up relative z-10 text-[var(--text-primary)]">
            Ship Better Code <br />
            <span style={{ background: 'linear-gradient(135deg, #f97316, #fb923c, #fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>With Confidence</span>
          </h1>

          <p className="text-xl text-[var(--text-secondary)] max-w-3xl mx-auto mb-12 leading-relaxed animate-slide-up delay-100 font-light">
            Paste code. Get bugs, security issues, and a quality score in under 20 seconds. Supports Java, Python, JavaScript, TypeScript, Go, C++, and more.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-slide-up delay-200">
            <Link to="/review" className="btn-primary group px-10 py-4 text-lg flex items-center gap-3 justify-center w-full sm:w-auto min-h-[44px]">
              <span className="hidden sm:inline" style={{ whiteSpace: 'nowrap' }}>{isAuthenticated ? 'Open Workspace' : 'Get Started Free'}</span>
              <span className="sm:hidden" style={{ whiteSpace: 'nowrap' }}>{isAuthenticated ? 'Open Workspace' : 'Get Started'}</span>
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            {!isAuthenticated && (
              <Link to="/login" className="btn-secondary px-10 py-4 text-lg backdrop-blur-md text-center w-full sm:w-auto min-h-[44px] whitespace-nowrap flex items-center justify-center">
                Sign In
              </Link>
            )}
          </div>

          {!isAuthenticated && (
            <p className="text-xs text-[var(--text-muted)] mt-6 animate-fade-in delay-300">
              No account needed · Sign in to save history
            </p>
          )}
          
          <div className="mt-12 flex items-center justify-center gap-4 animate-fade-in delay-300 relative z-10">
             <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#6b7280' }}>
               // spring-boot · react · ai-reviewer · docker · mysql · redis
             </div>
          </div>
        </div>
      </section>

      {/* Stats Bar — 2x2 grid on mobile, horizontal on desktop */}
      <section className="relative z-10 py-10 border-y border-white/5 bg-white/[0.01] backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 lg:gap-0 lg:divide-x divide-[#2a2a2a]">
            {STATS.map(({ value, label, suffix }) => (
              <div key={label} className="p-4 lg:p-0 text-center border border-[var(--border)] lg:border-0 rounded-xl lg:rounded-none bg-[var(--bg-surface)] lg:bg-transparent">
                <p className="text-3xl md:text-4xl font-black text-orange-500 mb-1 tracking-tight">
                  <AnimatedCounter value={value} suffix={suffix} />
                </p>
                <p 
                  className="font-bold uppercase tracking-widest" 
                  style={{
                    fontSize: '11px',
                    color: '#9ca3af'
                  }}
                >
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl font-bold mb-6 text-[var(--text-primary)]">Built for Developers, by Developers</h2>
            <p className="text-[var(--text-secondary)] max-w-2xl mx-auto text-lg font-light">
              Get actionable feedback on bugs, security flaws, and code quality in seconds.
            </p>
          </div>

          {/* Features Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Hero Card Span Full */}
            <div className="md:col-span-2">
              <div className="group glass-card relative overflow-hidden flex flex-col md:flex-row items-stretch card-hover">
                <div className="flex-1 p-8 md:p-10 flex flex-col justify-center">
                  <div className={`absolute top-0 right-0 w-48 h-48 bg-gradient-to-br ${heroFeature.color} opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-2xl`} />
                  <div className={`w-14 h-14 rounded-2xl bg-[var(--bg-surface-3)] flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-orange-500/20 transition-all duration-500`}>
                    <heroFeature.icon size={28} className="text-orange-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-3">{heroFeature.title}</h3>
                  <p className="text-[var(--text-secondary)] leading-relaxed font-light text-lg">{heroFeature.desc}</p>
                </div>
                <div className="hidden md:flex md:w-[380px] flex-shrink-0 bg-[var(--bg-surface-2)] border-l border-[var(--border)] p-5 flex-col justify-center">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full bg-red-500/60" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/60" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
                    <span className="text-[10px] text-[var(--text-muted)] font-mono ml-2">app.js</span>
                  </div>
                  <pre className="text-xs font-mono leading-[1.8] text-[var(--text-secondary)] overflow-hidden">
                    <code>
{`  1 │ function getUser(id) {`}
{`\n  2 │   const query = "SELECT * FROM`}
{`\n`}<span className="block bg-red-500/15 text-red-400 -mx-5 px-5 border-l-2 border-red-500">{`  3 │     users WHERE id=" + id;`}</span>
{`  4 │   const pwd = "admin123";`}
{`\n  5 │   return db.execute(query);`}
{`\n  6 │ }`}
                    </code>
                  </pre>
                </div>
              </div>
            </div>

            {/* 2x2 Grid for middle 4 features */}
            {remainingFeatures.slice(0, 4).map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="group glass-card relative overflow-hidden card-hover">
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-2xl`} />
                <div className={`w-14 h-14 rounded-2xl bg-[var(--bg-surface-3)] flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-orange-500/20 transition-all duration-500`}>
                  <Icon size={28} className="text-orange-500" />
                </div>
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-3">{title}</h3>
                <p className="text-[var(--text-secondary)] leading-relaxed font-light">{desc}</p>
              </div>
            ))}

            {(() => {
              const LastIcon = remainingFeatures[4].icon;
              return (
                <div className="md:col-span-2">
                  <div className="group glass-card relative overflow-hidden flex items-center gap-8 p-8 card-hover">
                    <div className={`w-16 h-16 rounded-2xl bg-[var(--bg-surface-3)] flex items-center justify-center group-hover:scale-110 group-hover:bg-orange-500/20 transition-all duration-500 flex-shrink-0`}>
                      <LastIcon size={32} className="text-orange-500" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">{remainingFeatures[4].title}</h3>
                      <p className="text-[var(--text-secondary)] leading-relaxed font-light">{remainingFeatures[4].desc}</p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="pt-12 pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="glass-card p-12 text-center relative overflow-hidden group border-orange-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/[0.03] via-transparent to-orange-500/[0.08]" />
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-orange-500/10 blur-[100px] rounded-full group-hover:bg-orange-500/20 transition-all duration-700" />
            
            <h2 className="text-4xl font-bold text-[var(--text-primary)] mb-6 relative z-10">Start Reviewing Code</h2>
            <p className="text-[var(--text-secondary)] mb-10 max-w-lg mx-auto relative z-10 font-light">
              Empower your team with automated code quality insights.
            </p>
            <div className="flex justify-center relative z-10">
              <Link 
                to="/review" 
                className="px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-bold shadow-glow-primary transition-all hover:scale-105 active:scale-95"
              >
                Start Reviewing Now
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
