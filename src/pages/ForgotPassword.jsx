import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Mail } from 'lucide-react';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleReset() {
    if (!email) return setError('Please enter your email');
    setLoading(true);
    setError('');
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (resetError) setError(resetError.message);
    else setSent(true);
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <button onClick={() => navigate(-1)} className="self-start mb-6"><ArrowLeft size={22} /></button>
      {sent ? (
        <div className="text-center">
          <Mail size={48} className="text-primary-600 mx-auto mb-4" />
          <h1 className="font-bold text-xl text-gray-900 mb-2">Check your email</h1>
          <p className="text-sm text-gray-500 mb-6">We've sent a password reset link to <span className="font-medium">{email}</span>.</p>
          <button onClick={() => navigate('/my-jobs')} className="btn-primary w-full max-w-xs">Back to Login</button>
        </div>
      ) : (
        <div className="w-full max-w-sm">
          <h1 className="font-bold text-xl text-gray-900 mb-1 text-center">Reset Password</h1>
          <p className="text-sm text-gray-500 mb-6 text-center">Enter your email and we'll send you a reset link.</p>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email address" className="w-full p-3 rounded-xl border border-gray-200 mb-3" />
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <button onClick={handleReset} disabled={loading} className="btn-primary w-full disabled:opacity-50">{loading ? 'Sending...' : 'Send Reset Link'}</button>
        </div>
      )}
    </div>
  );
}
