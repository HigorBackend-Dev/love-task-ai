# 🔧 Aplicar Storage de Avatares

## 📋 Passos para Configuração

### 1. Executar Migration de Storage

No Supabase SQL Editor, execute o arquivo:
`supabase/migrations/20251212_create_avatars_storage.sql`

**Ou via CLI:**
```bash
supabase db push
```

### 2. Verificar Bucket Criado

No Supabase Dashboard → Storage, verifique se o bucket `avatars` foi criado e está público.

### 3. Configurar CORS (se necessário)

Se houver problemas de CORS, adicione esta configuração no bucket:
```json
[
  {
    "allowedOrigins": ["*"],
    "allowedMethods": ["GET", "POST", "PUT", "DELETE"],
    "allowedHeaders": ["*"],
    "maxAge": 3600
  }
]
```

## ✅ Resultado

- ✅ Usuários podem fazer upload de fotos de perfil
- ✅ Fotos são armazenadas com segurança
- ✅ Política de acesso adequada (usuário só acessa seus próprios avatares)
- ✅ Avatares são públicos para visualização
- ✅ Limite de 5MB por imagem