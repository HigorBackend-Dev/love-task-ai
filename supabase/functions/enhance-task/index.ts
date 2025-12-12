// @deno-types="https://deno.land/std@0.168.0/http/server.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @deno-types="https://esm.sh/@supabase/supabase-js@2"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mock enhancement function for development when N8N is not configured
function generateMockEnhancement(title: string, userPrompt?: string): string {
  // Simple mock that capitalizes and adds context
  const enhanced = title.trim();
  
  if (userPrompt && userPrompt.trim()) {
    // If user provided a prompt, incorporate it
    return `${enhanced} - ${userPrompt.trim()}`;
  }
  
  // Add a generic improvement suggestion
  const improvements = [
    'Clarify and refine',
    'Improve and optimize',
    'Enhance and streamline',
    'Develop and strengthen',
    'Expand and detail'
  ];
  
  const improvement = improvements[Math.floor(Math.random() * improvements.length)];
  return `${enhanced} (${improvement})`;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { taskId, title, user_prompt, mode } = await req.json();
    
    console.log(`[enhance-task] Processing task ${taskId}: "${title}" (mode: ${mode || 'default'})`);

    if (!taskId || !title) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: taskId and title'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get N8N webhook URL from environment
    const n8nWebhookUrl = Deno.env.get('N8N_WEBHOOK_URL');
    
    // If N8N is not configured, provide a mock enhancement for development
    if (!n8nWebhookUrl) {
      console.warn('[enhance-task] N8N_WEBHOOK_URL not configured - using mock enhancement for development');
      
      // Generate a simple enhanced title by adding context
      const enhancedTitle = generateMockEnhancement(title, user_prompt);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          enhanced_title: enhancedTitle,
          source: 'mock_development'
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Call N8N webhook
    console.log(`[enhance-task] Calling N8N webhook at: ${n8nWebhookUrl}`);
    let n8nResponse;
    try {
      n8nResponse = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId,
          title,
          user_prompt: user_prompt || '',
          action: mode === 'suggest' ? 'suggest_enhancement' : 'enhance_task',
        }),
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });
    } catch (fetchError) {
      const fetchErrorMsg = fetchError instanceof Error ? fetchError.message : String(fetchError);
      console.error(`[enhance-task] Failed to fetch N8N webhook: ${fetchErrorMsg}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to connect to N8N webhook: ${fetchErrorMsg}`,
          suggestion: 'Check that N8N_WEBHOOK_URL is valid and N8N service is running'
        }),
        { 
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      console.error(`[enhance-task] N8N error: ${n8nResponse.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `N8N webhook returned ${n8nResponse.status}`,
          details: errorText.substring(0, 500) // Limit error details
        }),
        { 
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    let n8nData;
    try {
      n8nData = await n8nResponse.json();
    } catch (parseError) {
      console.error('[enhance-task] Failed to parse N8N response');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'N8N returned invalid JSON'
        }),
        { 
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`[enhance-task] N8N response:`, JSON.stringify(n8nData).substring(0, 500));

    // Extract enhanced title from various possible response formats
    let enhancedTitle = title; // fallback to original
    
    if (n8nData.enhanced_title) {
      enhancedTitle = n8nData.enhanced_title;
    } else if (n8nData.title) {
      enhancedTitle = n8nData.title;
    } else if (n8nData.output) {
      enhancedTitle = n8nData.output;
    } else if (n8nData.response) {
      enhancedTitle = n8nData.response;
    } else if (n8nData.result) {
      enhancedTitle = n8nData.result;
    } else if (typeof n8nData === 'string') {
      enhancedTitle = n8nData;
    }
    
    console.log(`[enhance-task] Extracted enhanced title: "${enhancedTitle}"`);

    // For 'suggest' mode, don't update the database yet (user will decide)
    if (mode === 'suggest') {
      return new Response(
        JSON.stringify({ 
          success: true, 
          enhanced_title: enhancedTitle 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

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
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Database update failed',
          details: updateError.message
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
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
    console.error('[enhance-task] Unexpected error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
