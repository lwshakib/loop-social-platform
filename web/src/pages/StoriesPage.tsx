import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { ChevronLeft, ChevronRight, Volume2, VolumeX, X } from "lucide-react";
import { toast } from "sonner";

type Story = {
  id: string;
  userId: string;
  user?: {
    id: string;
    firstName?: string;
    surName?: string;
    username?: string;
    profileImage?: string;
  };
  caption: string;
  url: string;
  type: "text" | "image" | "video";
  createdAt: string;
  expiresAt: string;
};

type StoryGroup = {
  userId: string;
  user?: {
    id: string;
    firstName?: string;
    surName?: string;
    username?: string;
    profileImage?: string;
  };
  stories: Story[];
};

export default function StoriesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  // Parse username and storyId from pathname
  // Path format: /stories/@username/storyId or /stories/username/storyId
  const pathParts = location.pathname.split("/").filter(Boolean);
  const username = pathParts[1] || "";
  const storyId = pathParts[2] || "";
  const [allStoryGroups, setAllStoryGroups] = useState<StoryGroup[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [currentUserIndex, setCurrentUserIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  // Remove @ from username if present
  const cleanUsername = username?.replace(/^@/, "") || "";

  // Fetch all stories grouped by user
  useEffect(() => {
    const fetchAllStories = async () => {
      try {
        const getCookie = (name: string): string | null => {
          const value = `; ${document.cookie}`;
          const parts = value.split(`; ${name}=`);
          if (parts.length === 2) {
            return parts.pop()?.split(";").shift() || null;
          }
          return null;
        };

        const serverUrl = import.meta.env.VITE_SERVER_URL || "";
        const accessToken = getCookie("accessToken");

        if (!accessToken) {
          toast.error("Error", {
            description: "You must be logged in to view stories",
          });
          navigate("/");
          return;
        }

        // Fetch all stories grouped by user
        const response = await fetch(`${serverUrl}/stories`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          credentials: "include",
        });

        if (response.ok) {
          const result = await response.json();
          if (result.data && Array.isArray(result.data)) {
            setAllStoryGroups(result.data);
            
            // Find the current user's story group
            const currentUserGroupIndex = result.data.findIndex(
              (group: StoryGroup) => group.user?.username === cleanUsername
            );
            
            if (currentUserGroupIndex !== -1) {
              const currentUserGroup = result.data[currentUserGroupIndex];
              setStories(currentUserGroup.stories || []);
              setCurrentUserIndex(currentUserGroupIndex);
              
              // Find the index of the current story
              if (storyId && currentUserGroup.stories) {
                const index = currentUserGroup.stories.findIndex(
                  (s: Story) => s.id === storyId
                );
                if (index !== -1) {
                  setCurrentStoryIndex(index);
                }
              }
            } else if (cleanUsername) {
              // If user not found in all stories, try fetching their stories directly
              const userResponse = await fetch(`${serverUrl}/stories/user/${cleanUsername}`, {
                method: "GET",
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
                credentials: "include",
              });

              if (userResponse.ok) {
                const userResult = await userResponse.json();
                if (userResult.data && Array.isArray(userResult.data)) {
                  setStories(userResult.data);
                  if (storyId) {
                    const index = userResult.data.findIndex(
                      (s: Story) => s.id === storyId
                    );
                    if (index !== -1) {
                      setCurrentStoryIndex(index);
                    }
                  }
                }
              }
            }
          }
        } else {
          const error = await response.json();
          toast.error("Error", {
            description: error.message || "Failed to load stories",
          });
          navigate("/");
        }
      } catch (error) {
        console.error("Error fetching stories:", error);
        toast.error("Error", {
          description: "Failed to load stories",
        });
        navigate("/");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllStories();
  }, [cleanUsername, storyId, navigate]);

  // Handle video play/pause and autoplay
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const currentStory = stories[currentStoryIndex];
    
    if (currentStory?.type === "video") {
      // Set video muted state
      video.muted = isMuted;
      video.load();
      
      // Try to play the video
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsVideoPlaying(true);
          })
          .catch((error) => {
            console.error("Error playing video:", error);
            setIsVideoPlaying(false);
          });
      }
    } else {
      video.pause();
      setIsVideoPlaying(false);
    }

    return () => {
      if (video) {
        video.pause();
      }
    };
  }, [currentStoryIndex, stories, isMuted]);

  // Function to go to next user's story (skip current user's remaining stories)
  const handleNextUser = () => {
    if (currentUserIndex < allStoryGroups.length - 1) {
      const nextUserGroup = allStoryGroups[currentUserIndex + 1];
      if (nextUserGroup && nextUserGroup.stories && nextUserGroup.stories.length > 0) {
        const nextUser = nextUserGroup.user;
        const firstStory = nextUserGroup.stories[0];
        if (nextUser?.username && firstStory) {
          setCurrentUserIndex(currentUserIndex + 1);
          setStories(nextUserGroup.stories);
          setCurrentStoryIndex(0);
          navigate(`/stories/@${nextUser.username}/${firstStory.id}`, {
            replace: true,
          });
        } else {
          navigate("/");
        }
      } else {
        navigate("/");
      }
    } else {
      // No more users, go back to home
      navigate("/");
    }
  };

  const handleNextStory = () => {
    if (currentStoryIndex < stories.length - 1) {
      // Move to next story in current user's stack
      const nextIndex = currentStoryIndex + 1;
      setCurrentStoryIndex(nextIndex);
      const nextStory = stories[nextIndex];
      if (nextStory && cleanUsername) {
        navigate(`/stories/@${cleanUsername}/${nextStory.id}`, {
          replace: true,
        });
      }
    } else {
      // Current user's stories are finished, move to next user
      handleNextUser();
    }
  };

  const handlePreviousStory = () => {
    if (currentStoryIndex > 0) {
      // Move to previous story in current user's stack
      const prevIndex = currentStoryIndex - 1;
      setCurrentStoryIndex(prevIndex);
      const prevStory = stories[prevIndex];
      if (prevStory && cleanUsername) {
        navigate(`/stories/@${cleanUsername}/${prevStory.id}`, {
          replace: true,
        });
      }
    } else {
      // At the beginning of current user's stories, move to previous user's last story
      if (currentUserIndex > 0) {
        const prevUserGroup = allStoryGroups[currentUserIndex - 1];
        if (prevUserGroup && prevUserGroup.stories && prevUserGroup.stories.length > 0) {
          const prevUser = prevUserGroup.user;
          const lastStory = prevUserGroup.stories[prevUserGroup.stories.length - 1];
          if (prevUser?.username && lastStory) {
            setCurrentUserIndex(currentUserIndex - 1);
            setStories(prevUserGroup.stories);
            setCurrentStoryIndex(prevUserGroup.stories.length - 1);
            navigate(`/stories/@${prevUser.username}/${lastStory.id}`, {
              replace: true,
            });
          } else {
            navigate("/");
          }
        } else {
          navigate("/");
        }
      } else {
        // At the first user's first story, go back to home
        navigate("/");
      }
    }
  };

  const handleClose = () => {
    navigate("/");
  };

  const currentStory = stories[currentStoryIndex];

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white">Loading story...</p>
        </div>
      </div>
    );
  }

  if (!currentStory || stories.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-center text-white">
          <p className="text-lg mb-4">Story not found</p>
          <Button onClick={handleClose} variant="outline">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 flex items-center justify-between">
        <button
          onClick={handleClose}
          className="text-white font-bold text-xl hover:opacity-80 transition-opacity"
        >
          Loop
        </button>
        <button
          onClick={handleClose}
          className="text-white hover:opacity-80 transition-opacity"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Story Content */}
      <div className="flex-1 flex items-center justify-center relative">
        {/* Previous Story Button */}
        {currentStoryIndex > 0 && (
          <button
            onClick={handlePreviousStory}
            className="absolute left-4 z-20 text-white hover:opacity-80 transition-opacity"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>
        )}

        {/* Story Display */}
        <div className="w-full h-full flex items-center justify-center relative">
          {currentStory.type === "text" ? (
            <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 w-full h-full flex items-center justify-center p-8">
              <div className="text-center text-white max-w-2xl">
                <p className="text-2xl sm:text-3xl md:text-4xl font-semibold whitespace-pre-wrap break-words">
                  {currentStory.caption || currentStory.url}
                </p>
              </div>
            </div>
          ) : currentStory.type === "image" ? (
            <div className="w-full h-full flex items-center justify-center bg-black">
              <img
                src={currentStory.url}
                alt={currentStory.caption || "Story"}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-black relative">
              <video
                ref={videoRef}
                src={currentStory.url}
                className="max-w-full max-h-full object-contain cursor-pointer"
                playsInline
                muted={isMuted}
                autoPlay
                onPlay={() => setIsVideoPlaying(true)}
                onPause={() => setIsVideoPlaying(false)}
                onEnded={() => {
                  // When video ends, automatically go to next story
                  handleNextStory();
                }}
                onLoadedData={() => {
                  // Ensure video plays when data is loaded
                  const video = videoRef.current;
                  if (video && !video.paused) {
                    setIsVideoPlaying(true);
                  }
                }}
                onClick={() => {
                  const video = videoRef.current;
                  if (video) {
                    if (isVideoPlaying) {
                      video.pause();
                    } else {
                      video.play().catch((error) => {
                        console.error("Error playing video:", error);
                      });
                    }
                  }
                }}
              />
              
              {/* Mute/Unmute Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMuted(!isMuted);
                  const video = videoRef.current;
                  if (video) {
                    video.muted = !isMuted;
                  }
                }}
                className="absolute top-4 right-4 z-30 p-2 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors"
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </button>
            </div>
          )}
        </div>

        {/* Next Story Button - Show if there are more stories in current user's stack */}
        <div className="absolute right-4 z-20 flex flex-col gap-2">
          {currentStoryIndex < stories.length - 1 && (
            <button
              onClick={handleNextStory}
              className="text-white hover:opacity-80 transition-opacity"
              aria-label="Next story"
            >
              <ChevronRight className="h-8 w-8" />
            </button>
          )}

          {/* Skip to Next User Button - Always show if there are more users */}
          {currentUserIndex < allStoryGroups.length - 1 && (
            <button
              onClick={handleNextUser}
              className="text-white hover:opacity-80 transition-opacity bg-black/50 backdrop-blur-sm rounded-full p-2 flex items-center gap-1"
              aria-label="Skip to next user"
            >
              <ChevronRight className="h-5 w-5" />
              <span className="text-xs font-medium">Next User</span>
            </button>
          )}
        </div>
      </div>

      {/* User Info and Caption at Bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/90 via-black/80 to-transparent">
        <div className="p-4 space-y-3">
          {/* User Info */}
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-white shrink-0">
              <AvatarImage
                src={currentStory.user?.profileImage || ""}
                alt={currentStory.user?.username || ""}
              />
              <AvatarFallback className="text-xs">
                {currentStory.user?.firstName?.[0] ||
                  currentStory.user?.username?.[0] ||
                  "U"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-white font-semibold text-sm">
                {currentStory.user?.username || "unknown"}
              </p>
              <p className="text-white/70 text-xs">
                {new Date(currentStory.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
          
          {/* Caption */}
          {currentStory.caption && (
            <div className="pl-[52px]">
              <p className="text-white text-sm sm:text-base whitespace-pre-wrap break-words">
                {currentStory.caption}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Story Progress Indicators */}
      {stories.length > 1 && (
        <div className="absolute top-16 left-4 right-4 z-10 flex gap-1">
          {stories.map((_, index) => (
            <div
              key={index}
              className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
            >
              <div
                className={`h-full bg-white transition-all duration-300 ${
                  index === currentStoryIndex ? "w-full" : "w-0"
                }`}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

