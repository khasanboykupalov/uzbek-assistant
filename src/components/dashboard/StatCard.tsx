import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'destructive';
}

const variantStyles = {
  default: 'bg-card',
  primary: 'bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20',
  success: 'bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20',
  warning: 'bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20',
  destructive: 'bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20',
};

const iconStyles = {
  default: 'bg-muted text-muted-foreground',
  primary: 'bg-primary/20 text-primary',
  success: 'bg-green-500/20 text-green-600',
  warning: 'bg-amber-500/20 text-amber-600',
  destructive: 'bg-destructive/20 text-destructive',
};

export const StatCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  variant = 'default' 
}: StatCardProps) => {
  return (
    <div className={cn(
      'stat-card animate-fade-in',
      variantStyles[variant]
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl lg:text-3xl font-bold mt-2">{value}</p>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className={cn(
              'inline-flex items-center gap-1 mt-2 text-sm font-medium',
              trend.isPositive ? 'text-green-600' : 'text-destructive'
            )}>
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        <div className={cn(
          'p-3 rounded-xl',
          iconStyles[variant]
        )}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
};
