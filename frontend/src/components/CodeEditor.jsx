import { useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { Upload, FileCode, Trash2 } from 'lucide-react';
import { EXT_TO_LANG, LANG_TO_MONACO } from './LanguageSelector';
import toast from 'react-hot-toast';

const MAX_FILE_SIZE = 50 * 1024; // 50KB

export default function CodeEditor({
  code,
  onCodeChange,
  language,
  onLanguageChange,
  bugs = [],
  securityIssues = [],
  theme = 'vs-dark',
  onEditorMount,
}) {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationsRef = useRef([]);
  const dropZoneRef = useRef(null);

  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    onEditorMount?.(editor, monaco);

    if (window.innerWidth < 640) {
      editor.updateOptions({ wordWrap: 'off', scrollbar: { horizontal: 'visible' } });
    }

    // Apply decorations if bugs exist
    updateDecorations(bugs, securityIssues, editor, monaco);
  };

  // Update line decorations when bugs/security issues change
  const updateDecorations = useCallback((bugList, secList, editor, monaco) => {
    if (!editor || !monaco) return;

    const decorations = [];

    // Bug decorations
    (bugList || []).forEach((bug) => {
      if (bug.line) {
        const severityColors = {
          Critical: { line: 'monaco-line-bug-critical', glyph: 'monaco-glyph-bug-critical', ruler: '#ef4444' },
          High: { line: 'monaco-line-bug-high', glyph: 'monaco-glyph-bug-high', ruler: '#f97316' },
          Medium: { line: 'monaco-line-bug-medium', glyph: 'monaco-glyph-bug-medium', ruler: '#f59e0b' },
          Low: { line: 'monaco-line-bug-low', glyph: 'monaco-glyph-bug-low', ruler: '#6b7280' },
        };
        const color = severityColors[bug.severity] || severityColors.Medium;

        decorations.push({
          range: new monaco.Range(bug.line, 1, bug.line, 1),
          options: {
            isWholeLine: true,
            className: color.line,
            glyphMarginClassName: color.glyph,
            hoverMessage: {
              value: `🐛 **${bug.severity}**: ${bug.description}\n\n💡 **Fix**: ${bug.fix}`,
            },
            overviewRuler: {
              color: color.ruler,
              position: monaco.editor.OverviewRulerLane.Left,
            },
          },
        });
      }
    });

    // Security issue decorations
    (secList || []).forEach((issue) => {
      if (issue.line) {
        decorations.push({
          range: new monaco.Range(issue.line, 1, issue.line, 1),
          options: {
            isWholeLine: true,
            className: 'monaco-line-security',
            glyphMarginClassName: 'monaco-glyph-security',
            hoverMessage: {
              value: `🔒 **${issue.severity}** — ${issue.vulnerability}\n\n${issue.description}\n\n💡 **Fix**: ${issue.fix}`,
            },
            overviewRuler: {
              color: '#6366f1',
              position: monaco.editor.OverviewRulerLane.Right,
            },
          },
        });
      }
    });

    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, decorations);
  }, []);

  // Apply decorations when bugs/security change
  const applyDecorations = useCallback(() => {
    if (editorRef.current && monacoRef.current) {
      updateDecorations(bugs, securityIssues, editorRef.current, monacoRef.current);
    }
  }, [bugs, securityIssues, updateDecorations]);

  // Scroll to a specific line
  const scrollToLine = useCallback((lineNumber) => {
    if (editorRef.current) {
      editorRef.current.revealLineInCenter(lineNumber);
      editorRef.current.setPosition({ lineNumber, column: 1 });
      editorRef.current.focus();
    }
  }, []);

  // File drop handler
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer?.files[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.error('File too large. Maximum size is 50KB.');
      return;
    }

    const ext = '.' + file.name.split('.').pop().toLowerCase();
    const detectedLang = EXT_TO_LANG[ext];

    if (!detectedLang) {
      toast.error('Unsupported file type. Accepted: .java, .py, .js, .ts, .go, .cpp, .rs, .sql, .php, .rb');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      onCodeChange(event.target.result);
      onLanguageChange(detectedLang);
      toast.success(`Loaded ${file.name} (${detectedLang})`);
    };
    reader.readAsText(file);
  }, [onCodeChange, onLanguageChange]);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // File input (click-to-browse)
  const fileInputRef = useRef(null);
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.error('File too large. Maximum size is 50KB.');
      return;
    }

    const ext = '.' + file.name.split('.').pop().toLowerCase();
    const detectedLang = EXT_TO_LANG[ext];

    if (!detectedLang) {
      toast.error('Unsupported file type.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      onCodeChange(event.target.result);
      onLanguageChange(detectedLang);
      toast.success(`Loaded ${file.name}`);
    };
    reader.readAsText(file);
  };

  // Expose scrollToLine via ref
  if (typeof window !== 'undefined') {
    window.__codeEditorScrollToLine = scrollToLine;
    window.__codeEditorApplyDecorations = applyDecorations;
  }

  const monacoLang = LANG_TO_MONACO[language] || 'plaintext';

  return (
    <div
      ref={dropZoneRef}
      className="relative h-full flex flex-col rounded-xl overflow-hidden border border-[#2a2a2a]"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {/* Editor toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#141414] border-b border-[#2a2a2a]">
        <div className="flex items-center gap-2">
          <FileCode size={16} className="text-primary-500" />
          <span className="text-xs font-medium text-dark-500 dark:text-dark-400 uppercase tracking-wider">
            {language}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              onCodeChange('');
              toast.success('Editor cleared');
            }}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md
                       text-red-500 dark:text-red-400
                       hover:bg-red-50 dark:hover:bg-red-900/20
                       transition-colors"
            title="Clear editor"
          >
            <Trash2 size={12} /> Clear
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md
                       text-dark-500 dark:text-dark-400
                       hover:bg-white/5 whitespace-nowrap
                       transition-colors"
            style={{ whiteSpace: 'nowrap' }}
          >
            <Upload size={12} /> 
            <span className="hidden sm:inline">Upload File</span>
            <span className="sm:hidden">Upload</span>
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".java,.py,.js,.jsx,.ts,.tsx,.go,.cpp,.cc,.c,.h,.rs,.sql,.php,.rb"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 min-h-0" style={{ overflowX: 'auto', width: '100%' }}>
        <Editor
          height="100%"
          language={monacoLang}
          value={code}
          onChange={(value) => onCodeChange(value || '')}
          onMount={handleEditorMount}
          beforeMount={(monaco) => {
            monaco.editor.defineTheme('custom-dark', {
              base: 'vs-dark',
              inherit: true,
              rules: [],
              colors: {
                'editor.background': '#141414'
              }
            });
          }}
          theme="custom-dark"
          options={{
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            fontLigatures: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: typeof window !== 'undefined' && window.innerWidth < 640 ? 'off' : 'on',
            scrollbar: {
              horizontal: 'visible',
              horizontalScrollbarSize: 8
            },
            lineNumbers: 'on',
            glyphMargin: true,
            folding: true,
            bracketPairColorization: { enabled: true },
            automaticLayout: true,
            tabSize: 2,
            padding: { top: 12, bottom: 12 },
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            renderLineHighlight: 'all',
          }}
        />
      </div>

      {/* Drop overlay */}
      {!code && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
          <div className="text-center">
            <Upload size={48} className="mx-auto mb-3 text-dark-400" />
            <p className="text-sm text-dark-400">Paste code or drop a file here</p>
          </div>
        </div>
      )}
    </div>
  );
}
