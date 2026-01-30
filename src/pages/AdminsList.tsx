import React, { useState, useEffect } from 'react';
import { Plus, Search, MoreVertical, Shield, ShieldOff, UserCog, Loader2, Pencil } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

const adminSchema = z.object({
  full_name: z.string().min(2, 'Ism kamida 2 ta harf bo\'lishi kerak').max(100),
  email: z.string().email('Email formati noto\'g\'ri').max(255),
  phone: z.string().min(9, 'Telefon raqami kamida 9 ta raqam bo\'lishi kerak').max(20),
  password: z.string().min(6, 'Parol kamida 6 ta belgi bo\'lishi kerak').max(100),
});

const editAdminSchema = z.object({
  full_name: z.string().min(2, 'Ism kamida 2 ta harf bo\'lishi kerak').max(100),
  phone: z.string().min(9, 'Telefon raqami kamida 9 ta raqam bo\'lishi kerak').max(20),
});

interface Admin {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  is_blocked: boolean;
  created_at: string;
}

const AdminsList = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
  });
  const [editFormData, setEditFormData] = useState({
    full_name: '',
    phone: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [editFormErrors, setEditFormErrors] = useState<Record<string, string>>({});

  const fetchAdmins = async () => {
    try {
      // Get all users with admin role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (roleError) throw roleError;

      if (!roleData || roleData.length === 0) {
        setAdmins([]);
        setIsLoading(false);
        return;
      }

      const adminUserIds = roleData.map(r => r.user_id);

      // Get profiles for these users
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', adminUserIds);

      if (profileError) throw profileError;

      // Get block status
      const { data: statusData, error: statusError } = await supabase
        .from('admin_status')
        .select('*')
        .in('admin_id', adminUserIds);

      if (statusError) throw statusError;

      const statusMap = new Map(statusData?.map(s => [s.admin_id, s.is_blocked]) || []);

      const adminList: Admin[] = (profileData || []).map(profile => ({
        id: profile.id,
        user_id: profile.user_id,
        full_name: profile.full_name,
        email: profile.email || '',
        phone: profile.phone || '',
        is_blocked: statusMap.get(profile.user_id) || false,
        created_at: profile.created_at,
      }));

      setAdmins(adminList);
    } catch (error) {
      console.error('Error fetching admins:', error);
      toast({
        title: t('error'),
        description: 'Adminlarni yuklashda xatolik',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleAddAdmin = async () => {
    setFormErrors({});
    
    const result = adminSchema.safeParse(formData);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0] as string] = err.message;
        }
      });
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      // Get current session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Avtorizatsiya talab qilinadi');
      }

      // Call edge function to create admin
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-admin`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            full_name: formData.full_name,
            phone: formData.phone,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Admin yaratishda xatolik');
      }

      toast({
        title: t('success'),
        description: t('created_successfully'),
      });

      setIsAddDialogOpen(false);
      setFormData({ full_name: '', email: '', phone: '', password: '' });
      fetchAdmins();
    } catch (error: any) {
      console.error('Error adding admin:', error);
      toast({
        title: t('error'),
        description: error.message || 'Admin qo\'shishda xatolik',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleBlock = async (admin: Admin) => {
    try {
      const newBlockedStatus = !admin.is_blocked;
      
      const { error } = await supabase
        .from('admin_status')
        .upsert(
          {
            admin_id: admin.user_id,
            is_blocked: newBlockedStatus,
            blocked_at: newBlockedStatus ? new Date().toISOString() : null,
            blocked_reason: newBlockedStatus ? 'Owner tomonidan bloklandi' : null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'admin_id' }
        );

      if (error) {
        console.error('Block toggle error:', error);
        throw error;
      }

      toast({
        title: t('success'),
        description: newBlockedStatus ? t('blocked_successfully') : t('unblocked_successfully'),
      });

      fetchAdmins();
    } catch (error: any) {
      console.error('Error toggling block:', error);
      toast({
        title: t('error'),
        description: error.message || 'Xatolik yuz berdi',
        variant: 'destructive',
      });
    }
  };

  const handleOpenEditDialog = (admin: Admin) => {
    setEditingAdmin(admin);
    setEditFormData({
      full_name: admin.full_name,
      phone: admin.phone,
    });
    setEditFormErrors({});
    setIsEditDialogOpen(true);
  };

  const handleEditAdmin = async () => {
    if (!editingAdmin) return;
    
    setEditFormErrors({});
    
    const result = editAdminSchema.safeParse(editFormData);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0] as string] = err.message;
        }
      });
      setEditFormErrors(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editFormData.full_name.trim(),
          phone: editFormData.phone.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', editingAdmin.user_id);

      if (error) throw error;

      toast({
        title: t('success'),
        description: t('updated_successfully'),
      });

      setIsEditDialogOpen(false);
      setEditingAdmin(null);
      fetchAdmins();
    } catch (error: any) {
      console.error('Error updating admin:', error);
      toast({
        title: t('error'),
        description: error.message || 'Adminni yangilashda xatolik',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredAdmins = admins.filter(admin =>
    admin.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    admin.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    admin.phone.includes(searchQuery)
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-3">
              <UserCog className="h-8 w-8 text-primary" />
              {t('admins')}
            </h1>
            <p className="text-muted-foreground mt-1">
              Ombor adminlarini boshqarish
            </p>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)} className="gradient-primary">
            <Plus className="h-4 w-4 mr-2" />
            {t('add_admin')}
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('search') + '...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredAdmins.length === 0 ? (
              <div className="text-center py-12">
                <UserCog className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">{t('no_admins')}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('admin_name')}</TableHead>
                    <TableHead>{t('admin_email')}</TableHead>
                    <TableHead>{t('admin_phone')}</TableHead>
                    <TableHead>{t('status')}</TableHead>
                    <TableHead className="w-[80px]">{t('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAdmins.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell className="font-medium">{admin.full_name}</TableCell>
                      <TableCell>{admin.email}</TableCell>
                      <TableCell>{admin.phone}</TableCell>
                      <TableCell>
                        <Badge variant={admin.is_blocked ? 'destructive' : 'default'}>
                          {admin.is_blocked ? t('blocked') : t('active')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenEditDialog(admin)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              {t('edit')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleBlock(admin)}>
                              {admin.is_blocked ? (
                                <>
                                  <Shield className="h-4 w-4 mr-2" />
                                  {t('unblock')}
                                </>
                              ) : (
                                <>
                                  <ShieldOff className="h-4 w-4 mr-2" />
                                  {t('block')}
                                </>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Admin Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('add_admin')}</DialogTitle>
            <DialogDescription>
              Yangi admin hisobini yarating
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('admin_name')}</Label>
              <Input
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Ism Familiya"
                className={formErrors.full_name ? 'border-destructive' : ''}
              />
              {formErrors.full_name && (
                <p className="text-sm text-destructive">{formErrors.full_name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>{t('admin_email')}</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
                className={formErrors.email ? 'border-destructive' : ''}
              />
              {formErrors.email && (
                <p className="text-sm text-destructive">{formErrors.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>{t('admin_phone')}</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+998 90 123 45 67"
                className={formErrors.phone ? 'border-destructive' : ''}
              />
              {formErrors.phone && (
                <p className="text-sm text-destructive">{formErrors.phone}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>{t('password')}</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className={formErrors.password ? 'border-destructive' : ''}
              />
              {formErrors.password && (
                <p className="text-sm text-destructive">{formErrors.password}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={handleAddAdmin} disabled={isSubmitting} className="gradient-primary">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('loading')}
                </>
              ) : (
                t('add')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Admin Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('edit_admin')}</DialogTitle>
            <DialogDescription>
              Admin ma'lumotlarini yangilang
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('admin_name')}</Label>
              <Input
                value={editFormData.full_name}
                onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                placeholder="Ism Familiya"
                className={editFormErrors.full_name ? 'border-destructive' : ''}
              />
              {editFormErrors.full_name && (
                <p className="text-sm text-destructive">{editFormErrors.full_name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>{t('admin_email')}</Label>
              <Input
                type="email"
                value={editingAdmin?.email || ''}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">Email o'zgartirib bo'lmaydi</p>
            </div>
            <div className="space-y-2">
              <Label>{t('admin_phone')}</Label>
              <Input
                value={editFormData.phone}
                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                placeholder="+998 90 123 45 67"
                className={editFormErrors.phone ? 'border-destructive' : ''}
              />
              {editFormErrors.phone && (
                <p className="text-sm text-destructive">{editFormErrors.phone}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={handleEditAdmin} disabled={isSubmitting} className="gradient-primary">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('loading')}
                </>
              ) : (
                t('save')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminsList;
