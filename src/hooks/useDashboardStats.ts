import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface OwnerStats {
  totalIncome: number;
  totalAdmins: number;
  activeAdmins: number;
  blockedAdmins: number;
  totalWarehouses: number;
  totalTenants: number;
  paidTenants: number;
  unpaidTenants: number;
}

interface AdminStats {
  totalIncome: number;
  totalTenants: number;
  paidTenants: number;
  unpaidTenants: number;
  totalWarehouses: number;
}

interface MonthlyIncomeData {
  month: string;
  income: number;
}

interface MonthlyTrendData {
  month: string;
  expected: number;
  paid: number;
}

interface ProductTypeData {
  name: string;
  value: number;
}

interface AdminPerformanceData {
  name: string;
  income: number;
  tenants: number;
}

const getCurrentMonthYear = () => {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
};

const getMonthAbbreviations = (language: string = 'uz') => {
  const months: Record<string, string[]> = {
    uz: ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'],
    ru: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
    en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  };
  return months[language] || months.uz;
};

export const useOwnerStats = () => {
  const { user } = useAuth();
  const { month, year } = getCurrentMonthYear();

  return useQuery({
    queryKey: ['ownerStats', month, year],
    queryFn: async (): Promise<OwnerStats> => {
      // Get all admins
      const { data: admins } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      const adminIds = admins?.map(a => a.user_id) || [];

      // Get admin status (blocked/active)
      const { data: adminStatuses } = await supabase
        .from('admin_status')
        .select('admin_id, is_blocked');

      const blockedAdmins = adminStatuses?.filter(s => s.is_blocked).length || 0;
      const activeAdmins = (adminIds.length || 0) - blockedAdmins;

      // Get all warehouses
      const { data: warehouses } = await supabase
        .from('warehouses')
        .select('id');

      // Get all tenants
      const { data: tenants } = await supabase
        .from('tenants')
        .select('id')
        .eq('is_active', true);

      // Get payments for current month
      const { data: payments } = await supabase
        .from('payments')
        .select('paid_amount, expected_amount, tenant_id')
        .eq('month', month)
        .eq('year', year);

      const totalIncome = payments?.reduce((sum, p) => sum + (p.paid_amount || 0), 0) || 0;
      
      // Count paid vs unpaid tenants
      const paidTenantIds = new Set(
        payments?.filter(p => p.paid_amount >= p.expected_amount).map(p => p.tenant_id) || []
      );
      const unpaidTenantIds = new Set(
        payments?.filter(p => p.paid_amount < p.expected_amount).map(p => p.tenant_id) || []
      );

      return {
        totalIncome,
        totalAdmins: adminIds.length || 0,
        activeAdmins,
        blockedAdmins,
        totalWarehouses: warehouses?.length || 0,
        totalTenants: tenants?.length || 0,
        paidTenants: paidTenantIds.size,
        unpaidTenants: unpaidTenantIds.size,
      };
    },
    enabled: !!user,
  });
};

export const useAdminStats = () => {
  const { user } = useAuth();
  const { month, year } = getCurrentMonthYear();

  return useQuery({
    queryKey: ['adminStats', user?.id, month, year],
    queryFn: async (): Promise<AdminStats> => {
      if (!user?.id) throw new Error('No user');

      // Get admin's warehouses
      const { data: warehouses } = await supabase
        .from('warehouses')
        .select('id')
        .eq('admin_id', user.id);

      // Get admin's tenants
      const { data: tenants } = await supabase
        .from('tenants')
        .select('id')
        .eq('admin_id', user.id)
        .eq('is_active', true);

      const tenantIds = tenants?.map(t => t.id) || [];

      // Get payments for admin's tenants this month
      const { data: payments } = await supabase
        .from('payments')
        .select('paid_amount, expected_amount, tenant_id')
        .in('tenant_id', tenantIds.length > 0 ? tenantIds : ['none'])
        .eq('month', month)
        .eq('year', year);

      const totalIncome = payments?.reduce((sum, p) => sum + (p.paid_amount || 0), 0) || 0;

      const paidTenants = payments?.filter(p => p.paid_amount >= p.expected_amount).length || 0;
      const unpaidTenants = payments?.filter(p => p.paid_amount < p.expected_amount).length || 0;

      return {
        totalIncome,
        totalTenants: tenants?.length || 0,
        paidTenants,
        unpaidTenants,
        totalWarehouses: warehouses?.length || 0,
      };
    },
    enabled: !!user,
  });
};

export const useMonthlyIncome = (isOwner: boolean) => {
  const { user } = useAuth();
  const { year } = getCurrentMonthYear();
  const monthAbbr = getMonthAbbreviations();

  return useQuery({
    queryKey: ['monthlyIncome', isOwner, user?.id, year],
    queryFn: async (): Promise<MonthlyIncomeData[]> => {
      const result: MonthlyIncomeData[] = [];

      for (let m = 1; m <= 6; m++) {
        let query = supabase
          .from('payments')
          .select('paid_amount, tenant_id')
          .eq('month', m)
          .eq('year', year);

        if (!isOwner && user?.id) {
          // For admin, get only their tenants' payments
          const { data: tenants } = await supabase
            .from('tenants')
            .select('id')
            .eq('admin_id', user.id);
          
          const tenantIds = tenants?.map(t => t.id) || [];
          if (tenantIds.length > 0) {
            query = query.in('tenant_id', tenantIds);
          } else {
            result.push({ month: monthAbbr[m - 1], income: 0 });
            continue;
          }
        }

        const { data: payments } = await query;
        const income = payments?.reduce((sum, p) => sum + (p.paid_amount || 0), 0) || 0;
        result.push({ month: monthAbbr[m - 1], income });
      }

      return result;
    },
    enabled: !!user,
  });
};

