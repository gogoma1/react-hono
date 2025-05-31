// react-hono/react/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router'; // Link 추가
import HomePage from './pages/HomePage';
import ExamplePage from './pages/example'; // 새로 추가된 페이지 import

// 간단한 네비게이션 예시
const Navigation: React.FC = () => (
  <nav style={{ marginBottom: '20px', padding: '10px', background: '#eee' }}>
    <Link to="/" style={{ marginRight: '10px' }}>Home</Link>
    <Link to="/example">Example Page (pg_tables)</Link>
  </nav>
);

function App() {
  return (
    <Router>
      <Navigation /> {/* 모든 페이지 상단에 네비게이션 바 추가 */}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/example" element={<ExamplePage />} /> {/* ExamplePage 라우트 추가 */}
        {/* 다른 라우트들 */}
      </Routes>
    </Router>
  );
}

export default App;