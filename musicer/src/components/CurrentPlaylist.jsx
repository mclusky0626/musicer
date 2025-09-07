import React, { useState } from 'react';
import CustomAudioPlayer from './CustomAudioPlayer'; // 커스텀 플레이어 임포트

// isLoggedIn 프롭을 받아 저장 UI를 제어합니다.
const CurrentPlaylist = ({ playlist, currentSong, onRemoveSong, onPlaySong, onEnded, onSave, isLoggedIn }) => {
  // audioRef와 관련된 로직은 CustomAudioPlayer 컴포넌트로 모두 이동했습니다.
  const [playlistName, setPlaylistName] = useState('');
  
  const handleSaveClick = () => {
    if (!playlistName.trim()) {
      alert('재생목록 이름을 입력하세요.');
      return;
    }
    onSave(playlistName);
    setPlaylistName(''); // 저장 후 입력 필드 초기화
  };

  return (
    <div className="panel sticky">
      <h2>{currentSong ? currentSong.name.replace(/\.mp3$/i, '') : '음악 플레이어'}</h2>
      
      {/* 기본 <audio> 태그 대신 새로 만든 커스텀 플레이어를 사용합니다. */}
      <CustomAudioPlayer 
        src={currentSong?.url}
        onEnded={onEnded}
      />
      
      <h3>현재 재생목록</h3>
      <ul className="current-playlist-list">
        {playlist.length > 0 ? (
          playlist.map((song, index) => (
            <li key={song.id} className={currentSong?.id === song.id ? 'playing' : ''}>
              <span className="song-title" onClick={() => onPlaySong(index)}>
                {song.name.replace(/\.mp3$/i, '')}
              </span>
              <button className="btn" title="목록에서 제거" onClick={() => onRemoveSong(index)}>×</button>
            </li>
          ))
        ) : (
          <li>추가된 노래가 없습니다.</li>
        )}
      </ul>

      <div className="save-section">
        {/* 로그인 상태에 따라 저장 UI 또는 로그인 안내 메시지를 보여줍니다. */}
        {isLoggedIn ? (
          <>
            <input
              type="text"
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              placeholder="재생목록 이름"
            />
            <button onClick={handleSaveClick}>저장</button>
          </>
        ) : (
          <p className="login-prompt">재생목록을 저장하려면 로그인하세요.</p>
        )}
      </div>
    </div>
  );
};

export default CurrentPlaylist;