export const useMonthlyTrend = (isOwner: boolean) => {
  const { user } = useAuth();
  const { year } = getCurrentMonthYear();
  const monthAbbr = getMonthAbbreviations();

  return useQuery({
    queryKey: ['monthlyTrend', isOwner, user?.id, year],
    queryFn: async (): Promise<MonthlyTrendData[]> => {
      const result: MonthlyTrendData[] = [];

      for (let m = 1; m <= 6; m++) {
        let query = supabase
          .from('payments')
          .select('paid_amount, expected_amount, tenant_id')
          .eq('month', m)
          .eq('year', year);

        if (!isOwner && user?.id) {
          const { data: tenants } = await supabase
            .from('tenants')
            .select('id')
            .eq('admin_id', user.id);
          
          const tenantIds = tenants?.map(t => t.id) || [];
          if (tenantIds.length > 0) {
            query = query.in('tenant_id', tenantIds);
          } else {
            result.push({ month: monthAbbr[m - 1], expected: 0, paid: 0 });
            continue;
          }
        }

        const { data: payments } = await query;
        const expected = payments?.reduce((sum, p) => sum + (p.expected_amount || 0), 0) || 0;
        const paid = payments?.reduce((sum, p) => sum + (p.paid_amount || 0), 0) || 0;
        result.push({ month: monthAbbr[m - 1], expected, paid });
      }

      return result;
    },
    enabled: !!user,
  });
};

export const useProductTypeStats = (isOwner: boolean) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['productTypeStats', isOwner, user?.id],
    queryFn: async (): Promise<ProductTypeData[]> => {
      let query = supabase
        .from('tenants')
        .select('product_type')
        .eq('is_active', true);

      if (!isOwner && user?.id) {
        query = query.eq('admin_id', user.id);
      }

      const { data: tenants } = await query;

      // Group by product type
      const typeCounts: Record<string, number> = {};
      tenants?.forEach(t => {
        typeCounts[t.product_type] = (typeCounts[t.product_type] || 0) + 1;
      });

      return Object.entries(typeCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
    },
    enabled: !!user,
  });
};

export const useAdminPerformance = () => {
  const { month, year } = getCurrentMonthYear();

  return useQuery({
    queryKey: ['adminPerformance', month, year],
    queryFn: async (): Promise<AdminPerformanceData[]> => {
      // Get all admins with their profiles
      const { data: admins } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (!admins || admins.length === 0) return [];

      const adminIds = admins.map(a => a.user_id);

      // Get profiles for names
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', adminIds);

      const result: AdminPerformanceData[] = [];

      for (const adminId of adminIds) {
        // Get admin's tenants
        const { data: tenants } = await supabase
          .from('tenants')
          .select('id')
          .eq('admin_id', adminId)
          .eq('is_active', true);

        const tenantIds = tenants?.map(t => t.id) || [];
        
        // Get payments for these tenants
        let income = 0;
        if (tenantIds.length > 0) {
          const { data: payments } = await supabase
            .from('payments')
            .select('paid_amount')
            .in('tenant_id', tenantIds)
            .eq('month', month)
            .eq('year', year);

          income = payments?.reduce((sum, p) => sum + (p.paid_amount || 0), 0) || 0;
        }

        const profile = profiles?.find(p => p.user_id === adminId);
        result.push({
          name: profile?.full_name || 'Admin',
          income,
          tenants: tenantIds.length,
        });
      }

      return result.sort((a, b) => b.income - a.income).slice(0, 5);
    },
  });
};

export const usePaymentSummary = (isOwner: boolean) => {
  const { user } = useAuth();
  const { month, year } = getCurrentMonthYear();

  return useQuery({
    queryKey: ['paymentSummary', isOwner, user?.id, month, year],
    queryFn: async () => {
      let query = supabase
        .from('payments')
        .select('paid_amount, expected_amount, tenant_id')
        .eq('month', month)
        .eq('year', year);

      if (!isOwner && user?.id) {
        const { data: tenants } = await supabase
          .from('tenants')
          .select('id')
          .eq('admin_id', user.id);
        
        const tenantIds = tenants?.map(t => t.id) || [];
        if (tenantIds.length > 0) {
          query = query.in('tenant_id', tenantIds);
        } else {
          return { expected: 0, paid: 0, unpaid: 0, percentage: 0 };
        }
      }

      const { data: payments } = await query;
      const expected = payments?.reduce((sum, p) => sum + (p.expected_amount || 0), 0) || 0;
      const paid = payments?.reduce((sum, p) => sum + (p.paid_amount || 0), 0) || 0;
      const unpaid = expected - paid;
      const percentage = expected > 0 ? Math.round((paid / expected) * 100 * 10) / 10 : 0;

      return { expected, paid, unpaid, percentage };
    },
    enabled: !!user,
  });
};
