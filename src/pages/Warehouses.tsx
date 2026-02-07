import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit, Trash2, Building2, Search, Loader2 } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { ExportButton } from '@/components/ExportButton';
import { exportToExcel } from '@/lib/exportToExcel';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileCard, MobileCardHeader, MobileCardRow } from '@/components/MobileCard';

type Warehouse = Tables<'warehouses'>;

interface WarehouseFormData {
  name: string;
  address: string;
  description: string;
  is_active: boolean;
}

const Warehouses = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user, role } = useAuth();
  const isMobile = useIsMobile();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [deletingWarehouse, setDeletingWarehouse] = useState<Warehouse | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState<WarehouseFormData>({
    name: '',
    address: '',
    description: '',
    is_active: true,
  });

  const filteredWarehouses = useMemo(() => {
    if (!searchQuery.trim()) return warehouses;
    const query = searchQuery.toLowerCase();
    return warehouses.filter(warehouse =>
      warehouse.name.toLowerCase().includes(query) ||
      warehouse.address?.toLowerCase().includes(query) ||
      warehouse.description?.toLowerCase().includes(query)
    );
  }, [warehouses, searchQuery]);

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('warehouses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWarehouses(data || []);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
      toast({
        title: t('error'),
        description: 'Failed to fetch warehouses',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (warehouse?: Warehouse) => {
    if (warehouse) {
      setEditingWarehouse(warehouse);
      setFormData({
        name: warehouse.name,
        address: warehouse.address || '',
        description: warehouse.description || '',
        is_active: warehouse.is_active,
      });
    } else {
      setEditingWarehouse(null);
      setFormData({
        name: '',
        address: '',
        description: '',
        is_active: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    try {
      if (editingWarehouse) {
        const { error } = await supabase
          .from('warehouses')
          .update({
            name: formData.name,
            address: formData.address || null,
            description: formData.description || null,
            is_active: formData.is_active,
          })
          .eq('id', editingWarehouse.id);

        if (error) throw error;
        toast({
          title: t('success'),
          description: t('updated_successfully'),
        });
      } else {
        const { error } = await supabase
          .from('warehouses')
          .insert({
            name: formData.name,
            address: formData.address || null,
            description: formData.description || null,
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
      fetchWarehouses();
    } catch (error) {
      console.error('Error saving warehouse:', error);
      toast({
        title: t('error'),
        description: 'Failed to save warehouse',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingWarehouse) return;

    try {
      const { error } = await supabase
        .from('warehouses')
        .delete()
        .eq('id', deletingWarehouse.id);

      if (error) throw error;
      toast({
        title: t('success'),
        description: t('deleted_successfully'),
      });
      setIsDeleteDialogOpen(false);
      setDeletingWarehouse(null);
      fetchWarehouses();
    } catch (error) {
      console.error('Error deleting warehouse:', error);
      toast({
        title: t('error'),
        description: 'Failed to delete warehouse',
        variant: 'destructive',
      });
    }
  };

  const canEdit = role === 'admin';

  const handleExport = () => {
    if (filteredWarehouses.length === 0) {
      toast({
        title: t('error'),
        description: t('no_data_to_export'),
        variant: 'destructive',
      });
      return;
    }

    const exportData = filteredWarehouses.map(warehouse => ({
      name: warehouse.name,
      address: warehouse.address || '-',
      description: warehouse.description || '-',
      status: warehouse.is_active ? t('active') : t('inactive'),
    }));

    exportToExcel(
      exportData,
      [
        { key: 'name', header: t('warehouse_name') },
        { key: 'address', header: t('warehouse_address') },
        { key: 'description', header: t('description') || 'Tavsif' },
        { key: 'status', header: t('status') },
      ],
      { filename: 'omborlar', sheetName: 'Omborlar' }
    );

    toast({
      title: t('success'),
      description: t('export_success'),
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 lg:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">{t('warehouses')}</h1>
            <p className="text-muted-foreground text-sm lg:text-base mt-1">
              {role === 'owner' ? 'Barcha omborlar' : "O'z omborlaringizni boshqaring"}
            </p>
          </div>
          <div className="flex gap-2">
            <ExportButton onExport={handleExport} />
            {canEdit && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => handleOpenDialog()} size={isMobile ? "sm" : "default"}>
                    <Plus className="mr-1.5 h-4 w-4" />
                    <span className="hidden sm:inline">{t('add_warehouse')}</span>
                    <span className="sm:hidden">Qo'shish</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingWarehouse ? t('edit_warehouse') : t('add_warehouse')}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">{t('warehouse_name')} *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">{t('warehouse_address')}</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Tavsif</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                      />
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
              placeholder={t('search') + ' (nom, manzil)...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Desktop Table View */}
        {!isMobile && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {t('warehouses')} ({filteredWarehouses.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">{t('loading')}</div>
              ) : filteredWarehouses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? 'Hech narsa topilmadi' : t('no_warehouses')}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('warehouse_name')}</TableHead>
                      <TableHead>{t('warehouse_address')}</TableHead>
                      <TableHead>{t('status')}</TableHead>
                      {canEdit && <TableHead className="text-right">{t('actions')}</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredWarehouses.map((warehouse) => (
                      <TableRow key={warehouse.id}>
                        <TableCell className="font-medium">{warehouse.name}</TableCell>
                        <TableCell>{warehouse.address || '-'}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              warehouse.is_active
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }`}
                          >
                            {warehouse.is_active ? t('active') : t('inactive')}
                          </span>
                        </TableCell>
                        {canEdit && (
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenDialog(warehouse)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setDeletingWarehouse(warehouse);
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
              )}
            </CardContent>
          </Card>
        )}

        {/* Mobile Card View */}
        {isMobile && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="h-5 w-5 text-primary" />
              <span className="font-semibold">{t('warehouses')} ({filteredWarehouses.length})</span>
            </div>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">{t('loading')}</div>
            ) : filteredWarehouses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? 'Hech narsa topilmadi' : t('no_warehouses')}
              </div>
            ) : (
              filteredWarehouses.map((warehouse) => (
                <MobileCard key={warehouse.id}>
                  <MobileCardHeader
                    title={warehouse.name}
                    subtitle={warehouse.address || t('warehouse_address') + ' ko\'rsatilmagan'}
                    actions={
                      canEdit && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleOpenDialog(warehouse)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setDeletingWarehouse(warehouse);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      )
                    }
                  />
                  <MobileCardRow
                    label={t('status')}
                    value={
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          warehouse.is_active
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}
                      >
                        {warehouse.is_active ? t('active') : t('inactive')}
                      </span>
                    }
                  />
                  {warehouse.description && (
                    <MobileCardRow label="Tavsif" value={warehouse.description} />
                  )}
                </MobileCard>
              ))
            )}
          </div>
        )}
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('delete')} {deletingWarehouse?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu amalni qaytarib bo'lmaydi. Ombor butunlay o'chiriladi.
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

export default Warehouses;
