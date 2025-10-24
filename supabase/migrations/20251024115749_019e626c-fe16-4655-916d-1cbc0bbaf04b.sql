-- Adicionar coluna para tipo de mídia (foto ou vídeo)
ALTER TABLE public.photos 
ADD COLUMN media_type TEXT NOT NULL DEFAULT 'photo' CHECK (media_type IN ('photo', 'video'));

-- Adicionar coluna para duração de vídeo (em segundos, nullable para fotos)
ALTER TABLE public.photos 
ADD COLUMN duration INTEGER;

-- Criar índice para melhor performance nas queries por tipo
CREATE INDEX idx_photos_media_type ON public.photos(media_type);

-- Atualizar a política de storage para permitir vídeos também
-- Primeiro, vamos garantir que o bucket aceite tanto imagens quanto vídeos
UPDATE storage.buckets 
SET allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime']
WHERE id = 'wedding-photos';