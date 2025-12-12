# 🔧 Correção do Webhook N8N - Debug Guide

## 🐛 Problema Identificado

O front-end não estava processando a resposta do N8N corretamente. O fluxo era:

1. ✅ Front-end → Edge Function (Supabase)
2. ✅ Edge Function → N8N Webhook
3. ✅ N8N processa e retorna título melhorado
4. ✅ Edge Function salva no banco
5. ❌ **Front-end não usava a resposta** 

## ✅ Correções Implementadas

### 1. **useTasks.ts** - Front-end agora processa a resposta
- ✅ Verifica se `data.enhanced_title` existe na resposta
- ✅ Atualiza o estado imediatamente com a resposta
- ✅ Fallback: busca do banco se resposta não vier completa
- ✅ Realtime subscription como backup adicional
- ✅ Logs detalhados para debug
- ✅ Toast notifications informando sucesso/erro

### 2. **enhance-task/index.ts** - Edge Function mais robusta
- ✅ Suporta múltiplos formatos de resposta do N8N:
  - `enhanced_title`
  - `output`
  - `response`
  - `result`
  - String direta
- ✅ Logs mais detalhados
- ✅ Sempre retorna o título melhorado ao front-end

### 3. **Realtime Subscription** - Backup automático
- ✅ Ouve mudanças na tabela `tasks`
- ✅ Atualiza automaticamente quando o banco mudar
- ✅ Garante que UI sempre fica sincronizada

## 🧪 Como Testar

### 1. Verificar Console do Browser
Abra DevTools (F12) e observe:

```javascript
// Quando criar uma task, deve aparecer:
✅ "Enhanced task response: { enhanced_title: '...' }"
✅ "Task updated via realtime: { ... }"
```

### 2. Verificar Logs da Edge Function
No Supabase Dashboard → Functions → enhance-task:

```
[enhance-task] Processing task xxx: "comprar leite"
[enhance-task] Calling N8N webhook...
[enhance-task] N8N response: { ... }
[enhance-task] Extracted enhanced title: "Comprar 2L de leite integral..."
[enhance-task] Task xxx enhanced successfully
```

### 3. Teste Manual
1. Criar uma task com título simples: **"comprar pão"**
2. Observar o loading (status: enhancing)
3. Deve aparecer notificação: "Tarefa melhorada!"
4. Título deve mudar para versão melhorada

## 🔍 Formatos de Resposta do N8N

A Edge Function agora aceita qualquer destes formatos:

```json
// Formato 1: Padrão
{
  "enhanced_title": "Comprar 2 pães franceses na padaria"
}

// Formato 2: Output
{
  "output": "Comprar 2 pães franceses na padaria"
}

// Formato 3: Response
{
  "response": "Comprar 2 pães franceses na padaria"
}

// Formato 4: Result
{
  "result": "Comprar 2 pães franceses na padaria"
}

// Formato 5: String direta
"Comprar 2 pães franceses na padaria"
```

## 🚨 Troubleshooting

### Task fica em "enhancing" infinitamente
**Causa**: N8N não está respondendo ou erro na comunicação

**Solução**:
1. Verificar se N8N está online: http://31.97.95.115:5678
2. Testar webhook manualmente:
```bash
curl -X POST http://31.97.95.115:5678/webhook/enhance-task \
  -H "Content-Type: application/json" \
  -d '{"taskId":"test","title":"comprar pão"}'
```
3. Verificar logs da Edge Function no Supabase

### Enhanced title não aparece
**Causa**: Formato de resposta diferente do esperado

**Solução**:
1. Verificar logs da Edge Function
2. Adicionar novo formato na linha 49-63 de `enhance-task/index.ts`
3. Republicar função

### Erro de CORS
**Causa**: Configuração de headers

**Solução**: Já está configurado, mas verificar se N8N retorna headers corretos

## 📊 Status da Task

```typescript
type Status = 
  | 'pending'    // Aguardando processamento
  | 'enhancing'  // Sendo processada pela IA
  | 'enhanced'   // Título melhorado com sucesso
  | 'error'      // Erro no processamento
```

## 🔄 Fluxo Completo Atualizado

```
1. Usuário cria task → createTask()
   └─ Task inserida no banco com status: 'pending'
   
2. Front-end chama → enhanceTask()
   └─ Atualiza estado local: status = 'enhancing'
   
3. Edge Function recebe requisição
   └─ Chama webhook N8N
   
4. N8N processa com IA
   └─ Retorna título melhorado
   
5. Edge Function recebe resposta
   ├─ Salva no banco (status = 'enhanced')
   └─ Retorna ao front-end { enhanced_title: "..." }
   
6. Front-end processa resposta
   ├─ Opção A: Usa resposta direta da função ✅
   ├─ Opção B: Busca do banco se não receber ✅
   └─ Opção C: Realtime atualiza automaticamente ✅
   
7. UI atualizada com título melhorado ✅
   └─ Notificação aparece para usuário
```

## 🎯 Resultado Final

Agora você tem **3 camadas de redundância**:
1. ✅ Resposta direta da Edge Function
2. ✅ Fallback com busca no banco
3. ✅ Realtime subscription como backup

**Impossível não receber o título melhorado!** 🚀
