import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MobileCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

interface MobileCardRowProps {
  label: string;
  value: React.ReactNode;
  className?: string;
}

interface MobileCardHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}

export const MobileCard = ({ children, className, onClick }: MobileCardProps) => (
  <Card 
    className={cn(
      "mb-3 last:mb-0 transition-all duration-200 active:scale-[0.99]",
      onClick && "cursor-pointer hover:shadow-md",
      className
    )}
    onClick={onClick}
  >
    <CardContent className="p-4">
      {children}
    </CardContent>
  </Card>
);

export const MobileCardHeader = ({ title, subtitle, actions }: MobileCardHeaderProps) => (
  <div className="flex items-start justify-between gap-2 mb-3">
    <div className="flex-1 min-w-0">
      <div className="font-semibold text-foreground truncate">{title}</div>
      {subtitle && (
        <div className="text-sm text-muted-foreground mt-0.5 truncate">{subtitle}</div>
      )}
    </div>
    {actions && <div className="flex items-center gap-1 flex-shrink-0">{actions}</div>}
  </div>
);

export const MobileCardRow = ({ label, value, className }: MobileCardRowProps) => (
  <div className={cn("flex justify-between items-center py-1.5", className)}>
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="text-sm font-medium text-foreground text-right ml-2">{value}</span>
  </div>
);

export const MobileCardDivider = () => (
  <div className="border-t border-border my-2" />
);
