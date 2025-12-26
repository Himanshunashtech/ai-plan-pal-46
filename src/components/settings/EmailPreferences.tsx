import { useState, useEffect } from "react";
import { Mail, FileText, Flame, Lightbulb } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface EmailPreferencesData {
  email_weekly_summary: boolean;
  email_meal_reminders: boolean;
  email_streak_alerts: boolean;
  email_tips_updates: boolean;
}

const defaultPreferences: EmailPreferencesData = {
  email_weekly_summary: true,
  email_meal_reminders: true,
  email_streak_alerts: true,
  email_tips_updates: true,
};

export function EmailPreferences() {
  const [preferences, setPreferences] = useState<EmailPreferencesData>(defaultPreferences);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchPreferences();
    }
  }, [user]);

  const fetchPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("email_weekly_summary, email_meal_reminders, email_streak_alerts, email_tips_updates")
        .eq("user_id", user?.id)
        .single();

      if (error) throw error;

      if (data) {
        setPreferences({
          email_weekly_summary: data.email_weekly_summary ?? true,
          email_meal_reminders: data.email_meal_reminders ?? true,
          email_streak_alerts: data.email_streak_alerts ?? true,
          email_tips_updates: data.email_tips_updates ?? true,
        });
      }
    } catch (error) {
      console.error("Error fetching email preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (key: keyof EmailPreferencesData, value: boolean) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ [key]: value })
        .eq("user_id", user?.id);

      if (error) throw error;

      toast({
        title: "Preferences saved",
        description: "Your email preferences have been updated.",
      });
    } catch (error) {
      console.error("Error updating email preference:", error);
      setPreferences(preferences);
      toast({
        title: "Error",
        description: "Failed to update preferences. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 rounded-2xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  const emailOptions = [
    {
      key: "email_weekly_summary" as const,
      icon: FileText,
      iconColor: "text-green-500",
      iconBg: "bg-green-500/10",
      title: "Weekly Summary",
      description: "Receive a weekly email with your nutrition progress",
    },
    {
      key: "email_meal_reminders" as const,
      icon: Mail,
      iconColor: "text-orange-500",
      iconBg: "bg-orange-500/10",
      title: "Meal Reminders",
      description: "Get email reminders to log your meals",
    },
    {
      key: "email_streak_alerts" as const,
      icon: Flame,
      iconColor: "text-red-500",
      iconBg: "bg-red-500/10",
      title: "Streak Alerts",
      description: "Be notified when your streak is at risk",
    },
    {
      key: "email_tips_updates" as const,
      icon: Lightbulb,
      iconColor: "text-yellow-500",
      iconBg: "bg-yellow-500/10",
      title: "Tips & Updates",
      description: "Receive nutrition tips and app updates",
    },
  ];

  return (
    <div className="space-y-6">
      {/* <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-primary/10">
          <Mail className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Email Preferences</h2>
          <p className="text-sm text-muted-foreground">
            Choose which emails you'd like to receive
          </p>
        </div>
      </div> */}

      {emailOptions.map((option) => (
        <div key={option.key} className="rounded-2xl border bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${option.iconBg}`}>
                <option.icon className={`w-4 h-4 ${option.iconColor}`} />
              </div>
              <div>
                <p className="font-medium">{option.title}</p>
                <p className="text-sm text-muted-foreground">
                  {option.description}
                </p>
              </div>
            </div>
            <Switch
              checked={preferences[option.key]}
              onCheckedChange={(checked) => updatePreference(option.key, checked)}
            />
          </div>
        </div>
      ))}

      <p className="text-xs text-muted-foreground text-center">
        You can unsubscribe from emails at any time
      </p>
    </div>
  );
}
