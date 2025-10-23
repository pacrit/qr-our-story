import { PhotoGallery } from "@/components/PhotoGallery";
import { Button } from "@/components/ui/button";
import { Heart, Camera, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen gradient-subtle">
      <header className="gradient-hero text-primary-foreground py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm mb-6 animate-in fade-in zoom-in duration-700">
            <Heart className="w-10 h-10" />
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            Nosso Casamento
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700 delay-150">
            Compartilhe conosco os momentos especiais deste dia inesquecível
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
            <Button
              size="lg"
              variant="secondary"
              className="gap-2 text-lg px-8 py-6"
              onClick={() => navigate('/upload')}
            >
              <Camera className="w-5 h-5" />
              Adicionar Foto
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="gap-2 text-lg px-8 py-6 bg-white/10 backdrop-blur-sm border-white/30 hover:bg-white/20"
              onClick={() => navigate('/admin')}
            >
              <Lock className="w-5 h-5" />
              Área dos Noivos
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            Galeria de Momentos
          </h2>
          <p className="text-muted-foreground text-lg">
            Todas as fotos compartilhadas pelos nossos convidados
          </p>
        </div>
        
        <PhotoGallery />
      </main>

      <footer className="py-8 px-4 border-t border-border mt-12">
        <div className="max-w-7xl mx-auto text-center text-muted-foreground">
          <Heart className="w-5 h-5 inline-block mb-1 text-primary" />
          <p className="text-sm">
            Feito com amor para celebrar nosso grande dia
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
