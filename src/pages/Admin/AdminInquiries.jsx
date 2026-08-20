import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, MessageSquare } from 'lucide-react';

export default function AdminInquiries() {
  const navigate = useNavigate();
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [availableByJob, setAvailableByJob] = useState({});
  const [selectedByJob, setSelectedByJob] = useState({});

  useEffect(() => { loadInquiries(); }, []);

  async function loadInquiries() {
    setLoading(true);
    const { data } = await supabase
      .from('jobs')
      .select('*, requested:requested_artisan_id(id, full_name, category_id, categories(name))')
      .eq('status', 'inquiry')
      .order('created_at', { ascending: true });
    setInquiries(data || []);

    // For each inquiry, load other available artisans in the same category
    const byJob = {};
    const selected = {};
    for (const job of data || []) {
      const categoryId = job.requested?.category_id;
      if (categoryId) {
        const { data: options } = await supabase
          .from('artisans')
          .select('id, full_name, is_available')
          .eq('category_id', categoryId)
          .eq('status', 'approved')
          .order('is_available', { ascending: false });
        byJob[job.id] = options || [];
        selected[job.id] = job.requested_artisan_id;
      }
    }
    setAvailableByJob(byJob);
    setSelectedByJob(selected);
    setLoading(false);
  }

  async function assignArtisan(job) {
    const artisanId = selectedByJob[job.id];
    if (!artisanId) return alert('Please select an artisan');

    await supabase.from('jobs').update({ artisan_id: artisanId, status: 'hired' }).eq('id', job.id);
    await supabase.from('artisans').update({ is_available: false }).eq('id', artisanId);
    loadInquiries();
  }

  async function declineInquiry(jobId) {
    await supabase.from('jobs').update({ status: 'declined' }).eq('id', jobId);
    loadInquiries();
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;

  return (
    <div className="min-h-screen px-4 pt-6 pb-10">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate('/admin/dashboard')}><ArrowLeft size={22} /></button>
        <h1 className="font-bold text-lg text-gray-900">New Inquiries</h1>
      </div>

      {inquiries.length === 0 ? (
        <p className="text-center text-gray-400 py-10">No new inquiries</p>
      ) : (
        <div className="flex flex-col gap-3">
          {inquiries.map((job) => (
            <div key={job.id} className="card p-4">
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare size={15} className="text-orange-500" />
                <p className="font-semibold text-gray-900">{job.customer_name}</p>
              </div>
              <p className="text-xs text-gray-500 mb-2">{job.customer_phone}</p>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3 mb-3">{job.problem_details}</p>
              <p className="text-xs text-gray-500 mb-1">
                Requested: <span className="font-medium">{job.requested?.full_name}</span> ({job.requested?.categories?.name})
              </p>

              <p className="text-xs font-medium text-gray-600 mt-2 mb-1">Assign artisan</p>
              <select
                value={selectedByJob[job.id] || ''}
                onChange={(e) => setSelectedByJob({ ...selectedByJob, [job.id]: e.target.value })}
                className="w-full p-3 rounded-xl border border-gray-200 text-sm mb-3"
              >
                {(availableByJob[job.id] || []).map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.full_name} {a.is_available ? '— Available' : '— Currently Working'}
                  </option>
                ))}
              </select>

              <div className="flex gap-2">
                <button onClick={() => assignArtisan(job)} className="flex-1 bg-primary-600 text-white py-2.5 rounded-xl text-sm font-medium">
                  Confirm & Assign
                </button>
                <button onClick={() => declineInquiry(job.id)} className="flex-1 bg-gray-100 text-gray-600 py-2.5 rounded-xl text-sm font-medium">
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
