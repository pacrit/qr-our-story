# 🚀 Configuração do Cloudinary

## 📋 Pré-requisitos

1. **Criar conta no Cloudinary**:
   - Acesse: https://cloudinary.com/
   - Registre-se gratuitamente (25GB de armazenamento + 25GB de bandwidth/mês)

## ⚙️ Configuração

### 1. Obter Credenciais

Após criar sua conta:

1. Vá para o **Dashboard** do Cloudinary
2. Anote as seguintes informações:
   - **Cloud Name** (nome da nuvem)
   - **API Key** (chave da API)
   - **API Secret** (segredo da API - não compartilhe!)

### 2. Criar Upload Preset

1. Vá em **Settings** → **Upload**
2. Clique em **Add upload preset**
3. Configure:
   - **Preset name**: `qr-our-story` (ou nome de sua preferência)
   - **Signing Mode**: **Unsigned** (para uploads diretos do frontend)
   - **Folder**: `wedding-photos` (opcional, para organização)
   - **Access Mode**: **Public** (para acesso público às imagens)
   - **Allowed formats**: Deixe em branco para permitir todos os formatos
4. Salve o preset

### 3. Configurar Variáveis de Ambiente

No arquivo `.env` do projeto, adicione:

```env
# Cloudinary Configuration
VITE_CLOUDINARY_CLOUD_NAME="seu-cloud-name-aqui"
VITE_CLOUDINARY_UPLOAD_PRESET="qr-our-story"
VITE_CLOUDINARY_API_KEY="sua-api-key-aqui"
```

**⚠️ Importante**: 
- Substitua `seu-cloud-name-aqui` pelo seu Cloud Name
- Substitua `qr-our-story` pelo nome do preset que você criou
- Substitua `sua-api-key-aqui` pela sua API Key
- **NÃO** inclua o API Secret no frontend por segurança

### 4. Configurações Opcionais Recomendadas

No Cloudinary Dashboard:

#### Transformações Automáticas:
1. **Settings** → **Upload** → **Incoming Transformation**
2. Configure para otimizar automaticamente:
   - Qualidade: `auto`
   - Formato: `auto`
   - Largura máxima: `1920px` (para evitar uploads muito grandes)

#### Configurações de Segurança:
1. **Settings** → **Security**
2. Configure domínios permitidos para maior segurança
3. Habilite **Restricted media types** se necessário

## 🎯 Benefícios da Migração

### ✅ Vantagens do Cloudinary:

1. **Mais Espaço**: 25GB vs limitações do Lovable
2. **Performance**: CDN global para carregamento mais rápido
3. **Otimização Automática**: 
   - Compressão inteligente
   - Conversão de formato automática (WebP, AVIF)
   - Qualidade adaptiva
4. **Transformações**: Redimensionamento, crop, filtros em tempo real
5. **Backup Seguro**: Armazenamento confiável na nuvem
6. **Analytics**: Métricas de uso e performance

### 📊 Exemplo de URLs Geradas:

**Imagem Original**:
```
https://res.cloudinary.com/seu-cloud/image/upload/v1234567890/wedding-photos/abc123.jpg
```

**Thumbnail Otimizado**:
```
https://res.cloudinary.com/seu-cloud/image/upload/c_fill,w_400,h_400,q_auto,f_auto/v1234567890/wedding-photos/abc123.jpg
```

## 🔧 Testando a Configuração

Após configurar as variáveis:

1. Reinicie o servidor de desenvolvimento
2. Tente fazer upload de uma imagem
3. Verifique no Dashboard do Cloudinary se o arquivo foi enviado
4. Verifique se a imagem aparece na galeria

## 🆘 Troubleshooting

### Erro: "Cloudinary não está configurado"
- Verifique se as variáveis estão corretas no `.env`
- Reinicie o servidor após alterar variáveis

### Erro: "Upload failed: 401"
- Verifique se o Upload Preset está configurado como **Unsigned**
- Confirme se o Cloud Name está correto

### Erro: "Upload failed: 400"
- Verifique se o formato do arquivo é suportado
- Confirme se o preset permite o tipo de arquivo

### Imagens não carregam
- Verifique se as URLs estão sendo geradas corretamente
- Confirme se as imagens estão públicas no Cloudinary

## 📱 Próximos Passos

Após a configuração, o sistema irá:

1. **Novos uploads**: Vão direto para o Cloudinary
2. **Uploads antigos**: Continuarão funcionando via Supabase (fallback)
3. **Otimização**: Thumbnails e versões otimizadas automáticas
4. **Migração gradual**: Podem migrar arquivos antigos manualmente se necessário

---

💡 **Dica**: Mantenha o Supabase Storage como backup para arquivos antigos durante a transição!