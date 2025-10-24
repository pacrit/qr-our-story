import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface Photo {
  id: string;
  storage_path: string;
  uploaded_at: string;
  media_type: 'photo' | 'video';
  duration?: number;
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

  const getMediaUrl = (path: string) => {
    const { data } = supabase.storage
      .from('wedding-photos')
      .getPublicUrl(path);
    return data.publicUrl;
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
                  src={getMediaUrl(photo.storage_path)}
                  className="w-full h-full object-cover"
                  controls
                  playsInline
                />
                {photo.duration && (
                  <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-sm font-medium">
                    {formatDuration(photo.duration)}
                  </div>
                )}
              </>
            ) : (
              <img
                src={getMediaUrl(photo.storage_path)}
                alt="Foto do casamento"
                className="w-full h-full object-cover transition-smooth group-hover:scale-105"
              />
            )}
          </div>
        </Card>
      ))}
    </div>
  );
};
