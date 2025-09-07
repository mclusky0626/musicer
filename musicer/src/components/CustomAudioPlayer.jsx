import React, { useState, useEffect, useRef } from 'react';

const CustomAudioPlayer = ({ src, onEnded }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isReady, setIsReady] = useState(false); // 오디오가 준비되었는지 확인하는 상태

  // 오디오 소스가 바뀌면 로드하고 재생
  useEffect(() => {
    // src가 유효한 값일 때만 오디오 소스를 설정
    if (src && audioRef.current) {
      audioRef.current.src = src;
      audioRef.current.load(); // 소스를 바꾸면 load()를 호출해주는 것이 좋음
      // 사용자가 페이지와 상호작용하기 전까지 자동재생은 실패할 수 있음
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false)); // 자동재생 실패 시, 재생 상태를 false로 설정
    } else {
      // src가 없으면 모든 상태 초기화
      setIsPlaying(false);
      setDuration(0);
      setCurrentTime(0);
      setIsReady(false);
    }
  }, [src]);

  // 오디오 이벤트 리스너 설정
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setAudioData = () => {
      setDuration(audio.duration);
      setCurrentTime(audio.currentTime);
      setIsReady(true); // 데이터가 로드되면 준비 완료
    };

    const setAudioTime = () => setCurrentTime(audio.currentTime);

    audio.addEventListener('loadeddata', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);
    audio.addEventListener('play', () => setIsPlaying(true));
    audio.addEventListener('pause', () => setIsPlaying(false));
    audio.addEventListener('ended', onEnded);
    // 에러 이벤트 리스너 추가 (디버깅에 유용)
    audio.addEventListener('error', () => setIsReady(false));

    return () => {
      audio.removeEventListener('loadeddata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
      // ... (나머지 리스너 제거 코드)
    };
  }, [onEnded]);

  const togglePlayPause = () => {
    // ▼▼▼ 1. 방어 코드 추가 ▼▼▼
    // 오디오가 준비되지 않았으면 아무것도 하지 않음
    if (!isReady) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const handleProgressChange = (e) => {
    // ▼▼▼ 2. 방어 코드 추가 ▼▼▼
    // duration이 유효한 숫자가 아닐 경우 아무것도 하지 않음
    if (!audioRef.current || !isFinite(audioRef.current.duration)) return;

    const newTime = (audioRef.current.duration / 100) * e.target.value;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };
  
  const formatTime = (time) => {
    if (isNaN(time) || time === 0) return '00:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const progressPercentage = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="custom-player">
      <audio ref={audioRef} />
      {/* ▼▼▼ 3. UI 비활성화 로직 추가 ▼▼▼ */}
      <button onClick={togglePlayPause} className="play-pause-btn" disabled={!isReady}>
        <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
      </button>
      <div className="timeline-container">
        <span>{formatTime(currentTime)}</span>
        <div className="progress-bar-wrapper">
          <input
            type="range"
            min="0"
            max="100"
            value={progressPercentage || 0}
            onChange={handleProgressChange}
            className="progress-bar"
            disabled={!isReady}
          />
        </div>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
};

export default CustomAudioPlayer;