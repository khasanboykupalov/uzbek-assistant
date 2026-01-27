import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface MonthlyTrendChartProps {
  data: Array<{
    month: string;
    expected: number;
    paid: number;
  }>;
  title?: string;
}

export const MonthlyTrendChart = ({ data, title }: MonthlyTrendChartProps) => {
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
          <TrendingUp className="h-5 w-5 text-primary" />
          {title || t('monthly_stats')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="month" 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              />
              <YAxis 
                tickFormatter={formatCurrency}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: number, name: string) => [
                  new Intl.NumberFormat('uz-UZ').format(value) + " so'm",
                  name === 'expected' ? t('expected_amount') : t('paid_amount')
                ]}
              />
              <Legend 
                formatter={(value) => (
                  <span style={{ color: 'hsl(var(--foreground))' }}>
                    {value === 'expected' ? t('expected_amount') : t('paid_amount')}
                  </span>
                )}
              />
              <Line 
                type="monotone" 
                dataKey="expected" 
                stroke="hsl(var(--muted-foreground))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--muted-foreground))' }}
                name="expected"
              />
              <Line 
                type="monotone" 
                dataKey="paid" 
                stroke="hsl(142, 76%, 36%)" 
                strokeWidth={2}
                dot={{ fill: 'hsl(142, 76%, 36%)' }}
                name="paid"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
