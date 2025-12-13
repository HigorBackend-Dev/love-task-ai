// @deno-types="https://deno.land/std@0.168.0/http/server.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @deno-types="https://esm.sh/@supabase/supabase-js@2"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // This function receives the auth user data as webhook from Supabase auth
    const event = await req.json();
    
    if (event.type !== 'user.created') {
      return new Response(
        JSON.stringify({ success: true, message: 'Not a user.created event' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = event.data.id;
    console.log(`[setup-user-tables] Creating tables for user: ${userId}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Generate table prefix
    const tablePrefix = `user_${userId.substring(0, 8)}`;
    
    try {
      // Create user-specific tasks table
      await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public."${tablePrefix}_tasks" (
            id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'enhanced', 'enhancing', 'error')),
            user_id UUID NOT NULL DEFAULT '${userId}'::uuid,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            enhanced_title TEXT,
            CONSTRAINT "${tablePrefix}_tasks_title_not_empty" CHECK (title <> ''),
            CONSTRAINT "${tablePrefix}_tasks_user_id_fk" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
          );
          
          CREATE INDEX IF NOT EXISTS "idx_${tablePrefix}_tasks_user_id" ON public."${tablePrefix}_tasks"(user_id);
          CREATE INDEX IF NOT EXISTS "idx_${tablePrefix}_tasks_status" ON public."${tablePrefix}_tasks"(status);
          CREATE INDEX IF NOT EXISTS "idx_${tablePrefix}_tasks_created_at" ON public."${tablePrefix}_tasks"(created_at DESC);
        `
      });

      // Create chat sessions table
      await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public."${tablePrefix}_chat_sessions" (
            id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL DEFAULT '${userId}'::uuid,
            title TEXT DEFAULT 'Nova Conversa',
            selected_task_id UUID,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            CONSTRAINT "${tablePrefix}_chat_sessions_user_id_fk" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
            CONSTRAINT "${tablePrefix}_chat_sessions_task_id_fk" FOREIGN KEY (selected_task_id) REFERENCES public."${tablePrefix}_tasks"(id) ON DELETE SET NULL
          );
          
          CREATE INDEX IF NOT EXISTS "idx_${tablePrefix}_chat_sessions_user_id" ON public."${tablePrefix}_chat_sessions"(user_id);
          CREATE INDEX IF NOT EXISTS "idx_${tablePrefix}_chat_sessions_created_at" ON public."${tablePrefix}_chat_sessions"(created_at DESC);
        `
      });

      // Create chat messages table
      await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public."${tablePrefix}_chat_messages" (
            id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            session_id UUID NOT NULL,
            role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
            content TEXT NOT NULL,
            metadata JSONB DEFAULT '{}'::jsonb,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            CONSTRAINT "${tablePrefix}_chat_messages_session_id_fk" FOREIGN KEY (session_id) REFERENCES public."${tablePrefix}_chat_sessions"(id) ON DELETE CASCADE
          );
          
          CREATE INDEX IF NOT EXISTS "idx_${tablePrefix}_chat_messages_session_id" ON public."${tablePrefix}_chat_messages"(session_id);
          CREATE INDEX IF NOT EXISTS "idx_${tablePrefix}_chat_messages_created_at" ON public."${tablePrefix}_chat_messages"(created_at DESC);
        `
      });

      console.log(`[setup-user-tables] ✅ Successfully created tables for user: ${userId}`);
      
      return new Response(
        JSON.stringify({ success: true, userId, tablePrefix }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (dbError) {
      const msg = dbError instanceof Error ? dbError.message : String(dbError);
      console.error(`[setup-user-tables] ❌ Database error: ${msg}`);
      
      return new Response(
        JSON.stringify({ success: false, error: msg, userId }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[setup-user-tables] Server error: ${msg}`);
    
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
