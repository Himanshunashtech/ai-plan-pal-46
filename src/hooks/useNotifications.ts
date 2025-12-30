import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchUserStreak, selectUserStreak } from '@/store/slices/gamificationSlice';

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

export function useNotifications() {
  const { user } = useAuth();
  const dispatch = useAppDispatch();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const streak = useAppSelector(selectUserStreak);
  const [loading, setLoading] = useState(false);

  const fetchedForUserRef = useRef<string | null>(null);
  const mountedRef = useRef(true);

  /* ----------------------------------
   * Fetch Notifications
   * ---------------------------------- */
  const fetchNotifications = useCallback(async (userId: string) => {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('user_notifications')
      .select('*')
      .eq('user_id', userId)
      .or(`snoozed_until.is.null,snoozed_until.lt.${now}`)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    if (!mountedRef.current) return;

    const mapped: Notification[] = (data || []).map((n) => ({
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
  }, []);

  /* ----------------------------------
   * Fetch Streak (SAFE for new users)
   * ---------------------------------- */
  const fetchStreak = useCallback(async (userId: string) => {
    await dispatch(fetchUserStreak(userId));
  }, [dispatch]);

  /* ----------------------------------
   * Initial Fetch (ONCE per user)
   * ---------------------------------- */
  useEffect(() => {
    if (!user?.id) return;
    if (fetchedForUserRef.current === user.id) return;

    fetchedForUserRef.current = user.id;
    mountedRef.current = true;
    setLoading(true);

    Promise.all([
      fetchNotifications(user.id),
      fetchStreak(user.id),
    ])
      .catch((err) => {
        console.error('Notification fetch error:', err);
      })
      .finally(() => {
        if (mountedRef.current) {
          setLoading(false);
        }
      });

    return () => {
      mountedRef.current = false;
    };
  }, [user?.id, fetchNotifications, fetchStreak]);

  /* ----------------------------------
   * Actions
   * ---------------------------------- */
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user?.id) return;

    await supabase
      .from('user_notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .eq('user_id', user.id);

    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }, [user?.id]);

  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;

    await supabase
      .from('user_notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }, [user?.id]);

  const snoozeNotification = useCallback(async (notificationId: string, hours = 24) => {
    if (!user?.id) return;

    const until = new Date();
    until.setHours(until.getHours() + hours);

    await supabase
      .from('user_notifications')
      .update({ snoozed_until: until.toISOString() })
      .eq('id', notificationId)
      .eq('user_id', user.id);

    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  }, [user?.id]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    if (!user?.id) return;

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
  }, [user?.id]);

  return {
    notifications,
    unreadCount,
    streak, // 🔥 NEVER NULL
    loading,
    markAsRead,
    markAllAsRead,
    snoozeNotification,
    deleteNotification,
    refetch: async () => {
      if (user?.id) {
        setLoading(true);
        try {
          await Promise.all([
            fetchNotifications(user.id),
            fetchStreak(user.id),
          ]);
        } finally {
          setLoading(false);
        }
      }
    },
  };
}
