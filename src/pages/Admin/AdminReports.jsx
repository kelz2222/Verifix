import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Flag } from 'lucide-react';

export default function AdminReports() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('open');

  useEffect(() => { loadReports(); }, [filter]);

  async function loadReports() {
    setLoading(true);
    let query = supabase.from('reports').select(`*, artisans(full_name)`).order('created_at', { ascending: false });
    if (filter !== 'all') query = query.eq('status', filter);
    const { data } = await query;
    setReports(data || []);
    setLoading(false);
  }

  async function updateStatus(id, status) { await supabase.from('reports').update({ status }).eq('id', id); loadReports(); }

  return (
    <div className="min-h-screen px-4 pt-6 pb-10">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate('/admin/dashboard')}><ArrowLeft size={22} /></button>
        <h1 className="font-bold text-lg text-gray-900">Reports</h1>
      </div>
      <div className="flex gap-2 mb-4">
        {['open', 'reviewed', 'dismissed', 'all'].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize ${filter === f ? 'bg-red-500 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>{f}</button>
        ))}
      </div>
      {loading ? <p className="text-center text-gray-400 py-10">Loading...</p> : reports.length === 0 ? (
        <p className="text-center text-gray-400 py-10">No reports here</p>
      ) : (
        <div className="flex flex-col gap-3">
          {reports.map((r) => (
            <div key={r.id} className="card p-4">
              <div className="flex items-center gap-2 mb-1"><Flag size={15} className="text-red-500" /><p className="font-semibold text-gray-900">{r.reason}</p></div>
              <p className="text-sm text-gray-600">Against: <span className="font-medium">{r.artisans?.full_name}</span></p>
              {r.details && <p className="text-sm text-gray-500 mt-1">{r.details}</p>}
              <p className="text-xs text-gray-400 mt-1">Reporter: {r.customer_phone || 'Not provided'}</p>
              {r.status === 'open' && (
                <div className="flex gap-2 mt-3">
                  <button onClick={() => updateStatus(r.id, 'reviewed')} className="flex-1 bg-gray-900 text-white py-2 rounded-xl text-sm font-medium">Mark Reviewed</button>
                  <button onClick={() => updateStatus(r.id, 'dismissed')} className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-xl text-sm font-medium">Dismiss</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
