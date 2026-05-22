import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const LANGUAGES = [
  { value: 'java', label: 'Java', color: '#7c3aed' },
  { value: 'python', label: 'Python', color: '#0284c7' },
  { value: 'javascript', label: 'JavaScript', color: '#ca8a04' },
  { value: 'typescript', label: 'TypeScript', color: '#2563eb' },
  { value: 'cpp', label: 'C++', color: '#dc2626' },
  { value: 'go', label: 'Go', color: '#0891b2' },
  { value: 'rust', label: 'Rust', color: '#ea580c' },
  { value: 'sql', label: 'SQL', color: '#16a34a' },
  { value: 'php', label: 'PHP', color: '#4f46e5' },
  { value: 'ruby', label: 'Ruby', color: '#db2777' },
];

// Map file extensions to language values
export const EXT_TO_LANG = {
  '.java': 'java',
  '.py': 'python',
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.go': 'go',
  '.cpp': 'cpp',
  '.cc': 'cpp',
  '.c': 'cpp',
  '.h': 'cpp',
  '.rs': 'rust',
  '.sql': 'sql',
  '.php': 'php',
  '.rb': 'ruby',
};

// Map language values to Monaco editor language identifiers
export const LANG_TO_MONACO = {
  java: 'java',
  python: 'python',
  javascript: 'javascript',
  typescript: 'typescript',
  cpp: 'cpp',
  go: 'go',
  rust: 'rust',
  sql: 'sql',
  php: 'php',
  ruby: 'ruby',
};

export default function LanguageSelector({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedLang = LANGUAGES.find(l => l.value === value) || LANGUAGES[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 pl-3 pr-9 py-2 rounded-lg text-sm font-medium
                   bg-[var(--bg-surface-2)] border border-[var(--border)]
                   text-[var(--text-primary)]
                   hover:border-primary-500
                   focus:outline-none focus:ring-2 focus:ring-primary-500/30
                   transition-all duration-200 w-full sm:w-[140px] min-h-[44px] sm:min-h-0"
      >
        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: selectedLang.color }} />
        <span className="truncate">{selectedLang.label}</span>
        <ChevronDown
          size={14}
          className={`absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 top-full left-0 w-[160px] rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] shadow-glow-sm py-1 overflow-hidden animate-slide-up">
          <div className="max-h-[280px] overflow-y-auto scrollbar-thin">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.value}
                type="button"
                className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors ${
                  value === lang.value ? 'bg-primary-500/10 text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)]'
                }`}
                onClick={() => {
                  onChange(lang.value);
                  setIsOpen(false);
                }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: lang.color }} />
                  {lang.label}
                </div>
                {value === lang.value && <Check size={14} className="text-primary-400" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export { LANGUAGES };
