# 🔧 GUIA DE CORREÇÃO DOS PROBLEMAS RLS

## ❌ Problema Identificado

Erro 406 (Not Acceptable) nas consultas do Supabase indica problemas com Row Level Security (RLS):

```
GET .../profiles?select=*&id=eq.356dd7d0... 406 (Not Acceptable)
```

## ✅ Soluções Implementadas

### 1. **Nova Migration** - `20251212_fix_profiles_rls.sql`

```bash
# Aplicar a migration manualmente via Dashboard do Supabase
# Ou via CLI:
npx supabase migration up
```

**O que a migration faz:**
- ✅ Corrige políticas RLS da tabela `profiles`
- ✅ Cria função melhorada para criação automática de profiles
- ✅ Adiciona colunas de onboarding faltantes
- ✅ Cria profiles para usuários existentes
- ✅ Adiciona função de debug para RLS

### 2. **Hooks Melhorados**

#### `useProfile.ts`
- ✅ Usa `maybeSingle()` em vez de `single()` para evitar erros
- ✅ Cria profile automaticamente se não existir
- ✅ Fallback robusto para problemas de RLS
- ✅ Melhor tratamento de erros

#### `useOnboarding.ts` 
- ✅ Não ativa automaticamente onboarding em caso de erro
- ✅ Usa `maybeSingle()` para consultas seguras
- ✅ Estados padrão seguros para fallback
- ✅ Só ativa onboarding quando realmente necessário

## 🚀 Como Aplicar as Correções

### Passo 1: Aplicar Migration
```sql
-- No Dashboard do Supabase > SQL Editor, executar:
-- Conteúdo do arquivo: supabase/migrations/20251212_fix_profiles_rls.sql
```

### Passo 2: Verificar Profiles
```sql
-- Verificar se profiles foram criados
SELECT id, email, full_name, onboarding_completed 
FROM profiles 
ORDER BY created_at DESC;
```

### Passo 3: Testar RLS
```sql
-- Função de debug (já incluída na migration)
SELECT * FROM debug_profile_access('356dd7d0-4686-4d16-a0b2-605ba4c80889');
```

### Passo 4: Rebuild Frontend
```bash
npm run build
npm run dev
```

## 🔍 Verificação de Funcionamento

### ✅ Sinais de Sucesso:
1. **Sem erros 406** no console do navegador
2. **Onboarding aparece apenas uma vez** para novos usuários
3. **Profiles carregam corretamente** no Dashboard
4. **Confirmações da IA funcionam** sem travamentos

### ❌ Se Ainda Houver Problemas:

#### Debug Step-by-Step:

1. **Verificar usuário logado:**
```javascript
console.log('Current user:', supabase.auth.getUser());
```

2. **Testar consulta manual:**
```javascript
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', user.id)
  .maybeSingle();
console.log('Profile query:', { data, error });
```

3. **Verificar RLS no Dashboard:**
   - Supabase Dashboard > Authentication > Policies
   - Verificar se políticas estão ativas

## 📊 Policies RLS Corretas

```sql
-- Ver todas as policies
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles';
```

## 💡 Prevenção de Problemas Futuros

### 1. **Sempre usar `maybeSingle()`** para consultas que podem não retornar dados
### 2. **Implementar fallbacks** para todos os hooks que dependem de dados externos
### 3. **Testar policies RLS** antes de fazer deploy
### 4. **Monitorar logs** do Supabase para erros 406/403

## 🎯 Resultado Esperado

Após aplicar todas as correções:

- ✅ **Sem erros 406** no console
- ✅ **Onboarding funciona corretamente** (aparece uma vez)
- ✅ **IA confirmações funcionam** perfeitamente
- ✅ **Profiles carregam** sem problemas
- ✅ **Sistema estável** e responsivo

---

## 📞 Se Problemas Persistirem

1. **Verificar logs** do Supabase Dashboard
2. **Executar debug function** para verificar RLS
3. **Recriar usuário de teste** se necessário
4. **Verificar auth.users** se tem dados corretos