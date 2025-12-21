import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting scheduled account cleanup...');
    
    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find all profiles with scheduled_deletion_at in the past
    const now = new Date().toISOString();
    const { data: profilesToDelete, error: fetchError } = await supabase
      .from('profiles')
      .select('user_id, full_name')
      .not('scheduled_deletion_at', 'is', null)
      .lt('scheduled_deletion_at', now);

    if (fetchError) {
      console.error('Error fetching profiles:', fetchError);
      throw fetchError;
    }

    if (!profilesToDelete || profilesToDelete.length === 0) {
      console.log('No accounts to delete');
      return new Response(
        JSON.stringify({ success: true, message: 'No accounts to delete', deleted: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${profilesToDelete.length} accounts to delete`);

    let deletedCount = 0;
    const errors: string[] = [];

    for (const profile of profilesToDelete) {
      try {
        const userId = profile.user_id;
        console.log(`Deleting data for user ${userId}...`);

        // Delete user data from all tables
        await supabase.from('food_entries').delete().eq('user_id', userId);
        await supabase.from('daily_nutrition_logs').delete().eq('user_id', userId);
        await supabase.from('goal_progress').delete().eq('user_id', userId);
        await supabase.from('user_notifications').delete().eq('user_id', userId);
        await supabase.from('user_streaks').delete().eq('user_id', userId);
        
        // Delete avatar from storage
        const { data: avatarFiles } = await supabase.storage
          .from('avatars')
          .list(userId);
        
        if (avatarFiles && avatarFiles.length > 0) {
          const filesToDelete = avatarFiles.map(f => `${userId}/${f.name}`);
          await supabase.storage.from('avatars').remove(filesToDelete);
        }

        // Delete profile
        await supabase.from('profiles').delete().eq('user_id', userId);

        // Delete auth user
        const { error: deleteUserError } = await supabase.auth.admin.deleteUser(userId);
        
        if (deleteUserError) {
          console.error(`Error deleting auth user ${userId}:`, deleteUserError);
          errors.push(`Failed to delete auth for ${userId}: ${deleteUserError.message}`);
        } else {
          deletedCount++;
          console.log(`Successfully deleted user ${userId}`);
        }
      } catch (userError: unknown) {
        const errorMessage = userError instanceof Error ? userError.message : 'Unknown error';
        console.error(`Error processing user ${profile.user_id}:`, userError);
        errors.push(`Error for ${profile.user_id}: ${errorMessage}`);
      }
    }

    console.log(`Cleanup complete. Deleted ${deletedCount} accounts.`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Deleted ${deletedCount} accounts`,
        deleted: deletedCount,
        errors: errors.length > 0 ? errors : undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in cleanup-deleted-accounts:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});