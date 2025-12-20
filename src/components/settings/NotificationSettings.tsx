import { useState, useEffect } from "react";
import { Bell, Clock, Calendar, ChevronRight } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import {
  NotificationSettings as NotificationSettingsType,
  getNotificationSettings,
  saveNotificationSettings,
  defaultNotificationSettings,
} from "@/lib/api/notifications";

const timeOptions = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, "0");
  return { value: `${hour}:00`, label: `${hour}:00` };
});

const dayOptions = [
  { value: "0", label: "Sunday" },
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
];

export function NotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettingsType>(
    defaultNotificationSettings
  );
  const [mealTimesOpen, setMealTimesOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setSettings(getNotificationSettings());
  }, []);

  const updateSettings = (updates: Partial<NotificationSettingsType>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    saveNotificationSettings(newSettings);
    toast({
      title: "Settings saved",
      description: "Your notification preferences have been updated.",
    });
  };

  const updateMealTime = (index: number, time: string) => {
    const newTimes = [...settings.mealReminderTimes];
    newTimes[index] = time;
    updateSettings({ mealReminderTimes: newTimes });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-primary/10">
          <Bell className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Notifications</h2>
          <p className="text-sm text-muted-foreground">
            Manage your reminder preferences
          </p>
        </div>
      </div>

      {/* Meal Reminders */}
      <div className="rounded-2xl border bg-card p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <Clock className="w-4 h-4 text-orange-500" />
            </div>
            <div>
              <p className="font-medium">Meal Reminders</p>
              <p className="text-sm text-muted-foreground">
                Get reminded to log your meals
              </p>
            </div>
          </div>
          <Switch
            checked={settings.mealReminders}
            onCheckedChange={(checked) =>
              updateSettings({ mealReminders: checked })
            }
          />
        </div>

        {settings.mealReminders && (
          <Sheet open={mealTimesOpen} onOpenChange={setMealTimesOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between"
              >
                <span>Reminder Times</span>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="text-sm">
                    {settings.mealReminderTimes.join(", ")}
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Meal Reminder Times</SheetTitle>
              </SheetHeader>
              <div className="space-y-4 mt-6">
                {["Breakfast", "Lunch", "Dinner"].map((meal, index) => (
                  <div
                    key={meal}
                    className="flex items-center justify-between p-3 rounded-xl border"
                  >
                    <span className="font-medium">{meal}</span>
                    <Select
                      value={settings.mealReminderTimes[index]}
                      onValueChange={(value) => updateMealTime(index, value)}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timeOptions.map((time) => (
                          <SelectItem key={time.value} value={time.value}>
                            {time.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>

      {/* Daily Logging Reminder */}
      <div className="rounded-2xl border bg-card p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Calendar className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <p className="font-medium">Daily Logging</p>
              <p className="text-sm text-muted-foreground">
                Evening reminder to complete your log
              </p>
            </div>
          </div>
          <Switch
            checked={settings.dailyLogging}
            onCheckedChange={(checked) =>
              updateSettings({ dailyLogging: checked })
            }
          />
        </div>

        {settings.dailyLogging && (
          <div className="flex items-center justify-between p-3 rounded-xl border">
            <span className="text-sm text-muted-foreground">Reminder Time</span>
            <Select
              value={settings.dailyLoggingTime}
              onValueChange={(value) =>
                updateSettings({ dailyLoggingTime: value })
              }
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeOptions.map((time) => (
                  <SelectItem key={time.value} value={time.value}>
                    {time.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Weekly Summary */}
      <div className="rounded-2xl border bg-card p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Bell className="w-4 h-4 text-green-500" />
            </div>
            <div>
              <p className="font-medium">Weekly Summary</p>
              <p className="text-sm text-muted-foreground">
                Get a weekly progress report
              </p>
            </div>
          </div>
          <Switch
            checked={settings.weeklySummary}
            onCheckedChange={(checked) =>
              updateSettings({ weeklySummary: checked })
            }
          />
        </div>

        {settings.weeklySummary && (
          <div className="flex items-center justify-between p-3 rounded-xl border">
            <span className="text-sm text-muted-foreground">Day of Week</span>
            <Select
              value={settings.weeklySummaryDay.toString()}
              onValueChange={(value) =>
                updateSettings({ weeklySummaryDay: parseInt(value) })
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dayOptions.map((day) => (
                  <SelectItem key={day.value} value={day.value}>
                    {day.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Push notifications require the app to be installed on your device
      </p>
    </div>
  );
}
