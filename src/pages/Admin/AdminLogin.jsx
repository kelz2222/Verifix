import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ShieldCheck } from 'lucide-react';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    setError('');
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) { setLoading(false); return setError(authError.message); }

    // Explicitly confirm the session is fully attached before querying —
    // same fix pattern used for WorkmanLink's registration timing issue.
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      setLoading(false);
      return setError('Could not confirm login session. Please try again.');
    }

    const { data: adminRow } = await supabase.from('admin_users').select('*').eq('auth_user_id', sessionData.session.user.id).single();
    if (!adminRow) {
      await supabase.auth.signOut();
      setLoading(false);
      return setError('This account is not an admin account.');
    }
    setLoading(false);
    navigate('/admin/dashboard');
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <ShieldCheck size={48} className="text-primary-600 mb-3" />
      <h1 className="font-bold text-xl text-gray-900 mb-1">Admin Login</h1>
      <p className="text-sm text-gray-500 mb-6">VeriFix Administration</p>
      <div className="w-full max-w-sm flex flex-col gap-3">
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Admin email" className="w-full p-3 rounded-xl border border-gray-200" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" className="w-full p-3 rounded-xl border border-gray-200" />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button onClick={handleLogin} disabled={loading} className="btn-primary w-full disabled:opacity-50">
          {loading ? 'Logging in...' : 'Log In'}
        </button>
      </div>
    </div>
  );
}
