import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { shareAPI } from '../services/api';
import ReviewPanel from '../components/ReviewPanel';
import { Code2, Clock, Eye, ArrowLeft } from 'lucide-react';

export default function SharedReview() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    shareAPI.getShared(token)
      .then(res => setData(res.data))
      .catch(err => setError(err.response?.data?.error || 'Review not found or link expired'))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-dark-400 text-sm">Loading shared review...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <Eye size={28} className="text-accent-rose" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Link Unavailable</h2>
          <p className="text-dark-400 text-sm mb-6">{error}</p>
          <Link to="/" className="btn-primary inline-flex items-center gap-2">
            <ArrowLeft size={14} /> Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="badge bg-primary-500/10 text-primary-400 border border-primary-500/20">
                <Eye size={10} className="mr-1" /> Read-only
              </span>
              <span className="badge bg-[#1e1e1e] text-dark-300">
                {data.language}
              </span>
            </div>
            <h1 className="text-xl font-bold text-white">Shared Code Review</h1>
            <p className="text-dark-400 text-sm flex items-center gap-1 mt-1">
              <Clock size={12} />
              {new Date(data.createdAt).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric'
              })}
            </p>
          </div>

          <Link to="/" className="btn-ghost text-sm flex items-center gap-2 text-dark-300">
            <ArrowLeft size={14} /> CodeReviewer
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Code display */}
          <div className="lg:col-span-2">
            <div className="glass-panel-solid rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#2a2a2a] bg-[#141414]">
                <Code2 size={14} className="text-primary-500" />
                <span className="text-xs font-mono text-dark-500 dark:text-dark-400 uppercase">{data.language}</span>
              </div>
              <pre className="p-4 overflow-auto max-h-[60vh] text-sm font-mono text-white whitespace-pre-wrap leading-relaxed">
                {data.code}
              </pre>
            </div>
          </div>

          {/* Review results */}
          <div className="h-[70vh]">
            <ReviewPanel review={data.review} loading={false} />
          </div>
        </div>

        {/* Sign up CTA */}
        <div className="mt-8 p-5 rounded-2xl bg-gradient-to-r from-primary-500/10 to-accent-violet/10 border border-primary-500/20 text-center">
          <h3 className="text-lg font-semibold text-white mb-2">Get AI code reviews for your own code</h3>
          <p className="text-dark-400 text-sm mb-4">Free tier includes 10 reviews per hour. No credit card needed.</p>
          <Link to="/register" className="btn-primary inline-flex items-center gap-2">
            Sign Up Free
          </Link>
        </div>
      </div>
    </div>
  );
}
