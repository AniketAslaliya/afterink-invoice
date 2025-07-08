import React from 'react';
import { User } from 'lucide-react';
import { useTheme, generateInitials, getAvatarColor } from '../contexts/ThemeContext';

interface AvatarProps {
  src?: string;
  alt?: string;
  firstName?: string;
  lastName?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showOnlineIndicator?: boolean;
  fallbackIcon?: React.ReactNode;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl',
  '2xl': 'w-20 h-20 text-2xl',
};

const iconSizes = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  '2xl': 40,
};

const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  firstName,
  lastName,
  size = 'md',
  className = '',
  showOnlineIndicator = false,
  fallbackIcon,
}) => {
  const { personalization } = useTheme();
  
  const displayName = `${firstName || ''} ${lastName || ''}`.trim();
  const initials = generateInitials(firstName, lastName);
  const backgroundColor = getAvatarColor(displayName || 'User');
  
  // Use personalization avatar if available, then prop src
  const avatarSrc = personalization.avatar || src;
  
  const baseClasses = `relative inline-flex items-center justify-center rounded-full overflow-hidden flex-shrink-0 ${sizeClasses[size]} ${className}`;

  const renderContent = () => {
    if (avatarSrc) {
      return (
        <img
          src={avatarSrc}
          alt={alt || `${displayName} avatar`}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to initials if image fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
      );
    }

    if (initials && initials !== 'U') {
      return (
        <div
          className="w-full h-full flex items-center justify-center text-white font-semibold"
          style={{ backgroundColor }}
        >
          {initials}
        </div>
      );
    }

    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-500 text-white">
        {fallbackIcon || <User size={iconSizes[size]} />}
      </div>
    );
  };

  return (
    <div className={baseClasses}>
      {renderContent()}
      
      {/* Online indicator */}
      {showOnlineIndicator && (
        <div className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-400 ring-2 ring-white" />
      )}
    </div>
  );
};

export default Avatar; 