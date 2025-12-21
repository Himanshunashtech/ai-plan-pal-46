import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  snoozed_until: string | null;
  data: Record<string, unknown> | null;
  created_at: string;
}

export interface UserStreak {
  current_streak: number;
  longest_streak: number;
  last_log_date: string | null;
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [streak, setStreak] = useState<UserStreak | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', user.id)
        .or(`snoozed_until.is.null,snoozed_until.lt.${now}`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const mapped = (data || []).map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type,
        read: n.read,
        snoozed_until: n.snoozed_until,
        data: n.data as Record<string, unknown> | null,
        created_at: n.created_at,
      }));

      setNotifications(mapped);
      setUnreadCount(mapped.filter((n) => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [user]);

  const fetchStreak = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_streaks')
        .select('current_streak, longest_streak, last_log_date')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setStreak({
          current_streak: data.current_streak,
          longest_streak: data.longest_streak,
          last_log_date: data.last_log_date,
        });
      } else {
        // Create initial streak record
        const { data: newStreak, error: createError } = await supabase
          .from('user_streaks')
          .insert({ user_id: user.id, current_streak: 0, longest_streak: 0 })
          .select()
          .single();

        if (!createError && newStreak) {
          setStreak({
            current_streak: newStreak.current_streak,
            longest_streak: newStreak.longest_streak,
            last_log_date: newStreak.last_log_date,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching streak:', error);
    }
  }, [user]);

  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('user_notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', user.id);

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [user]);

  const snoozeNotification = useCallback(async (notificationId: string, hours = 24) => {
    if (!user) return;

    try {
      const snoozedUntil = new Date();
      snoozedUntil.setHours(snoozedUntil.getHours() + hours);

      await supabase
        .from('user_notifications')
        .update({ snoozed_until: snoozedUntil.toISOString() })
        .eq('id', notificationId)
        .eq('user_id', user.id);

      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (error) {
      console.error('Error snoozing notification:', error);
    }
  }, [user]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('user_notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user.id);

      setNotifications((prev) => {
        const removed = prev.find((n) => n.id === notificationId);
        if (removed && !removed.read) {
          setUnreadCount((c) => Math.max(0, c - 1));
        }
        return prev.filter((n) => n.id !== notificationId);
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, [user]);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      await supabase
        .from('user_notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      setLoading(true);
      Promise.all([fetchNotifications(), fetchStreak()]).finally(() => {
        setLoading(false);
      });
    }
  }, [user, fetchNotifications, fetchStreak]);

  return {
    notifications,
    unreadCount,
    streak,
    loading,
    markAsRead,
    snoozeNotification,
    deleteNotification,
    markAllAsRead,
    refetch: fetchNotifications,
  };
}
