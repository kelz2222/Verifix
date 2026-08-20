import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Banknote, MessageCircle } from 'lucide-react';

export default function AdminPayments() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadPending(); }, []);

  async function loadPending() {
    setLoading(true);
    const { data } = await supabase.from('jobs').select('*, artisans(full_name, phone)')
      .eq('status', 'hired').eq('payment_status', 'unpaid').not('payment_reference', 'is', null)
      .order('created_at', { ascending: false });
    setJobs(data || []);
    setLoading(false);
  }

  async function confirmPayment(job) { await supabase.from('jobs').update({ payment_status: 'paid' }).eq('id', job.id); loadPending(); }

  function notifyCustomer(job) {
    const message = encodeURIComponent(`Hi ${job.customer_name}, your payment for the booking with ${job.artisans?.full_name} has been confirmed. Your booking is secured!`);
    window.open(`https://wa.me/${job.customer_phone.replace(/\D/g, '')}?text=${message}`, '_blank');
  }

  return (
    <div className="min-h-screen px-4 pt-6 pb-10">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate('/admin/dashboard')}><ArrowLeft size={22} /></button>
        <h1 className="font-bold text-lg text-gray-900">Pending Payments</h1>
      </div>
      <p className="text-sm text-gray-500 mb-4">Check your bank alert before confirming.</p>

      {loading ? <p className="text-center text-gray-400 py-10">Loading...</p> : jobs.length === 0 ? (
        <p className="text-center text-gray-400 py-10">No pending payments</p>
      ) : (
        <div className="flex flex-col gap-3">
          {jobs.map((job) => (
            <div key={job.id} className="card p-4">
              <p className="font-semibold text-gray-900">{job.customer_name}</p>
              <p className="text-xs text-gray-500 mb-1">{job.customer_phone}</p>
              <p className="text-sm text-gray-600">Artisan: <span className="font-medium">{job.artisans?.full_name}</span></p>
              <div className="bg-gray-50 rounded-xl p-3 mt-2">
                <p className="text-xs text-gray-500 mb-1">Payment reference:</p>
                <p className="text-sm font-mono text-gray-800">{job.payment_reference}</p>
              </div>
              <button onClick={() => confirmPayment(job)} className="w-full mt-3 flex items-center justify-center gap-2 bg-primary-600 text-white py-2.5 rounded-xl text-sm font-medium">
                <Banknote size={16} /> Confirm Payment Received
              </button>
              <button onClick={() => notifyCustomer(job)} className="w-full mt-2 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-2 rounded-xl text-sm font-medium">
                <MessageCircle size={16} /> Notify Customer
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
