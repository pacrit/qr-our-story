-- ========================================
-- SETUP COMPLETO DO BANCO - QR OUR STORY
-- ========================================
-- Este arquivo contém todas as migrations consolidadas para um novo projeto

-- 1. Create storage bucket for wedding photos
INSERT INTO storage.buckets (id, name, public, allowed_mime_types) 
VALUES (
  'wedding-photos', 
  'wedding-photos', 
  true,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime']
);

-- 2. Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- 3. Create photos table with all columns (incluindo Cloudinary)
CREATE TABLE public.photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path TEXT NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'photo' CHECK (media_type IN ('photo', 'video')),
  duration INTEGER, -- Para vídeos (em segundos)
  cloudinary_url TEXT, -- URL do Cloudinary
  file_size BIGINT, -- Tamanho do arquivo em bytes
  width INTEGER, -- Largura da imagem/vídeo
  height INTEGER, -- Altura da imagem/vídeo
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- 5. Enable RLS
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 6. Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 7. Policies for photos table
CREATE POLICY "Anyone can view photos"
ON public.photos
FOR SELECT
USING (true);

CREATE POLICY "Anyone can upload photos"
ON public.photos
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can delete photos"
ON public.photos
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 8. Policies for user_roles table
CREATE POLICY "Admins can view roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Allow first user to become admin"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND role = 'admin'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE role = 'admin'
  )
);

-- 9. Storage policies
CREATE POLICY "Anyone can view wedding photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'wedding-photos');

CREATE POLICY "Anyone can upload wedding photos"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'wedding-photos');

CREATE POLICY "Admins can delete wedding photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'wedding-photos' 
  AND public.has_role(auth.uid(), 'admin')
);

-- 10. Create indexes for performance
CREATE INDEX idx_photos_media_type ON public.photos(media_type);
CREATE INDEX idx_photos_cloudinary_url ON public.photos(cloudinary_url) WHERE cloudinary_url IS NOT NULL;
CREATE INDEX idx_photos_uploaded_at ON public.photos(uploaded_at DESC);

-- 11. Add comments for documentation
COMMENT ON COLUMN public.photos.cloudinary_url IS 'URL segura do arquivo no Cloudinary';
COMMENT ON COLUMN public.photos.file_size IS 'Tamanho do arquivo em bytes';
COMMENT ON COLUMN public.photos.width IS 'Largura da imagem/vídeo em pixels';
COMMENT ON COLUMN public.photos.height IS 'Altura da imagem/vídeo em pixels';
COMMENT ON COLUMN public.photos.duration IS 'Duração do vídeo em segundos (NULL para fotos)';

-- 12. Create view for easy querying
CREATE OR REPLACE VIEW public.photos_with_urls AS
SELECT 
  *,
  CASE 
    WHEN cloudinary_url IS NOT NULL THEN cloudinary_url
    ELSE storage_path
  END as display_url
FROM public.photos
ORDER BY uploaded_at DESC;

-- 13. Inserir seu usuário como admin (SUBSTITUA O EMAIL!)
-- IMPORTANTE: Substitua 'SEU_EMAIL@AQUI.COM' pelo seu email real
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'patrick.carneiro13@gmail.com'  -- MUDE ESTE EMAIL SE NECESSÁRIO
ON CONFLICT (user_id, role) DO NOTHING;