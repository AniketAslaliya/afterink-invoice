import React, { createContext, useContext, useState, useEffect } from 'react';

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
}

export interface ThemeSettings {
  mode: 'light' | 'dark';
  accentColor: string;
  colors: ThemeColors;
  fontFamily: string;
  borderRadius: 'sm' | 'md' | 'lg';
  animation: 'none' | 'reduced' | 'full';
}

interface UserPersonalization {
  avatar?: string;
  companyLogo?: string;
  displayName?: string;
  initials?: string;
}

interface ThemeContextType {
  theme: ThemeSettings;
  personalization: UserPersonalization;
  setThemeMode: (mode: 'light' | 'dark') => void;
  setAccentColor: (color: string) => void;
  setBorderRadius: (radius: 'sm' | 'md' | 'lg') => void;
  setAnimation: (animation: 'none' | 'reduced' | 'full') => void;
  setPersonalization: (personalization: Partial<UserPersonalization>) => void;
  resetTheme: () => void;
}

// Predefined accent colors
export const accentColors = {
  blue: '#3b82f6',
  purple: '#8b5cf6',
  green: '#10b981',
  orange: '#f59e0b',
  red: '#ef4444',
  pink: '#ec4899',
  indigo: '#6366f1',
  teal: '#14b8a6',
};

// Theme color definitions
const lightColors: ThemeColors = {
  primary: '#3b82f6',
  secondary: '#6b7280',
  accent: '#3b82f6',
  background: '#ffffff',
  surface: '#f9fafb',
  text: '#111827',
  textSecondary: '#6b7280',
  border: '#e5e7eb',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
};

const darkColors: ThemeColors = {
  primary: '#3b82f6',
  secondary: '#9ca3af',
  accent: '#3b82f6',
  background: '#111827',
  surface: '#1f2937',
  text: '#f9fafb',
  textSecondary: '#9ca3af',
  border: '#374151',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
};

const defaultTheme: ThemeSettings = {
  mode: 'dark',
  accentColor: accentColors.blue,
  colors: darkColors,
  fontFamily: 'Inter, sans-serif',
  borderRadius: 'md',
  animation: 'full',
};

const defaultPersonalization: UserPersonalization = {
  avatar: '',
  companyLogo: '',
  displayName: '',
  initials: '',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeSettings>(() => {
    const saved = localStorage.getItem('afterink-theme');
    return saved ? JSON.parse(saved) : defaultTheme;
  });

  const [personalization, setPersonalizationState] = useState<UserPersonalization>(() => {
    const saved = localStorage.getItem('afterink-personalization');
    return saved ? JSON.parse(saved) : defaultPersonalization;
  });

  // Update colors when theme mode or accent color changes
  useEffect(() => {
    const baseColors = theme.mode === 'light' ? lightColors : darkColors;
    const updatedColors = {
      ...baseColors,
      primary: theme.accentColor,
      accent: theme.accentColor,
    };
    
    setTheme(prev => ({
      ...prev,
      colors: updatedColors,
    }));
  }, [theme.mode, theme.accentColor]);

  // Apply theme to CSS variables
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    
    // Set CSS custom properties
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });
    
    root.style.setProperty('--font-family', theme.fontFamily);
    root.style.setProperty('--border-radius', 
      theme.borderRadius === 'sm' ? '0.375rem' : 
      theme.borderRadius === 'lg' ? '0.75rem' : '0.5rem'
    );
    
    // Set dark/light mode class - this is the key for Tailwind dark mode
    if (theme.mode === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      body.classList.add('dark');
      body.classList.remove('light');
      // Apply dark theme background
      body.style.backgroundColor = '#111827';
      body.style.color = '#f9fafb';
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
      body.classList.add('light');
      body.classList.remove('dark');
      // Apply light theme background
      body.style.backgroundColor = '#ffffff';
      body.style.color = '#111827';
    }
    
    // Set animation preferences
    if (theme.animation === 'none') {
      document.documentElement.classList.add('motion-reduce');
    } else {
      document.documentElement.classList.remove('motion-reduce');
    }
    
    // Save to localStorage
    localStorage.setItem('afterink-theme', JSON.stringify(theme));
    
    console.log(`Theme applied: ${theme.mode} mode with colors:`, theme.colors);
  }, [theme]);

  // Save personalization to localStorage
  useEffect(() => {
    localStorage.setItem('afterink-personalization', JSON.stringify(personalization));
  }, [personalization]);

  const setThemeMode = (mode: 'light' | 'dark') => {
    setTheme(prev => ({ ...prev, mode }));
  };

  const setAccentColor = (color: string) => {
    setTheme(prev => ({ ...prev, accentColor: color }));
  };

  const setBorderRadius = (radius: 'sm' | 'md' | 'lg') => {
    setTheme(prev => ({ ...prev, borderRadius: radius }));
  };

  const setAnimation = (animation: 'none' | 'reduced' | 'full') => {
    setTheme(prev => ({ ...prev, animation }));
  };

  const setPersonalization = (updates: Partial<UserPersonalization>) => {
    setPersonalizationState(prev => ({ ...prev, ...updates }));
  };

  const resetTheme = () => {
    setTheme(defaultTheme);
    setPersonalizationState(defaultPersonalization);
    localStorage.removeItem('afterink-theme');
    localStorage.removeItem('afterink-personalization');
  };

  const value: ThemeContextType = {
    theme,
    personalization,
    setThemeMode,
    setAccentColor,
    setBorderRadius,
    setAnimation,
    setPersonalization,
    resetTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Helper function to generate initials from name
export const generateInitials = (firstName?: string, lastName?: string): string => {
  if (!firstName && !lastName) return 'U';
  const first = firstName?.charAt(0)?.toUpperCase() || '';
  const last = lastName?.charAt(0)?.toUpperCase() || '';
  return `${first}${last}`;
};

// Helper function to generate avatar background color
export const getAvatarColor = (name: string): string => {
  const colors = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
    '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
    '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
    '#ec4899', '#f43f5e'
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}; 