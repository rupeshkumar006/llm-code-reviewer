import { useState } from 'react';
import { reviewAPI } from '../services/api';
import { Download, Share2, Copy, ChevronDown, FileJson, FileText, Link2, Check, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ExportButton({ reviewId, code, disabled, tooltip }) {
  const [open, setOpen] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [loadingJson, setLoadingJson] = useState(false);
  const [loadingShare, setLoadingShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const handleExportPdf = async () => {
    if (disabled) return;
    setLoadingPdf(true);
    setOpen(false);
    try {
      const res = await reviewAPI.export(reviewId, 'pdf');
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `review-${reviewId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('PDF downloaded!');
    } catch {
      toast.error('Failed to export PDF. Pro tier required.');
    } finally {
      setLoadingPdf(false);
    }
  };

  const handleExportJson = async () => {
    if (disabled) return;
    setLoadingJson(true);
    setOpen(false);
    try {
      const res = await reviewAPI.export(reviewId, 'json');
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `review-${reviewId}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('JSON exported!');
    } catch {
      toast.error('Failed to export JSON');
    } finally {
      setLoadingJson(false);
    }
  };

  const handleShare = async () => {
    if (disabled) return;
    setLoadingShare(true);
    setOpen(false);
    try {
      const res = await reviewAPI.share(reviewId, 30);
      const shareUrl = `${window.location.origin}/share/${res.data.token}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Share link copied to clipboard!');
    } catch {
      toast.error('Failed to generate share link');
    } finally {
      setLoadingShare(false);
    }
  };

  const handleCopyCode = async () => {
    setOpen(false);
    try {
      await navigator.clipboard.writeText(code || '');
      setCopied(true);
      toast.success('Refactored code copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleClick = () => {
    if (disabled) {
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 3000);
      return;
    }
    setOpen(!open);
  };

  return (
    <div 
      className="relative"
      onMouseEnter={() => disabled && setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <button
        onClick={handleClick}
        className={`text-sm flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg border transition-all min-h-[44px] sm:min-h-0 whitespace-nowrap
          ${disabled 
            ? 'bg-[var(--bg-surface-2)] border-[var(--border)] text-[var(--text-muted)] cursor-not-allowed opacity-60' 
            : 'bg-transparent border-[var(--border)] text-[var(--text-secondary)] hover:border-orange-500 hover:text-orange-500'
          }`}
      >
        {disabled ? <Lock size={14} /> : <Download size={14} />}
        <span className="hidden sm:inline">Export</span>
        {!disabled && <ChevronDown size={12} className={`hidden sm:inline transition-transform ${open ? 'rotate-180' : ''}`} />}
      </button>

      {disabled && showTooltip && (
        <div className="absolute top-full mt-2 right-0 bg-[var(--bg-surface-3)] border border-[var(--border)] text-[var(--text-primary)] text-[11px] font-bold py-2 px-3 rounded-xl shadow-2xl z-50 animate-slide-up w-48 sm:w-auto whitespace-normal sm:whitespace-nowrap text-center">
          {tooltip || "Sign in to export reviews"}
        </div>
      )}

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 bottom-full sm:bottom-auto sm:top-full mb-2 sm:mt-2 w-52 glass-panel-solid p-1.5 z-50 animate-fade-in overflow-hidden">
            <button
              onClick={handleExportPdf}
              disabled={loadingPdf}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-[var(--bg-surface-2)] transition-colors disabled:opacity-50 overflow-hidden"
            >
              <FileText size={14} className="text-accent-rose flex-shrink-0" />
              <div className="text-left min-w-0">
                <p className="font-medium text-[var(--text-primary)] truncate">Export PDF</p>
                <p className="text-[10px] text-[var(--text-muted)] truncate">Full report with all findings</p>
              </div>
            </button>

            <button
              onClick={handleExportJson}
              disabled={loadingJson}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-[var(--bg-surface-2)] transition-colors disabled:opacity-50 overflow-hidden"
            >
              <FileJson size={14} className="text-accent-emerald flex-shrink-0" />
              <div className="text-left min-w-0">
                <p className="font-medium text-[var(--text-primary)] truncate">Export JSON</p>
                <p className="text-[10px] text-[var(--text-muted)] truncate">Machine-readable format</p>
              </div>
            </button>

            <div className="h-px bg-[var(--border)] my-1" />

            <button
              onClick={handleShare}
              disabled={loadingShare}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-[var(--bg-surface-2)] transition-colors disabled:opacity-50 overflow-hidden"
            >
              <Link2 size={14} className="text-primary-500 flex-shrink-0" />
              <div className="text-left min-w-0">
                <p className="font-medium text-[var(--text-primary)] truncate">Share Link</p>
                <p className="text-[10px] text-[var(--text-muted)] truncate">Expires in 30 days</p>
              </div>
            </button>

            <button
              onClick={handleCopyCode}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-[var(--bg-surface-2)] transition-colors overflow-hidden"
            >
              {copied ? <Check size={14} className="text-accent-emerald flex-shrink-0" /> : <Copy size={14} className="text-accent-violet flex-shrink-0" />}
              <div className="text-left min-w-0">
                <p className="font-medium text-[var(--text-primary)] truncate">Copy Code</p>
                <p className="text-[10px] text-[var(--text-muted)] truncate">Copy refactored code</p>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
