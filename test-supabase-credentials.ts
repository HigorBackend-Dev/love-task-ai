import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

async function testSupabaseCredentials() {
  console.log('🔍 Testando credenciais do Supabase...\n');

  // Read .env.local file
  const envPath = path.join(process.cwd(), '.env');
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf-8');
    console.log('📂 Arquivo .env.local encontrado\n');
  } else {
    console.log('⚠️  Arquivo .env.local não encontrado\n');
  }

  // Parse env variables
  const envLines = envContent.split('\n');
  const envVars: Record<string, string> = {};
  
  envLines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...rest] = trimmed.split('=');
      const value = rest.join('=').replace(/^["']|["']$/g, '');
      if (key && value) {
        envVars[key] = value;
      }
    }
  });

  const supabaseUrl = envVars['VITE_SUPABASE_URL'] || process.env.VITE_SUPABASE_URL;
  const supabaseKey = envVars['VITE_SUPABASE_PUBLISHABLE_KEY'] || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const serviceRoleKey = envVars['SUPABASE_SERVICE_ROLE_KEY'] || process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('📋 Verificando variáveis de ambiente:');
  console.log(`   VITE_SUPABASE_URL: ${supabaseUrl ? '✅ ' + supabaseUrl.substring(0, 50) + '...' : '❌ Não definida'}`);
  console.log(`   VITE_SUPABASE_PUBLISHABLE_KEY: ${supabaseKey ? '✅ ' + supabaseKey.substring(0, 50) + '...' : '❌ Não definida'}`);
  console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${serviceRoleKey ? '✅ Definida' : '❌ Não definida'}\n`);

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Credenciais faltando! Configure .env.local com as variáveis acima.');
    process.exit(1);
  }

  try {
    // Test 1: Conexão com ANON_KEY (usuário não autenticado)
    console.log('📡 Teste 1: Conectando com ANON_KEY...');
    const anonClient = createClient(supabaseUrl, supabaseKey);
    
    const { error: authError } = await anonClient.auth.getSession();
    if (authError) {
      console.log('   ⚠️  Auth: Sem sessão ativa (esperado para ANON_KEY)');
    } else {
      console.log('   ✅ Conexão OK');
    }

    // Test 2: Listar tabelas públicas
    console.log('\n📡 Teste 2: Acessando tabela "tasks"...');
    const { data, error } = await anonClient
      .from('tasks')
      .select('id')
      .limit(1);

    if (error) {
      console.log(`   ⚠️  Erro (esperado sem RLS bypass): ${error.message}`);
    } else {
      console.log(`   ✅ Acesso OK (${data?.length || 0} registros encontrados)`);
    }

    // Test 3: Conexão com SERVICE_ROLE_KEY (admin)
    if (serviceRoleKey) {
      console.log('\n📡 Teste 3: Conectando com SERVICE_ROLE_KEY (admin)...');
      const adminClient = createClient(supabaseUrl, serviceRoleKey);
      
      const { data: adminData, error: adminError } = await adminClient
        .from('tasks')
        .select('id')
        .limit(1);

      if (adminError) {
        console.log(`   ❌ Erro: ${adminError.message}`);
      } else {
        console.log(`   ✅ Acesso admin OK (${adminData?.length || 0} registros encontrados)`);
      }

      // Test 4: Verificar se consegue atualizar (importante para Edge Functions)
      console.log('\n📡 Teste 4: Testando permissão de UPDATE (sem guardar dados)...');
      console.log('   (Tentando update em um registro que não existe)');
      
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const { error: updateError } = await adminClient
        .from('tasks')
        .update({ status: 'test' })
        .eq('id', fakeId);

      if (updateError) {
        console.log(`   ⚠️  Erro esperado: ${updateError.message}`);
      } else {
        console.log('   ✅ Permissão de UPDATE OK');
      }
    }

    console.log('\n✅ Testes concluídos com sucesso!');
    console.log('\n📌 Próximos passos:');
    console.log('   1. Certifique-se que as variáveis estão em .env.local');
    console.log('   2. Se SERVICE_ROLE_KEY faltar, configure no dashboard Supabase');
    console.log('   3. Teste criando uma tarefa no app');

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`\n❌ Erro durante teste: ${msg}`);
    process.exit(1);
  }
}

testSupabaseCredentials();
