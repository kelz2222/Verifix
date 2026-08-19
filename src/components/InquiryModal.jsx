import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { ADMIN_WHATSAPP } from '../lib/config';
import { X } from 'lucide-react';

export default function InquiryModal({ artisan, onClose, onSubmitted }) {
  const [name, setName] = useState(localStorage.getItem('vf_customer_name') || '');
  const [phone, setPhone] = useState(localStorage.getItem('vf_customer_phone') || '');
  const [problem, setProblem] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!name.trim() || !phone.trim() || !problem.trim()) {
      return alert('Please fill in your name, phone number, and describe the problem');
    }
    setSubmitting(true);

    const { data, error } = await supabase.from('jobs').insert({
      requested_artisan_id: artisan.id,
      customer_name: name.trim(),
      customer_phone: phone.trim(),
      problem_details: problem.trim(),
      status: 'inquiry',
    }).select().single();

    if (error) {
      alert('Something went wrong, please try again');
      setSubmitting(false);
      return;
    }

    localStorage.setItem('vf_customer_name', name.trim());
    localStorage.setItem('vf_customer_phone', phone.trim());
    const jobs = JSON.parse(localStorage.getItem('vf_active_jobs') || '{}');
    jobs[data.id] = { artisanId: artisan.id };
    localStorage.setItem('vf_active_jobs', JSON.stringify(jobs));

    const message = encodeURIComponent(
      `New VeriFix Inquiry\n\nRequested Artisan: ${artisan.full_name} (${artisan.categories?.name})\nCustomer: ${name.trim()}\nPhone: ${phone.trim()}\n\nProblem: ${problem.trim()}`
    );
    window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${message}`, '_blank');

    setSubmitting(false);
    onSubmitted(data);
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-[60] flex items-end" onClick={onClose}>
      <div
        className="bg-white w-full rounded-t-3xl flex flex-col"
        style={{ maxHeight: '90dvh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 pb-3 flex-shrink-0">
          <h3 className="font-bold text-lg text-gray-900">Contact {artisan.full_name.split(' ')[0]}</h3>
          <button onClick={onClose}><X size={22} /></button>
        </div>

        <div className="overflow-y-auto px-5 flex-1 min-h-0">
          <p className="text-sm text-gray-500 mb-4">
            Tell us what you need. Our team will confirm the artisan's availability and get back to you on WhatsApp.
          </p>

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full p-3 rounded-xl border border-gray-200 text-sm outline-none mb-3"
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            type="tel"
            placeholder="Your phone number"
            className="w-full p-3 rounded-xl border border-gray-200 text-sm outline-none mb-3"
          />
          <textarea
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            placeholder="Describe the problem or job you need help with"
            rows={3}
            className="w-full p-3 rounded-xl border border-gray-200 text-sm outline-none mb-3"
          />
        </div>

        <div className="p-5 pt-3 flex-shrink-0 border-t border-gray-100">
          <button onClick={handleSubmit} disabled={submitting} className="w-full btn-primary disabled:opacity-50">
            {submitting ? 'Sending...' : 'Send Request via WhatsApp'}
          </button>
        </div>
      </div>
    </div>
  );
}
