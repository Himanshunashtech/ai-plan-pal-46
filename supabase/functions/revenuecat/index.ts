import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, userId, productId } = await req.json();
    const REVENUECAT_API_KEY = Deno.env.get('REVENUECAT_API_KEY');

    if (!REVENUECAT_API_KEY) {
      throw new Error('REVENUECAT_API_KEY is not configured');
    }

    const baseUrl = 'https://api.revenuecat.com/v1';
    const headers = {
      'Authorization': `Bearer ${REVENUECAT_API_KEY}`,
      'Content-Type': 'application/json',
      'X-Platform': 'ios' // or android depending on platform
    };

    let response;
    let data;

    switch (action) {
      case 'get_offerings':
        // Get available products/offerings
        response = await fetch(`${baseUrl}/subscribers/${userId}`, {
          method: 'GET',
          headers
        });
        data = await response.json();
        
        return new Response(JSON.stringify({
          success: true,
          offerings: {
            monthly: {
              id: 'premium_monthly',
              price: '$19.99',
              priceAmount: 19.99,
              currency: 'USD',
              period: 'month',
              trialDays: 3
            }
          },
          subscriber: data.subscriber
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'get_subscriber':
        response = await fetch(`${baseUrl}/subscribers/${userId}`, {
          method: 'GET',
          headers
        });
        data = await response.json();
        
        const isPremium = data.subscriber?.entitlements?.premium?.expires_date 
          ? new Date(data.subscriber.entitlements.premium.expires_date) > new Date()
          : false;

        return new Response(JSON.stringify({
          success: true,
          isPremium,
          expiresAt: data.subscriber?.entitlements?.premium?.expires_date,
          subscriber: data.subscriber
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'grant_trial':
        // For web, we can grant entitlements via API
        response = await fetch(`${baseUrl}/subscribers/${userId}/entitlements/premium/promotional`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            duration: 'three_day'
          })
        });
        data = await response.json();
        
        return new Response(JSON.stringify({
          success: true,
          message: '3-day trial activated',
          data
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('RevenueCat error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
