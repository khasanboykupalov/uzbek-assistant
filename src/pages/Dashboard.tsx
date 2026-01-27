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

const Dashboard = () => {
  const { role } = useAuth();
  const { t, getMonth } = useLanguage();

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // Mock data - will be replaced with real data from database
  const ownerStats = {
    totalIncome: 125000000,
    totalAdmins: 8,
    activeAdmins: 6,
    blockedAdmins: 2,
    totalWarehouses: 12,
    totalTenants: 156,
  };

  const adminStats = {
    totalIncome: 15600000,
    totalTenants: 24,
    paidTenants: 18,
    unpaidTenants: 6,
    productTypes: ['Oziq-ovqat', 'Elektronika', 'Kiyim-kechak', 'Qurilish mollari'],
  };

  // Chart data
  const monthlyIncomeData = [
    { month: 'Yan', income: 95000000 },
    { month: 'Fev', income: 102000000 },
    { month: 'Mar', income: 98000000 },
    { month: 'Apr', income: 115000000 },
    { month: 'May', income: 108000000 },
    { month: 'Iyn', income: 125000000 },
  ];

  const adminMonthlyIncomeData = [
    { month: 'Yan', income: 12500000 },
    { month: 'Fev', income: 13200000 },
    { month: 'Mar', income: 11800000 },
    { month: 'Apr', income: 14500000 },
    { month: 'May', income: 15100000 },
    { month: 'Iyn', income: 15600000 },
  ];

  const productTypeData = [
    { name: 'Oziq-ovqat', value: 45 },
    { name: 'Elektronika', value: 32 },
    { name: 'Kiyim-kechak', value: 28 },
    { name: 'Qurilish mollari', value: 25 },
    { name: 'Uy-ro\'zg\'or', value: 18 },
    { name: 'Boshqa', value: 8 },
  ];

  const adminProductTypeData = [
    { name: 'Oziq-ovqat', value: 8 },
    { name: 'Elektronika', value: 6 },
    { name: 'Kiyim-kechak', value: 5 },
    { name: 'Qurilish mollari', value: 5 },
  ];

  const adminPerformanceData = [
    { name: 'Admin 1', income: 18500000, tenants: 24 },
    { name: 'Admin 2', income: 16200000, tenants: 21 },
    { name: 'Admin 3', income: 15800000, tenants: 19 },
    { name: 'Admin 4', income: 14500000, tenants: 18 },
    { name: 'Admin 5', income: 12000000, tenants: 15 },
  ];

  const monthlyTrendData = [
    { month: 'Yan', expected: 95000000, paid: 82000000 },
    { month: 'Fev', expected: 102000000, paid: 95000000 },
    { month: 'Mar', expected: 98000000, paid: 90000000 },
    { month: 'Apr', expected: 115000000, paid: 108000000 },
    { month: 'May', expected: 108000000, paid: 102000000 },
    { month: 'Iyn', expected: 125000000, paid: 118000000 },
  ];

  const adminTrendData = [
    { month: 'Yan', expected: 14000000, paid: 12500000 },
    { month: 'Fev', expected: 14500000, paid: 13200000 },
    { month: 'Mar', expected: 14000000, paid: 11800000 },
    { month: 'Apr', expected: 15500000, paid: 14500000 },
    { month: 'May', expected: 16000000, paid: 15100000 },
    { month: 'Iyn', expected: 18000000, paid: 15600000 },
  ];

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
        {role === 'owner' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            <StatCard
              title={t('total_income')}
              value={formatCurrency(ownerStats.totalIncome)}
              subtitle={t('this_month')}
              icon={TrendingUp}
              variant="primary"
              trend={{ value: 12, isPositive: true }}
            />
            <StatCard
              title={t('admins')}
              value={ownerStats.totalAdmins}
              subtitle={`${ownerStats.activeAdmins} ${t('active')}, ${ownerStats.blockedAdmins} ${t('blocked')}`}
              icon={Users}
              variant="default"
            />
            <StatCard
              title={t('warehouses')}
              value={ownerStats.totalWarehouses}
              icon={Building2}
              variant="success"
            />
            <StatCard
              title={t('total_tenants')}
              value={ownerStats.totalTenants}
              icon={Package}
              variant="default"
            />
            <StatCard
              title={t('paid_users')}
              value={142}
              icon={UserCheck}
              variant="success"
            />
            <StatCard
              title={t('unpaid_users')}
              value={14}
              icon={UserX}
              variant="destructive"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            <StatCard
              title={t('total_income')}
              value={formatCurrency(adminStats.totalIncome)}
              subtitle={t('this_month')}
              icon={TrendingUp}
              variant="primary"
            />
            <StatCard
              title={t('total_tenants')}
              value={adminStats.totalTenants}
              icon={Users}
              variant="default"
            />
            <StatCard
              title={t('paid_users')}
              value={adminStats.paidTenants}
              icon={UserCheck}
              variant="success"
            />
            <StatCard
              title={t('unpaid_users')}
              value={adminStats.unpaidTenants}
              icon={UserX}
              variant="destructive"
            />
          </div>
        )}

        {/* Charts Section */}
        {role === 'owner' ? (
          <>
            {/* Owner Charts - Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <IncomeChart data={monthlyIncomeData} />
              <PaymentStatusChart paid={142} unpaid={14} />
            </div>

            {/* Owner Charts - Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AdminPerformanceChart data={adminPerformanceData} />
              <TenantsByProductChart data={productTypeData} />
            </div>

            {/* Owner Charts - Row 3 */}
            <MonthlyTrendChart data={monthlyTrendData} />
          </>
        ) : (
          <>
            {/* Admin Charts - Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <IncomeChart data={adminMonthlyIncomeData} />
              <PaymentStatusChart paid={adminStats.paidTenants} unpaid={adminStats.unpaidTenants} />
            </div>

            {/* Admin Charts - Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TenantsByProductChart data={adminProductTypeData} />
              <MonthlyTrendChart data={adminTrendData} />
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
                {role === 'owner' ? 'Barcha omborlardagi mahsulotlar' : 'Sizning ombordagi mahsulotlar'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {(role === 'owner' 
                  ? ['Oziq-ovqat', 'Elektronika', 'Kiyim-kechak', 'Qurilish mollari', 'Uy-ro\'zg\'or', 'Avtomobil ehtiyot qismlari']
                  : adminStats.productTypes
                ).map((type, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium"
                  >
                    {type}
                  </span>
                ))}
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
                  <span className="font-semibold">{formatCurrency(18000000)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{t('paid_amount')}</span>
                  <span className="font-semibold text-green-600">{formatCurrency(15600000)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{t('unpaid_balance')}</span>
                  <span className="font-semibold text-destructive">{formatCurrency(2400000)}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden mt-4">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-500"
                    style={{ width: '86.7%' }}
                  />
                </div>
                <p className="text-sm text-muted-foreground text-center">86.7% to'langan</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
