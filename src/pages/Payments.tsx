import React, { useState, useEffect, useMemo } from 'react';
import { Plus, CreditCard, AlertCircle, Search } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { getMonthName } from '@/lib/i18n';
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
}

const Payments = () => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const { user, role } = useAuth();
  const [payments, setPayments] = useState<PaymentWithTenant[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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
      // Check if payment already exists
      const { data: existingPayment } = await supabase
        .from('payments')
        .select('id')
        .eq('tenant_id', formData.tenant_id)
        .eq('month', formData.month)
        .eq('year', formData.year)
        .maybeSingle();

      // Calculate carry over debt from previous month
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold">{t('payments')}</h1>
            <p className="text-muted-foreground mt-1">
              To'lovlarni boshqaring va qarzlarni kuzating
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(Number(v))}>
                <SelectTrigger className="w-[140px]">
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
                <SelectTrigger className="w-[100px]">
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
            {canEdit && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={handleOpenDialog}>
                    <Plus className="mr-2 h-4 w-4" />
                    {t('record_payment')}
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
                    <div className="space-y-2">
                      <Label htmlFor="expected_amount">{t('expected_amount')} (so'm)</Label>
                      <Input
                        id="expected_amount"
                        type="number"
                        value={formData.expected_amount}
                        onChange={(e) => setFormData({ ...formData, expected_amount: Number(e.target.value) })}
                        min="0"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="paid_amount">{t('paid_amount')} (so'm) *</Label>
                      <Input
                        id="paid_amount"
                        type="number"
                        value={formData.paid_amount}
                        onChange={(e) => setFormData({ ...formData, paid_amount: Number(e.target.value) })}
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
              <div className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">{t('remaining')}</div>
              <div className="text-2xl font-bold text-red-600">{formatCurrency(totalRemaining)}</div>
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
                              <span className="text-orange-600">
                                +{formatCurrency(Number(payment.carry_over_debt))}
                              </span>
                            )}
                            {Number(payment.carry_over_debt) === 0 && '-'}
                          </TableCell>
                          <TableCell className="font-medium">{formatCurrency(total)}</TableCell>
                          <TableCell className="text-green-600">{formatCurrency(Number(payment.paid_amount))}</TableCell>
                          <TableCell className={remaining > 0 ? 'text-red-600' : ''}>
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
                        </TableRow>
                      );
                    })}
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

export default Payments;
