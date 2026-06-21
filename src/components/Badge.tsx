import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'active' | 'inactive' | 'silver' | 'gold' | 'platinum' | 'primary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md';
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'active',
  size = 'sm',
  className = '',
}) => {
  const variantStyles = {
    active: 'bg-green-100 text-green-700',
    inactive: 'bg-red-100 text-red-700',
    silver: 'bg-slate-200 text-slate-700',
    gold: 'bg-yellow-100 text-yellow-700',
    platinum: 'bg-purple-100 text-purple-700',
    primary: 'bg-primary/10 text-primary',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    error: 'bg-red-100 text-red-700',
  };

  const sizeStyles = {
    sm: 'text-xs px-3 py-1',
    md: 'text-sm px-4 py-1.5',
  };

  return (
    <span className={`inline-flex items-center font-medium rounded-full ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
