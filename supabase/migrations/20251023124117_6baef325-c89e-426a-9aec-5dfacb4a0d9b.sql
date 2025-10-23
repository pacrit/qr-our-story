-- Create storage bucket for wedding photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('wedding-photos', 'wedding-photos', true);

-- Create photos table
CREATE TABLE public.photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on photos table
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view photos
CREATE POLICY "Anyone can view photos"
ON public.photos
FOR SELECT
USING (true);

-- Policy: Anyone can upload photos
CREATE POLICY "Anyone can upload photos"
ON public.photos
FOR INSERT
WITH CHECK (true);

-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
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

-- Policy: Admins can select user_roles
CREATE POLICY "Admins can view roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Policy: Admins can delete photos
CREATE POLICY "Admins can delete photos"
ON public.photos
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Storage policies for wedding photos bucket
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