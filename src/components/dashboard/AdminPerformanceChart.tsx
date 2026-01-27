import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface AdminPerformanceChartProps {
  data: Array<{
    name: string;
    income: number;
    tenants: number;
  }>;
  title?: string;
}

export const AdminPerformanceChart = ({ data, title }: AdminPerformanceChartProps) => {
  const { t } = useLanguage();

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toString();
  };

  return (
    <Card className="card-hover">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          {title || t('admin_performance')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="name" 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              />
              <YAxis 
                yAxisId="left"
                tickFormatter={formatCurrency}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: number, name: string) => {
                  if (name === 'income') {
                    return [new Intl.NumberFormat('uz-UZ').format(value) + " so'm", t('total_income')];
                  }
                  return [value, t('total_tenants')];
                }}
              />
              <Legend 
                formatter={(value) => (
                  <span style={{ color: 'hsl(var(--foreground))' }}>
                    {value === 'income' ? t('total_income') : t('total_tenants')}
                  </span>
                )}
              />
              <Bar 
                yAxisId="left"
                dataKey="income" 
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]}
                name="income"
              />
              <Bar 
                yAxisId="right"
                dataKey="tenants" 
                fill="hsl(142, 76%, 36%)" 
                radius={[4, 4, 0, 0]}
                name="tenants"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
