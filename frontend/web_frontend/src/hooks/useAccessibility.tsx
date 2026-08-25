import React, { createContext, useContext, useState, useEffect } from 'react';

export type FontSize = 'small' | 'normal' | 'large' | 'xlarge';
export type Theme = 'light' | 'dark';

interface AccessibilityContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  highContrast: boolean;
  setHighContrast: (active: boolean) => void;
  toggleHighContrast: () => void;
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  toggleTheme: () => void;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('sambhav-theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [fontSize, setFontSizeState] = useState<FontSize>(() => {
    return (localStorage.getItem('sambhav-font-size') as FontSize) || 'normal';
  });

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('sambhav-theme', newTheme);
  };

  const setFontSize = (size: FontSize) => {
    setFontSizeState(size);
    localStorage.setItem('sambhav-font-size', size);
  };

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  const increaseFontSize = () => {
    if (fontSize === 'small') setFontSize('normal');
    else if (fontSize === 'normal') setFontSize('large');
    else if (fontSize === 'large') setFontSize('xlarge');
  };

  const decreaseFontSize = () => {
    if (fontSize === 'xlarge') setFontSize('large');
    else if (fontSize === 'large') setFontSize('normal');
    else if (fontSize === 'normal') setFontSize('small');
  };

  // Sync state to <html> element classes & color-scheme
  useEffect(() => {
    const root = document.documentElement;

    if (theme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }

    // Font Size Classes
    root.classList.remove('text-small', 'text-large', 'text-xlarge');
    if (fontSize === 'small') {
      root.classList.add('text-small');
    } else if (fontSize === 'large') {
      root.classList.add('text-large');
    } else if (fontSize === 'xlarge') {
      root.classList.add('text-xlarge');
    }
  }, [theme, fontSize]);

  return (
    <AccessibilityContext.Provider
      value={{
        theme,
        setTheme,
        highContrast: false,
        setHighContrast: () => {},
        toggleHighContrast: () => {},
        fontSize,
        setFontSize,
        toggleTheme,
        increaseFontSize,
        decreaseFontSize,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};
