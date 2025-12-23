import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  type: 'password_reset' | 'email_confirmation' | 'welcome';
  data: {
    name?: string;
    resetLink?: string;
    confirmLink?: string;
  };
}

const getEmailTemplate = (type: string, data: any) => {
  const brandColor = '#22c55e'; // Green from the app
  
  const baseStyles = `
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
      .header { text-align: center; margin-bottom: 40px; }
      .logo { font-size: 32px; margin-bottom: 10px; }
      .brand { font-size: 24px; font-weight: bold; color: ${brandColor}; }
      .content { background: #f9fafb; border-radius: 16px; padding: 32px; margin-bottom: 30px; }
      .button { display: inline-block; background: ${brandColor}; color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; margin: 20px 0; }
      .footer { text-align: center; color: #6b7280; font-size: 14px; }
      h1 { color: #111827; margin-bottom: 16px; }
      p { color: #4b5563; margin-bottom: 16px; }
    </style>
  `;

  switch (type) {
    case 'password_reset':
      return {
        subject: 'Reset Your Calo Password',
        html: `
          <!DOCTYPE html>
          <html>
          <head>${baseStyles}</head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">🍎</div>
                <div class="brand">Calo</div>
              </div>
              <div class="content">
                <h1>Reset Your Password</h1>
                <p>Hi${data.name ? ` ${data.name}` : ''},</p>
                <p>We received a request to reset your password. Click the button below to create a new password:</p>
                <center>
                  <a href="${data.resetLink}" class="button">Reset Password</a>
                </center>
                <p style="font-size: 14px; color: #6b7280;">This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.</p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} Calo. All rights reserved.</p>
                <p>Your AI-powered calorie tracking companion.</p>
              </div>
            </div>
          </body>
          </html>
        `
      };

    case 'email_confirmation':
      return {
        subject: 'Confirm Your Calo Email',
        html: `
          <!DOCTYPE html>
          <html>
          <head>${baseStyles}</head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">🍎</div>
                <div class="brand">Calo</div>
              </div>
              <div class="content">
                <h1>Confirm Your Email</h1>
                <p>Hi${data.name ? ` ${data.name}` : ''},</p>
                <p>Thanks for signing up for Calo! Please confirm your email address by clicking the button below:</p>
                <center>
                  <a href="${data.confirmLink}" class="button">Confirm Email</a>
                </center>
                <p style="font-size: 14px; color: #6b7280;">If you didn't create a Calo account, you can safely ignore this email.</p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} Calo. All rights reserved.</p>
                <p>Your AI-powered calorie tracking companion.</p>
              </div>
            </div>
          </body>
          </html>
        `
      };

    case 'welcome':
      return {
        subject: 'Welcome to Calo! 🍎',
        html: `
          <!DOCTYPE html>
          <html>
          <head>${baseStyles}</head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">🍎</div>
                <div class="brand">Calo</div>
              </div>
              <div class="content">
                <h1>Welcome to Calo!</h1>
                <p>Hi${data.name ? ` ${data.name}` : ''},</p>
                <p>We're excited to have you on board! Calo is your AI-powered companion for tracking calories and achieving your nutrition goals.</p>
                <h3 style="color: #111827; margin-top: 24px;">Here's what you can do:</h3>
                <ul style="color: #4b5563;">
                  <li>📸 <strong>Scan your meals</strong> - Just take a photo and let AI analyze the nutrition</li>
                  <li>📊 <strong>Track your progress</strong> - See your daily, weekly, and monthly trends</li>
                  <li>🏆 <strong>Earn badges</strong> - Stay motivated with achievement rewards</li>
                  <li>🔥 <strong>Build streaks</strong> - Consistency is key to success</li>
                </ul>
                <p>Start your health journey today!</p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} Calo. All rights reserved.</p>
                <p>Your AI-powered calorie tracking companion.</p>
              </div>
            </div>
          </body>
          </html>
        `
      };

    default:
      throw new Error('Unknown email type');
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, type, data }: EmailRequest = await req.json();

    if (!to || !type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const template = getEmailTemplate(type, data);

    const emailResponse = await resend.emails.send({
      from: "Calo <noreply@resend.dev>",
      to: [to],
      subject: template.subject,
      html: template.html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-branded-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
