import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MusicPlayerPage from './pages/MusicPlayerPage';
import './index.css'; // ❗️ 전역 CSS를 여기서 import 해야 합니다.

function App() {
  return (
    // <Router> 태그로 전체를 감싸야 합니다.
    <Router>
      <Routes>
        <Route path="/" element={<MusicPlayerPage />} />
      </Routes>
    </Router>
  );
}

export default App;