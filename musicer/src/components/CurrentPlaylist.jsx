import React, { useState, useEffect } from 'react';
import CustomAudioPlayer from './CustomAudioPlayer';

const CurrentPlaylist = ({ playlist, currentSong, onRemoveSong, onPlaySong, onEnded, onSave, isLoggedIn, loadedPlaylistInfo, onNewPlaylist }) => {
  const [playlistName, setPlaylistName] = useState('');

  useEffect(() => {
    if (loadedPlaylistInfo) {
      setPlaylistName(loadedPlaylistInfo.name);
    } else {
      setPlaylistName('');
    }
  }, [loadedPlaylistInfo]);

  const handleSaveClick = () => {
    if (!loadedPlaylistInfo && !playlistName.trim()) {
      alert('재생목록 이름을 입력하세요.');
      return;
    }
    onSave(playlistName);
  };
  
  const handleRemoveSong = (index) => {
      onRemoveSong(index);
  }

  return (
    <div className="panel sticky">
      <h2>{currentSong ? currentSong.name.replace(/\.mp3$/i, '') : '음악 플레이어'}</h2>
      <CustomAudioPlayer 
        src={currentSong?.url}
        onEnded={onEnded}
      />
      
      <div className="playlist-header">
        <h3>{loadedPlaylistInfo ? '재생목록 수정' : '현재 재생목록'}</h3>
        {loadedPlaylistInfo && (
          <button className="btn-new-playlist" onClick={onNewPlaylist}>+ 새 재생목록</button>
        )}
      </div>

      <ul className="current-playlist-list">
        {playlist.length > 0 ? (
          playlist.map((song, index) => (
            <li key={song.id} className={currentSong?.id === song.id ? 'playing' : ''}>
              <span className="song-title" onClick={() => onPlaySong(index)}>
                {song.name.replace(/\.mp3$/i, '')}
              </span>
              <button className="btn" title="목록에서 제거" onClick={() => handleRemoveSong(index)}>×</button>
            </li>
          ))
        ) : (
          <li>추가된 노래가 없습니다.</li>
        )}
      </ul>

      <div className="save-section">
        {isLoggedIn ? (
          <>
            <input
              type="text"
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              placeholder="새 재생목록 이름"
              disabled={!!loadedPlaylistInfo} 
            />
            <button onClick={handleSaveClick}>
              {loadedPlaylistInfo ? '수정사항 저장' : '새로 저장'}
            </button>
          </>
        ) : (
          <p className="login-prompt">재생목록을 저장/수정하려면 로그인하세요.</p>
        )}
      </div>
    </div>
  );
};

export default CurrentPlaylist;