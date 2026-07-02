import React, { useState } from 'react';

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  shape?: 'circle' | 'rounded';
  className?: string;
}

const SIZE: Record<string, string> = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-16 h-16 text-xl',
};

const SHAPE: Record<string, string> = {
  circle: 'rounded-full',
  rounded: 'rounded-xl',
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  shape = 'circle',
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);

  const base = `${SIZE[size]} ${SHAPE[shape]} flex-shrink-0 flex items-center justify-center overflow-hidden ${className}`;

  if (src && !imgError) {
    return (
      <div className={base}>
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => { console.log("voici l'erreurrrrrrrrrrr", src); setImgError(true); }}
        />
      </div>
    );
  }

  return (
    <div className={`${base} bg-gradient`}>
      <span className="text-white font-semibold font-poppins leading-none">
        {initials(name)}
      </span>
    </div>
  );
};

export default Avatar;
