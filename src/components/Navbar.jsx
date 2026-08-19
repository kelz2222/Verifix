import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, UserPlus, UtensilsCrossed } from 'lucide-react';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Search, label: 'Browse', path: '/browse' },
    { icon: UtensilsCrossed, label: 'Food', path: '/food' },
    { icon: UserPlus, label: 'Become Artisan', path: '/register' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around py-2 z-50 pb-safe">
      {tabs.map((tab) => {
        const active = location.pathname === tab.path;
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className="flex flex-col items-center gap-0.5 px-2 py-1"
          >
            <tab.icon size={22} className={active ? 'text-primary-600' : 'text-gray-400'} />
            <span className={`text-[10px] ${active ? 'text-primary-600 font-medium' : 'text-gray-400'}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
