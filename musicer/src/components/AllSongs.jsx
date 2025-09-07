import React, { useState, useMemo } from 'react';

const AllSongs = ({ songs, onAddSong, onPlaySong }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // 검색어가 바뀔 때만 필터링을 다시 수행하도록 useMemo 사용 (성능 최적화)
  const filteredSongs = useMemo(() => {
    if (!searchTerm) {
      return songs;
    }
    return songs.filter(song =>
      song.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [songs, searchTerm]);

  return (
    <div className="panel">
      <h2>전체 노래 목록</h2>
      <div className="search-bar-container">
        <i className="fas fa-search"></i>
        <input
          type="text"
          placeholder="노래 제목 검색..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      {/* 이제 filteredSongs를 사용해 목록을 렌더링 */}
      <ul>
        {filteredSongs.length > 0 ? (
          filteredSongs.map((song) => (
            <li key={song.id}>
              <span className="song-title" onClick={() => onPlaySong(song)}>
                {song.name.replace(/\.mp3$/i, '')}
              </span>
              <button className="btn" title="재생목록에 추가" onClick={() => onAddSong(song)}>+</button>
            </li>
          ))
        ) : (
          <li>검색 결과가 없습니다.</li>
        )}
      </ul>
    </div>
  );
};

export default AllSongs;