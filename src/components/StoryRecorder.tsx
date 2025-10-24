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
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async (mode: "user" | "environment" = facingMode) => {
    try {
      // Parar stream anterior se existir
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: mode,
          width: { ideal: 1080 },
          height: { ideal: 1920 }
        },
        audio: true
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      // Tentar sem especificar facingMode se falhar
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        toast.success('Câmera ativada');
      } catch (fallbackError) {
        console.error('Fallback camera error:', fallbackError);
        toast.error('Não foi possível acessar a câmera. Verifique as permissões.');
      }
    }
  };

  const toggleCamera = () => {
    const newMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(newMode);
    startCamera(newMode);
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const startRecording = () => {
    if (!stream) return;

    chunksRef.current = [];
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp8,opus'
    });
    
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setRecordedVideo(url);
      stopCamera();
    };

    mediaRecorder.start();
    setIsRecording(true);
    setRecordingTime(0);

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
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
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
                className="rounded-full bg-black/50 border-white/30 text-white hover:bg-black/70 ml-auto"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            )
          )}
        </div>

        {/* Controls overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
          {recordedVideo ? (
            <div className="flex items-center justify-center gap-4">
              <Button
                onClick={handleRetry}
                size="lg"
                variant="outline"
                className="rounded-full w-14 h-14 p-0 border-white text-white hover:bg-white/20"
              >
                <RotateCcw className="w-6 h-6" />
              </Button>
              <Button
                onClick={handleConfirm}
                size="lg"
                className="rounded-full w-16 h-16 p-0 bg-primary"
              >
                <Check className="w-8 h-8" />
              </Button>
              <Button
                onClick={onCancel}
                size="lg"
                variant="outline"
                className="rounded-full w-14 h-14 p-0 border-white text-white hover:bg-white/20"
              >
                <X className="w-6 h-6" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-4">
              <Button
                onClick={onCancel}
                size="lg"
                variant="outline"
                className="rounded-full w-14 h-14 p-0 border-white text-white hover:bg-white/20"
              >
                <X className="w-6 h-6" />
              </Button>
              {!isRecording ? (
                <Button
                  onClick={startRecording}
                  size="lg"
                  className="rounded-full w-20 h-20 p-0 bg-white hover:bg-white/90"
                >
                  <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center">
                    <Video className="w-8 h-8 text-white" />
                  </div>
                </Button>
              ) : (
                <Button
                  onClick={stopRecording}
                  size="lg"
                  className="rounded-full w-20 h-20 p-0 bg-white hover:bg-white/90"
                >
                  <div className="w-8 h-8 rounded bg-red-500" />
                </Button>
              )}
            </div>
          )}
          
          {!recordedVideo && !isRecording && (
            <p className="text-white text-center mt-4 text-sm">
              Limite: 60 segundos
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};
