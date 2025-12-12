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
    const { message, selectedTask, sessionId } = await req.json();
    
    console.log(`[chatbot] Processing message: "${message}"`);
    console.log(`[chatbot] Selected task:`, selectedTask);
    console.log(`[chatbot] Session ID:`, sessionId);

    // Get N8N chatbot webhook URL from environment
    const n8nChatbotUrl = Deno.env.get('N8N_CHATBOT_WEBHOOK_URL');
    
    if (!n8nChatbotUrl) {
      console.error('[chatbot] N8N_CHATBOT_WEBHOOK_URL not configured');
      throw new Error('N8N chatbot webhook URL not configured');
    }

    // Build context for N8N
    const context = {
      message,
      action: 'chat',
      sessionId,
      selectedTask: selectedTask ? {
        id: selectedTask.id,
        title: selectedTask.title,
        enhanced_title: selectedTask.enhanced_title,
        is_completed: selectedTask.is_completed,
        status: selectedTask.status,
        created_at: selectedTask.created_at,
      } : null,
    };

    // Call N8N webhook
    console.log(`[chatbot] Calling N8N chatbot webhook with context...`);
    const n8nResponse = await fetch(n8nChatbotUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(context),
    });

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      console.error(`[chatbot] N8N error: ${n8nResponse.status} - ${errorText}`);
      throw new Error(`N8N webhook failed: ${n8nResponse.status}`);
    }

    const n8nData = await n8nResponse.json();
    console.log(`[chatbot] N8N response:`, n8nData);

    // Parse N8N response for actions
    // N8N can return:
    // - response: text response to show user
    // - action: 'update_task' | 'complete_task' | null
    // - updates: { title?: string, is_completed?: boolean } (for update_task action)
    
    const response = n8nData.response || n8nData.message || 'Sem resposta do assistente.';
    const action = n8nData.action || null;
    const updates = n8nData.updates || null;

    return new Response(
      JSON.stringify({ 
        success: true, 
        response,
        action,
        updates,
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
