import React from 'react';

const SavedPlaylists = ({ playlists, onLoadPlaylist, onDeletePlaylist }) => {
  return (
    <div className="panel">
      <h2>저장된 재생목록</h2>
      <ul>
        {playlists && playlists.length > 0 ? (
          playlists.map((playlist) => {
            if (!playlist || !playlist.id) return null;
            const fileName = playlist.name.replace(/\.json$/i, '');
            return (
              <li key={playlist.id} className="playlist-item">
                <span className="song-title" onClick={() => onLoadPlaylist(playlist.id, fileName)}>
                  {fileName}
                </span>
                <div className="playlist-actions">
                  <button className="btn-icon" title="삭제" onClick={() => onDeletePlaylist(playlist.id, fileName)}>
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </li>
            );
          })
        ) : (
          <li>저장된 재생목록이 없습니다.</li>
        )}
      </ul>
    </div>
  );
};

export default SavedPlaylists;