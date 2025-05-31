// react-hono/react/App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router';
import HomePage from './pages/HomePage';
// 다른 페이지들이 있다면 여기에 import 합니다.
// import AboutPage from './pages/AboutPage';
// import ProfilePage from './pages/ProfilePage';

// 만약 전역 레이아웃 (예: 네비게이션 바, 푸터)이 필요하다면
// Layout 컴포넌트를 만들고 Route들을 감쌀 수 있습니다.
// const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
//   <div>
//     <nav>Navbar</nav>
//     <main>{children}</main>
//     <footer>Footer</footer>
//   </div>
// );

function App() {
  return (
    <Router>
      {/* <Layout> */}
        <Routes>
          <Route path="/" element={<HomePage />} />
          {/* 다른 라우트들 */}
          {/* <Route path="/about" element={<AboutPage />} /> */}
          {/* <Route path="/profile" element={<ProfilePage />} /> */}
          {/* 인증이 필요한 라우트는 ProtectedRoute 같은 컴포넌트로 감쌀 수 있습니다. */}
        </Routes>
      {/* </Layout> */}
    </Router>
  );
}

export default App;