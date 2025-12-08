"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight, Play, Pause } from "lucide-react";
import Link from "next/link";

type Story = {
  id: string;
  userId: string;
  url: string;
  caption: string;
  createdAt: string;
  expiresAt: string;
};

type StoryData = {
  story: Story & {
    user: {
      id: string;
      username: string;
      name: string;
      imageUrl: string | null;
    };
  };
  allStories: Story[];
};

const STORY_DURATION = 5000; // 5 seconds per story

export default function StoryViewerPage() {
  const params = useParams();
  const router = useRouter();
  const username = params?.username as string;
  const storyId = params?.storyId as string;

  const [storyData, setStoryData] = useState<StoryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isVideo, setIsVideo] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);

  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Navigation handlers
  const handleNext = useCallback(() => {
    if (!storyData) return;

    if (currentStoryIndex < storyData.allStories.length - 1) {
      const nextStory = storyData.allStories[currentStoryIndex + 1];
      router.replace(`/stories/${username}/${nextStory.id}`);
    } else {
      // Go to next user's stories or back to home
      router.push("/");
    }
  }, [storyData, currentStoryIndex, username, router]);

  const handlePrevious = useCallback(() => {
    if (!storyData) return;

    if (currentStoryIndex > 0) {
      const prevStory = storyData.allStories[currentStoryIndex - 1];
      router.replace(`/stories/${username}/${prevStory.id}`);
    } else {
      router.push("/");
    }
  }, [storyData, currentStoryIndex, username, router]);

  const togglePause = useCallback(() => {
    if (isVideo && videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setVideoPlaying(true);
      } else {
        videoRef.current.pause();
        setVideoPlaying(false);
      }
    } else {
      setIsPaused((prev) => !prev);
    }
  }, [isVideo]);

  // Fetch story data
  useEffect(() => {
    const fetchStory = async () => {
      if (!storyId) return;

      try {
        setIsLoading(true);
        const response = await fetch(`/api/stories/${storyId}`);

        if (!response.ok) {
          if (response.status === 404) {
            router.push("/");
            return;
          }
          throw new Error("Failed to fetch story");
        }

        const result = await response.json();
        if (result.data) {
          setStoryData(result.data);
          // Find current story index
          const index = result.data.allStories.findIndex(
            (s: Story) => s.id === storyId
          );
          const storyIndex = index >= 0 ? index : 0;
          setCurrentStoryIndex(storyIndex);
          // Check if story has video
          const currentStory = result.data.allStories[storyIndex];
          if (currentStory?.url) {
            const isVideoFile =
              currentStory.url.match(/\.(mp4|webm|ogg|mov|avi|mkv)$/i) !== null;
            setIsVideo(isVideoFile);
          } else {
            setIsVideo(false);
          }
        }
      } catch (error) {
        console.error("Error fetching story:", error);
        router.push("/");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStory();
  }, [storyId, router]);

  // Handle progress and auto-advance for images
  useEffect(() => {
    if (!storyData || isPaused || isVideo) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      return;
    }

    // Only run timer for images (not videos)
    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + 2; // Update every 100ms (2% per 100ms = 5 seconds total)
      });
    }, 100);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, [storyData, isPaused, isVideo, currentStoryIndex, handleNext]);

  // Handle video progress and events
  useEffect(() => {
    if (isVideo && videoRef.current) {
      const video = videoRef.current;

      const handleTimeUpdate = () => {
        if (video.duration) {
          const progressPercent = (video.currentTime / video.duration) * 100;
          setProgress(progressPercent);
        }
      };

      const handleLoadedMetadata = () => {
        setVideoDuration(video.duration);
        setProgress(0);
      };

      const handleEnded = () => {
        setProgress(100);
        handleNext();
      };

      const handlePlay = () => {
        setVideoPlaying(true);
      };

      const handlePause = () => {
        setVideoPlaying(false);
      };

      video.addEventListener("timeupdate", handleTimeUpdate);
      video.addEventListener("loadedmetadata", handleLoadedMetadata);
      video.addEventListener("ended", handleEnded);
      video.addEventListener("play", handlePlay);
      video.addEventListener("pause", handlePause);

      return () => {
        video.removeEventListener("timeupdate", handleTimeUpdate);
        video.removeEventListener("loadedmetadata", handleLoadedMetadata);
        video.removeEventListener("ended", handleEnded);
        video.removeEventListener("play", handlePlay);
        video.removeEventListener("pause", handlePause);
      };
    }
  }, [isVideo, currentStoryIndex, handleNext]);

  // Reset progress when story changes
  useEffect(() => {
    setProgress(0);
    setIsPaused(false);
    setVideoDuration(0);
    if (storyData) {
      const currentStory = storyData.allStories[currentStoryIndex];
      if (currentStory?.url) {
        const isVideoFile =
          currentStory.url.match(/\.(mp4|webm|ogg|mov|avi|mkv)$/i) !== null;
        setIsVideo(isVideoFile);
      } else {
        setIsVideo(false);
      }
    }
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      if (isVideo && !isPaused) {
        videoRef.current.play().catch(console.error);
        setVideoPlaying(true);
      } else if (videoRef.current) {
        videoRef.current.pause();
        setVideoPlaying(false);
      }
    }
  }, [currentStoryIndex, storyData, isVideo, isPaused]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        handleNext();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        handlePrevious();
      } else if (e.key === "Escape") {
        router.push("/");
      } else if (e.key === " ") {
        e.preventDefault();
        togglePause();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handlePrevious, togglePause, router]);

  if (isLoading || !storyData) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  const currentStory = storyData.allStories[currentStoryIndex];
  const user = storyData.story.user;

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Progress Bars */}
      <div className="absolute top-0 left-0 right-0 z-20 p-2 flex gap-1">
        {storyData.allStories.map((story, index) => (
          <div
            key={story.id}
            className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
          >
            <div
              className={`h-full bg-white transition-all duration-100 ${
                index < currentStoryIndex
                  ? "w-full"
                  : index === currentStoryIndex
                  ? "w-full"
                  : "w-0"
              }`}
              style={{
                width:
                  index < currentStoryIndex
                    ? "100%"
                    : index === currentStoryIndex
                    ? `${progress}%`
                    : "0%",
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-12 left-0 right-0 z-20 px-4 flex items-center justify-between">
        <Link
          href={`/${user.username}`}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <Avatar className="h-10 w-10 border-2 border-white">
            <AvatarImage src={user.imageUrl || ""} />
            <AvatarFallback className="bg-muted text-foreground">
              {user.name[0] || user.username[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-white font-semibold text-sm">{user.username}</p>
            <p className="text-white/70 text-xs">
              {new Date(currentStory.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/")}
          className="text-white hover:bg-white/20"
        >
          <X className="h-6 w-6" />
        </Button>
      </div>

      {/* Story Content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {currentStory.url ? (
          isVideo ? (
            <video
              ref={videoRef}
              src={currentStory.url}
              className="max-w-full max-h-full object-contain"
              playsInline
              autoPlay
              muted={false}
              onPlay={() => setVideoPlaying(true)}
              onPause={() => setVideoPlaying(false)}
            />
          ) : (
            <img
              src={currentStory.url}
              alt="Story"
              className="max-w-full max-h-full object-contain"
            />
          )
        ) : (
          <div className="text-center p-8 text-white max-w-md">
            <p className="text-lg whitespace-pre-wrap">
              {currentStory.caption}
            </p>
          </div>
        )}
      </div>

      {/* Caption */}
      {currentStory.caption && currentStory.url && (
        <div className="absolute bottom-20 left-0 right-0 z-20 px-4">
          <p className="text-white text-sm bg-black/50 backdrop-blur-sm rounded-lg p-3">
            {currentStory.caption}
          </p>
        </div>
      )}

      {/* Navigation Areas */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1/3 cursor-pointer z-10"
        onClick={handlePrevious}
      />
      <div
        className="absolute right-0 top-0 bottom-0 w-1/3 cursor-pointer z-10"
        onClick={handleNext}
      />

      {/* Controls */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePrevious}
          className="text-white hover:bg-white/20"
          disabled={currentStoryIndex === 0}
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={togglePause}
          className="text-white hover:bg-white/20"
        >
          {isVideo ? (
            videoPlaying ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6" />
            )
          ) : isPaused ? (
            <Play className="h-6 w-6" />
          ) : (
            <Pause className="h-6 w-6" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNext}
          className="text-white hover:bg-white/20"
          disabled={currentStoryIndex === storyData.allStories.length - 1}
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}
