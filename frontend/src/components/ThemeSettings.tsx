import React, { useState } from 'react';
import { Moon, Sun, Palette, Upload, X, Monitor, Zap, ZapOff, Settings as SettingsIcon } from 'lucide-react';
import { useTheme, accentColors } from '../contexts/ThemeContext';
import Avatar from './Avatar';

interface ThemeSettingsProps {
  className?: string;
}

const ThemeSettings: React.FC<ThemeSettingsProps> = ({ className = '' }) => {
  const {
    theme,
    personalization,
    setThemeMode,
    setAccentColor,
    setBorderRadius,
    setAnimation,
    setPersonalization,
    resetTheme,
  } = useTheme();

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setAvatarPreview(result);
        setPersonalization({ avatar: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setLogoPreview(result);
        setPersonalization({ companyLogo: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAvatar = () => {
    setAvatarPreview(null);
    setPersonalization({ avatar: '' });
  };

  const removeLogo = () => {
    setLogoPreview(null);
    setPersonalization({ companyLogo: '' });
  };

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Theme Mode Section */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Palette className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-white">Theme Settings</h3>
        </div>

        {/* Dark/Light Mode Toggle */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Appearance Mode
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setThemeMode('dark')}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all ${
                theme.mode === 'dark'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <Moon size={18} />
              <span>Dark</span>
            </button>
            
            <button
              onClick={() => setThemeMode('light')}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all ${
                theme.mode === 'light'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <Sun size={18} />
              <span>Light</span>
            </button>
          </div>
        </div>

        {/* Accent Color Picker */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Accent Color
          </label>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
            {Object.entries(accentColors).map(([name, color]) => (
              <button
                key={name}
                onClick={() => setAccentColor(color)}
                className={`w-10 h-10 rounded-lg transition-all hover:scale-110 ${
                  theme.accentColor === color
                    ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-800'
                    : ''
                }`}
                style={{ backgroundColor: color }}
                title={name.charAt(0).toUpperCase() + name.slice(1)}
              />
            ))}
          </div>
        </div>

        {/* Border Radius */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Border Radius
          </label>
          <div className="flex items-center gap-3">
            {(['sm', 'md', 'lg'] as const).map((radius) => (
              <button
                key={radius}
                onClick={() => setBorderRadius(radius)}
                className={`px-4 py-2 rounded transition-all ${
                  theme.borderRadius === radius
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                style={{
                  borderRadius: radius === 'sm' ? '0.375rem' : radius === 'lg' ? '0.75rem' : '0.5rem'
                }}
              >
                {radius.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Animation Settings */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Animations
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAnimation('none')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                theme.animation === 'none'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <ZapOff size={16} />
              <span>None</span>
            </button>
            
            <button
              onClick={() => setAnimation('reduced')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                theme.animation === 'reduced'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <Monitor size={16} />
              <span>Reduced</span>
            </button>
            
            <button
              onClick={() => setAnimation('full')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                theme.animation === 'full'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <Zap size={16} />
              <span>Full</span>
            </button>
          </div>
        </div>
      </div>

      {/* Personalization Section */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-600 rounded-lg">
            <SettingsIcon className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-white">Personalization</h3>
        </div>

        {/* Avatar Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Profile Avatar
          </label>
          <div className="flex items-center gap-4">
            <Avatar
              src={avatarPreview || personalization.avatar}
              firstName="User"
              lastName=""
              size="xl"
            />
            <div className="flex flex-col gap-2">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                  <Upload size={16} />
                  <span>Upload Avatar</span>
                </div>
              </label>
              {(avatarPreview || personalization.avatar) && (
                <button
                  onClick={removeAvatar}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  <X size={16} />
                  <span>Remove</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Company Logo Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Company Logo
          </label>
          <div className="flex items-center gap-4">
            {(logoPreview || personalization.companyLogo) ? (
              <div className="w-16 h-16 rounded-lg bg-gray-700 border border-gray-600 flex items-center justify-center overflow-hidden">
                <img
                  src={logoPreview || personalization.companyLogo}
                  alt="Company logo"
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-lg bg-gray-700 border border-gray-600 flex items-center justify-center">
                <Upload className="w-6 h-6 text-gray-400" />
              </div>
            )}
            <div className="flex flex-col gap-2">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                  <Upload size={16} />
                  <span>Upload Logo</span>
                </div>
              </label>
              {(logoPreview || personalization.companyLogo) && (
                <button
                  onClick={removeLogo}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  <X size={16} />
                  <span>Remove</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Display Name */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Display Name
          </label>
          <input
            type="text"
            value={personalization.displayName || ''}
            onChange={(e) => setPersonalization({ displayName: e.target.value })}
            placeholder="Enter your display name"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
          />
        </div>
      </div>

      {/* Reset Section */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Reset Settings</h3>
        <p className="text-gray-300 text-sm mb-4">
          Reset all theme and personalization settings to their default values.
        </p>
        <button
          onClick={resetTheme}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
        >
          Reset to Defaults
        </button>
      </div>
    </div>
  );
};

export default ThemeSettings; 