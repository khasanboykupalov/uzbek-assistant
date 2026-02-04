import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit, Trash2, Users, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ExportButton } from '@/components/ExportButton';
import { exportToExcel } from '@/lib/exportToExcel';
import type { Tables } from '@/integrations/supabase/types';

type Tenant = Tables<'tenants'>;
type Warehouse = Tables<'warehouses'>;

interface TenantFormData {
  full_name: string;
  phone: string;
  product_type: string;
  monthly_rent: number;
  warehouse_id: string;
  is_active: boolean;
}

const Tenants = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user, role } = useAuth();
  const [tenants, setTenants] = useState<(Tenant & { warehouse?: Warehouse })[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [deletingTenant, setDeletingTenant] = useState<Tenant | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState<TenantFormData>({
    full_name: '',
    phone: '',
    product_type: '',
    monthly_rent: 0,
    warehouse_id: '',
    is_active: true,
  });

  const filteredTenants = useMemo(() => {
    if (!searchQuery.trim()) return tenants;
    const query = searchQuery.toLowerCase();
    return tenants.filter(tenant =>
      tenant.full_name.toLowerCase().includes(query) ||
      tenant.phone.includes(query) ||
      tenant.product_type.toLowerCase().includes(query) ||
      tenant.warehouse?.name?.toLowerCase().includes(query)
    );
  }, [tenants, searchQuery]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch warehouses
      const { data: warehousesData, error: warehousesError } = await supabase
        .from('warehouses')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (warehousesError) throw warehousesError;
      setWarehouses(warehousesData || []);

      // Fetch tenants with warehouse info
      const { data: tenantsData, error: tenantsError } = await supabase
        .from('tenants')
        .select(`
          *,
          warehouse:warehouses(*)
        `)
        .order('created_at', { ascending: false });

      if (tenantsError) throw tenantsError;
      setTenants(tenantsData || []);
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

  const handleOpenDialog = (tenant?: Tenant) => {
    if (tenant) {
      setEditingTenant(tenant);
      setFormData({
        full_name: tenant.full_name,
        phone: tenant.phone,
        product_type: tenant.product_type,
        monthly_rent: Number(tenant.monthly_rent),
        warehouse_id: tenant.warehouse_id,
        is_active: tenant.is_active,
      });
    } else {
      setEditingTenant(null);
      setFormData({
        full_name: '',
        phone: '',
        product_type: '',
        monthly_rent: 0,
        warehouse_id: warehouses[0]?.id || '',
        is_active: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    try {
      if (editingTenant) {
        const { error } = await supabase
          .from('tenants')
          .update({
            full_name: formData.full_name,
            phone: formData.phone,
            product_type: formData.product_type,
            monthly_rent: formData.monthly_rent,
            warehouse_id: formData.warehouse_id,
            is_active: formData.is_active,
          })
          .eq('id', editingTenant.id);

        if (error) throw error;
        toast({
          title: t('success'),
          description: t('updated_successfully'),
        });
      } else {
        const { error } = await supabase
          .from('tenants')
          .insert({
            full_name: formData.full_name,
            phone: formData.phone,
            product_type: formData.product_type,
            monthly_rent: formData.monthly_rent,
            warehouse_id: formData.warehouse_id,
            is_active: formData.is_active,
            admin_id: user.id,
          });

        if (error) throw error;
        toast({
          title: t('success'),
          description: t('created_successfully'),
        });
      }

      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving tenant:', error);
      toast({
        title: t('error'),
        description: 'Failed to save tenant',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingTenant) return;

    try {
      const { error } = await supabase
        .from('tenants')
        .delete()
        .eq('id', deletingTenant.id);

      if (error) throw error;
      toast({
        title: t('success'),
        description: t('deleted_successfully'),
      });
      setIsDeleteDialogOpen(false);
      setDeletingTenant(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting tenant:', error);
      toast({
        title: t('error'),
        description: 'Failed to delete tenant',
        variant: 'destructive',
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ').format(amount) + " so'm";
  };

  const canEdit = role === 'admin';

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
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold">{t('tenants')}</h1>
            <p className="text-muted-foreground mt-1">
              Ijarachilarni boshqaring
            </p>
          </div>
          <div className="flex gap-2">
            <ExportButton onExport={handleExport} />
            {canEdit && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => handleOpenDialog()}>
                    <Plus className="mr-2 h-4 w-4" />
                    {t('add_tenant')}
                  </Button>
                </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingTenant ? t('edit_tenant') : t('add_tenant')}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">{t('tenant_name')} *</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t('tenant_phone')} *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+998 XX XXX XX XX"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="product_type">{t('product_type')} *</Label>
                    <Input
                      id="product_type"
                      value={formData.product_type}
                      onChange={(e) => setFormData({ ...formData, product_type: e.target.value })}
                      placeholder="Masalan: Oziq-ovqat, Elektronika..."
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="monthly_rent">{t('monthly_rent')} (so'm) *</Label>
                    <Input
                      id="monthly_rent"
                      type="number"
                      value={formData.monthly_rent}
                      onChange={(e) => setFormData({ ...formData, monthly_rent: Number(e.target.value) })}
                      min="0"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="warehouse_id">{t('warehouse')} *</Label>
                    <Select
                      value={formData.warehouse_id}
                      onValueChange={(value) => setFormData({ ...formData, warehouse_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Omborni tanlang" />
                      </SelectTrigger>
                      <SelectContent>
                        {warehouses.map((warehouse) => (
                          <SelectItem key={warehouse.id} value={warehouse.id}>
                            {warehouse.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="is_active">{t('active')}</Label>
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                      {t('cancel')}
                    </Button>
                    <Button type="submit" className="flex-1">
                      {t('save')}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('search') + ' (ism, telefon, mahsulot turi)...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
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
                {searchQuery ? 'Hech narsa topilmadi' : t('no_tenants')}
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
                      <TableHead>{t('status')}</TableHead>
                      {canEdit && <TableHead className="text-right">{t('actions')}</TableHead>}
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
                        {canEdit && (
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenDialog(tenant)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setDeletingTenant(tenant);
                                  setIsDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('delete')} {deletingTenant?.full_name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu amalni qaytarib bo'lmaydi. Ijarachi butunlay o'chiriladi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Tenants;
