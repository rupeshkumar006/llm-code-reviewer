import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Code2, Mail, Lock, User, AlertCircle, CheckCircle2, Globe } from 'lucide-react';
import toast from 'react-hot-toast';

const RULES = [
  { label: 'At least 6 characters', test: (p) => p.length >= 6 },
  { label: 'Contains a number', test: (p) => /\d/.test(p) },
  { label: 'Contains a letter', test: (p) => /[a-zA-Z]/.test(p) },
];

export default function Register() {
  const { register, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', displayName: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isExiting, setIsExiting] = useState(false);
  const { state } = useLocation();
  const fromSignout = state?.fromSignout;
  const [googleInitialized, setGoogleInitialized] = useState(false);

  useEffect(() => {
    document.title = "Sign Up · CodeReviewer";
  }, []);

  const handleCredentialResponse = async (response) => {
    try {
      const base64Url = response.credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      const payload = JSON.parse(jsonPayload);
      
      setLoading(true);
      await googleLogin({
        email: payload.email,
        name: payload.name,
        picture: payload.picture
      });
      
      toast.success('Account created! Welcome.');
      setIsExiting(true);
      setTimeout(() => navigate('/review', { state: { fromAuth: true } }), 600);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Google Login failed');
    } finally {
      setLoading(false);
    }
  };

  const hasGoogleClientId = !!import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!hasGoogleClientId) return;

    const initGoogle = () => {
      if (typeof window.google !== 'undefined') {
        try {
          window.google.accounts.id.initialize({
            client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
            callback: handleCredentialResponse,
            use_fedcm_for_prompt: false,
          });
          setGoogleInitialized(true);

          setTimeout(() => {
            const btnElem = document.getElementById('googleBtn');
            if (btnElem && window.google) {
              window.google.accounts.id.renderButton(
                btnElem,
                { 
                  theme: 'filled_black',
                  size: 'large', 
                  text: 'signup_with',
                  shape: 'rectangular',
                  width: 368,
                }
              );
            }
          }, 150);
          return true;
        } catch (err) {
          console.error('Failed to initialize Google register:', err);
        }
      }
      return false;
    };

    // Try immediately
    if (initGoogle()) return;

    // Poll if not loaded yet
    const interval = setInterval(() => {
      if (initGoogle()) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [hasGoogleClientId]);

  const handleGoogleLoginClick = () => {
    if (typeof window.google !== 'undefined') {
      if (!googleInitialized && hasGoogleClientId) {
        try {
          window.google.accounts.id.initialize({
            client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
            callback: handleCredentialResponse,
            use_fedcm_for_prompt: false,
          });
          setGoogleInitialized(true);
        } catch (err) {
          toast.error('Google Sign In script failed to load.');
          return;
        }
      }
      window.google.accounts.id.prompt();
    } else {
      toast.error('Google Sign In is loading, please try again in a moment.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!RULES.every(r => r.test(form.password))) {
      setError('Password does not meet requirements');
      return;
    }
    setLoading(true);
    try {
      await register(form.email, form.password, form.displayName);
      toast.success('Account created! Welcome.');
      setIsExiting(true);
      setTimeout(() => navigate('/review', { state: { fromAuth: true } }), 600);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col md:flex-row transition-all duration-700 ${isExiting ? 'animate-slide-out-right' : (fromSignout ? '' : 'animate-slide-in-left')}`} style={{ background: 'var(--login-mobile-bg)' }}>
      {/* Left Side (Charcoal Panel) */}
      <div className="hidden md:flex md:w-[45%] lg:w-[40%] bg-[var(--login-left-bg)] p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-500/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4" />
        
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-3 group mb-20">
            <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center shadow-glow-sm">
              <Code2 size={22} className="text-white" />
            </div>
            <span className="text-2xl font-black tracking-tight text-white">
              CodeReviewer<span className="text-orange-500">.</span>
            </span>
          </Link>

          <div className="space-y-8">
            <h2 className="text-4xl lg:text-5xl font-black text-white leading-tight">
              Perfect your code <br />
              <span className="text-orange-500">with intelligence.</span>
            </h2>
            <p className="text-lg text-gray-400 font-light max-w-sm">
              Join thousands of developers building cleaner, safer, and more efficient software.
            </p>
          </div>
        </div>

        <div className="relative z-10">
          <div className="flex flex-col gap-6 mb-12">
            {[
              "AI-Powered Analysis",
              "Security Vulnerability Detection",
              "Best Practices Enforcement"
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-3 text-gray-300 font-medium">
                <CheckCircle2 size={14} className="text-orange-500" />
                {text}
              </div>
            ))}
          </div>
          
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 backdrop-blur-sm">
            <pre className="font-mono text-[10px] sm:text-xs leading-relaxed">
              <code className="text-white/90">
                <span className="text-orange-500 font-bold drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]">if</span> (<span className="text-white">bugs</span>.<span className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]">exist</span>()) {'{'}
                {'\n  '}<span className="text-white">we</span>.<span className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]">catch</span>(<span className="text-orange-300">them</span>).<span className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]">before</span>(<span className="text-orange-300">production</span>);
                {'\n}'}
              </code>
            </pre>
          </div>
        </div>
      </div>

      {/* Right side: Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12" style={{ background: 'var(--login-right-bg)' }}>
        <div className="max-w-[440px] w-full animate-slide-up">
          <div 
            className="rounded-2xl p-8 sm:p-10 shadow-xl border transition-all duration-300"
            style={{ 
              background: 'var(--login-form-bg)',
              borderColor: 'var(--login-input-border)'
            }}
          >
            <div className="text-center mb-10">
              <Link to="/" className="lg:hidden w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-glow-sm cursor-pointer hover:scale-105 active:scale-95 transition-all duration-300">
                <Code2 size={32} className="text-white" />
              </Link>
              <h2 className="text-3xl font-black mb-2" style={{ color: 'var(--login-heading)' }}>Create Account</h2>
              <p className="font-light" style={{ color: 'var(--login-subtext)' }}>Start your journey with us.</p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-4 mb-6 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm animate-fade-in">
                <AlertCircle size={16} className="flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest mb-2 ml-1" style={{ color: 'var(--login-label)' }}>Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--login-input-placeholder)' }} size={18} />
                  <input 
                    type="text" 
                    required
                    value={form.displayName}
                    onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
                    className="w-full rounded-xl pl-12 pr-4 py-3.5 outline-none focus:border-orange-500/50 transition-all"
                    style={{ 
                      background: 'var(--login-input-bg)', 
                      border: '1.5px solid var(--login-input-border)', 
                      color: 'var(--login-input-text)'
                    }}
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-widest mb-2 ml-1" style={{ color: 'var(--login-label)' }}>Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--login-input-placeholder)' }} size={18} />
                  <input 
                    type="email" 
                    required
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full rounded-xl pl-12 pr-4 py-3.5 outline-none focus:border-orange-500/50 transition-all"
                    style={{ 
                      background: 'var(--login-input-bg)', 
                      border: '1.5px solid var(--login-input-border)', 
                      color: 'var(--login-input-text)'
                    }}
                    placeholder="name@company.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-widest mb-2 ml-1" style={{ color: 'var(--login-label)' }}>Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--login-input-placeholder)' }} size={18} />
                  <input 
                    type="password" 
                    required
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    className="w-full rounded-xl pl-12 pr-4 py-3.5 outline-none focus:border-orange-500/50 transition-all"
                    style={{ 
                      background: 'var(--login-input-bg)', 
                      border: '1.5px solid var(--login-input-border)', 
                      color: 'var(--login-input-text)'
                    }}
                    placeholder="••••••••"
                  />
                </div>
                {/* Password rules */}
                {form.password && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {RULES.map(rule => {
                      const passed = rule.test(form.password);
                      return (
                        <div key={rule.label} className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${passed ? 'text-emerald-500' : 'text-gray-500'}`}>
                          <CheckCircle2 size={10} className={passed ? 'text-emerald-500' : 'text-gray-400'} />
                          {rule.label}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              
              <button 
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-4 text-sm font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            {hasGoogleClientId && (
              <div className="mt-8 pt-6 border-t animate-fade-in text-center" style={{ borderColor: 'var(--login-divider)' }}>
                <p className="font-black tracking-widest text-[10px] uppercase mb-6" style={{ color: 'var(--login-subtext)' }}>Or continue with</p>
                
                <div className="w-full flex justify-center">
                  <div id="googleBtn" className="min-h-[44px]"></div>
                </div>
                
                <button
                  type="button"
                  onClick={handleGoogleLoginClick}
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-3 text-sm font-bold shadow-sm border"
                  style={{ 
                    background: 'var(--login-form-bg)', 
                    borderColor: 'var(--login-input-border)', 
                    color: 'var(--login-label)',
                    display: googleInitialized ? 'none' : 'flex' 
                  }}
                >
                  <Globe size={18} />
                  Sign up with Google
                </button>
              </div>
            )}

            <div className="mt-6 text-center">
              <p className="text-sm font-light" style={{ color: 'var(--login-subtext)' }}>
                Already a member? <Link to="/login" className="text-orange-500 font-bold hover:underline">Sign In</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
