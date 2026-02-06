import { supabase } from '@/integrations/supabase/client';

interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  relatedId?: string;
  relatedType?: string;
}

export const useNotifications = () => {
  const createNotification = async ({
    userId,
    title,
    message,
    type = 'info',
    relatedId,
    relatedType,
  }: CreateNotificationParams) => {
    try {
      const { error } = await supabase.from('notifications').insert({
        user_id: userId,
        title,
        message,
        type,
        related_id: relatedId,
        related_type: relatedType,
      });

      if (error) {
        console.error('Error creating notification:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Failed to create notification:', error);
      return false;
    }
  };

  const notifyOwner = async (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    // Get owner user_id
    const { data: ownerRole, error } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'owner')
      .limit(1)
      .maybeSingle();

    if (error || !ownerRole) {
      console.error('Error finding owner:', error);
      return false;
    }

    return createNotification({
      userId: ownerRole.user_id,
      title,
      message,
      type,
    });
  };

  const notifyUser = async (
    userId: string,
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info'
  ) => {
    return createNotification({
      userId,
      title,
      message,
      type,
    });
  };

  return {
    createNotification,
    notifyOwner,
    notifyUser,
  };
};
