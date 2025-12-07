"use client";

import { Volume2, VolumeX, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

// Helper function to format time (MM:SS)
const formatTime = (seconds: number): string => {
  if (!seconds || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

interface VideoPlayerProps {
  src: string;
  videoId?: string;
  className?: string;
  containerClassName?: string;
  autoPlay?: boolean;
  loop?: boolean;
  initialMuted?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onMutedChange?: (muted: boolean) => void;
  showControls?: boolean;
  intersectionObserverId?: string;
  aspectRatio?: string;
  maxHeight?: string;
}

export default function VideoPlayer({
  src,
  className,
  containerClassName,
  autoPlay = false,
  loop = true,
  initialMuted = false,
  onPlay,
  onPause,
  onMutedChange,
  showControls = true,
  intersectionObserverId,
  aspectRatio,
  maxHeight,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(initialMuted);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Update video element when props change
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
      if (onMutedChange) {
        onMutedChange(isMuted);
      }
    }
  }, [isMuted, onMutedChange]);

  // Set up video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setProgress(video.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handlePlay = () => {
      setIsPlaying(true);
      if (onPlay) onPlay();
    };

    const handlePause = () => {
      setIsPlaying(false);
      if (onPause) onPause();
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);

    // Set initial muted state
    video.muted = isMuted;

    // Auto-play if requested
    if (autoPlay) {
      video.play().catch((error) => {
        console.error("Error auto-playing video:", error);
      });
    }

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
    };
  }, [autoPlay, isMuted, onPlay, onPause]);

  // Set up Intersection Observer if intersectionObserverId is provided
  useEffect(() => {
    if (!intersectionObserverId || !videoRef.current) return;

    const video = videoRef.current;
    const container = video.parentElement; // The container div has the data-video-id

    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting && !video.paused) {
            video.pause();
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px",
      }
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [intersectionObserverId]);

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch((error) => {
        console.error("Error playing video:", error);
      });
    }
  };

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const newTime = parseFloat(e.target.value);
    video.currentTime = newTime;
    setProgress(newTime);
  };

  return (
    <div
      data-video-id={intersectionObserverId}
      className={cn(
        "relative group bg-black rounded-2xl overflow-hidden",
        containerClassName
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        aspectRatio: aspectRatio,
        maxHeight: maxHeight,
      }}
    >
      <video
        ref={videoRef}
        src={src}
        className={cn("w-full h-full object-contain cursor-pointer", className)}
        playsInline
        loop={loop}
        muted={isMuted}
        onClick={togglePlayPause}
      >
        Your browser does not support the video tag.
      </video>

      {showControls && (
        <>
          {/* Mute/Unmute Button - Top Right */}
          <div
            className={cn(
              "absolute top-3 right-3 transition-opacity z-10",
              isHovered ? "opacity-100" : "opacity-0"
            )}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleMute();
              }}
              className="p-2 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors"
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Play Button - Center (only shown when paused) */}
          <AnimatePresence>
            {!isPlaying && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePlayPause();
                  }}
                  className="p-4 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 pointer-events-auto"
                  aria-label="Play"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                  }}
                >
                  <Play className="h-10 w-10 fill-current" />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Video Progress Slider - Bottom */}
          <div
            className={cn(
              "absolute bottom-0 left-0 right-0 p-3 transition-opacity z-10 bg-gradient-to-t from-black/70 via-black/50 to-transparent",
              isHovered ? "opacity-100" : "opacity-0"
            )}
          >
            <div className="flex items-center gap-3 text-white">
              <span className="shrink-0 min-w-12 text-right text-xs font-medium">
                {formatTime(progress)}
              </span>
              <div className="flex-1 relative">
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={progress}
                  onChange={handleProgressChange}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-0 [&::-webkit-slider-thumb]:h-0 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-0 [&::-moz-range-thumb]:h-0"
                  style={{
                    background: `linear-gradient(to right, white 0%, white ${
                      ((progress || 0) / (duration || 1)) * 100
                    }%, rgba(255, 255, 255, 0.2) ${
                      ((progress || 0) / (duration || 1)) * 100
                    }%, rgba(255, 255, 255, 0.2) 100%)`,
                  }}
                />
              </div>
              <span className="shrink-0 min-w-12 text-xs font-medium">
                {formatTime(duration)}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
