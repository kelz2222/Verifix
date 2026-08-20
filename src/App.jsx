import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Browse from './pages/Browse';
import ArtisanProfile from './pages/ArtisanProfile';
import ArtisanRegister from './pages/ArtisanRegister';
import ArtisanDashboard from './pages/ArtisanDashboard';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AdminLogin from './pages/Admin/AdminLogin';
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminInquiries from './pages/Admin/AdminInquiries';
import AdminArtisans from './pages/Admin/AdminArtisans';
import AdminPayments from './pages/Admin/AdminPayments';
import AdminReports from './pages/Admin/AdminReports';
import AdminDisputes from './pages/Admin/AdminDisputes';
import AdminCombo from './pages/Admin/AdminCombo';

export default function App() {
  const location = useLocation();
  const hideNavbar = location.pathname.startsWith('/admin');

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
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/inquiries" element={<AdminInquiries />} />
        <Route path="/admin/artisans" element={<AdminArtisans />} />
        <Route path="/admin/payments" element={<AdminPayments />} />
        <Route path="/admin/reports" element={<AdminReports />} />
        <Route path="/admin/disputes" element={<AdminDisputes />} />
        <Route path="/admin/combo" element={<AdminCombo />} />
      </Routes>
      {!hideNavbar && <Navbar />}
    </div>
  );
}
