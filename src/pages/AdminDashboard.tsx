import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { cloudinaryService } from "@/services/cloudinary";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { LogOut, Trash2, Heart } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletePhoto, setDeletePhoto] = useState<Photo | null>(null);

  useEffect(() => {
    checkAdmin();
    fetchPhotos();
  }, []);

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate('/admin');
      return;
    }

    // No sistema simples, se está autenticado, é admin
  };

  const fetchPhotos = async () => {
    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('Error fetching photos:', error);
      toast.error('Erro ao carregar fotos');
    } else {
      setPhotos((data || []) as Photo[]);
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!deletePhoto) return;

    try {
      const { error: storageError } = await supabase.storage
        .from('wedding-photos')
        .remove([deletePhoto.storage_path]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('photos')
        .delete()
        .eq('id', deletePhoto.id);

      if (dbError) throw dbError;

      toast.success('Foto excluída com sucesso');
      setPhotos(photos.filter(p => p.id !== deletePhoto.id));
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast.error('Erro ao excluir foto');
    } finally {
      setDeletePhoto(null);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Logout realizado');
    navigate('/admin');
  };

  // Funções copiadas do PhotoGallery para garantir consistência
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
      <div className="min-h-screen gradient-subtle flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-base sm:text-lg text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-subtle py-6 sm:py-8 lg:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header - Responsivo */}
        <div className="flex flex-col gap-4 mb-8 lg:flex-row lg:justify-between lg:items-center">
          <div className="text-center lg:text-left">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 bg-gradient-hero bg-clip-text text-transparent">
              Painel Administrativo
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              {photos.length} {photos.length === 1 ? 'foto' : 'fotos'} no álbum
            </p>
          </div>
          
          {/* Botões - Responsivos */}
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center lg:justify-end">
            <Button 
              onClick={() => navigate('/')} 
              variant="outline"
              className="w-full sm:w-auto"
            >
              <span className="hidden sm:inline">Ver Álbum Público</span>
              <span className="sm:hidden">Álbum Público</span>
            </Button>
            <Button 
              onClick={handleLogout} 
              variant="outline" 
              className="gap-2 w-full sm:w-auto"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </Button>
          </div>
        </div>

        {/* Conteúdo Principal */}
        {photos.length === 0 ? (
          <Card className="p-8 sm:p-12 text-center shadow-soft">
            <Heart className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground text-base sm:text-lg">
              Ainda não há fotos no álbum
            </p>
            <p className="text-muted-foreground text-sm mt-2">
              Acesse o álbum público para adicionar fotos
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4">
            {photos.map((photo) => (
              <Card key={photo.id} className="overflow-hidden shadow-soft group hover:shadow-lg transition-all duration-300">
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
                        <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-sm font-medium">
                          {formatDuration(photo.duration)}
                        </div>
                      )}
                    </>
                  ) : (
                    <img
                      src={getThumbnailUrl(photo)}
                      alt="Foto do casamento"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  )}
                  
                  {/* Overlay para hover (desktop) e botão sempre visível no mobile */}
                  <div className="absolute inset-0 bg-black/50 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeletePhoto(photo)}
                      className="gap-2 text-xs sm:text-sm"
                    >
                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Excluir</span>
                      <span className="sm:hidden">×</span>
                    </Button>
                  </div>
                </div>
                
                {/* Info da foto */}
                <div className="p-2 sm:p-3">
                  <p className="text-xs text-muted-foreground">
                    {new Date(photo.uploaded_at).toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Confirmação - Responsivo */}
      <AlertDialog open={!!deletePhoto} onOpenChange={() => setDeletePhoto(null)}>
        <AlertDialogContent className="mx-4 sm:mx-auto max-w-md sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg sm:text-xl">Excluir foto?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm sm:text-base">
              Esta ação não pode ser desfeita. A foto será permanentemente removida do álbum.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row sm:gap-0">
            <AlertDialogCancel className="w-full sm:w-auto">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="w-full sm:w-auto bg-destructive hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminDashboard;
