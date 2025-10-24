import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cloudinaryService } from "@/services/cloudinary";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface Photo {
  id: string;
  storage_path: string;
  uploaded_at: string;
  media_type: 'photo' | 'video';
  duration?: number;
  cloudinary_url?: string;
  file_size?: number;
  width?: number;
  height?: number;
}

export const PhotoGallery = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPhotos();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('photos-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'photos'
        },
        () => {
          fetchPhotos();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchPhotos = async () => {
    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('Error fetching photos:', error);
    } else {
      setPhotos((data || []) as Photo[]);
    }
    setLoading(false);
  };

  const getMediaUrl = (photo: Photo) => {
    // Se tiver URL do Cloudinary, usar ela
    if (photo.cloudinary_url) {
      return photo.cloudinary_url;
    }
    
    // Se tiver public_id do Cloudinary, gerar URL otimizada
    if (photo.storage_path && !photo.storage_path.includes('.')) {
      if (photo.media_type === 'video') {
        return cloudinaryService.generateVideoUrl(photo.storage_path, {
          quality: 'auto',
          format: 'mp4'
        });
      } else {
        return cloudinaryService.generateUrl(photo.storage_path, {
          quality: 'auto',
          format: 'auto'
        });
      }
    }
    
    // Fallback para URLs antigas do Supabase
    const { data } = supabase.storage
      .from('wedding-photos')
      .getPublicUrl(photo.storage_path);
    return data.publicUrl;
  };

  const getThumbnailUrl = (photo: Photo) => {
    // Se tiver URL do Cloudinary ou public_id, criar thumbnail otimizado
    if (photo.cloudinary_url || (!photo.storage_path.includes('.'))) {
      const publicId = photo.storage_path;
      if (photo.media_type === 'video') {
        return cloudinaryService.generateVideoUrl(publicId, {
          width: 400,
          height: 400,
          quality: 'auto',
          format: 'jpg' // Thumbnail do vídeo como imagem
        });
      } else {
        return cloudinaryService.generateUrl(publicId, {
          width: 400,
          height: 400,
          crop: 'fill',
          quality: 'auto',
          format: 'auto'
        });
      }
    }
    
    // Fallback para URLs antigas do Supabase
    return getMediaUrl(photo);
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-lg" />
        ))}
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <Card className="p-12 text-center shadow-soft">
        <p className="text-muted-foreground text-lg">
          Ainda não há fotos ou vídeos. Seja o primeiro a compartilhar um momento especial!
        </p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {photos.map((photo) => (
        <Card 
          key={photo.id} 
          className="overflow-hidden group shadow-soft hover:shadow-elegant transition-smooth"
        >
          <div className="aspect-square relative">
            {photo.media_type === 'video' ? (
              <>
                <video
                  src={getMediaUrl(photo)}
                  poster={getThumbnailUrl(photo)}
                  className="w-full h-full object-cover"
                  controls
                  playsInline
                  preload="metadata"
                />
                {photo.duration && (
                  <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-sm font-medium">
                    {formatDuration(photo.duration)}
                  </div>
                )}
              </>
            ) : (
              <img
                src={getThumbnailUrl(photo)}
                alt="Foto do casamento"
                className="w-full h-full object-cover transition-smooth group-hover:scale-105"
                loading="lazy"
                onClick={() => window.open(getMediaUrl(photo), '_blank')}
              />
            )}
          </div>
        </Card>
      ))}
    </div>
  );
};
