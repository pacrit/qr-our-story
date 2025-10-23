import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface Photo {
  id: string;
  storage_path: string;
  uploaded_at: string;
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
      setPhotos(data || []);
    }
    setLoading(false);
  };

  const getPhotoUrl = (path: string) => {
    const { data } = supabase.storage
      .from('wedding-photos')
      .getPublicUrl(path);
    return data.publicUrl;
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
          Ainda não há fotos. Seja o primeiro a compartilhar um momento especial!
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
            <img
              src={getPhotoUrl(photo.storage_path)}
              alt="Foto do casamento"
              className="w-full h-full object-cover transition-smooth group-hover:scale-105"
            />
          </div>
        </Card>
      ))}
    </div>
  );
};
