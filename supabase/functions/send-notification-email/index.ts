import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  type: 'profile_updated' | 'password_changed' | 'weekly_summary' | 'deletion_scheduled' | 'account_restored';
  userId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    
    if (!RESEND_API_KEY) {
      console.log('RESEND_API_KEY not configured - email notifications disabled');
      return new Response(
        JSON.stringify({ success: false, message: 'Email service not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const { type, userId } = await req.json() as EmailRequest;
    console.log(`Processing ${type} notification for user ${userId}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user email
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
    
    if (userError || !userData.user?.email) {
      console.error('Error fetching user:', userError);
      return new Response(
        JSON.stringify({ success: false, message: 'User not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    const userEmail = userData.user.email;
    
    // Get user profile for personalization
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, scheduled_deletion_at')
      .eq('user_id', userId)
      .single();
    
    const userName = profile?.full_name || 'there';
    const deletionDate = profile?.scheduled_deletion_at;

    let subject = '';
    let htmlContent = '';

    switch (type) {
      case 'profile_updated':
        subject = 'Your Profile Has Been Updated';
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #10b981;">Profile Updated Successfully</h2>
            <p>Hi ${userName},</p>
            <p>Your profile has been successfully updated. If you didn't make this change, please contact support immediately.</p>
            <p style="margin-top: 30px; color: #666;">Best regards,<br>The Alle AI Team</p>
          </div>
        `;
        break;
        
      case 'password_changed':
        subject = 'Your Password Has Been Changed';
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #f59e0b;">Password Changed</h2>
            <p>Hi ${userName},</p>
            <p>Your password was recently changed. If you didn't make this change, please reset your password immediately and contact support.</p>
            <p style="margin-top: 30px; color: #666;">Best regards,<br>The Alle AI Team</p>
          </div>
        `;
        break;
        
      case 'weekly_summary':
        // Fetch weekly progress data
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        const { data: logs } = await supabase
          .from('daily_nutrition_logs')
          .select('*')
          .eq('user_id', userId)
          .gte('log_date', oneWeekAgo.toISOString().split('T')[0]);
        
        const { data: streak } = await supabase
          .from('user_streaks')
          .select('current_streak, longest_streak')
          .eq('user_id', userId)
          .single();
        
        const totalCalories = logs?.reduce((sum, log) => sum + (log.total_calories || 0), 0) || 0;
        const avgCalories = logs && logs.length > 0 ? Math.round(totalCalories / logs.length) : 0;
        const daysLogged = logs?.length || 0;
        
        subject = 'Your Weekly Nutrition Summary';
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #10b981;">Weekly Progress Summary</h2>
            <p>Hi ${userName},</p>
            <p>Here's your nutrition summary for the past week:</p>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 10px; margin: 20px 0;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span><strong>Days Logged:</strong></span>
                <span>${daysLogged} / 7</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span><strong>Average Daily Calories:</strong></span>
                <span>${avgCalories} kcal</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span><strong>Current Streak:</strong></span>
                <span>${streak?.current_streak || 0} days 🔥</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span><strong>Longest Streak:</strong></span>
                <span>${streak?.longest_streak || 0} days</span>
              </div>
            </div>
            
            <p>Keep up the great work! Consistency is key to reaching your health goals.</p>
            <p style="margin-top: 30px; color: #666;">Best regards,<br>The Alle AI Team</p>
          </div>
        `;
        break;
        
      case 'deletion_scheduled':
        const formattedDeletionDate = deletionDate 
          ? new Date(deletionDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
          : '30 days from now';
        
        subject = 'Account Deletion Scheduled';
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #ef4444;">Account Scheduled for Deletion</h2>
            <p>Hi ${userName},</p>
            <p>Your account has been scheduled for deletion on <strong>${formattedDeletionDate}</strong>.</p>
            <p>If you change your mind, simply log back in before this date and you'll be given the option to keep your account and all your data.</p>
            <p>After this date, all your data will be permanently deleted and cannot be recovered.</p>
            <p style="margin-top: 30px; color: #666;">Best regards,<br>The Alle AI Team</p>
          </div>
        `;
        break;
        
      case 'account_restored':
        subject = 'Account Restored Successfully';
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #10b981;">Welcome Back!</h2>
            <p>Hi ${userName},</p>
            <p>Great news! Your account has been restored and the scheduled deletion has been cancelled.</p>
            <p>All your data is safe and you can continue using Alle AI as before.</p>
            <p style="margin-top: 30px; color: #666;">Best regards,<br>The Alle AI Team</p>
          </div>
        `;
        break;
        
      default:
        return new Response(
          JSON.stringify({ success: false, message: 'Invalid notification type' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }

    // Send email via Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Alle AI <noreply@alleai.com>',
        to: [userEmail],
        subject: subject,
        html: htmlContent,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('Resend API error:', errorText);
      return new Response(
        JSON.stringify({ success: false, message: 'Failed to send email' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const emailResult = await emailResponse.json();
    console.log('Email sent successfully:', emailResult);

    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in send-notification-email:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});