import { supabase } from "@/integrations/supabase/client";

export interface NotificationSettings {
  mealReminders: boolean;
  mealReminderTimes: string[];
  dailyLogging: boolean;
  dailyLoggingTime: string;
  weeklySummary: boolean;
  weeklySummaryDay: number;
}

export const defaultNotificationSettings: NotificationSettings = {
  mealReminders: true,
  mealReminderTimes: ["08:00", "12:00", "18:00"],
  dailyLogging: true,
  dailyLoggingTime: "20:00",
  weeklySummary: true,
  weeklySummaryDay: 0,
};

export async function sendNotification(
  title: string,
  message: string,
  userId?: string,
  data?: Record<string, string>
) {
  try {
    const { data: result, error } = await supabase.functions.invoke(
      "push-notifications/send",
      {
        body: { userId, title, message, data },
      }
    );

    if (error) throw error;
    return result;
  } catch (error) {
    console.error("Failed to send notification:", error);
    throw error;
  }
}

export async function registerDevice(playerId: string, userId: string) {
  try {
    const { data: result, error } = await supabase.functions.invoke(
      "push-notifications/register",
      {
        body: { playerId, userId },
      }
    );

    if (error) throw error;
    return result;
  } catch (error) {
    console.error("Failed to register device:", error);
    throw error;
  }
}

export function getNotificationSettings(): NotificationSettings {
  const stored = localStorage.getItem("notification_settings");
  if (stored) {
    return JSON.parse(stored);
  }
  return defaultNotificationSettings;
}

export function saveNotificationSettings(settings: NotificationSettings) {
  localStorage.setItem("notification_settings", JSON.stringify(settings));
}
