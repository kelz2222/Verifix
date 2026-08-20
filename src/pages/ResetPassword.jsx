import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ShieldCheck } from 'lucide-react';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function handleUpdatePassword() {
    if (password.length < 6) return setError('Password must be at least 6 characters');
    if (password !== confirmPassword) return setError('Passwords do not match');
    setLoading(true);
    setError('');
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) setError(updateError.message);
    else setDone(true);
    setLoading(false);
  }

  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <ShieldCheck size={56} className="text-primary-600 mb-4" />
        <h1 className="font-bold text-xl text-gray-900 mb-2">Password Updated!</h1>
        <p className="text-sm text-gray-500 mb-6">You can now log in with your new password.</p>
        <button onClick={() => navigate('/my-jobs')} className="btn-primary w-full max-w-xs">Go to Login</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="font-bold text-xl text-gray-900 mb-1 text-center">Set New Password</h1>
        <p className="text-sm text-gray-500 mb-6 text-center">Enter your new password below.</p>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password (min 6 characters)" className="w-full p-3 rounded-xl border border-gray-200 mb-3" />
        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" className="w-full p-3 rounded-xl border border-gray-200 mb-3" />
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
        <button onClick={handleUpdatePassword} disabled={loading} className="btn-primary w-full disabled:opacity-50">{loading ? 'Updating...' : 'Update Password'}</button>
      </div>
    </div>
  );
}
