import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Video, X, Check, RotateCcw, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface StoryRecorderProps {
  onRecordingComplete: (blob: Blob, duration: number) => void;
  onCancel: () => void;
}

export const StoryRecorder = ({ onRecordingComplete, onCancel }: StoryRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [cameraReady, setCameraReady] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let mounted = true;
    
    const initCamera = async () => {
      if (mounted) {
        await startCamera();
      }
    };
    
    initCamera();
    
    return () => {
      mounted = false;
      stopCamera();
    };
  }, [facingMode]);

  const startCamera = async (mode: "user" | "environment" = facingMode) => {
    try {
      // Parar stream anterior se existir
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }

      console.log('Tentando acessar câmera com modo:', mode);

      const constraints = {
        video: { 
          facingMode: mode,
          width: { ideal: 720, max: 1080 },
          height: { ideal: 1280, max: 1920 },
          aspectRatio: 9/16
        },
        audio: true
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      console.log('Stream obtido com sucesso');
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        // Aguardar o vídeo carregar antes de definir como pronto
        videoRef.current.onloadedmetadata = () => {
          console.log('Vídeo carregado, dimensões:', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight);
          setCameraReady(true);
        };
      }
      
    } catch (error) {
      console.error('Erro ao acessar câmera principal:', error);
      
      // Fallback 1: Tentar sem especificar facingMode
      try {
        console.log('Tentando fallback sem facingMode');
        const fallbackConstraints = {
          video: { 
            width: { ideal: 720, max: 1080 },
            height: { ideal: 1280, max: 1920 }
          },
          audio: true
        };
        
        const mediaStream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
        setStream(mediaStream);
        
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.onloadedmetadata = () => {
            setCameraReady(true);
          };
        }
        
        toast.success('Câmera ativada (modo básico)');
        
      } catch (fallbackError) {
        console.error('Erro no fallback 1:', fallbackError);
        
        // Fallback 2: Configurações mínimas
        try {
          console.log('Tentando fallback mínimo');
          const minimalStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
          });
          
          setStream(minimalStream);
          
          if (videoRef.current) {
            videoRef.current.srcObject = minimalStream;
            videoRef.current.onloadedmetadata = () => {
              setCameraReady(true);
            };
          }
          
          toast.success('Câmera ativada');
          
        } catch (minimalError) {
          console.error('Erro no fallback mínimo:', minimalError);
          toast.error('Não foi possível acessar a câmera. Verifique as permissões.');
        }
      }
    }
  };

  const toggleCamera = async () => {
    const newMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(newMode);
    await startCamera(newMode);
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraReady(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const startRecording = () => {
    if (!stream) {
      console.error('Stream não disponível para gravação');
      toast.error('Câmera não está pronta. Tente novamente.');
      return;
    }

    console.log('Iniciando gravação...');
    chunksRef.current = [];
    
    try {
      // Verificar se o MediaRecorder suporta o formato desejado
      let mimeType = 'video/webm;codecs=vp8,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = ''; // Usar o padrão
        }
      }
      
      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        console.log('Dados disponíveis:', event.data.size);
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        console.log('Gravação parada, processando...');
        const blob = new Blob(chunksRef.current, { type: mimeType || 'video/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedVideo(url);
        stopCamera();
      };

      mediaRecorder.onerror = (event) => {
        console.error('Erro na gravação:', event);
        toast.error('Erro durante a gravação');
        setIsRecording(false);
      };

      mediaRecorder.start(100); // Capturar dados a cada 100ms
      setIsRecording(true);
      setRecordingTime(0);

      console.log('Gravação iniciada');

      // Timer para mostrar duração
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= 60) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
      
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error);
      toast.error('Erro ao iniciar gravação');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const handleConfirm = async () => {
    if (!recordedVideo) return;

    const response = await fetch(recordedVideo);
    const blob = await response.blob();
    onRecordingComplete(blob, recordingTime);
  };

  const handleRetry = () => {
    setRecordedVideo(null);
    setRecordingTime(0);
    startCamera();
  };

  return (
    <Card className="relative overflow-hidden bg-black">
      <div className="relative aspect-[9/16] max-h-[80vh]">
        {recordedVideo ? (
          <video
            src={recordedVideo}
            className="w-full h-full object-cover"
            controls
            autoPlay
            loop
          />
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ 
                transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
                objectFit: 'cover'
              }}
            />
            {!cameraReady && (
              <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                  <p>Iniciando câmera...</p>
                </div>
              </div>
            )}
          </>
        )}

        {/* Recording indicator and flip button */}
        <div className="absolute top-4 left-0 right-0 z-10 px-4 flex justify-between items-start">
          {isRecording ? (
            <div className="bg-red-500 text-white px-4 py-2 rounded-full flex items-center gap-2 animate-pulse mx-auto">
              <div className="w-3 h-3 bg-white rounded-full" />
              <span className="font-semibold">{recordingTime}s</span>
            </div>
          ) : (
            !recordedVideo && (
              <Button
                onClick={toggleCamera}
                size="sm"
                variant="outline"
                className="rounded-full bg-black/70 border-2 border-white text-white hover:bg-black/90 hover:border-gray-300 ml-auto shadow-lg backdrop-blur-sm"
                title="Trocar câmera"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            )
          )}
        </div>

        {/* Controls overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
          {recordedVideo ? (
            <div className="flex items-center justify-center gap-6">
              <div className="flex flex-col items-center gap-2">
                <Button
                  onClick={handleRetry}
                  size="lg"
                  variant="outline"
                  className="rounded-full w-14 h-14 p-0 border-2 border-white bg-black/70 text-white hover:bg-black/90 hover:border-gray-300 shadow-lg backdrop-blur-sm"
                  title="Tentar novamente"
                >
                  <RotateCcw className="w-6 h-6" />
                </Button>
                <span className="text-white text-xs font-medium bg-black/60 px-2 py-1 rounded-full">
                  Repetir
                </span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Button
                  onClick={handleConfirm}
                  size="lg"
                  className="rounded-full w-16 h-16 p-0 bg-green-500 hover:bg-green-600 text-white shadow-lg"
                  title="Confirmar e enviar"
                >
                  <Check className="w-8 h-8" />
                </Button>
                <span className="text-white text-xs font-medium bg-green-500/80 px-2 py-1 rounded-full">
                  Enviar
                </span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Button
                  onClick={onCancel}
                  size="lg"
                  variant="outline"
                  className="rounded-full w-14 h-14 p-0 border-2 border-white bg-red-500/80 text-white hover:bg-red-600 hover:border-gray-300 shadow-lg backdrop-blur-sm"
                  title="Cancelar"
                >
                  <X className="w-6 h-6" />
                </Button>
                <span className="text-white text-xs font-medium bg-red-500/80 px-2 py-1 rounded-full">
                  Cancelar
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-4">
              <div className="flex flex-col items-center gap-2">
                <Button
                  onClick={onCancel}
                  size="lg"
                  variant="outline"
                  className="rounded-full w-14 h-14 p-0 border-2 border-white bg-red-500/80 text-white hover:bg-red-600 hover:border-gray-300 shadow-lg backdrop-blur-sm"
                  title="Cancelar"
                >
                  <X className="w-6 h-6" />
                </Button>
                <span className="text-white text-xs font-medium bg-red-500/80 px-2 py-1 rounded-full">
                  Sair
                </span>
              </div>
              <div className="flex flex-col items-center gap-2">
                {!isRecording ? (
                  <Button
                    onClick={startRecording}
                    disabled={!cameraReady || !stream}
                    size="lg"
                    className="rounded-full w-20 h-20 p-0 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    title={cameraReady && stream ? "Iniciar gravação" : "Aguardando câmera..."}
                  >
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${cameraReady && stream ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-400'} transition-colors`}>
                      <Video className="w-8 h-8 text-white" />
                    </div>
                  </Button>
                ) : (
                  <Button
                    onClick={stopRecording}
                    size="lg"
                    className="rounded-full w-20 h-20 p-0 bg-white hover:bg-gray-100 shadow-lg"
                    title="Parar gravação"
                  >
                    <div className="w-8 h-8 rounded bg-red-500 hover:bg-red-600 transition-colors" />
                  </Button>
                )}
                {!isRecording && (
                  <span className="text-white text-xs font-medium bg-black/60 px-2 py-1 rounded-full">
                    {cameraReady && stream ? 'Gravar' : 'Carregando...'}
                  </span>
                )}
              </div>
            </div>
          )}
          
          {!recordedVideo && !isRecording && (
            <p className="text-white text-center mt-4 text-sm">
              Limite: 20 segundos
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};
