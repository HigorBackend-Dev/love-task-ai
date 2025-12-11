import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { message } = await req.json();
    
    console.log(`[chatbot] Processing message: "${message}"`);

    // Get N8N chatbot webhook URL from environment
    const n8nChatbotUrl = Deno.env.get('N8N_CHATBOT_WEBHOOK_URL');
    
    if (!n8nChatbotUrl) {
      console.error('[chatbot] N8N_CHATBOT_WEBHOOK_URL not configured');
      throw new Error('N8N chatbot webhook URL not configured');
    }

    // Call N8N webhook
    console.log(`[chatbot] Calling N8N chatbot webhook...`);
    const n8nResponse = await fetch(n8nChatbotUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        action: 'chat',
      }),
    });

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      console.error(`[chatbot] N8N error: ${n8nResponse.status} - ${errorText}`);
      throw new Error(`N8N webhook failed: ${n8nResponse.status}`);
    }

    const n8nData = await n8nResponse.json();
    console.log(`[chatbot] N8N response:`, n8nData);

    const response = n8nData.response || n8nData.message || 'Sem resposta do assistente.';

    return new Response(
      JSON.stringify({ 
        success: true, 
        response 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('[chatbot] Error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        response: 'Desculpe, ocorreu um erro ao processar sua mensagem.'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
