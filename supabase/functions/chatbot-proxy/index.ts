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
    const body = await req.json();
    console.log('[chatbot-proxy] Received request:', body);

    const n8nUrl = Deno.env.get('N8N_CHATBOT_WEBHOOK_URL');
    
    if (!n8nUrl) {
      throw new Error('N8N_CHATBOT_WEBHOOK_URL not configured');
    }

    console.log('[chatbot-proxy] Forwarding to N8N:', n8nUrl);

    const n8nResponse = await fetch(n8nUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const responseText = await n8nResponse.text();
    console.log('[chatbot-proxy] N8N response:', responseText);

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      // If not JSON, wrap in response object
      responseData = { response: responseText };
    }

    return new Response(
      JSON.stringify(responseData),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('[chatbot-proxy] Error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        response: 'Desculpe, não foi possível processar sua mensagem.'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
