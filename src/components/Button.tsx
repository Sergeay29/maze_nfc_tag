import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  fullWidth = false,
  className = '',
  disabled = false,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantStyles = {
    primary: 'bg-gradient text-white hover:shadow-hover hover:scale-[1.02] active:scale-[0.98]',
    secondary: 'bg-white text-primary border border-primary/20 hover:bg-primary/5 hover:border-primary/40',
    ghost: 'text-slate hover:bg-slate/10',
    danger: 'bg-red-500 text-white hover:bg-red-600 hover:shadow-lg',
  };

  const sizeStyles = {
    sm: 'text-sm py-2 px-4 gap-2',
    md: 'text-sm py-3 px-5 gap-2',
    lg: 'text-base py-4 px-7 gap-3',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && iconPosition === 'left' && <span className="w-5 h-5">{icon}</span>}
      {children}
      {icon && iconPosition === 'right' && <span className="w-5 h-5">{icon}</span>}
    </button>
  );
};

export default Button;
