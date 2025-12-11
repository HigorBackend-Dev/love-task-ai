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
    const { taskId, title } = await req.json();
    
    console.log(`[enhance-task] Processing task ${taskId}: "${title}"`);

    // Get N8N webhook URL from environment
    const n8nWebhookUrl = Deno.env.get('N8N_WEBHOOK_URL');
    
    if (!n8nWebhookUrl) {
      console.error('[enhance-task] N8N_WEBHOOK_URL not configured');
      throw new Error('N8N webhook URL not configured');
    }

    // Call N8N webhook
    console.log(`[enhance-task] Calling N8N webhook...`);
    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        taskId,
        title,
        action: 'enhance_task',
      }),
    });

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      console.error(`[enhance-task] N8N error: ${n8nResponse.status} - ${errorText}`);
      throw new Error(`N8N webhook failed: ${n8nResponse.status}`);
    }

    const n8nData = await n8nResponse.json();
    console.log(`[enhance-task] N8N response:`, n8nData);

    const enhancedTitle = n8nData.enhanced_title || n8nData.response || title;

    // Update task in Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error: updateError } = await supabase
      .from('tasks')
      .update({ 
        enhanced_title: enhancedTitle,
        status: 'enhanced'
      })
      .eq('id', taskId);

    if (updateError) {
      console.error('[enhance-task] Supabase update error:', updateError);
      throw updateError;
    }

    console.log(`[enhance-task] Task ${taskId} enhanced successfully`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        enhanced_title: enhancedTitle 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('[enhance-task] Error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
