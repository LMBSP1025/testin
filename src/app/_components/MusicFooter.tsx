"use client";

import React, { useEffect, useRef, useState } from "react";

type MusicFooterProps = {
  playlistId: string;
  playlistTitle?: string | null;
};

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift();
}

function setCookie(name: string, value: string, days = 365) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/`;
}

export default function MusicFooter({ playlistId, playlistTitle }: MusicFooterProps) {
  const playerRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const volumeRef = useRef<HTMLInputElement | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [volume, setVolume] = useState(50);
  const [showVolumeNotice, setShowVolumeNotice] = useState(false);
  const [showManualNotice, setShowManualNotice] = useState(false);
  
  // 플레이리스트 진행 상태 추적
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [totalElapsedTime, setTotalElapsedTime] = useState(0);
  const startTimeRef = useRef<number>(0);
  const isFirstPlayRef = useRef<boolean>(true);

  useEffect(() => {
    const cookieVolume = getCookie("playerVolume");
    if (cookieVolume) {
      setVolume(Number(cookieVolume));
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!(window as any).YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      }
    }

    // YouTube API 준비 완료 시 플레이어 생성
    (window as any).onYouTubeIframeAPIReady = () => {
      if (playerRef.current) return;
      
      playerRef.current = new (window as any).YT.Player("music-player-iframe", {
        height: "0",
        width: "0",
        videoId: "",
        playerVars: {
          list: playlistId,
          listType: "playlist",
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
        },
        events: {
          onReady: onPlayerReady,
          onStateChange: onPlayerStateChange,
        },
      });
    };

    // 이미 API가 로드된 경우
    if ((window as any).YT && (window as any).YT.Player) {
      (window as any).onYouTubeIframeAPIReady();
    }
  }, [playlistId]);

  const onPlayerReady = (event: { target: any }) => {
    if (event.target && typeof event.target.getCurrentTime === "function") {
      setDuration(event.target.getDuration());
      setIsLoading(false);

      const cookieVolume = getCookie("playerVolume");
      const targetVolume = cookieVolume ? Number(cookieVolume) : 50;
      setVolume(targetVolume);
      if (playerRef.current && typeof playerRef.current.setVolume === "function") {
        playerRef.current.setVolume(targetVolume);
      }

      // 저장된 재생 상태 복원
      const savedState = localStorage.getItem("musicPlayerState");
      if (savedState) {
        try {
          const state = JSON.parse(savedState);
          if (state.playlistId === playlistId) {
            console.log("Restoring state:", state);
            
            // 재생을 완전히 중지하고 위치 복원 후 재생
            if (playerRef.current && typeof playerRef.current.pauseVideo === "function") {
              playerRef.current.pauseVideo();
              setIsPlaying(false);
            }
            
            // 이전 곡 인덱스가 있으면 해당 곡으로 이동
            if (state.currentVideoIndex > 0) {
              console.log("Moving to video index:", state.currentVideoIndex);
              
              // YouTube API의 getPlaylistIndex()를 사용하여 현재 인덱스 확인
              const currentIndex = playerRef.current.getPlaylistIndex ? playerRef.current.getPlaylistIndex() : 0;
              console.log("Current playlist index:", currentIndex);
              
              // 목표 인덱스까지 이동
              const targetIndex = state.currentVideoIndex;
              if (currentIndex !== targetIndex) {
                if (currentIndex < targetIndex) {
                  // 앞으로 이동
                  for (let i = currentIndex; i < targetIndex; i++) {
                    if (playerRef.current && typeof playerRef.current.nextVideo === "function") {
                      console.log("Moving to next video, current:", i, "target:", targetIndex);
                      playerRef.current.nextVideo();
                      // nextVideo 호출 후 즉시 일시정지
                      setTimeout(() => {
                        if (playerRef.current && typeof playerRef.current.pauseVideo === "function") {
                          playerRef.current.pauseVideo();
                        }
                      }, 100);
                    }
                  }
                } else {
                  // 뒤로 이동
                  for (let i = currentIndex; i > targetIndex; i--) {
                    if (playerRef.current && typeof playerRef.current.previousVideo === "function") {
                      console.log("Moving to previous video, current:", i, "target:", targetIndex);
                      playerRef.current.previousVideo();
                      // previousVideo 호출 후 즉시 일시정지
                      setTimeout(() => {
                        if (playerRef.current && typeof playerRef.current.pauseVideo === "function") {
                          playerRef.current.pauseVideo();
                        }
                      }, 100);
                    }
                  }
                }
                
                // 위치 복원 후 재생
                setTimeout(() => {
                  if (playerRef.current && typeof playerRef.current.seekTo === "function") {
                    // 각 곡별로 저장된 시간 계산
                    let targetTime = 0;
                    if (state.videoTimes && state.videoTimes[targetIndex]) {
                      // 특정 곡의 저장된 시간 사용
                      targetTime = state.videoTimes[targetIndex];
                    } else {
                      // 전체 경과 시간에서 현재 곡의 시간 계산
                      const totalTime = state.totalElapsedTime || 0;
                      const currentVideoTime = totalTime % (state.duration || 1);
                      targetTime = Math.max(0, currentVideoTime);
                    }
                    
                    console.log("Seeking to time:", targetTime, "in video index:", targetIndex);
                    playerRef.current.seekTo(targetTime, true);
                    
                    // seekTo 후에도 일시정지 유지
                    setTimeout(() => {
                      if (playerRef.current && typeof playerRef.current.pauseVideo === "function") {
                        playerRef.current.pauseVideo();
                      }
                      
                      // 모든 설정 완료 후 재생 시작
                      setTimeout(() => {
                        if (playerRef.current && typeof playerRef.current.playVideo === "function") {
                          playerRef.current.playVideo();
                          setIsPlaying(true);
                          console.log("Resuming playback from restored position");
                        }
                      }, 200);
                    }, 500);
                  }
                }, 1500); // 곡 이동 완료 대기 시간 증가
              } else {
                // 같은 곡이면 바로 시간 설정 후 재생
                setTimeout(() => {
                  if (playerRef.current && typeof playerRef.current.seekTo === "function") {
                    let targetTime = 0;
                    if (state.videoTimes && state.videoTimes[targetIndex]) {
                      targetTime = state.videoTimes[targetIndex];
                    } else {
                      const totalTime = state.totalElapsedTime || 0;
                      const currentVideoTime = totalTime % (state.duration || 1);
                      targetTime = Math.max(0, currentVideoTime);
                    }
                    
                    console.log("Seeking to time in same video:", targetTime);
                    playerRef.current.seekTo(targetTime, true);
                    
                    // seekTo 후 일시정지 유지
                    setTimeout(() => {
                      if (playerRef.current && typeof playerRef.current.pauseVideo === "function") {
                        playerRef.current.pauseVideo();
                      }
                      
                      // 위치 복원 완료 후 재생 시작
                      setTimeout(() => {
                        if (playerRef.current && typeof playerRef.current.playVideo === "function") {
                          playerRef.current.playVideo();
                          setIsPlaying(true);
                          console.log("Resuming playback from restored position");
                        }
                      }, 200);
                    }, 300);
                  }
                }, 800);
              }
            } else if (state.currentTime > 0) {
              // 첫 곡이면 이전 시간으로 이동 후 재생
              console.log("Seeking to time in first video:", state.currentTime);
              playerRef.current.seekTo(state.currentTime, true);
              
              // seekTo 후 일시정지 유지
              setTimeout(() => {
                if (playerRef.current && typeof playerRef.current.pauseVideo === "function") {
                  playerRef.current.pauseVideo();
                }
                
                // 위치 복원 완료 후 재생 시작
                setTimeout(() => {
                  if (playerRef.current && typeof playerRef.current.playVideo === "function") {
                    playerRef.current.playVideo();
                    setIsPlaying(true);
                    console.log("Resuming playback from restored position");
                  }
                }, 200);
              }, 300);
            } else {
              // 저장된 상태가 없으면 정상 재생
              if (playerRef.current && typeof playerRef.current.playVideo === "function") {
                playerRef.current.playVideo();
                setIsPlaying(true);
              }
            }
            
            // 시작 시간 설정 - 복원된 위치에서부터 시간 계산
            if (state.totalElapsedTime > 0) {
              startTimeRef.current = Date.now() - (state.totalElapsedTime * 1000);
              isFirstPlayRef.current = false;
            } else {
              // 저장된 시간이 없으면 현재 시간부터 시작
              startTimeRef.current = Date.now();
              isFirstPlayRef.current = false;
            }
          } else {
            // 저장된 상태가 없으면 정상 재생
            if (playerRef.current && typeof playerRef.current.playVideo === "function") {
              playerRef.current.playVideo();
              setIsPlaying(true);
            }
          }
        } catch (error) {
          console.error("Error restoring state:", error);
          // 에러 발생 시 정상 재생
          if (playerRef.current && typeof playerRef.current.playVideo === "function") {
            playerRef.current.playVideo();
            setIsPlaying(true);
          }
        }
      } else {
        // 저장된 상태가 없으면 정상 재생
        if (playerRef.current && typeof playerRef.current.playVideo === "function") {
          playerRef.current.playVideo();
          setIsPlaying(true);
        }
      }

      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        if (playerRef.current && typeof playerRef.current.getCurrentTime === "function") {
          const newCurrentTime = playerRef.current.getCurrentTime();
          setCurrentTime(newCurrentTime);
          
          // 현재 곡의 duration 업데이트
          if (typeof playerRef.current.getDuration === "function") {
            const currentDuration = playerRef.current.getDuration();
            if (currentDuration && currentDuration !== duration) {
              setDuration(currentDuration);
            }
          }
          
          // 현재 플레이리스트 인덱스 가져오기
          const playlistIndex = playerRef.current.getPlaylistIndex ? playerRef.current.getPlaylistIndex() : 0;
          setCurrentVideoIndex(playlistIndex);
          
          // 전체 경과 시간 계산 - startTimeRef가 0이 아닐 때만 계산
          let elapsed = 0;
          if (startTimeRef.current > 0) {
            elapsed = (Date.now() - startTimeRef.current) / 1000;
            setTotalElapsedTime(elapsed);
          }
          
          // 각 곡별 시간 저장을 위한 videoTimes 객체 생성
          const savedState = localStorage.getItem("musicPlayerState");
          let videoTimes: { [key: number]: number } = {};
          if (savedState) {
            try {
              const state = JSON.parse(savedState);
              videoTimes = state.videoTimes || {};
            } catch (_e) {}
          }
          
          // 현재 곡의 시간 저장
          videoTimes[playlistIndex] = newCurrentTime;
          
          // 재생 상태를 localStorage에 저장
          localStorage.setItem("musicPlayerState", JSON.stringify({
            isPlaying: isPlaying,
            playlistId: playlistId,
            currentTime: newCurrentTime,
            currentVideoIndex: playlistIndex,
            totalElapsedTime: elapsed,
            duration: duration,
            volume: volume,
            videoTimes: videoTimes  // 각 곡별 시간 추가
          }));
        }
      }, 200);
    }
  };

  const onPlayerStateChange = (event: { data: number }) => {
    if (event.data === (window as any).YT.PlayerState.PLAYING) {
      setIsPlaying(true);
      // 재생 시작 시 startTimeRef 업데이트
      if (isFirstPlayRef.current) {
        startTimeRef.current = Date.now();
        isFirstPlayRef.current = false;
      }
      
      // 새로운 곡이 재생될 때 duration 업데이트
      if (playerRef.current && typeof playerRef.current.getDuration === "function") {
        const currentDuration = playerRef.current.getDuration();
        if (currentDuration && currentDuration !== duration) {
          setDuration(currentDuration);
        }
      }
    } else if (event.data === (window as any).YT.PlayerState.PAUSED) {
      setIsPlaying(false);
    } else if (event.data === (window as any).YT.PlayerState.ENDED) {
      setIsPlaying(false);
      
      // 현재 플레이리스트 인덱스 확인
      if (playerRef.current && typeof playerRef.current.getPlaylistIndex === "function") {
        const currentIndex = playerRef.current.getPlaylistIndex();
        const playlistLength = playerRef.current.getPlaylist ? playerRef.current.getPlaylist().length : 0;
        
        console.log('Video ended - Current index:', currentIndex, 'Playlist length:', playlistLength);
        
        // 마지막 곡이 끝났는지 확인
        if (currentIndex >= playlistLength - 1) {
          // 마지막 곡이 끝났으면 첫 번째 곡부터 다시 재생
          console.log('Playlist ended, restarting from beginning');
          setTimeout(() => {
            if (playerRef.current && typeof playerRef.current.playVideoAt === "function") {
              playerRef.current.playVideoAt(0); // 첫 번째 곡(인덱스 0)부터 재생
              startTimeRef.current = Date.now();
            }
          }, 100);
        } else {
          // 중간 곡이 끝났으면 다음 곡으로 넘어가기
          if (playerRef.current && typeof playerRef.current.nextVideo === "function") {
            setTimeout(() => {
              playerRef.current.nextVideo();
              // 다음 곡으로 넘어간 후 startTimeRef 재설정
              startTimeRef.current = Date.now();
            }, 100);
          }
        }
      } else {
        // getPlaylistIndex가 지원되지 않는 경우 기본 동작
        if (playerRef.current && typeof playerRef.current.nextVideo === "function") {
          setTimeout(() => {
            playerRef.current.nextVideo();
            startTimeRef.current = Date.now();
          }, 100);
        }
      }
    } else if (event.data === (window as any).YT.PlayerState.CUED) {
      // 새로운 곡이 로드되었을 때 duration과 startTimeRef 업데이트
      if (startTimeRef.current > 0) {
        startTimeRef.current = Date.now();
      }
      
      // 새로운 곡이 로드될 때 duration 업데이트
      setTimeout(() => {
        if (playerRef.current && typeof playerRef.current.getDuration === "function") {
          const currentDuration = playerRef.current.getDuration();
          if (currentDuration && currentDuration > 0) {
            setDuration(currentDuration);
          }
        }
      }, 500); // 곡 로드 완료 후 duration 가져오기
    }
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || !duration) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickPercent = clickX / rect.width;
    const newTime = clickPercent * duration;
    
    if (playerRef.current && typeof playerRef.current.seekTo === "function") {
      playerRef.current.seekTo(newTime, true);
    }
  };

  const handleTimelineMouseDown = () => {
    setIsDragging(true);
  };

  const handleTimelineMouseUp = () => {
    setIsDragging(false);
  };

  const handleTimelineMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !timelineRef.current || !duration) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickPercent = clickX / rect.width;
    const newTime = clickPercent * duration;
    
    if (playerRef.current && typeof playerRef.current.seekTo === "function") {
      playerRef.current.seekTo(newTime, true);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number(e.target.value);
    setVolume(newVolume);
    setCookie("playerVolume", newVolume.toString());
    
    if (playerRef.current && typeof playerRef.current.setVolume === "function") {
      playerRef.current.setVolume(newVolume);
    }
  };

  const togglePlay = () => {
    if (playerRef.current && typeof playerRef.current.playVideo === "function" && typeof playerRef.current.pauseVideo === "function") {
      if (isPlaying) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const prevVideo = () => {
    if (playerRef.current && typeof playerRef.current.previousVideo === "function") {
      playerRef.current.previousVideo();
      // 이전 곡으로 이동 시 startTimeRef 재설정 및 duration 업데이트
      setTimeout(() => {
        if (startTimeRef.current > 0) {
          startTimeRef.current = Date.now();
        }
        
        // 새로운 곡의 duration 업데이트
        if (playerRef.current && typeof playerRef.current.getDuration === "function") {
          const currentDuration = playerRef.current.getDuration();
          if (currentDuration && currentDuration > 0) {
            setDuration(currentDuration);
          }
        }
      }, 500);
    }
  };

  const nextVideo = () => {
    if (playerRef.current && typeof playerRef.current.nextVideo === "function") {
      playerRef.current.nextVideo();
      // 다음 곡으로 이동 시 startTimeRef 재설정 및 duration 업데이트
      setTimeout(() => {
        if (startTimeRef.current > 0) {
          startTimeRef.current = Date.now();
        }
        
        // 새로운 곡의 duration 업데이트
        if (playerRef.current && typeof playerRef.current.getDuration === "function") {
          const currentDuration = playerRef.current.getDuration();
          if (currentDuration && currentDuration > 0) {
            setDuration(currentDuration);
          }
        }
      }, 500);
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <footer className="bg-white border-t border-none dark:bg-slate-800 fixed inset-x-0 bottom-0">
      {showVolumeNotice && (
        <div className="fixed left-1/2 bottom-24 z-50 px-4 py-2 bg-black text-white text-sm -translate-x-1/2 shadow-lg">
          플레이리스트 로딩 중...
        </div>
      )}
      {showManualNotice && (
        <div className="fixed left-1/2 bottom-24 z-50 px-4 py-2 bg-red-600 text-white text-sm -translate-x-1/2 shadow-lg">
          소리가 나지 않으면 브라우저 정책으로 인한 것이오니 재생 버튼을 다시 눌러주세요.
        </div>
      )}
      <div
        ref={timelineRef}
        className="w-full bg-gray-300 h-0.5 relative cursor-pointer"
        onClick={handleTimelineClick}
        onMouseDown={handleTimelineMouseDown}
        onMouseUp={handleTimelineMouseUp}
        onMouseMove={handleTimelineMouseMove}
      >
        <div
          className="absolute h-full bg-black"
          style={{ 
            width: `${duration && duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0}%`, 
            zIndex: 100 
          }}
        />
      </div>
      <div className="w-full px-5 py-3">
        <div id="music-player-iframe" className="w-0 h-0 overflow-hidden absolute -left-[9999px]" />
        <div className="py-1.5 flex items-center justify-between">
          {/* Title - left */}
          {!isLoading ? (
            <div className="truncate pr-2">
              <a href={`https://www.youtube.com/playlist?list=${playlistId}`}>
                {playlistTitle || "YouTube Playlist"}
              </a>
            </div>
          ) : (
            <div />
          )}
          {/* Controls + Volume - right */}
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={prevVideo} className="p-0 bg-transparent border-none text-black focus:outline-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentcolor" viewBox="0 0 13 13">
                <polyline points="0 0 3 0 3 6 13 0 13 13 3 7 3 13 0 13" />
              </svg>
            </button>
            <button onClick={togglePlay} className="p-0 bg-transparent border-none text-black focus:outline-none">
              {isPlaying ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentcolor" viewBox="0 0 13 13" stroke="currentColor">
                  <path strokeWidth={9} d="M0 0v13m13-13v13" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentcolor" viewBox="0 0 13 13">
                  <polyline points="0 0 13 6.5 0 13" />
                </svg>
              )}
            </button>
            <button onClick={nextVideo} className="p-0 bg-transparent border-none text-black focus:outline-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentcolor" viewBox="0 0 13 13">
                <polyline points="0 0 10 6 10 0 13 0 13 13 10 13 10 7 0 13 0 0" />
              </svg>
            </button>
            {!isLoading && navigator.maxTouchPoints == 0 && (
              <input
                ref={volumeRef}
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={handleVolumeChange}
                className="slider ml-2"
              />
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}

