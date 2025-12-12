# 🖥️ Como Rodar Migration via Terminal

## Método 1: Supabase CLI (Recomendado)

### 1️⃣ Instale o Supabase CLI

```bash
npm install -g supabase
```

Ou com Scoop (Windows):
```bash
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### 2️⃣ Faça login no Supabase

```bash
supabase login
```

Isso vai abrir o navegador para você autorizar.

### 3️⃣ Link o projeto local com o projeto remoto

```bash
supabase link --project-ref cnwnixdqjetjqoxuavsr
```

Você precisará da senha do banco de dados. Se não souber:
- Vá em: https://supabase.com/dashboard/project/cnwnixdqjetjqoxuavsr/settings/database
- Clique em "Reset database password" se necessário

### 4️⃣ Execute a migration

```bash
supabase db push
```

Isso vai aplicar todas as migrations da pasta `supabase/migrations/` que ainda não foram aplicadas.

---

## Método 2: psql (PostgreSQL CLI)

### 1️⃣ Instale o PostgreSQL (se não tiver)

**Windows:**
```bash
# Com Chocolatey
choco install postgresql

# Ou baixe em: https://www.postgresql.org/download/windows/
```

### 2️⃣ Obtenha a connection string

1. Vá em: https://supabase.com/dashboard/project/cnwnixdqjetjqoxuavsr/settings/database
2. Copie a **Connection string** (modo: Session)
3. Ela tem este formato:
```
postgresql://postgres.[projeto]:[senha]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

### 3️⃣ Execute a migration

```bash
psql "postgresql://postgres.cnwnixdqjetjqoxuavsr:[SENHA]@aws-0-us-east-1.pooler.supabase.com:6543/postgres" -f supabase/migrations/20251212_saas_architecture.sql
```

**Substitua `[SENHA]` pela senha real do banco!**

---

## Método 3: Script PowerShell (Windows)

Crie um arquivo `run-migration.ps1`:

```powershell
# run-migration.ps1
$PROJECT_ID = "cnwnixdqjetjqoxuavsr"
$DB_PASSWORD = "SUA_SENHA_AQUI"
$MIGRATION_FILE = "supabase/migrations/20251212_saas_architecture.sql"

# Connection string
$CONNECTION_STRING = "postgresql://postgres.$PROJECT_ID:$DB_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres"

# Executar migration
psql $CONNECTION_STRING -f $MIGRATION_FILE

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Migration aplicada com sucesso!" -ForegroundColor Green
} else {
    Write-Host "❌ Erro ao aplicar migration" -ForegroundColor Red
}
```

Execute:
```bash
powershell ./run-migration.ps1
```

---

## Método 4: Node.js Script

Crie um arquivo `apply-migration.js`:

```javascript
// apply-migration.js
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = 'https://cnwnixdqjetjqoxuavsr.supabase.co';
const supabaseServiceKey = 'SEU_SERVICE_ROLE_KEY_AQUI'; // Pegue em Project Settings → API

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  const migrationSQL = readFileSync(
    'supabase/migrations/20251212_saas_architecture.sql',
    'utf-8'
  );

  try {
    // Executa via RPC (se tiver uma função)
    // Ou usa uma abordagem diferente
    console.log('⏳ Aplicando migration...');
    
    // Nota: Supabase JS não suporta executar SQL arbitrário por segurança
    // Você precisaria usar psql ou a API REST diretamente
    
    console.log('❌ Use Supabase CLI ou psql para aplicar migrations SQL');
    console.log('📖 Ver: MIGRATION_VIA_TERMINAL.md');
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

applyMigration();
```

**Nota:** Método 4 não é recomendado - use CLI ou psql.

---

## ⚡ SOLUÇÃO MAIS RÁPIDA

Se você só quer aplicar AGORA sem instalar nada:

### Usando curl + Supabase REST API

```bash
# Pegue seu Service Role Key em:
# https://supabase.com/dashboard/project/cnwnixdqjetjqoxuavsr/settings/api

# Leia o arquivo
$SQL = Get-Content -Path "supabase/migrations/20251212_saas_architecture.sql" -Raw

# Execute via API (não recomendado para migrations grandes)
# Melhor usar o SQL Editor do Dashboard
```

---

## 🎯 RECOMENDAÇÃO

**Para este caso específico, a melhor opção é:**

### Opção A: SQL Editor (Mais Fácil)
✅ Abra: https://supabase.com/dashboard/project/cnwnixdqjetjqoxuavsr/sql/new
✅ Cole o conteúdo do arquivo
✅ Clique em RUN

### Opção B: Supabase CLI (Mais Profissional)
```bash
# 1. Instalar CLI
npm install -g supabase

# 2. Login
supabase login

# 3. Link projeto
supabase link --project-ref cnwnixdqjetjqoxuavsr

# 4. Push migrations
supabase db push
```

### Opção C: psql Direto
```bash
# Substitua [SENHA] pela senha real
psql "postgresql://postgres.cnwnixdqjetjqoxuavsr:[SENHA]@aws-0-us-east-1.pooler.supabase.com:6543/postgres" -f supabase/migrations/20251212_saas_architecture.sql
```

---

## 🔍 Verificar se foi aplicada

Depois de aplicar, verifique:

```bash
# Com Supabase CLI
supabase db diff

# Com psql
psql "connection_string" -c "SELECT * FROM profiles LIMIT 1;"

# Ou no dashboard
# Table Editor → Deve aparecer a tabela 'profiles'
```

---

## ❓ Como pegar a senha do banco?

1. Vá em: https://supabase.com/dashboard/project/cnwnixdqjetjqoxuavsr/settings/database
2. A senha está em **Database Password**
3. Se não souber, clique em **Reset Database Password**

---

## 🆘 Troubleshooting

### "command not found: supabase"
- Instale o CLI: `npm install -g supabase`
- Ou reinicie o terminal após instalar

### "command not found: psql"
- Instale PostgreSQL: https://www.postgresql.org/download/
- Ou use o SQL Editor do dashboard

### "FATAL: password authentication failed"
- Verifique a senha do banco
- Resete a senha no dashboard se necessário

### "connection refused"
- Verifique se o projeto está ativo no Supabase
- Confirme o project-ref: `cnwnixdqjetjqoxuavsr`
