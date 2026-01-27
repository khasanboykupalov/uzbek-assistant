import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart as PieChartIcon } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface PaymentStatusChartProps {
  paid: number;
  unpaid: number;
  title?: string;
}

export const PaymentStatusChart = ({ paid, unpaid, title }: PaymentStatusChartProps) => {
  const { t } = useLanguage();

  const data = [
    { name: t('paid_users'), value: paid, color: 'hsl(142, 76%, 36%)' },
    { name: t('unpaid_users'), value: unpaid, color: 'hsl(var(--destructive))' },
  ];

  const total = paid + unpaid;
  const paidPercentage = total > 0 ? Math.round((paid / total) * 100) : 0;

  return (
    <Card className="card-hover">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChartIcon className="h-5 w-5 text-primary" />
          {title || t('payments')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: number, name: string) => [value, name]}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value) => (
                  <span style={{ color: 'hsl(var(--foreground))' }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center -mt-8">
              <p className="text-3xl font-bold">{paidPercentage}%</p>
              <p className="text-sm text-muted-foreground">{t('paid_users')}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
