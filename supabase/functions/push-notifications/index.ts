import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationPayload {
  userId?: string;
  playerId?: string;
  title: string;
  message: string;
  data?: Record<string, string>;
}

interface SchedulePayload {
  userId: string;
  notificationType: 'meal_reminder' | 'daily_logging' | 'weekly_summary';
  enabled: boolean;
  time?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ONESIGNAL_APP_ID = Deno.env.get("ONESIGNAL_APP_ID");
    const ONESIGNAL_REST_API_KEY = Deno.env.get("ONESIGNAL_REST_API_KEY");

    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
      return new Response(
        JSON.stringify({ error: "OneSignal not configured" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = new URL(req.url);
    const path = url.pathname.split("/").pop();

    if (path === "send" && req.method === "POST") {
      const payload: NotificationPayload = await req.json();

      const notificationBody: Record<string, unknown> = {
        app_id: ONESIGNAL_APP_ID,
        headings: { en: payload.title },
        contents: { en: payload.message },
        data: payload.data || {},
      };

      if (payload.playerId) {
        notificationBody.include_player_ids = [payload.playerId];
      } else if (payload.userId) {
        notificationBody.include_external_user_ids = [payload.userId];
      } else {
        notificationBody.included_segments = ["Subscribed Users"];
      }

      const response = await fetch("https://onesignal.com/api/v1/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
        },
        body: JSON.stringify(notificationBody),
      });

      const result = await response.json();

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (path === "register" && req.method === "POST") {
      const { playerId, userId } = await req.json();

      if (userId && playerId) {
        const response = await fetch(
          `https://onesignal.com/api/v1/players/${playerId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
            },
            body: JSON.stringify({
              app_id: ONESIGNAL_APP_ID,
              external_user_id: userId,
            }),
          }
        );

        const result = await response.json();
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(
        JSON.stringify({ error: "playerId and userId required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid endpoint" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Push notification error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
