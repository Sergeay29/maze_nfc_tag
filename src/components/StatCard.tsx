import React from 'react';
import Card from './Card';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  gradient?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  className = '',
  gradient = false,
}) => {
  return (
    <Card className={`relative overflow-hidden ${className}`}>
      {gradient && (
        <div className="absolute inset-0 bg-gradient opacity-5" />
      )}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-slate">{title}</h3>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${gradient ? 'bg-gradient text-white' : 'bg-primary/10 text-primary'}`}>
            {icon}
          </div>
        </div>
        <div className="flex items-end justify-between">
          <p className="text-3xl font-bold font-poppins text-dark">{value}</p>
          {trend && (
            <span className={`text-sm font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.isPositive ? '+' : ''}{trend.value}%
            </span>
          )}
        </div>
      </div>
    </Card>
  );
};

export default StatCard;
