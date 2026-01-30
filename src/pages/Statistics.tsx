import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  useMonthlyIncome, 
  useMonthlyTrend, 
  useProductTypeStats, 
  useAdminPerformance,
  usePaymentSummary 
} from '@/hooks/useDashboardStats';
import { IncomeChart } from '@/components/dashboard/IncomeChart';
import { MonthlyTrendChart } from '@/components/dashboard/MonthlyTrendChart';
import { TenantsByProductChart } from '@/components/dashboard/TenantsByProductChart';
import { AdminPerformanceChart } from '@/components/dashboard/AdminPerformanceChart';
import { PaymentStatusChart } from '@/components/dashboard/PaymentStatusChart';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3, TrendingUp, PieChart, Users } from 'lucide-react';

const Statistics = () => {
  const { role } = useAuth();
  const { t } = useLanguage();
  const isOwner = role === 'owner';

  const { data: monthlyIncome, isLoading: incomeLoading } = useMonthlyIncome(isOwner);
  const { data: monthlyTrend, isLoading: trendLoading } = useMonthlyTrend(isOwner);
  const { data: productStats, isLoading: productLoading } = useProductTypeStats(isOwner);
  const { data: adminPerformance, isLoading: adminLoading } = useAdminPerformance();
  const { data: paymentSummary, isLoading: paymentLoading } = usePaymentSummary(isOwner);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('statistics')}</h1>
            <p className="text-sm text-muted-foreground">
              {isOwner ? t('owner_statistics_desc') : t('admin_statistics_desc')}
            </p>
          </div>
        </div>

        {/* Payment Summary */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              {t('payment_summary')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {paymentLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-20" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">{t('expected')}</p>
                  <p className="text-xl font-bold text-foreground">
                    {paymentSummary?.expected?.toLocaleString() || 0} {t('currency')}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-success/10">
                  <p className="text-sm text-muted-foreground">{t('paid')}</p>
                  <p className="text-xl font-bold text-success">
                    {paymentSummary?.paid?.toLocaleString() || 0} {t('currency')}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-destructive/10">
                  <p className="text-sm text-muted-foreground">{t('unpaid')}</p>
                  <p className="text-xl font-bold text-destructive">
                    {paymentSummary?.unpaid?.toLocaleString() || 0} {t('currency')}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-primary/10">
                  <p className="text-sm text-muted-foreground">{t('collection_rate')}</p>
                  <p className="text-xl font-bold text-primary">
                    {paymentSummary?.percentage || 0}%
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Charts Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Monthly Income Chart */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{t('monthly_income')}</CardTitle>
            </CardHeader>
            <CardContent>
              {incomeLoading ? (
                <Skeleton className="h-[250px]" />
              ) : (
                <IncomeChart data={monthlyIncome || []} />
              )}
            </CardContent>
          </Card>

          {/* Monthly Trend Chart */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{t('payment_trend')}</CardTitle>
            </CardHeader>
            <CardContent>
              {trendLoading ? (
                <Skeleton className="h-[250px]" />
              ) : (
                <MonthlyTrendChart data={monthlyTrend || []} />
              )}
            </CardContent>
          </Card>

          {/* Product Type Distribution */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <PieChart className="h-5 w-5 text-primary" />
                {t('tenants_by_product')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {productLoading ? (
                <Skeleton className="h-[250px]" />
              ) : (
                <TenantsByProductChart data={productStats || []} />
              )}
            </CardContent>
          </Card>

          {/* Admin Performance (Owner only) */}
          {isOwner && (
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  {t('admin_performance')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {adminLoading ? (
                  <Skeleton className="h-[250px]" />
                ) : (
                  <AdminPerformanceChart data={adminPerformance || []} />
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Payment Status Chart - Full Width */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{t('payment_status')}</CardTitle>
          </CardHeader>
          <CardContent>
            {paymentLoading ? (
              <Skeleton className="h-[200px]" />
            ) : (
              <PaymentStatusChart 
                paid={paymentSummary?.paid || 0} 
                unpaid={paymentSummary?.unpaid || 0} 
              />
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Statistics;
