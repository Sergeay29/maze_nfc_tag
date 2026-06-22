import React from 'react';

interface ProgressBarProps {
  current: number;
  max: number;
  label?: string;
  showPercentage?: boolean;
  className?: string;
  color?: 'primary' | 'gradient';
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  max,
  label,
  showPercentage = true,
  className = '',
  color = 'gradient',
}) => {
  const percentage = Math.min((current / max) * 100, 100);

  return (
    <div className={`w-full ${className}`}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between mb-2">
          {label && <span className="text-sm font-medium text-slate">{label}</span>}
          {showPercentage && (
            <span className="text-sm font-medium text-primary">{Math.round(percentage)}%</span>
          )}
        </div>
      )}
      <div className="w-full h-2 bg-slate/20 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${
            color === 'gradient' ? 'bg-gradient' : 'bg-primary'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
