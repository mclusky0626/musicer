import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MusicPlayerPage from './pages/MusicPlayerPage';
import './index.css';

function App() {
  return (
    // ▼▼▼ 이 부분이 수정되었습니다 ▼▼▼
    <Router basename="/musicer/">
      <Routes>
        <Route path="/" element={<MusicPlayerPage />} />
        {/* 다른 라우트가 필요하면 여기에 추가 */}
      </Routes>
    </Router>
    // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
  );
}

export default App;