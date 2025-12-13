// @deno-types="https://deno.land/std@0.168.0/http/server.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @deno-types="https://esm.sh/@supabase/supabase-js@2"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mock enhancement function
function generateMockEnhancement(title: string, userPrompt?: string): string {
  const enhanced = title.trim();
  
  if (userPrompt && userPrompt.trim()) {
    return `${enhanced} - ${userPrompt.trim()}`;
  }
  
  // For enhance mode without user prompt, just return the title as-is
  return enhanced;
}

// Timeout helper
function timeout(ms: number): Promise<never> {
  return new Promise((_, reject) => 
    setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
  );
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let taskId = '';
  let title = '';
  
  try {
    // Parse request
    const body = await req.json();
    taskId = body.taskId;
    title = body.title;
    const user_prompt = body.user_prompt;
    const mode = body.mode;
    
    if (!taskId || !title) {
      console.error('[enhance-task] Missing taskId or title');
      return new Response(
        JSON.stringify({ success: false, error: 'Missing taskId or title' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[enhance-task] START - taskId: ${taskId}`);
    console.log(`[enhance-task] Title: ${title}`);
    console.log(`[enhance-task] Mode: ${mode}`);
    
    // Check environment variables exist
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('[enhance-task] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
      return new Response(
        JSON.stringify({ success: false, error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('[enhance-task] Credentials verified');
    
    // Get enhancement (N8N or mock)
    let enhancedTitle = title;
    let usedN8N = false;
    
    const n8nUrl = Deno.env.get('N8N_ENHANCE_WEBHOOK_URL');
    
    if (n8nUrl && n8nUrl.trim().length > 0) {
      console.log('[enhance-task] Attempting N8N...');
      try {
        // For enhance mode without user_prompt, add a default prompt to generate steps
        let finalUserPrompt = user_prompt || '';
        if (mode === 'enhance' && !user_prompt) {
          finalUserPrompt = 'Provide a clear, improved version of this task with step-by-step instructions if applicable.';
        }
        
        // Race against timeout
        const n8nPromise = fetch(n8nUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taskId,
            title,
            user_prompt: finalUserPrompt,
            action: mode === 'suggest' ? 'suggest_enhancement' : 'enhance_task',
          }),
        });
        
        const n8nResponse = await Promise.race([
          n8nPromise,
          timeout(10000) // 10 second timeout
        ]);

        if (n8nResponse.ok) {
          try {
            const contentType = n8nResponse.headers.get('content-type');
            let n8nData;
            
            // Check if response is JSON or plain text
            if (contentType && contentType.includes('application/json')) {
              n8nData = await n8nResponse.json();
              console.log('[enhance-task] N8N JSON response:', JSON.stringify(n8nData));
              
              // Handle array responses (take first element)
              if (Array.isArray(n8nData) && n8nData.length > 0) {
                n8nData = n8nData[0];
                console.log('[enhance-task] Extracted first element from array');
              }
            } else {
              // Plain text response
              const textData = await n8nResponse.text();
              console.log('[enhance-task] N8N text response:', textData);
              n8nData = textData;
            }
            
            // Extract from response - try multiple fields
            let foundTitle = null;
            
            // If response is plain text/string, use it directly
            if (typeof n8nData === 'string' && n8nData.trim()) {
              foundTitle = n8nData.trim();
            } 
            // Try common field names for JSON responses
            else if (typeof n8nData === 'object' && n8nData !== null) {
              if (n8nData.improved_title && typeof n8nData.improved_title === 'string' && n8nData.improved_title.trim()) {
                foundTitle = n8nData.improved_title.trim();
                
                // If there are steps, append them to the title
                if (Array.isArray(n8nData.steps) && n8nData.steps.length > 0) {
                  const stepsText = n8nData.steps
                    .map((step: string, index: number) => `${index + 1}. ${step.trim()}`)
                    .join('\n');
                  foundTitle = `${foundTitle}\n\n${stepsText}`;
                  console.log('[enhance-task] Added steps to enhanced title');
                }
              } else if (n8nData.enhanced_title && typeof n8nData.enhanced_title === 'string' && n8nData.enhanced_title.trim()) {
                foundTitle = n8nData.enhanced_title.trim();
              } else if (n8nData.title && typeof n8nData.title === 'string' && n8nData.title.trim()) {
                foundTitle = n8nData.title.trim();
              } else if (n8nData.output && typeof n8nData.output === 'string' && n8nData.output.trim()) {
                foundTitle = n8nData.output.trim();
              } else if (n8nData.body && typeof n8nData.body === 'string' && n8nData.body.trim()) {
                foundTitle = n8nData.body.trim();
              } else if (n8nData.text && typeof n8nData.text === 'string' && n8nData.text.trim()) {
                foundTitle = n8nData.text.trim();
              }
            }
            
            if (foundTitle) {
              enhancedTitle = foundTitle;
              usedN8N = true;
              console.log('[enhance-task] N8N success, extracted title:', enhancedTitle);
            } else {
              console.warn('[enhance-task] No valid title found in N8N response, response was:', n8nData);
              enhancedTitle = generateMockEnhancement(title, user_prompt);
            }
          } catch (e) {
            console.warn('[enhance-task] Failed to parse N8N JSON');
            enhancedTitle = generateMockEnhancement(title, user_prompt);
          }
        } else {
          console.warn(`[enhance-task] N8N returned ${n8nResponse.status}`);
          enhancedTitle = generateMockEnhancement(title, user_prompt);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.warn(`[enhance-task] N8N error: ${msg}`);
        enhancedTitle = generateMockEnhancement(title, user_prompt);
      }
    } else {
      console.log('[enhance-task] N8N not configured, using mock');
      enhancedTitle = generateMockEnhancement(title, user_prompt);
    }
    
    console.log(`[enhance-task] Enhanced title: ${enhancedTitle}`);
    
    // Update database
    if (mode !== 'suggest') {
      console.log('[enhance-task] Updating database...');
      
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        const { error, data } = await supabase
          .from('tasks')
          .update({
            enhanced_title: enhancedTitle,
            status: 'enhanced'
          })
          .eq('id', taskId)
          .select();

        if (error) {
          console.error(`[enhance-task] DB error: ${error.message}`);
          return new Response(
            JSON.stringify({ success: false, error: 'Database update failed', details: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (!data || data.length === 0) {
          console.error(`[enhance-task] Task not found: ${taskId}`);
          return new Response(
            JSON.stringify({ success: false, error: 'Task not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('[enhance-task] Database updated successfully');
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`[enhance-task] DB exception: ${msg}`);
        return new Response(
          JSON.stringify({ success: false, error: 'Database error', details: msg }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    console.log('[enhance-task] SUCCESS');
    return new Response(
      JSON.stringify({
        success: true,
        enhanced_title: enhancedTitle,
        source: usedN8N ? 'n8n' : 'mock'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[enhance-task] FATAL ERROR: ${msg}`);
    console.error(`[enhance-task] Stack: ${error instanceof Error ? error.stack : 'no stack'}`);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        details: msg
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
