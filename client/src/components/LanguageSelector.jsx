import React, { useState, useEffect } from 'react';
import { Globe, X, Check, ChevronDown } from 'lucide-react';
import { getLanguages } from '../services/api';

export const POPULAR_LANGUAGES = [
  'Telugu',
  'Hindi',
  'Tamil',
  'English',
  'Malayalam',
  'Kannada',
  'Punjabi',
  'Spanish',
  'Korean',
];

export default function LanguageSelector({
  selectedLanguage,
  onSelectLanguage,
  isOpen,
  onToggle,
}) {
  const [dbLanguages, setDbLanguages] = useState([]);

  useEffect(() => {
    getLanguages()
      .then((data) => {
        if (Array.isArray(data)) setDbLanguages(data);
      })
      .catch(() => {});
  }, [selectedLanguage]);

  // Combine popular languages with any existing in DB
  const languageList = React.useMemo(() => {
    const list = [...POPULAR_LANGUAGES];
    dbLanguages.forEach((l) => {
      if (l.name && !list.includes(l.name)) {
        list.push(l.name);
      }
    });
    return list;
  }, [dbLanguages]);

  const getSongCount = (langName) => {
    const found = dbLanguages.find((l) => l.name?.toLowerCase() === langName.toLowerCase());
    return found ? found.songCount : 0;
  };

  return (
    <div className="relative">
      {/* Language Toggle Button */}
      <button
        type="button"
        onClick={onToggle}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all select-none border ${
          selectedLanguage
            ? 'bg-black text-white border-black shadow-xs'
            : isOpen
            ? 'bg-slate-100 text-neutral-900 border-border'
            : 'bg-surface hover:bg-slate-50 text-neutral-700 hover:text-black border-border shadow-xs'
        }`}
        title="Toggle Language Categories"
      >
        <Globe className={`w-3.5 h-3.5 ${selectedLanguage ? 'text-white' : 'text-neutral-500'}`} />
        <span>{selectedLanguage ? selectedLanguage : 'Languages'}</span>
        {selectedLanguage ? (
          <span
            onClick={(e) => {
              e.stopPropagation();
              onSelectLanguage(null);
            }}
            className="p-0.5 hover:bg-white/20 rounded-full ml-0.5"
            title="Clear language filter"
          >
            <X className="w-3 h-3 text-white" />
          </span>
        ) : (
          <ChevronDown
            className={`w-3 h-3 text-muted transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        )}
      </button>

      {/* Language Categories Bar / Dropdown Panel */}
      {isOpen && (
        <div className="absolute left-0 sm:right-0 sm:left-auto top-10 z-50 w-72 sm:w-80 p-3 bg-surface border border-border rounded-2xl shadow-2xl animate-scaleUp backdrop-blur-md">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-border text-[11px] font-semibold uppercase tracking-wider text-muted">
            <span className="flex items-center gap-1.5 text-neutral-900 font-bold">
              <Globe className="w-3.5 h-3.5 text-black" />
              Language Categories
            </span>
            {selectedLanguage && (
              <button
                onClick={() => onSelectLanguage(null)}
                className="text-xs text-black font-semibold hover:underline lowercase"
              >
                Reset
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-56 overflow-y-auto pr-1">
            {/* All Languages Option */}
            <button
              onClick={() => onSelectLanguage(null)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 border ${
                !selectedLanguage
                  ? 'bg-black text-white font-semibold border-black shadow-xs'
                  : 'bg-slate-50 text-neutral-800 hover:bg-slate-100 border-border'
              }`}
            >
              {!selectedLanguage && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
              <span>All Languages</span>
            </button>

            {/* Language Chips */}
            {languageList.map((lang) => {
              const count = getSongCount(lang);
              const isSelected = selectedLanguage?.toLowerCase() === lang.toLowerCase();

              return (
                <button
                  key={lang}
                  onClick={() => onSelectLanguage(lang)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 border ${
                    isSelected
                      ? 'bg-black text-white font-semibold border-black shadow-xs'
                      : count > 0
                      ? 'bg-slate-50 hover:bg-slate-100 text-neutral-800 border-border'
                      : 'bg-surface hover:bg-slate-50 text-neutral-500 border-border'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                  <span>{lang}</span>
                  {count > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        isSelected
                          ? 'bg-black/20 text-black font-bold'
                          : 'bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

