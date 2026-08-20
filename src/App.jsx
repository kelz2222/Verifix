import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Browse from './pages/Browse';
import ArtisanProfile from './pages/ArtisanProfile';
import ArtisanRegister from './pages/ArtisanRegister';
import ArtisanDashboard from './pages/ArtisanDashboard';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

export default function App() {
  const location = useLocation();
  const hideNavbar = location.pathname.startsWith('/admin') || location.pathname.startsWith('/confirm');

  return (
    <div className="max-w-md mx-auto bg-[#F7F9FA] min-h-screen relative">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/browse" element={<Browse />} />
        <Route path="/artisan/:id" element={<ArtisanProfile />} />
        <Route path="/register" element={<ArtisanRegister />} />
        <Route path="/my-jobs" element={<ArtisanDashboard />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
      {!hideNavbar && <Navbar />}
    </div>
  );
}
