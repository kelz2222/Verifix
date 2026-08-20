import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Flag } from 'lucide-react';

export default function AdminDisputes() {
  const navigate = useNavigate();
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('open');

  useEffect(() => { loadDisputes(); }, [filter]);

  async function loadDisputes() {
    setLoading(true);
    let query = supabase.from('disputes').select(`*, artisans(full_name, phone), jobs(customer_name, customer_phone, status, payment_status)`).order('created_at', { ascending: false });
    if (filter !== 'all') query = query.eq('status', filter);
    const { data } = await query;
    setDisputes(data || []);
    setLoading(false);
  }

  async function updateStatus(id, status) { await supabase.from('disputes').update({ status }).eq('id', id); loadDisputes(); }

  return (
    <div className="min-h-screen px-4 pt-6 pb-10">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate('/admin/dashboard')}><ArrowLeft size={22} /></button>
        <h1 className="font-bold text-lg text-gray-900">Artisan Disputes</h1>
      </div>
      <div className="flex gap-2 mb-4">
        {['open', 'resolved', 'dismissed', 'all'].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize ${filter === f ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>{f}</button>
        ))}
      </div>
      {loading ? <p className="text-center text-gray-400 py-10">Loading...</p> : disputes.length === 0 ? (
        <p className="text-center text-gray-400 py-10">No disputes here</p>
      ) : (
        <div className="flex flex-col gap-3">
          {disputes.map((d) => (
            <div key={d.id} className="card p-4">
              <div className="flex items-center gap-2 mb-1"><Flag size={15} className="text-blue-500" /><p className="font-semibold text-gray-900">{d.reason}</p></div>
              <p className="text-sm text-gray-600">Artisan: <span className="font-medium">{d.artisans?.full_name}</span></p>
              <p className="text-sm text-gray-600">Customer: <span className="font-medium">{d.jobs?.customer_name}</span></p>
              {d.details && <p className="text-sm text-gray-500 mt-2">{d.details}</p>}
              {d.status === 'open' && (
                <div className="flex gap-2 mt-3">
                  <button onClick={() => updateStatus(d.id, 'resolved')} className="flex-1 bg-gray-900 text-white py-2 rounded-xl text-sm font-medium">Mark Resolved</button>
                  <button onClick={() => updateStatus(d.id, 'dismissed')} className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-xl text-sm font-medium">Dismiss</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
