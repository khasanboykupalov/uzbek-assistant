import React, { useState, useEffect, useMemo } from 'react';
import { Users, Search, Building2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { ExportButton } from '@/components/ExportButton';
import { exportToExcel } from '@/lib/exportToExcel';
import type { Tables } from '@/integrations/supabase/types';

type Tenant = Tables<'tenants'>;
type Warehouse = Tables<'warehouses'>;
type Profile = Tables<'profiles'>;

interface TenantWithDetails extends Tenant {
  warehouse?: Warehouse;
  admin_profile?: Profile;
}

const OwnerTenants = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [tenants, setTenants] = useState<TenantWithDetails[]>([]);
  const [admins, setAdmins] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAdminId, setSelectedAdminId] = useState<string>('all');

  const filteredTenants = useMemo(() => {
    let result = tenants;
    
    // Filter by admin
    if (selectedAdminId !== 'all') {
      result = result.filter(tenant => tenant.admin_id === selectedAdminId);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(tenant =>
        tenant.full_name.toLowerCase().includes(query) ||
        tenant.phone.includes(query) ||
        tenant.product_type.toLowerCase().includes(query) ||
        tenant.warehouse?.name?.toLowerCase().includes(query) ||
        tenant.admin_profile?.full_name?.toLowerCase().includes(query)
      );
    }
    
    return result;
  }, [tenants, searchQuery, selectedAdminId]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch all tenants with warehouse and admin profile
      const { data: tenantsData, error: tenantsError } = await supabase
        .from('tenants')
        .select(`
          *,
          warehouse:warehouses(*)
        `)
        .order('created_at', { ascending: false });

      if (tenantsError) throw tenantsError;

      // Fetch admin profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;

      // Get admin user_ids from user_roles
      const { data: adminRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (rolesError) throw rolesError;

      const adminUserIds = new Set(adminRoles?.map(r => r.user_id) || []);
      const adminProfiles = profilesData?.filter(p => adminUserIds.has(p.user_id)) || [];
      setAdmins(adminProfiles);

      // Map admin profiles to tenants
      const tenantsWithDetails: TenantWithDetails[] = (tenantsData || []).map(tenant => {
        const adminProfile = profilesData?.find(p => p.user_id === tenant.admin_id);
        return {
          ...tenant,
          admin_profile: adminProfile,
        };
      });

      setTenants(tenantsWithDetails);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: t('error'),
        description: 'Failed to fetch data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ').format(amount) + " so'm";
  };

  const handleExport = () => {
    if (filteredTenants.length === 0) {
      toast({
        title: t('error'),
        description: t('no_data_to_export'),
        variant: 'destructive',
      });
      return;
    }

    const exportData = filteredTenants.map(tenant => ({
      full_name: tenant.full_name,
      phone: tenant.phone,
      product_type: tenant.product_type,
      warehouse: tenant.warehouse?.name || '-',
      monthly_rent: Number(tenant.monthly_rent),
      admin: tenant.admin_profile?.full_name || '-',
      status: tenant.is_active ? t('active') : t('inactive'),
    }));

    exportToExcel(
      exportData,
      [
        { key: 'full_name', header: t('tenant_name') },
        { key: 'phone', header: t('tenant_phone') },
        { key: 'product_type', header: t('product_type') },
        { key: 'warehouse', header: t('warehouse') },
        { key: 'monthly_rent', header: t('monthly_rent') },
        { key: 'admin', header: t('admin') },
        { key: 'status', header: t('status') },
      ],
      { filename: 'ijarachilar', sheetName: 'Ijarachilar' }
    );

    toast({
      title: t('success'),
      description: t('export_success'),
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{t('tenants')}</h1>
            <p className="text-muted-foreground mt-1">
              Barcha adminlar bo'yicha ijarachilarni ko'ring
            </p>
          </div>
          <ExportButton onExport={handleExport} />
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('search') + ' (ism, telefon, mahsulot, ombor, admin)...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={selectedAdminId} onValueChange={setSelectedAdminId}>
            <SelectTrigger className="w-full sm:w-[220px]">
              <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Admin bo'yicha filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha adminlar</SelectItem>
              {admins.map((admin) => (
                <SelectItem key={admin.user_id} value={admin.user_id}>
                  {admin.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t('tenants')} ({filteredTenants.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">{t('loading')}</div>
            ) : filteredTenants.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery || selectedAdminId !== 'all' ? 'Hech narsa topilmadi' : t('no_tenants')}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('tenant_name')}</TableHead>
                      <TableHead>{t('tenant_phone')}</TableHead>
                      <TableHead>{t('product_type')}</TableHead>
                      <TableHead>{t('warehouse')}</TableHead>
                      <TableHead>{t('monthly_rent')}</TableHead>
                      <TableHead>{t('admin')}</TableHead>
                      <TableHead>{t('status')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTenants.map((tenant) => (
                      <TableRow key={tenant.id}>
                        <TableCell className="font-medium">{tenant.full_name}</TableCell>
                        <TableCell>{tenant.phone}</TableCell>
                        <TableCell>{tenant.product_type}</TableCell>
                        <TableCell>{tenant.warehouse?.name || '-'}</TableCell>
                        <TableCell>{formatCurrency(Number(tenant.monthly_rent))}</TableCell>
                        <TableCell>
                          <span className="text-muted-foreground">
                            {tenant.admin_profile?.full_name || '-'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              tenant.is_active
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }`}
                          >
                            {tenant.is_active ? t('active') : t('inactive')}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default OwnerTenants;
