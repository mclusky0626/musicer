import React, { useState, useEffect, useCallback } from 'react';
import AllSongs from '../components/AllSongs';
import CurrentPlaylist from '../components/CurrentPlaylist';
import SavedPlaylists from '../components/SavedPlaylists';
import {
  initClient, handleAuthClick, handleSignoutClick, isSignedIn,
  savePlaylist, updatePlaylist, deletePlaylist,
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
  const [loadedPlaylistInfo, setLoadedPlaylistInfo] = useState(null);

  useEffect(() => {
    // 로그인 상태를 업데이트하는 콜백 함수
    const updateAuthStatus = (signedIn) => {
      setIsLoggedIn(signedIn);
    };

    // API 초기화가 끝나면 실행될 콜백 함수
    const initialLoadCallback = async () => {
      setIsApiReady(true);
      try {
        const [songs, playlists] = await Promise.all([fetchSongs(), fetchPlaylists()]);
        setAllSongs(songs || []);
        setSavedPlaylists(playlists || []);
      } catch (err) {
        console.error("데이터 로딩 실패:", err);
        setError("데이터를 불러오는 데 실패했습니다. API 키와 폴더 설정을 확인하세요.");
      }
    };

    initClient(updateAuthStatus, initialLoadCallback);
  }, []);

  const onAuthClick = () => {
    handleAuthClick();
  };
  
  const onSignoutClick = () => {
    handleSignoutClick();
    setIsLoggedIn(false);
  };
  
  const handleLoadPlaylist = async (fileId, fileName) => {
    try {
      const content = await fetchPlaylistContent(fileId);
      setCurrentPlaylist(content);
      setLoadedPlaylistInfo({ id: fileId, name: fileName });
      if (content.length > 0) {
        handlePlayTrack(0);
      }
    } catch (err) {
      console.error("재생목록 로딩 실패:", err);
      alert('재생목록을 불러오는 데 실패했습니다.');
    }
  };

  const handleSaveOrUpdatePlaylist = async (playlistName) => {
    if (currentPlaylist.length === 0) {
      alert("목록에 노래를 추가해주세요.");
      return;
    }
    try {
      if (loadedPlaylistInfo) {
        await updatePlaylist(loadedPlaylistInfo.id, currentPlaylist);
        alert(`'${loadedPlaylistInfo.name}' 재생목록이 수정되었습니다!`);
      } else {
        await savePlaylist(playlistName, currentPlaylist);
        alert(`'${playlistName}' 재생목록이 저장되었습니다!`);
        // 새로 저장 후 '수정 모드'로 전환
        const newPlaylists = await fetchPlaylists();
        const newFile = newPlaylists.find(p => p.name === `${playlistName}.json`);
        if (newFile) {
          setLoadedPlaylistInfo({ id: newFile.id, name: playlistName });
        }
        setSavedPlaylists(newPlaylists || []);
        return; // 아래 중복 fetch 방지
      }
      const playlists = await fetchPlaylists();
      setSavedPlaylists(playlists || []);
    } catch (error) {
      console.error(error);
      alert('작업에 실패했습니다. F12 콘솔을 확인하세요.');
    }
  };
  
  const handleDeletePlaylist = async (fileId, fileName) => {
    if (window.confirm(`정말로 '${fileName}' 재생목록을 삭제하시겠습니까?`)) {
      try {
        await deletePlaylist(fileId);
        alert(`'${fileName}' 재생목록이 삭제되었습니다.`);
        setSavedPlaylists(prev => prev.filter(p => p.id !== fileId));
        // 삭제된 재생목록이 현재 수정 중인 재생목록이었다면 '새 재생목록' 모드로 전환
        if (loadedPlaylistInfo && loadedPlaylistInfo.id === fileId) {
          handleNewPlaylist();
        }
      } catch (error) {
        alert('삭제에 실패했습니다. F12 콘솔을 확인하세요.');
      }
    }
  };

  const handleNewPlaylist = () => {
    setCurrentPlaylist([]);
    setCurrentSong(null);
    setLoadedPlaylistInfo(null);
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
      setCurrentSong({ ...song, url: getSongUrl(song.id) });
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
    if (currentPlaylist.length > 0) {
      const nextIndex = (currentIndex + 1) % currentPlaylist.length;
      handlePlayTrack(nextIndex);
    }
  };

  if (!isApiReady) {
    return <div>API를 로딩 중입니다...</div>;
  }

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
      {error && <div className="error-message">{error}</div>}
      <div className="content-wrapper">
        <AllSongs songs={allSongs} onAddSong={handleAddSongToPlaylist} onPlaySong={handlePlayFromAllSongs} />
        <CurrentPlaylist
          playlist={currentPlaylist}
          currentSong={currentSong}
          onRemoveSong={handleRemoveSongFromPlaylist}
          onPlaySong={handlePlayTrack}
          onEnded={handleSongEnded}
          onSave={handleSaveOrUpdatePlaylist}
          isLoggedIn={isLoggedIn}
          loadedPlaylistInfo={loadedPlaylistInfo}
          onNewPlaylist={handleNewPlaylist}
        />
        <SavedPlaylists
          playlists={savedPlaylists}
          onLoadPlaylist={handleLoadPlaylist}
          onDeletePlaylist={handleDeletePlaylist}
        />
      </div>
    </div>
  );
};

export default MusicPlayerPage;