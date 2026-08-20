import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import DisputeModal from '../components/DisputeModal';
import { CheckCircle2, Share2, Flag } from 'lucide-react';

export default function ArtisanDashboard() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [artisan, setArtisan] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [disputeJob, setDisputeJob] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) loadArtisanAndJobs(data.session.user.id);
      else setLoading(false);
    });
  }, []);

  async function loadArtisanAndJobs(authUserId) {
    const { data: artisanData } = await supabase.from('artisans').select('*').eq('auth_user_id', authUserId).single();
    setArtisan(artisanData);
    if (artisanData) {
      const { data: jobsData } = await supabase.from('jobs').select('*').eq('artisan_id', artisanData.id).order('created_at', { ascending: false });
      setJobs(jobsData || []);
    }
    setLoading(false);
  }

  async function handleLogin() {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return alert(error.message);
    setSession(data.session);
    loadArtisanAndJobs(data.session.user.id);
  }

  async function markFinished(jobId) {
    await supabase.from('jobs').update({ status: 'awaiting_confirmation' }).eq('id', jobId);
    setJobs(jobs.map(j => j.id === jobId ? { ...j, status: 'awaiting_confirmation' } : j));
  }

  function shareConfirmLink(job) {
    const link = `${window.location.origin}/confirm/${job.id}`;
    const message = encodeURIComponent(`Hi ${job.customer_name}, I've completed the job. Please confirm here: ${link}`);
    window.open(`https://wa.me/${job.customer_phone.replace(/\D/g, '')}?text=${message}`, '_blank');
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col justify-center px-6">
        <h1 className="font-bold text-xl text-center mb-1">Artisan Login</h1>
        <p className="text-sm text-gray-500 text-center mb-6">Manage your jobs on VeriFix</p>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full p-3 rounded-xl border border-gray-200 mb-3" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" className="w-full p-3 rounded-xl border border-gray-200 mb-3" />
        <button onClick={handleLogin} className="btn-primary w-full mb-3">Log In</button>
        <button onClick={() => navigate('/forgot-password')} className="text-primary-600 text-sm font-medium text-center">Forgot Password?</button>
      </div>
    );
  }

  if (!artisan) return <div className="min-h-screen flex items-center justify-center text-gray-400 px-6 text-center">No artisan profile found for this account.</div>;

  return (
    <div className="pb-24 min-h-screen px-4 pt-6">
      <h1 className="font-bold text-lg text-gray-900 mb-1">Hi, {artisan.full_name.split(' ')[0]}</h1>
      <p className="text-sm text-gray-500 mb-5">
        {artisan.status === 'pending' && '⏳ Awaiting admin approval'}
        {artisan.status === 'approved' && `✅ ${artisan.is_verified ? 'Verified' : 'Approved'} — ${artisan.completed_jobs} jobs completed — currently ${artisan.is_available ? 'Available' : 'Working'}`}
      </p>

      <h2 className="font-semibold text-gray-900 mb-2">My Jobs</h2>
      {jobs.length === 0 ? (
        <p className="text-sm text-gray-400">No jobs assigned yet</p>
      ) : (
        <div className="flex flex-col gap-2">
          {jobs.map((job) => (
            <div key={job.id} className="card p-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-sm text-gray-900">{job.customer_name}</p>
                  <p className="text-xs text-gray-500">{job.customer_phone}</p>
                  {job.problem_details && <p className="text-xs text-gray-500 mt-1">{job.problem_details}</p>}
                </div>
                <span className={`text-[11px] px-2 py-1 rounded-full font-medium flex-shrink-0 ${
                  job.status === 'completed' ? 'bg-primary-50 text-primary-700' :
                  job.status === 'awaiting_confirmation' ? 'bg-blue-50 text-blue-600' : 'bg-yellow-50 text-yellow-700'
                }`}>
                  {job.status.replace('_', ' ')}
                </span>
              </div>

              {job.status === 'hired' && (
                <button onClick={() => markFinished(job.id)} className="w-full mt-3 flex items-center justify-center gap-2 bg-gray-900 text-white py-2.5 rounded-xl text-sm font-medium">
                  <CheckCircle2 size={16} /> Mark Job Finished
                </button>
              )}

              {job.status === 'awaiting_confirmation' && (
                <button onClick={() => shareConfirmLink(job)} className="w-full mt-3 flex items-center justify-center gap-2 bg-primary-600 text-white py-2.5 rounded-xl text-sm font-medium">
                  <Share2 size={16} /> Send Confirmation Link
                </button>
              )}

              {(job.status === 'awaiting_confirmation' || job.status === 'completed') && (
                <button onClick={() => setDisputeJob(job)} className="w-full mt-2 flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-600 py-2 rounded-xl text-xs font-medium">
                  <Flag size={13} /> Raise a Dispute
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {disputeJob && <DisputeModal jobId={disputeJob.id} artisanId={artisan.id} onClose={() => setDisputeJob(null)} />}
    </div>
  );
}
