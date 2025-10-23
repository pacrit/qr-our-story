import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, Upload, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const PhotoUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione apenas imagens');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    setUploading(true);
    setSuccess(false);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from('wedding-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from('photos')
        .insert({ storage_path: filePath });

      if (dbError) throw dbError;

      setSuccess(true);
      toast.success('Foto enviada com sucesso! 🎉');
      
      setTimeout(() => {
        setPreview(null);
        setSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Erro ao enviar foto. Tente novamente.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="p-8 shadow-elegant">
      <div className="space-y-6">
        {preview ? (
          <div className="relative aspect-square rounded-lg overflow-hidden">
            <img 
              src={preview} 
              alt="Preview" 
              className="w-full h-full object-cover"
            />
            {success && (
              <div className="absolute inset-0 bg-primary/90 flex items-center justify-center">
                <div className="text-center text-primary-foreground">
                  <CheckCircle2 className="w-16 h-16 mx-auto mb-4" />
                  <p className="text-xl font-semibold">Foto enviada!</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="aspect-square border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-muted/20">
            <div className="text-center text-muted-foreground p-6">
              <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Capture um momento especial</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            className="hidden"
          />
          <Button
            onClick={() => cameraInputRef.current?.click()}
            disabled={uploading || success}
            size="lg"
            className="gap-2"
          >
            <Camera className="w-5 h-5" />
            Tirar Foto
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || success}
            variant="outline"
            size="lg"
            className="gap-2"
          >
            <Upload className="w-5 h-5" />
            Escolher da Galeria
          </Button>
        </div>
      </div>
    </Card>
  );
};
