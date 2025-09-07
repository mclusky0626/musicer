import React, { useState, useEffect, useCallback } from 'react';
import AllSongs from '../components/AllSongs';
import CurrentPlaylist from '../components/CurrentPlaylist';
import SavedPlaylists from '../components/SavePlaylists';
// ✅ fetchSongs는 이렇게 import로 불러오는 것이 올바른 방법입니다.
import {
  initClient, handleAuthClick, handleSignoutClick, isSignedIn, savePlaylist,
  fetchSongs, fetchPlaylists, fetchPlaylistContent, getSongUrl
} from '../api/googleDriveAPI';

const MusicPlayerPage = () => {
  const [allSongs, setAllSongs] = useState([]);
  const [savedPlaylists, setSavedPlaylists] = useState([]);
  const [currentPlaylist, setCurrentPlaylist] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const [error, setError] = useState('');
  const [isApiReady, setIsApiReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    initClient(async () => {
      setIsApiReady(true);
      setIsLoggedIn(isSignedIn());
      try {
        const [songs, playlists] = await Promise.all([fetchSongs(), fetchPlaylists()]);
        setAllSongs(songs || []);
        setSavedPlaylists(playlists || []);
      } catch (err) {
        console.error("데이터 로딩 실패:", err);
        setError("데이터를 불러오는 데 실패했습니다. API 키와 폴더 설정을 확인하세요.");
      }
    });
  }, []);

  // ❌ 이 파일 안에 const fetchSongs = ... 와 같은 코드가 있으면 안 됩니다.
  //    모든 핸들러 함수들은 정상적으로 위치합니다.

  const onAuthClick = async () => {
    await handleAuthClick();
    setTimeout(() => setIsLoggedIn(isSignedIn()), 1000);
  };
  
  const onSignoutClick = () => {
    handleSignoutClick();
    setIsLoggedIn(false);
  };

  const handleSavePlaylist = async (playlistName) => {
    console.log("1. '저장' 버튼 클릭됨. 저장할 이름:", playlistName);
    if (currentPlaylist.length === 0) {
      alert("목록에 노래를 추가해주세요.");
      return;
    }
    try {
        console.log("2. savePlaylist API 함수 호출 시도.");
      await savePlaylist(playlistName, currentPlaylist);
      console.log("4. API 호출 성공! 목록 새로고침 시도.")
      alert(`'${playlistName}' 재생목록이 저장되었습니다!`);
      const playlists = await fetchPlaylists();
      setSavedPlaylists(playlists || []);
    } catch (error) {
      console.error(error);
      alert('재생목록 저장에 실패했습니다. 다시 로그인해보세요.');
    }
  };

  const handleAddSongToPlaylist = (song) => {
    if (!currentPlaylist.some(item => item.id === song.id)) {
      setCurrentPlaylist(prev => [...prev, song]);
    }
  };
  
  const handleRemoveSongFromPlaylist = (index) => {
    setCurrentPlaylist(prev => prev.filter((_, i) => i !== index));
  };
  
  const handlePlayTrack = useCallback((index) => {
    if (index >= 0 && index < currentPlaylist.length) {
      const song = currentPlaylist[index];
      setCurrentSong({
        ...song,
        url: getSongUrl(song.id),
      });
    }
  }, [currentPlaylist]);

  const handlePlayFromAllSongs = (song) => {
    const indexInPlaylist = currentPlaylist.findIndex(item => item.id === song.id);
    if (indexInPlaylist !== -1) {
      handlePlayTrack(indexInPlaylist);
    } else {
      const newPlaylist = [...currentPlaylist, song];
      setCurrentPlaylist(newPlaylist);
      setCurrentSong({ ...song, url: getSongUrl(song.id) });
    }
  };

  const handleSongEnded = () => {
    const currentIndex = currentPlaylist.findIndex(song => song.id === currentSong.id);
    const nextIndex = (currentIndex + 1) % currentPlaylist.length;
    handlePlayTrack(nextIndex);
  };
  
  const handleLoadPlaylist = async (fileId) => {
    try {
      const content = await fetchPlaylistContent(fileId);
      setCurrentPlaylist(content);
      if (content.length > 0) {
        handlePlayTrack(0);
      }
    } catch (err) {
      console.error("재생목록 로딩 실패:", err);
      alert('재생목록을 불러오는 데 실패했습니다.');
    }
  };

  if (!isApiReady) {
    return <div>API를 로딩 중입니다...</div>;
  }

  // ... 이하 return JSX 부분은 동일 ...
  return (
    <div className="app-container">
      <div className="header">
        <h1>My Drive Music Player</h1>
        {isLoggedIn ? (
          <button onClick={onSignoutClick}>로그아웃</button>
        ) : (
          <button onClick={onAuthClick}>Google 계정으로 로그인 (저장 기능 활성화)</button>
        )}
      </div>
      <div className="content-wrapper">
        <AllSongs songs={allSongs} onAddSong={handleAddSongToPlaylist} onPlaySong={handlePlayFromAllSongs} />
        <CurrentPlaylist
          playlist={currentPlaylist}
          currentSong={currentSong}
          onRemoveSong={handleRemoveSongFromPlaylist}
          onPlaySong={handlePlayTrack}
          onEnded={handleSongEnded}
          onSave={handleSavePlaylist}
          isLoggedIn={isLoggedIn}
        />
        <SavedPlaylists playlists={savedPlaylists} onLoadPlaylist={handleLoadPlaylist} />
      </div>
    </div>
  );
};

export default MusicPlayerPage;