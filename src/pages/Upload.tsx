import { PhotoUpload } from "@/components/PhotoUpload";
import { Button } from "@/components/ui/button";
import { Heart, ArrowLeft, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Upload = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen gradient-subtle py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header com botão de volta */}
        <div className="flex justify-between items-center mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/')}
            className="gap-2"
          >
            <Home className="w-4 h-4" />
            Home
          </Button>
        </div>

        <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Heart className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-hero bg-clip-text text-transparent">
            Compartilhe um Momento
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Capture e compartilhe as memórias especiais deste dia inesquecível
          </p>
        </div>
        
        <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 delay-150">
          <PhotoUpload />
        </div>
      </div>
    </div>
  );
};

export default Upload;
