import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Review from './pages/Review';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import SharedReview from './pages/SharedReview';
import { Toaster } from 'react-hot-toast';
import { useEffect, useState } from 'react';
import { reviewAPI } from './services/api';

// Protected route wrapper
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-dark-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
          <p className="text-dark-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Layout wrapper with Navbar (excludes auth pages + shared)
function AppLayout({ children }) {
  const { isAuthenticated } = useAuth();
  const [remaining, setRemaining] = useState(undefined);

  useEffect(() => {
    if (isAuthenticated) {
      reviewAPI.getRemaining()
        .then(res => setRemaining(res.data.remaining))
        .catch(() => {});
    }

    const handleUpdate = (e) => {
      setRemaining(e.detail);
    };
    window.addEventListener('remaining-reviews-updated', handleUpdate);
    return () => window.removeEventListener('remaining-reviews-updated', handleUpdate);
  }, [isAuthenticated]);

  return (
    <div id="app-content" className="min-h-screen dark:bg-dark-950 bg-dot-grid transition-all duration-700">
      <Navbar remainingReviews={remaining} />
      {children}
    </div>
  );
}

export default function App() {
  // Apply theme from localStorage on mount
  useEffect(() => {
    const theme = localStorage.getItem('theme') || 'dark';
    if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: 'var(--toast-bg, #1e293b)',
            color: '#f1f5f9',
            border: '1px solid rgba(148, 163, 184, 0.15)',
            borderRadius: '0.75rem',
            fontSize: '0.875rem',
            fontFamily: 'Inter, sans-serif',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#f43f5e', secondary: '#fff' } },
        }}
      />
      <Routes>
        {/* Auth pages — no navbar */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Shared review — no navbar needed, has its own layout */}
        <Route path="/share/:token" element={<SharedReview />} />

        {/* Main app — with navbar */}
        <Route path="/" element={<AppLayout><Home /></AppLayout>} />
        <Route path="/review" element={<AppLayout><Review /></AppLayout>} />
        <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
