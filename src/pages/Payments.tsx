import React, { useState, useEffect, useMemo } from 'react';
import { Plus, CreditCard, AlertCircle, Search, MoreVertical, Pencil, Trash2 } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { getMonthName } from '@/lib/i18n';
import { ExportButton } from '@/components/ExportButton';
import { exportToExcel } from '@/lib/exportToExcel';
import { useNotifications } from '@/hooks/useNotifications';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileCard, MobileCardHeader, MobileCardRow, MobileCardDivider } from '@/components/MobileCard';
import type { Tables } from '@/integrations/supabase/types';

type Payment = Tables<'payments'>;
type Tenant = Tables<'tenants'>;

interface PaymentWithTenant extends Payment {
  tenant?: Tenant;
}

interface PaymentFormData {
  tenant_id: string;
  month: number;
  year: number;
  expected_amount: number;
  paid_amount: number;
  notes: string;
  isAdvancePayment?: boolean;
  advanceMonths?: number;
}

const Payments = () => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const { user, role } = useAuth();
  const { notifyOwner } = useNotifications();
  const isMobile = useIsMobile();
  const [payments, setPayments] = useState<PaymentWithTenant[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentWithTenant | null>(null);
  const [deletingPayment, setDeletingPayment] = useState<PaymentWithTenant | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState<PaymentFormData>({
    tenant_id: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    expected_amount: 0,
    paid_amount: 0,
    notes: '',
    isAdvancePayment: false,
    advanceMonths: 1,
  });
  const [editFormData, setEditFormData] = useState({
    paid_amount: 0,
    notes: '',
  });

  const filteredPayments = useMemo(() => {
    if (!searchQuery.trim()) return payments;
    const query = searchQuery.toLowerCase();
    return payments.filter(payment =>
      payment.tenant?.full_name?.toLowerCase().includes(query) ||
      payment.tenant?.phone?.includes(query) ||
      payment.tenant?.product_type?.toLowerCase().includes(query) ||
      payment.notes?.toLowerCase().includes(query)
    );
  }, [payments, searchQuery]);

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch tenants
      const { data: tenantsData, error: tenantsError } = await supabase
        .from('tenants')
        .select('*')
        .eq('is_active', true)
        .order('full_name');

      if (tenantsError) throw tenantsError;
      setTenants(tenantsData || []);

      // Fetch payments for selected month/year
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select(`
          *,
          tenant:tenants(*)
        `)
        .eq('month', selectedMonth)
        .eq('year', selectedYear)
        .order('created_at', { ascending: false });

      if (paymentsError) throw paymentsError;
      setPayments(paymentsData || []);
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

  const handleOpenDialog = () => {
    setFormData({
      tenant_id: tenants[0]?.id || '',
      month: selectedMonth,
      year: selectedYear,
      expected_amount: tenants[0]?.monthly_rent ? Number(tenants[0].monthly_rent) : 0,
      paid_amount: 0,
      notes: '',
      isAdvancePayment: false,
      advanceMonths: 1,
    });
    setIsDialogOpen(true);
  };

  const handleTenantChange = (tenantId: string) => {
    const tenant = tenants.find(t => t.id === tenantId);
    setFormData({
      ...formData,
      tenant_id: tenantId,
      expected_amount: tenant ? Number(tenant.monthly_rent) : 0,
    });
  };

  const calculateCarryOver = async (tenantId: string, month: number, year: number): Promise<number> => {
    // Get previous month's payment
    let prevMonth = month - 1;
    let prevYear = year;
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear = year - 1;
    }

    const { data: prevPayment } = await supabase
      .from('payments')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('month', prevMonth)
      .eq('year', prevYear)
      .maybeSingle();

    if (prevPayment) {
      const remaining = Number(prevPayment.expected_amount) + Number(prevPayment.carry_over_debt) - Number(prevPayment.paid_amount);
      return remaining > 0 ? remaining : 0;
    }
    return 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    try {
      const selectedTenant = tenants.find(t => t.id === formData.tenant_id);
      
      if (formData.isAdvancePayment && (formData.advanceMonths || 0) > 1) {
        // Handle advance payment - create multiple payment records
        const monthsToCreate = formData.advanceMonths || 1;
        const amountPerMonth = Math.round(formData.paid_amount / monthsToCreate);
        
        let currentMonth = formData.month;
        let currentYear = formData.year;
        
        for (let i = 0; i < monthsToCreate; i++) {
          const { data: existingPayment } = await supabase
            .from('payments')
            .select('id')
            .eq('tenant_id', formData.tenant_id)
            .eq('month', currentMonth)
            .eq('year', currentYear)
            .maybeSingle();

          const carryOver = await calculateCarryOver(formData.tenant_id, currentMonth, currentYear);
          
          if (existingPayment) {
            // Update existing payment
            await supabase
              .from('payments')
              .update({
                paid_amount: amountPerMonth,
                notes: (formData.notes ? formData.notes + ' (Oldindan to\'lov)' : 'Oldindan to\'lov'),
                payment_date: new Date().toISOString(),
              })
              .eq('id', existingPayment.id);
          } else {
            // Create new payment
            await supabase
              .from('payments')
              .insert({
                tenant_id: formData.tenant_id,
                month: currentMonth,
                year: currentYear,
                expected_amount: formData.expected_amount,
                paid_amount: amountPerMonth,
                carry_over_debt: carryOver,
                notes: formData.notes ? formData.notes + ' (Oldindan to\'lov)' : 'Oldindan to\'lov',
                payment_date: new Date().toISOString(),
              });
          }

          // Move to next month
          currentMonth++;
          if (currentMonth > 12) {
            currentMonth = 1;
            currentYear++;
          }
        }

        if (selectedTenant && formData.paid_amount > 0) {
          notifyOwner(
            'Oldindan to\'lov qabul qilindi',
            `${selectedTenant.full_name} - ${formData.paid_amount.toLocaleString()} so'm (${monthsToCreate} oy)`,
            'success'
          );
        }

        toast({
          title: t('success'),
          description: `${monthsToCreate} oylik to'lov qayd etildi`,
        });
      } else {
        // Handle regular payment
        const { data: existingPayment } = await supabase
          .from('payments')
          .select('id')
          .eq('tenant_id', formData.tenant_id)
          .eq('month', formData.month)
          .eq('year', formData.year)
          .maybeSingle();

        const carryOver = await calculateCarryOver(formData.tenant_id, formData.month, formData.year);

        if (existingPayment) {
          // Update existing payment
          const { error } = await supabase
            .from('payments')
            .update({
              paid_amount: formData.paid_amount,
              notes: formData.notes || null,
              payment_date: new Date().toISOString(),
            })
            .eq('id', existingPayment.id);

          if (error) throw error;
          toast({
            title: t('success'),
            description: t('updated_successfully'),
          });
        } else {
          // Create new payment
          const { error } = await supabase
            .from('payments')
            .insert({
              tenant_id: formData.tenant_id,
              month: formData.month,
              year: formData.year,
              expected_amount: formData.expected_amount,
              paid_amount: formData.paid_amount,
              carry_over_debt: carryOver,
              notes: formData.notes || null,
              payment_date: formData.paid_amount > 0 ? new Date().toISOString() : null,
            });

          if (error) throw error;
          toast({
            title: t('success'),
            description: t('created_successfully'),
          });

          // Notify owner about new payment record
          if (selectedTenant && formData.paid_amount > 0) {
            notifyOwner(
              'Yangi to\'lov qabul qilindi',
              `${selectedTenant.full_name} - ${formData.paid_amount.toLocaleString()} so'm (${getMonthName(language, formData.month)})`,
              'success'
            );
          }
        }
      }

      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving payment:', error);
      toast({
        title: t('error'),
        description: 'Failed to save payment',
        variant: 'destructive',
      });
    }
  };

  const handleOpenEditDialog = (payment: PaymentWithTenant) => {
    setEditingPayment(payment);
    setEditFormData({
      paid_amount: Number(payment.paid_amount),
      notes: payment.notes || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleEditPayment = async () => {
    if (!editingPayment) return;

    try {
      const { error } = await supabase
        .from('payments')
        .update({
          paid_amount: editFormData.paid_amount,
          notes: editFormData.notes || null,
          payment_date: editFormData.paid_amount > 0 ? new Date().toISOString() : null,
        })
        .eq('id', editingPayment.id);

      if (error) throw error;

      toast({
        title: t('success'),
        description: t('updated_successfully'),
      });

      setIsEditDialogOpen(false);
      setEditingPayment(null);
      fetchData();
    } catch (error) {
      console.error('Error updating payment:', error);
      toast({
        title: t('error'),
        description: "To'lovni yangilashda xatolik",
        variant: 'destructive',
      });
    }
  };

  const handleDeletePayment = async () => {
    if (!deletingPayment) return;

    try {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', deletingPayment.id);

      if (error) throw error;

      toast({
        title: t('success'),
        description: t('deleted_successfully'),
      });

      setIsDeleteDialogOpen(false);
      setDeletingPayment(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting payment:', error);
      toast({
        title: t('error'),
        description: "To'lovni o'chirishda xatolik",
        variant: 'destructive',
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ').format(amount) + " so'm";
  };

  const getPaymentStatus = (payment: PaymentWithTenant) => {
    const total = Number(payment.expected_amount) + Number(payment.carry_over_debt);
    const paid = Number(payment.paid_amount);
    
    if (paid >= total) return 'paid';
    if (paid > 0) return 'partial';
    return 'unpaid';
  };

  const canEdit = role === 'admin';

  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  // Calculate summary
  const totalExpected = payments.reduce((sum, p) => sum + Number(p.expected_amount) + Number(p.carry_over_debt), 0);
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.paid_amount), 0);
  const totalRemaining = totalExpected - totalPaid;

  const handleExport = () => {
    if (filteredPayments.length === 0) {
      toast({
        title: t('error'),
        description: t('no_data_to_export'),
        variant: 'destructive',
      });
      return;
    }

    const exportData = filteredPayments.map(payment => ({
      tenant_name: payment.tenant?.full_name || '-',
      phone: payment.tenant?.phone || '-',
      expected_amount: Number(payment.expected_amount),
      carry_over_debt: Number(payment.carry_over_debt),
      total: Number(payment.expected_amount) + Number(payment.carry_over_debt),
      paid_amount: Number(payment.paid_amount),
      remaining: Number(payment.expected_amount) + Number(payment.carry_over_debt) - Number(payment.paid_amount),
      notes: payment.notes || '',
    }));

    exportToExcel(
      exportData,
      [
        { key: 'tenant_name', header: t('tenant_name') },
        { key: 'phone', header: t('tenant_phone') },
        { key: 'expected_amount', header: t('expected_amount') },
        { key: 'carry_over_debt', header: t('carry_over') },
        { key: 'total', header: 'Jami' },
        { key: 'paid_amount', header: t('paid_amount') },
        { key: 'remaining', header: t('remaining') },
        { key: 'notes', header: 'Izoh' },
      ],
      { filename: `tolovlar_${getMonthName(language, selectedMonth)}_${selectedYear}`, sheetName: 'To\'lovlar' }
    );

    toast({
      title: t('success'),
      description: t('export_success'),
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 lg:space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold">{t('payments')}</h1>
              <p className="text-muted-foreground text-sm lg:text-base mt-1">
                To'lovlarni boshqaring va qarzlarni kuzating
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <ExportButton onExport={handleExport} />
              {canEdit && (
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={handleOpenDialog} size={isMobile ? "sm" : "default"}>
                      <Plus className="mr-1.5 h-4 w-4" />
                      <span className="hidden sm:inline">{t('record_payment')}</span>
                      <span className="sm:hidden">To'lov</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                    <DialogTitle>{t('record_payment')}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="tenant_id">Ijarachi *</Label>
                      <Select
                        value={formData.tenant_id}
                        onValueChange={handleTenantChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Ijarachini tanlang" />
                        </SelectTrigger>
                        <SelectContent>
                          {tenants.map((tenant) => (
                            <SelectItem key={tenant.id} value={tenant.id}>
                              {tenant.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Oy</Label>
                        <Select
                          value={formData.month.toString()}
                          onValueChange={(v) => setFormData({ ...formData, month: Number(v) })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {months.map((m) => (
                              <SelectItem key={m} value={m.toString()}>
                                {getMonthName(language, m)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Yil</Label>
                        <Select
                          value={formData.year.toString()}
                          onValueChange={(v) => setFormData({ ...formData, year: Number(v) })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {years.map((y) => (
                              <SelectItem key={y} value={y.toString()}>
                                {y}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    {/* Advance Payment Toggle */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.isAdvancePayment || false}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            isAdvancePayment: e.target.checked,
                            advanceMonths: e.target.checked ? 1 : undefined
                          })}
                          className="rounded"
                        />
                        <span className="text-sm font-medium">Oldindan to'lov (bir necha oyga)</span>
                      </label>
                    </div>

                    {formData.isAdvancePayment && (
                      <div className="space-y-2">
                        <Label htmlFor="advance_months">Oylar soni</Label>
                        <Input
                          id="advance_months"
                          type="number"
                          min="1"
                          max="12"
                          value={formData.advanceMonths || 1}
                          onChange={(e) => setFormData({ ...formData, advanceMonths: Number(e.target.value) || 1 })}
                        />
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="expected_amount">{t('expected_amount')} (so'm)</Label>
                      <Input
                        id="expected_amount"
                        type="number"
                        value={formData.expected_amount || ''}
                        onChange={(e) => setFormData({ ...formData, expected_amount: Number(e.target.value) || 0 })}
                        onFocus={(e) => e.target.select()}
                        min="0"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="paid_amount">{t('paid_amount')} (so'm) *</Label>
                      <Input
                        id="paid_amount"
                        type="number"
                        value={formData.paid_amount || ''}
                        onChange={(e) => setFormData({ ...formData, paid_amount: Number(e.target.value) || 0 })}
                        onFocus={(e) => e.target.select()}
                        min="0"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">Izoh</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        rows={2}
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
          
          {/* Month/Year Selectors */}
          <div className="flex gap-2">
            <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(Number(v))}>
              <SelectTrigger className="w-[120px] sm:w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((m) => (
                  <SelectItem key={m} value={m.toString()}>
                    {getMonthName(language, m)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(Number(v))}>
              <SelectTrigger className="w-[90px] sm:w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">{t('expected_amount')}</div>
              <div className="text-2xl font-bold">{formatCurrency(totalExpected)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">{t('paid_amount')}</div>
              <div className="text-2xl font-bold text-success">{formatCurrency(totalPaid)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">{t('remaining')}</div>
              <div className="text-2xl font-bold text-destructive">{formatCurrency(totalRemaining)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('search') + ' (ism, telefon)...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Desktop Table View */}
        {!isMobile && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                {getMonthName(language, selectedMonth)} {selectedYear} - {t('payments')} ({filteredPayments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">{t('loading')}</div>
              ) : filteredPayments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  {searchQuery ? 'Hech narsa topilmadi' : 'Bu oy uchun to\'lov qayd etilmagan'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ijarachi</TableHead>
                        <TableHead>{t('expected_amount')}</TableHead>
                        <TableHead>{t('carry_over')}</TableHead>
                        <TableHead>Jami</TableHead>
                        <TableHead>{t('paid_amount')}</TableHead>
                        <TableHead>{t('remaining')}</TableHead>
                        <TableHead>{t('status')}</TableHead>
                        {canEdit && <TableHead className="w-[80px]">{t('actions')}</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayments.map((payment) => {
                        const total = Number(payment.expected_amount) + Number(payment.carry_over_debt);
                        const remaining = total - Number(payment.paid_amount);
                        const status = getPaymentStatus(payment);
                        
                        return (
                          <TableRow key={payment.id}>
                            <TableCell className="font-medium">{payment.tenant?.full_name || '-'}</TableCell>
                            <TableCell>{formatCurrency(Number(payment.expected_amount))}</TableCell>
                            <TableCell>
                              {Number(payment.carry_over_debt) > 0 && (
                                <span className="text-warning">
                                  +{formatCurrency(Number(payment.carry_over_debt))}
                                </span>
                              )}
                              {Number(payment.carry_over_debt) === 0 && '-'}
                            </TableCell>
                            <TableCell className="font-medium">{formatCurrency(total)}</TableCell>
                            <TableCell className="text-success">{formatCurrency(Number(payment.paid_amount))}</TableCell>
                            <TableCell className={remaining > 0 ? 'text-destructive' : ''}>
                              {remaining > 0 ? formatCurrency(remaining) : '-'}
                            </TableCell>
                            <TableCell>
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  status === 'paid'
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                    : status === 'partial'
                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                }`}
                              >
                                {status === 'paid' ? "To'langan" : status === 'partial' ? "Qisman" : "To'lanmagan"}
                              </span>
                            </TableCell>
                            {canEdit && (
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleOpenEditDialog(payment)}>
                                      <Pencil className="h-4 w-4 mr-2" />
                                      {t('edit')}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setDeletingPayment(payment);
                                        setIsDeleteDialogOpen(true);
                                      }}
                                      className="text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      {t('delete')}
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Mobile Card View */}
        {isMobile && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="h-5 w-5 text-primary" />
              <span className="font-semibold">
                {getMonthName(language, selectedMonth)} {selectedYear} ({filteredPayments.length})
              </span>
            </div>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">{t('loading')}</div>
            ) : filteredPayments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                {searchQuery ? 'Hech narsa topilmadi' : 'Bu oy uchun to\'lov qayd etilmagan'}
              </div>
            ) : (
              filteredPayments.map((payment) => {
                const total = Number(payment.expected_amount) + Number(payment.carry_over_debt);
                const remaining = total - Number(payment.paid_amount);
                const status = getPaymentStatus(payment);
                
                return (
                  <MobileCard key={payment.id}>
                    <MobileCardHeader
                      title={payment.tenant?.full_name || '-'}
                      subtitle={payment.tenant?.phone}
                      actions={
                        canEdit && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleOpenEditDialog(payment)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                {t('edit')}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setDeletingPayment(payment);
                                  setIsDeleteDialogOpen(true);
                                }}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {t('delete')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )
                      }
                    />
                    <MobileCardDivider />
                    <MobileCardRow label={t('expected_amount')} value={formatCurrency(Number(payment.expected_amount))} />
                    {Number(payment.carry_over_debt) > 0 && (
                      <MobileCardRow 
                        label={t('carry_over')} 
                        value={<span className="text-warning">+{formatCurrency(Number(payment.carry_over_debt))}</span>} 
                      />
                    )}
                    <MobileCardRow label="Jami" value={<span className="font-semibold">{formatCurrency(total)}</span>} />
                    <MobileCardRow label={t('paid_amount')} value={<span className="text-success">{formatCurrency(Number(payment.paid_amount))}</span>} />
                    {remaining > 0 && (
                      <MobileCardRow label={t('remaining')} value={<span className="text-destructive">{formatCurrency(remaining)}</span>} />
                    )}
                    <MobileCardRow
                      label={t('status')}
                      value={
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            status === 'paid'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : status === 'partial'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}
                        >
                          {status === 'paid' ? "To'langan" : status === 'partial' ? "Qisman" : "To'lanmagan"}
                        </span>
                      }
                    />
                  </MobileCard>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Edit Payment Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>To'lovni tahrirlash</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Ijarachi</Label>
              <Input
                value={editingPayment?.tenant?.full_name || '-'}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label>Oy / Yil</Label>
              <Input
                value={editingPayment ? `${getMonthName(language, editingPayment.month)} ${editingPayment.year}` : '-'}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('expected_amount')}</Label>
              <Input
                value={formatCurrency(Number(editingPayment?.expected_amount || 0) + Number(editingPayment?.carry_over_debt || 0))}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_paid_amount">{t('paid_amount')} (so'm) *</Label>
              <Input
                id="edit_paid_amount"
                type="number"
                value={editFormData.paid_amount || ''}
                onChange={(e) => setEditFormData({ ...editFormData, paid_amount: Number(e.target.value) || 0 })}
                onFocus={(e) => e.target.select()}
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_notes">Izoh</Label>
              <Textarea
                id="edit_notes"
                value={editFormData.notes}
                onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="flex-1">
              {t('cancel')}
            </Button>
            <Button onClick={handleEditPayment} className="flex-1">
              {t('save')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>To'lovni o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingPayment?.tenant?.full_name} uchun {getMonthName(language, deletingPayment?.month || 1)} {deletingPayment?.year} 
              to'lovini o'chirishni xohlaysizmi? Bu amalni qaytarib bo'lmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePayment} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Payments;
