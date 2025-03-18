import { useState, useRef, useEffect } from "react";
import { Video } from "@shared/schema";
import { Play, Pause, Volume2, VolumeX, Maximize, X } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";

interface VideoPlayerProps {
  video: Video;
  onClose?: () => void;
}

export default function VideoPlayer({ video, onClose }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Fetch embed URL if this is an embedded video
  const { data: embedData } = useQuery({
    queryKey: ['/api/stream', video.id],
    queryFn: async () => {
      if (video.isEmbedded) {
        const response = await fetch(`/api/stream/${video.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch embed URL');
        }
        return response.json();
      }
      return null;
    },
    enabled: !!video.isEmbedded,
    refetchOnWindowFocus: false
  });
  
  // Handle successful embed URL fetch
  useEffect(() => {
    if (embedData?.embedUrl) {
      setEmbedUrl(embedData.embedUrl);
      
      // Update view count for embedded videos
      if (!sessionStorage.getItem(`video-${video.id}-viewed`)) {
        apiRequest('POST', `/api/videos/${video.id}/views`);
        sessionStorage.setItem(`video-${video.id}-viewed`, 'true');
      }
    }
  }, [embedData, video.id]);

  // Format time as MM:SS
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Update view count when video starts playing
  const handlePlay = () => {
    setIsPlaying(true);
    // Only update view count once per session
    if (!sessionStorage.getItem(`video-${video.id}-viewed`)) {
      apiRequest('POST', `/api/videos/${video.id}/views`);
      sessionStorage.setItem(`video-${video.id}-viewed`, 'true');
    }
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleProgressChange = (value: number[]) => {
    const newTime = (value[0] / 100) * duration;
    setProgress(value[0]);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      playerRef.current?.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(err => console.error(`Error attempting to enable fullscreen: ${err.message}`));
    } else {
      document.exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(err => console.error(`Error attempting to exit fullscreen: ${err.message}`));
    }
  };

  // Handle showing/hiding controls
  const showControlsTemporarily = () => {
    setShowControls(true);
    
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  // Clean up
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  // For embedded videos, we just render an iframe
  if (video.isEmbedded) {
    // If still loading the embed URL
    if (!embedUrl) {
      return (
        <div 
          ref={playerRef}
          className="flex items-center justify-center relative rounded-lg overflow-hidden bg-black aspect-video w-full"
        >
          <div className="text-white">Loading embedded video...</div>
          {onClose && (
            <button 
              onClick={onClose} 
              className="absolute top-4 right-4 text-white p-1 hover:bg-white/20 rounded-full z-10"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      );
    }
    
    // Show iframe with embedded video
    return (
      <div 
        ref={playerRef}
        className="relative rounded-lg overflow-hidden bg-black aspect-video w-full"
      >
        <iframe
          src={embedUrl}
          className="w-full h-full"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={video.title}
        />
        {onClose && (
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-white p-1 hover:bg-white/20 rounded-full z-10"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    );
  }
  
  // For uploaded videos, we use our custom player
  return (
    <div 
      ref={playerRef}
      className="relative rounded-lg overflow-hidden bg-black aspect-video w-full"
      onMouseMove={showControlsTemporarily}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        className="w-full h-full"
        src={`/api/stream/${video.id}`}
        poster={video.thumbnailPath || undefined}
        onPlay={handlePlay}
        onPause={handlePause}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onClick={togglePlay}
      />
      
      {/* Custom Video Controls */}
      <div 
        className={`absolute inset-0 flex flex-col justify-between p-4 bg-gradient-to-t from-black/70 to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
      >
        <div className="flex justify-end">
          {onClose && (
            <button 
              onClick={onClose} 
              className="text-white p-1 hover:bg-white/20 rounded-full"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        
        <div>
          <div className="mb-2">
            <Slider
              value={[progress]}
              min={0}
              max={100}
              step={0.1}
              onValueChange={handleProgressChange}
              className="h-1.5"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button 
                onClick={togglePlay}
                className="text-white p-1 hover:bg-white/20 rounded-full"
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6" />
                )}
              </button>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleMute}
                  className="text-white p-1 hover:bg-white/20 rounded-full"
                >
                  {isMuted ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </button>
                
                <div className="w-20 hidden md:block">
                  <Slider
                    value={[isMuted ? 0 : volume]}
                    min={0}
                    max={1}
                    step={0.01}
                    onValueChange={handleVolumeChange}
                  />
                </div>
              </div>
              
              <div className="text-white text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>
            
            <button
              onClick={toggleFullscreen}
              className="text-white p-1 hover:bg-white/20 rounded-full"
            >
              <Maximize className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
