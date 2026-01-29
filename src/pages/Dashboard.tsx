import React from 'react';
import { 
  Users, 
  Building2, 
  CreditCard, 
  TrendingUp,
  Package,
  UserCheck,
  UserX,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { IncomeChart } from '@/components/dashboard/IncomeChart';
import { PaymentStatusChart } from '@/components/dashboard/PaymentStatusChart';
import { TenantsByProductChart } from '@/components/dashboard/TenantsByProductChart';
import { AdminPerformanceChart } from '@/components/dashboard/AdminPerformanceChart';
import { MonthlyTrendChart } from '@/components/dashboard/MonthlyTrendChart';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useOwnerStats,
  useAdminStats,
  useMonthlyIncome,
  useMonthlyTrend,
  useProductTypeStats,
  useAdminPerformance,
  usePaymentSummary,
} from '@/hooks/useDashboardStats';

const Dashboard = () => {
  const { role } = useAuth();
  const { t, getMonth } = useLanguage();
  const isOwner = role === 'owner';

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // Real data hooks
  const { data: ownerStats, isLoading: ownerLoading } = useOwnerStats();
  const { data: adminStats, isLoading: adminLoading } = useAdminStats();
  const { data: monthlyIncomeData, isLoading: incomeLoading } = useMonthlyIncome(isOwner);
  const { data: monthlyTrendData, isLoading: trendLoading } = useMonthlyTrend(isOwner);
  const { data: productTypeData, isLoading: productLoading } = useProductTypeStats(isOwner);
  const { data: adminPerformanceData, isLoading: perfLoading } = useAdminPerformance();
  const { data: paymentSummary, isLoading: summaryLoading } = usePaymentSummary(isOwner);

  const isLoading = isOwner 
    ? ownerLoading || incomeLoading || trendLoading || productLoading || perfLoading || summaryLoading
    : adminLoading || incomeLoading || trendLoading || productLoading || summaryLoading;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ').format(amount) + ' so\'m';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">{t('dashboard')}</h1>
          <p className="text-muted-foreground mt-1">
            {getMonth(currentMonth)} {currentYear} - {t('monthly_stats')}
          </p>
        </div>

        {/* Stats Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-[120px] w-full rounded-xl" />
            ))}
          </div>
        ) : isOwner ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            <StatCard
              title={t('total_income')}
              value={formatCurrency(ownerStats?.totalIncome || 0)}
              subtitle={t('this_month')}
              icon={TrendingUp}
              variant="primary"
            />
            <StatCard
              title={t('admins')}
              value={ownerStats?.totalAdmins || 0}
              subtitle={`${ownerStats?.activeAdmins || 0} ${t('active')}, ${ownerStats?.blockedAdmins || 0} ${t('blocked')}`}
              icon={Users}
              variant="default"
            />
            <StatCard
              title={t('warehouses')}
              value={ownerStats?.totalWarehouses || 0}
              icon={Building2}
              variant="success"
            />
            <StatCard
              title={t('total_tenants')}
              value={ownerStats?.totalTenants || 0}
              icon={Package}
              variant="default"
            />
            <StatCard
              title={t('paid_users')}
              value={ownerStats?.paidTenants || 0}
              icon={UserCheck}
              variant="success"
            />
            <StatCard
              title={t('unpaid_users')}
              value={ownerStats?.unpaidTenants || 0}
              icon={UserX}
              variant="destructive"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            <StatCard
              title={t('total_income')}
              value={formatCurrency(adminStats?.totalIncome || 0)}
              subtitle={t('this_month')}
              icon={TrendingUp}
              variant="primary"
            />
            <StatCard
              title={t('total_tenants')}
              value={adminStats?.totalTenants || 0}
              icon={Users}
              variant="default"
            />
            <StatCard
              title={t('paid_users')}
              value={adminStats?.paidTenants || 0}
              icon={UserCheck}
              variant="success"
            />
            <StatCard
              title={t('unpaid_users')}
              value={adminStats?.unpaidTenants || 0}
              icon={UserX}
              variant="destructive"
            />
          </div>
        )}

        {/* Charts Section */}
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-[300px] w-full" />
            <Skeleton className="h-[300px] w-full" />
          </div>
        ) : isOwner ? (
          <>
            {/* Owner Charts - Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <IncomeChart data={monthlyIncomeData || []} />
              <PaymentStatusChart paid={ownerStats?.paidTenants || 0} unpaid={ownerStats?.unpaidTenants || 0} />
            </div>

            {/* Owner Charts - Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AdminPerformanceChart data={adminPerformanceData || []} />
              <TenantsByProductChart data={productTypeData || []} />
            </div>

            {/* Owner Charts - Row 3 */}
            <MonthlyTrendChart data={monthlyTrendData || []} />
          </>
        ) : (
          <>
            {/* Admin Charts - Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <IncomeChart data={monthlyIncomeData || []} />
              <PaymentStatusChart paid={adminStats?.paidTenants || 0} unpaid={adminStats?.unpaidTenants || 0} />
            </div>

            {/* Admin Charts - Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TenantsByProductChart data={productTypeData || []} />
              <MonthlyTrendChart data={monthlyTrendData || []} />
            </div>
          </>
        )}

        {/* Additional Info Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                {t('product_type')}
              </CardTitle>
              <CardDescription>
                {isOwner ? 'Barcha omborlardagi mahsulotlar' : 'Sizning ombordagi mahsulotlar'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {(productTypeData || []).length > 0 ? (
                  productTypeData?.map((type, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium"
                    >
                      {type.name}
                    </span>
                  ))
                ) : (
                  <span className="text-muted-foreground text-sm">Ma'lumot yo'q</span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                {t('payments')}
              </CardTitle>
              <CardDescription>
                {t('this_month')} to'lovlar holati
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{t('expected_amount')}</span>
                  <span className="font-semibold">{formatCurrency(paymentSummary?.expected || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{t('paid_amount')}</span>
                  <span className="font-semibold text-green-600">{formatCurrency(paymentSummary?.paid || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{t('unpaid_balance')}</span>
                  <span className="font-semibold text-destructive">{formatCurrency(paymentSummary?.unpaid || 0)}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden mt-4">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-500"
                    style={{ width: `${paymentSummary?.percentage || 0}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground text-center">{paymentSummary?.percentage || 0}% to'langan</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
