-- Adicionar colunas para integração com Cloudinary
ALTER TABLE public.photos 
ADD COLUMN cloudinary_url TEXT,
ADD COLUMN file_size BIGINT,
ADD COLUMN width INTEGER,
ADD COLUMN height INTEGER;

-- Criar índice para otimizar consultas
CREATE INDEX idx_photos_cloudinary_url ON public.photos(cloudinary_url) WHERE cloudinary_url IS NOT NULL;

-- Adicionar comentários para documentação
COMMENT ON COLUMN public.photos.cloudinary_url IS 'URL segura do arquivo no Cloudinary';
COMMENT ON COLUMN public.photos.file_size IS 'Tamanho do arquivo em bytes';
COMMENT ON COLUMN public.photos.width IS 'Largura da imagem/vídeo em pixels';
COMMENT ON COLUMN public.photos.height IS 'Altura da imagem/vídeo em pixels';

-- Opcional: Criar uma view para facilitar consultas
CREATE OR REPLACE VIEW public.photos_with_urls AS
SELECT 
  *,
  CASE 
    WHEN cloudinary_url IS NOT NULL THEN cloudinary_url
    ELSE storage_path
  END as display_url
FROM public.photos
ORDER BY uploaded_at DESC;