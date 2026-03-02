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

        {/* Data Tables Section */}
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-[200px] w-full" />
          </div>
        ) : (
          <>
            {/* Row 1: Monthly Income + Payment Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Income Table */}
              <Card className="card-hover">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    {t('total_income')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {(monthlyIncomeData || []).map((item, i) => (
                      <div key={i} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                        <span className="text-sm font-medium text-muted-foreground">{item.month}</span>
                        <span className="font-semibold">{formatCurrency(item.income)}</span>
                      </div>
                    ))}
                    {(monthlyIncomeData || []).length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">Ma'lumot yo'q</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Payment Status */}
              <Card className="card-hover">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    {t('payments')} - {t('this_month')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2">
                      <span className="text-muted-foreground">{t('expected_amount')}</span>
                      <span className="font-semibold">{formatCurrency(paymentSummary?.expected || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-muted-foreground">{t('paid_amount')}</span>
                      <span className="font-semibold text-green-600">{formatCurrency(paymentSummary?.paid || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-muted-foreground">{t('unpaid_balance')}</span>
                      <span className="font-semibold text-destructive">{formatCurrency(paymentSummary?.unpaid || 0)}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden mt-2">
                      <div 
                        className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-500"
                        style={{ width: `${paymentSummary?.percentage || 0}%` }}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground text-center">{paymentSummary?.percentage || 0}% to'langan</p>
                    <div className="flex justify-between items-center pt-2 border-t border-border">
                      <span className="text-muted-foreground">{t('paid_users')}</span>
                      <span className="font-semibold text-green-600">{isOwner ? ownerStats?.paidTenants || 0 : adminStats?.paidTenants || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">{t('unpaid_users')}</span>
                      <span className="font-semibold text-destructive">{isOwner ? ownerStats?.unpaidTenants || 0 : adminStats?.unpaidTenants || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Row 2: Monthly Trend + Product Types */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Trend Table */}
              <Card className="card-hover">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    {t('monthly_stats')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center py-2 border-b border-border font-medium text-sm">
                      <span className="w-16">Oy</span>
                      <span className="text-muted-foreground">{t('expected_amount')}</span>
                      <span className="text-green-600">{t('paid_amount')}</span>
                    </div>
                    {(monthlyTrendData || []).map((item, i) => (
                      <div key={i} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                        <span className="w-16 text-sm font-medium">{item.month}</span>
                        <span className="text-sm">{formatCurrency(item.expected)}</span>
                        <span className="text-sm text-green-600">{formatCurrency(item.paid)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Product Types */}
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
                  <div className="space-y-2">
                    {(productTypeData || []).length > 0 ? (
                      productTypeData?.map((type, index) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                          <span className="text-sm font-medium">{type.name}</span>
                          <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-semibold">
                            {type.value} ta
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">Ma'lumot yo'q</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Admin Performance (Owner only) */}
            {isOwner && (adminPerformanceData || []).length > 0 && (
              <Card className="card-hover">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    {t('admin_performance')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center py-2 border-b border-border font-medium text-sm">
                      <span>Admin</span>
                      <span className="text-muted-foreground">{t('total_income')}</span>
                      <span className="text-muted-foreground">{t('total_tenants')}</span>
                    </div>
                    {adminPerformanceData?.map((admin, i) => (
                      <div key={i} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                        <span className="text-sm font-medium">{admin.name}</span>
                        <span className="text-sm">{formatCurrency(admin.income)}</span>
                        <span className="text-sm font-semibold">{admin.tenants}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
