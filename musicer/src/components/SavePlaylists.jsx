import React from 'react';

// Props: playlists(배열), onLoadPlaylist(함수)
const SavedPlaylists = ({ playlists, onLoadPlaylist }) => {
  if (playlists.length === 0) {
    return <p>저장된 재생목록이 없거나 불러오는 중입니다...</p>;
  }

  return (
    <div className="panel">
      <h2>저장된 재생목록</h2>
      <ul>
        {playlists.map((playlist) => (
          <li key={playlist.id} onClick={() => onLoadPlaylist(playlist.id)}>
            <span className="song-title">{playlist.name.replace(/\.json$/i, '')}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SavedPlaylists;