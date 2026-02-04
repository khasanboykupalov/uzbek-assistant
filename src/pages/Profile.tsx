import React, { useState, useEffect } from 'react';
import { User, Phone, Save, Loader2 } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

const profileSchema = z.object({
  full_name: z.string().trim().min(2, 'Ism kamida 2 ta harf bo\'lishi kerak').max(100),
  phone: z.string().trim().min(9, 'Telefon raqami kamida 9 ta raqam bo\'lishi kerak').max(20),
});

const Profile = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, phone, email')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;

        setFormData({
          full_name: data.full_name || '',
          phone: data.phone || '',
          email: data.email || '',
        });
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast({
          title: t('error'),
          description: 'Profil ma\'lumotlarini yuklashda xatolik',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    setFormErrors({});

    const result = profileSchema.safeParse({
      full_name: formData.full_name,
      phone: formData.phone,
    });

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

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name.trim(),
          phone: formData.phone.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: t('success'),
        description: t('profile_updated'),
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: t('error'),
        description: error.message || 'Profilni yangilashda xatolik',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-3">
            <User className="h-8 w-8 text-primary" />
            {t('profile_settings')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('profile_settings_description')}
          </p>
        </div>

        {/* Profile Form */}
        <Card>
          <CardHeader>
            <CardTitle>{t('personal_info')}</CardTitle>
            <CardDescription>{t('update_your_info')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Email (read-only) */}
            <div className="space-y-2">
              <Label>{t('email')}</Label>
              <Input
                type="email"
                value={formData.email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                {t('email_cannot_be_changed')}
              </p>
            </div>

            {/* Full Name */}
            <div className="space-y-2">
              <Label>{t('full_name')}</Label>
              <Input
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder={t('enter_full_name')}
                className={formErrors.full_name ? 'border-destructive' : ''}
              />
              {formErrors.full_name && (
                <p className="text-sm text-destructive">{formErrors.full_name}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                {t('phone')}
              </Label>
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

            {/* Save Button */}
            <div className="flex justify-end pt-4">
              <Button onClick={handleSave} disabled={isSaving} className="gradient-primary">
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('saving')}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {t('save_changes')}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
