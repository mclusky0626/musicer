import React, { useState, useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual'; // 새로 설치한 라이브러리 임포트

const AllSongs = ({ songs, onAddSong, onPlaySong }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSongs = useMemo(() => {
    if (!searchTerm) {
      return songs;
    }
    return songs.filter(song =>
      song.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [songs, searchTerm]);

  // 스크롤될 컨테이너를 위한 ref
  const parentRef = useRef();

  // 가상화 로직을 처리하는 hook
  const rowVirtualizer = useVirtualizer({
    count: filteredSongs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 45, // 각 항목의 예상 높이
  });

  return (
    <div className="panel">
      <h2>전체 노래 목록 ({songs.length}곡)</h2>
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
      
      {/* 스크롤 컨테이너 역할을 할 div */}
      <div ref={parentRef} className="list-container">
        {/* 전체 높이를 가진 내부 div */}
        <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
          {/* 현재 보이는 항목만 렌더링 */}
          {rowVirtualizer.getVirtualItems().map(virtualItem => {
            const song = filteredSongs[virtualItem.index];
            if (!song) return null;

            return (
              <div
                key={virtualItem.key}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
                className="list-item-virtual"
              >
                <span className="song-title" onClick={() => onPlaySong(song)}>
                  {song.name.replace(/\.mp3$/i, '')}
                </span>
                <button className="btn" title="재생목록에 추가" onClick={() => onAddSong(song)}>+</button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AllSongs;