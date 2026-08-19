import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';

export default function App() {
  const location = useLocation();
  const hideNavbar = location.pathname.startsWith('/admin') || location.pathname.startsWith('/confirm');

  return (
    <div className="max-w-md mx-auto bg-[#F7F9FA] min-h-screen relative">
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
      {!hideNavbar && <Navbar />}
    </div>
  );
}
