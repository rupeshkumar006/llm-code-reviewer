import { DiffEditor } from '@monaco-editor/react';
import { Check, X, CheckCheck, XCircle, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DiffViewer({ original, modified, language = 'javascript', onAcceptAll, onRejectAll }) {
  const handleCopyRefactored = () => {
    navigator.clipboard.writeText(modified || '');
    toast.success('Refactored code copied to clipboard!');
  };

  if (!modified) {
    return (
      <div className="h-full flex items-center justify-center glass-panel-solid">
        <p className="text-sm text-dark-400">No refactored code available</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col glass-panel-solid overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border)] bg-[var(--bg-surface-2)] overflow-hidden" style={{ flexWrap: 'nowrap', overflow: 'hidden' }}>
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] whitespace-nowrap">
            Diff View
          </h3>
          <span className="text-xs text-[var(--text-muted)] hidden sm:inline whitespace-nowrap">Original → Refactored</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyRefactored}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md
                       text-dark-600 dark:text-dark-300
                       hover:bg-white/5
                       transition-colors"
          >
            <Copy size={12} /> Copy
          </button>
          <button
            onClick={onAcceptAll}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md
                       text-accent-emerald bg-emerald-50 dark:bg-emerald-900/20
                       hover:bg-emerald-100 dark:hover:bg-emerald-900/30
                       transition-colors"
            title="Accept All"
          >
            <Check size={12} /> <span className="hidden sm:inline">Accept All</span>
          </button>
          <button
            onClick={onRejectAll}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md
                       text-accent-rose bg-red-50 dark:bg-red-900/20
                       hover:bg-red-100 dark:hover:bg-red-900/30
                       transition-colors"
            title="Reject All"
          >
            <X size={12} /> <span className="hidden sm:inline">Reject All</span>
          </button>
        </div>
      </div>

      {/* Diff editor */}
      <div className="flex-1 min-h-0">
        <DiffEditor
          height="100%"
          original={original}
          modified={modified}
          language={language}
          beforeMount={(monaco) => {
            const isDark = document.documentElement.classList.contains('dark');
            monaco.editor.defineTheme('premium-diff', {
              base: isDark ? 'vs-dark' : 'vs',
              inherit: true,
              rules: [],
              colors: {
                'diffEditor.insertedLineBackground': '#10b98115',
                'diffEditor.insertedTextBackground': '#10b98130',
                'diffEditor.removedLineBackground': '#ef444415',
                'diffEditor.removedTextBackground': '#ef444430',
                'editor.background': isDark ? '#141414' : '#ffffff',
              }
            });
          }}
          theme="premium-diff"
          options={{
            readOnly: true,
            renderSideBySide: true,
            fontSize: 13,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 16, bottom: 16 },
            renderOverviewRuler: false,
            scrollbar: {
              vertical: 'hidden',
              horizontal: 'hidden'
            }
          }}
        />
      </div>
    </div>
  );
}
