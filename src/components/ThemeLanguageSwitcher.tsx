import React, { useState, useRef, useEffect } from 'react';
import { useThemeStore, ThemeMode } from '../utils/themeStore';
import { useLanguageStore, Language } from '../utils/languageStore';
import { soundManager } from '../utils/audio';
import { Sun, Moon, Laptop, Globe, Check, ChevronDown } from 'lucide-react';

interface SwitcherProps {
  compact?: boolean;
  className?: string;
}

export const ThemeLanguageSwitcher: React.FC<SwitcherProps> = ({ 
  compact = false, 
  className = '' 
}) => {
  const { mode, effectiveTheme, setMode } = useThemeStore();
  const { language, setLanguage, toggleLanguage, t } = useLanguageStore();

  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);

  const themeRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) {
        setIsThemeOpen(false);
      }
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectTheme = (newMode: ThemeMode) => {
    soundManager.playClick();
    setMode(newMode);
    setIsThemeOpen(false);
  };

  const handleSelectLang = (newLang: Language) => {
    soundManager.playClick();
    setLanguage(newLang);
    setIsLangOpen(false);
  };

  return (
    <div className={`flex items-center gap-1.5 sm:gap-2 ${className}`}>
      
      {/* Language Switcher */}
      <div className="relative" ref={langRef}>
        <button
          onClick={() => {
            soundManager.playClick();
            if (compact) {
              toggleLanguage();
            } else {
              setIsLangOpen(!isLangOpen);
            }
          }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-all shadow-2xs cursor-pointer"
          title={language === 'vi' ? 'Chuyển sang Tiếng Anh (English)' : 'Switch to Vietnamese (Tiếng Việt)'}
        >
          <span className="text-sm">{language === 'vi' ? '🇻🇳' : '🇬🇧'}</span>
          <span className="text-[11px] font-black uppercase tracking-wider">
            {language === 'vi' ? 'VI' : 'EN'}
          </span>
          {!compact && <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isLangOpen ? 'rotate-180' : ''}`} />}
        </button>

        {/* Language Dropdown */}
        {isLangOpen && !compact && (
          <div className="absolute right-0 mt-1.5 w-36 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 text-xs font-semibold animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => handleSelectLang('vi')}
              className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer ${
                language === 'vi' ? 'text-blue-600 dark:text-blue-400 font-bold bg-blue-50/50 dark:bg-blue-950/30' : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>🇻🇳</span>
                <span>Tiếng Việt</span>
              </div>
              {language === 'vi' && <Check className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={() => handleSelectLang('en')}
              className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer ${
                language === 'en' ? 'text-blue-600 dark:text-blue-400 font-bold bg-blue-50/50 dark:bg-blue-950/30' : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>🇬🇧</span>
                <span>English</span>
              </div>
              {language === 'en' && <Check className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      </div>

      {/* Theme Switcher (Light / Dark / Auto) */}
      <div className="relative" ref={themeRef}>
        <button
          onClick={() => {
            soundManager.playClick();
            if (compact) {
              // Quick cycle
              const next: ThemeMode = mode === 'light' ? 'dark' : mode === 'dark' ? 'auto' : 'light';
              setMode(next);
            } else {
              setIsThemeOpen(!isThemeOpen);
            }
          }}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all text-xs font-bold shadow-2xs cursor-pointer ${
            effectiveTheme === 'dark'
              ? 'border-slate-800 bg-slate-900 text-amber-300 hover:bg-slate-800'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
          }`}
          title={
            mode === 'auto'
              ? `${t('themeAuto')} (Đang ${effectiveTheme === 'dark' ? 'Tối' : 'Sáng'})`
              : mode === 'dark'
              ? t('themeDark')
              : t('themeLight')
          }
        >
          {mode === 'auto' ? (
            <div className="relative flex items-center">
              <Laptop className="w-3.5 h-3.5 text-blue-500" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 absolute -bottom-0.5 -right-0.5" />
            </div>
          ) : effectiveTheme === 'dark' ? (
            <Moon className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <Sun className="w-3.5 h-3.5 text-amber-500" />
          )}

          <span className="hidden md:inline text-[11px] font-semibold">
            {mode === 'auto' ? 'Tự động' : mode === 'dark' ? 'Tối' : 'Sáng'}
          </span>

          {!compact && <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isThemeOpen ? 'rotate-180' : ''}`} />}
        </button>

        {/* Theme Dropdown */}
        {isThemeOpen && !compact && (
          <div className="absolute right-0 mt-1.5 w-44 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 text-xs font-semibold animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => handleSelectTheme('light')}
              className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer ${
                mode === 'light' ? 'text-amber-600 dark:text-amber-400 font-bold bg-amber-50/50 dark:bg-amber-950/20' : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-amber-500" />
                <span>Giao diện Sáng (Light)</span>
              </div>
              {mode === 'light' && <Check className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={() => handleSelectTheme('dark')}
              className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer ${
                mode === 'dark' ? 'text-blue-600 dark:text-blue-400 font-bold bg-blue-50/50 dark:bg-blue-950/30' : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Moon className="w-4 h-4 text-indigo-400" />
                <span>Giao diện Tối (Dark)</span>
              </div>
              {mode === 'dark' && <Check className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={() => handleSelectTheme('auto')}
              className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer ${
                mode === 'auto' ? 'text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50/50 dark:bg-emerald-950/20' : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Laptop className="w-4 h-4 text-emerald-500" />
                <div>
                  <div className="leading-tight">Tự động (Hệ thống)</div>
                  <div className="text-[10px] text-slate-400 font-normal">Theo máy: {effectiveTheme === 'dark' ? 'Đang Tối' : 'Đang Sáng'}</div>
                </div>
              </div>
              {mode === 'auto' && <Check className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      </div>

    </div>
  );
};

export default ThemeLanguageSwitcher;
