import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X } from 'lucide-react';

const REASONS = [
  'Customer won\'t confirm job completion',
  'Customer unreachable after job done',
  'Unfair or false review',
  'Customer disputing payment unfairly',
  'Other',
];

export default function DisputeModal({ jobId, artisanId, onClose }) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!reason) return alert('Please select a reason');
    setSubmitting(true);
    const { error } = await supabase.from('disputes').insert({ job_id: jobId, artisan_id: artisanId, reason, details });
    setSubmitting(false);
    if (error) alert('Could not submit dispute: ' + error.message);
    else setSubmitted(true);
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-[60] flex items-end" onClick={onClose}>
      <div className="bg-white w-full rounded-t-3xl flex flex-col" style={{ maxHeight: '90dvh' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 pb-3 flex-shrink-0">
          <h3 className="font-bold text-lg text-gray-900">Raise a Dispute</h3>
          <button onClick={onClose}><X size={22} /></button>
        </div>
        {submitted ? (
          <div className="text-center py-6 px-5">
            <p className="text-primary-600 font-semibold">Dispute submitted</p>
            <p className="text-sm text-gray-500 mt-1">Our admin team will review this.</p>
            <button onClick={onClose} className="btn-primary w-full mt-4">Close</button>
          </div>
        ) : (
          <>
            <div className="overflow-y-auto px-5 flex-1 min-h-0">
              <p className="text-sm font-semibold text-gray-700 mb-2">Reason</p>
              <div className="flex flex-col gap-1.5 mb-3">
                {REASONS.map((r) => (
                  <button key={r} onClick={() => setReason(r)}
                    className={`text-left px-3 py-2.5 rounded-xl text-sm ${reason === r ? 'bg-blue-50 border-2 border-blue-400 text-blue-700' : 'bg-gray-50 text-gray-700'}`}>
                    {r}
                  </button>
                ))}
              </div>
              <textarea value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Explain what happened..." rows={2}
                className="w-full p-3 rounded-xl border border-gray-200 text-sm outline-none mb-3" />
            </div>
            <div className="p-5 pt-3 flex-shrink-0 border-t border-gray-100">
              <button onClick={handleSubmit} disabled={submitting} className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl disabled:opacity-50">
                {submitting ? 'Submitting...' : 'Submit Dispute'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
