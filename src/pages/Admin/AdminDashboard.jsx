import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Users, Clock, Flag, LogOut, AlertTriangle, Banknote, MessageSquare, Wine } from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => { checkAdminAndLoad(); }, []);

  async function checkAdminAndLoad() {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) return navigate('/admin');
    const { data: adminRow } = await supabase.from('admin_users').select('*').eq('auth_user_id', sessionData.session.user.id).single();
    if (!adminRow) return navigate('/admin');
    setAuthorized(true);

    const [total, pending, inquiries, payments, reports, disputes] = await Promise.all([
      supabase.from('artisans').select('id', { count: 'exact', head: true }),
      supabase.from('artisans').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('status', 'inquiry'),
      supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('status', 'hired').eq('payment_status', 'unpaid').not('payment_reference', 'is', null),
      supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'open'),
      supabase.from('disputes').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    ]);

    setStats({
      total: total.count || 0, pending: pending.count || 0, inquiries: inquiries.count || 0,
      payments: payments.count || 0, reports: reports.count || 0, disputes: disputes.count || 0,
    });
    setLoading(false);
  }

  async function handleLogout() { await supabase.auth.signOut(); navigate('/admin'); }

  if (loading || !authorized) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;

  const links = [
    { label: 'New Inquiries', icon: MessageSquare, path: '/admin/inquiries', count: stats.inquiries, color: 'text-orange-600 bg-orange-50' },
    { label: 'Pending Approvals', icon: Clock, path: '/admin/artisans?filter=pending', count: stats.pending, color: 'text-yellow-600 bg-yellow-50' },
    { label: 'All Artisans', icon: Users, path: '/admin/artisans', count: stats.total, color: 'text-primary-600 bg-primary-50' },
    { label: 'Pending Payments', icon: Banknote, path: '/admin/payments', count: stats.payments, color: 'text-green-600 bg-green-50' },
    { label: 'Combo Promotion', icon: Wine, path: '/admin/combo', count: 0, color: 'text-purple-600 bg-purple-50' },
    { label: 'Customer Reports', icon: Flag, path: '/admin/reports', count: stats.reports, color: 'text-red-600 bg-red-50' },
    { label: 'Artisan Disputes', icon: AlertTriangle, path: '/admin/disputes', count: stats.disputes, color: 'text-blue-600 bg-blue-50' },
  ];

  return (
    <div className="min-h-screen px-4 pt-6 pb-10">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="font-bold text-xl text-gray-900">Admin Dashboard</h1><p className="text-sm text-gray-500">VeriFix Overview</p></div>
        <button onClick={handleLogout} className="text-gray-400"><LogOut size={20} /></button>
      </div>
      <div className="flex flex-col gap-2">
        {links.map((link) => (
          <button key={link.path} onClick={() => navigate(link.path)} className="card p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${link.color}`}><link.icon size={20} /></div>
              <span className="font-medium text-gray-800">{link.label}</span>
            </div>
            {link.count > 0 && <span className="bg-gray-900 text-white text-xs font-semibold px-2 py-1 rounded-full">{link.count}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
