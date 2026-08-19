import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, PUBLIC_ARTISAN_FIELDS } from '../lib/supabase';
import { AGENCY_BANK_NAME, AGENCY_ACCOUNT_NUMBER, AGENCY_ACCOUNT_NAME, ADMIN_WHATSAPP } from '../lib/config';
import StarRating from '../components/StarRating';
import InquiryModal from '../components/InquiryModal';
import ReportModal from '../components/ReportModal';
import { BadgeCheck, MapPin, Flag, CheckCircle2, ArrowLeft, Zap, Clock, MessageCircleQuestion } from 'lucide-react';

export default function ArtisanProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [artisan, setArtisan] = useState(null);
  const [portfolio, setPortfolio] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReport, setShowReport] = useState(false);
  const [showInquiry, setShowInquiry] = useState(false);
  const [activeJob, setActiveJob] = useState(null);
  const [paymentReference, setPaymentReference] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  useEffect(() => { loadArtisan(); checkActiveJob(); }, [id]);

  async function loadArtisan() {
    const { data } = await supabase.from('artisans').select(PUBLIC_ARTISAN_FIELDS).eq('id', id).single();
    setArtisan(data);
    const { data: images } = await supabase.from('portfolio_images').select('*').eq('artisan_id', id);
    setPortfolio(images || []);
    const { data: revs } = await supabase.from('reviews').select('*').eq('artisan_id', id).order('created_at', { ascending: false });
    setReviews(revs || []);
    setLoading(false);
  }

  async function checkActiveJob() {
    const jobs = JSON.parse(localStorage.getItem('vf_active_jobs') || '{}');
    const jobId = Object.keys(jobs).find((jid) => jobs[jid].artisanId === id);
    if (jobId) {
      const { data } = await supabase.from('jobs').select('*').eq('id', jobId).single();
      setActiveJob(data);
    }
  }

  async function submitPaymentClaim() {
    if (!paymentReference.trim()) return alert('Please enter your payment reference or teller number');
    setSubmittingPayment(true);
    await supabase.from('jobs').update({ payment_reference: paymentReference.trim() }).eq('id', activeJob.id);
    setActiveJob({ ...activeJob, payment_reference: paymentReference.trim() });

    const message = encodeURIComponent(
      `Payment notification\n\nCustomer: ${activeJob.customer_name}\nArtisan: ${artisan.full_name}\nReference: ${paymentReference.trim()}\n\nPlease confirm my payment.`
    );
    window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${message}`, '_blank');
    setSubmittingPayment(false);
  }

  async function handleConfirmCompletion() {
    await supabase.from('jobs').update({
      status: 'completed', payment_status: 'released', completed_at: new Date().toISOString(),
    }).eq('id', activeJob.id);
    await supabase.from('artisans').update({ completed_jobs: (artisan.completed_jobs || 0) + 1, is_available: true }).eq('id', id);
    setActiveJob({ ...activeJob, status: 'completed', payment_status: 'released' });
    setArtisan({ ...artisan, completed_jobs: (artisan.completed_jobs || 0) + 1 });
  }

  function handleInquirySubmitted(job) {
    setActiveJob(job);
    setShowInquiry(false);
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;
  if (!artisan) return <div className="min-h-screen flex items-center justify-center text-gray-400">Artisan not found</div>;

  const hasReviewedThisJob = activeJob?.status === 'completed' &&
    reviews.some(r => r.customer_phone === localStorage.getItem('vf_customer_phone'));

  return (
    <div className="pb-24 min-h-screen">
      <div className="bg-navy-700 px-4 pt-5 pb-6 rounded-b-[28px]">
        <button onClick={() => navigate(-1)} className="text-white mb-3"><ArrowLeft size={22} /></button>
        <div className="flex gap-4 items-center">
          <img src={artisan.profile_photo_url || 'https://placehold.co/100x100/ffffff/0F2A4A?text=VF'}
            className="w-20 h-20 rounded-2xl object-cover border-2 border-white" />
          <div className="flex-1">
            <div className="flex items-center gap-1 flex-wrap">
              <h1 className="text-white font-bold text-lg">{artisan.full_name}</h1>
              {artisan.is_verified && <BadgeCheck size={18} className="text-white" />}
              {artisan.is_available && (
                <span className="flex items-center gap-1 bg-orange-500 text-white text-[11px] font-semibold px-2 py-0.5 rounded-full">
                  <Zap size={11} /> Available Now
                </span>
              )}
            </div>
            <p className="text-gray-300 text-sm">{artisan.categories?.icon} {artisan.categories?.name}</p>
            <div className="flex items-center gap-1 text-gray-300 text-xs mt-1">
              <MapPin size={12} /><span>{artisan.areas?.name}, Aba</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4">
        <div className="card p-4 grid grid-cols-3 divide-x divide-gray-100 text-center">
          <div><p className="font-bold text-gray-900">{artisan.completed_jobs || 0}</p><p className="text-[11px] text-gray-500">Jobs Done</p></div>
          <div><StarRating rating={artisan.average_rating} size={14} /><p className="text-[11px] text-gray-500 mt-0.5">{artisan.review_count || 0} reviews</p></div>
          <div><p className="font-bold text-gray-900">{artisan.years_experience}yrs</p><p className="text-[11px] text-gray-500">Experience</p></div>
        </div>
      </div>

      <div className="px-4 mt-4">
        {!activeJob && (
          <button onClick={() => setShowInquiry(true)} className="w-full flex items-center justify-center gap-2 btn-primary">
            <MessageCircleQuestion size={18} /> Contact via VeriFix
          </button>
        )}

        {activeJob?.status === 'inquiry' && (
          <div className="card p-4 bg-blue-50 border border-blue-200 text-center">
            <Clock className="text-blue-500 mx-auto mb-1" size={22} />
            <p className="text-sm font-medium text-blue-800">Request sent</p>
            <p className="text-xs text-blue-600 mt-1">Our team is confirming availability and will reach out on WhatsApp shortly.</p>
          </div>
        )}

        {activeJob?.status === 'declined' && (
          <div className="card p-4 bg-gray-50 border border-gray-200 text-center">
            <p className="text-sm font-medium text-gray-700">We couldn't confirm this artisan for your request.</p>
            <button onClick={() => { setActiveJob(null); setShowInquiry(true); }} className="text-primary-600 text-sm font-medium mt-2">Try again</button>
          </div>
        )}

        {activeJob?.status === 'hired' && activeJob?.payment_status === 'unpaid' && !activeJob?.payment_reference && (
          <div className="card p-4 bg-yellow-50 border border-yellow-200">
            <p className="text-sm text-yellow-800 font-medium mb-3">Secure your booking</p>
            <div className="bg-white rounded-xl p-3 mb-3">
              <p className="text-xs text-gray-500">Bank</p><p className="text-sm font-semibold text-gray-900 mb-2">{AGENCY_BANK_NAME}</p>
              <p className="text-xs text-gray-500">Account Number</p><p className="text-sm font-semibold text-gray-900 mb-2">{AGENCY_ACCOUNT_NUMBER}</p>
              <p className="text-xs text-gray-500">Account Name</p><p className="text-sm font-semibold text-gray-900">{AGENCY_ACCOUNT_NAME}</p>
            </div>
            <input value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)}
              placeholder="Payment reference / teller number"
              className="w-full p-3 rounded-xl border border-gray-200 text-sm outline-none mb-3" />
            <button onClick={submitPaymentClaim} disabled={submittingPayment}
              className="w-full bg-yellow-600 text-white py-3 rounded-xl font-semibold disabled:opacity-50">
              {submittingPayment ? 'Submitting...' : "I've Paid — Notify Admin"}
            </button>
          </div>
        )}

        {activeJob?.status === 'hired' && activeJob?.payment_status === 'unpaid' && activeJob?.payment_reference && (
          <div className="card p-4 bg-blue-50 border border-blue-200 text-center">
            <Clock className="text-blue-500 mx-auto mb-1" size={22} />
            <p className="text-sm font-medium text-blue-800">Payment submitted</p>
            <p className="text-xs text-blue-600 mt-1">Waiting for admin to confirm.</p>
          </div>
        )}

        {activeJob?.status === 'hired' && activeJob?.payment_status === 'paid' && (
          <div className="card p-4 bg-blue-50 border-2 border-blue-300">
            <p className="text-sm font-semibold text-blue-900 mb-2">Payment secured</p>
            <p className="text-xs text-blue-700 mb-3">Once the job is finished to your satisfaction, confirm below to release payment.</p>
            <button onClick={handleConfirmCompletion} className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-semibold">
              <CheckCircle2 size={18} /> Job Finished — Release Payment
            </button>
          </div>
        )}

        {activeJob?.status === 'completed' && hasReviewedThisJob && (
          <div className="card p-4 bg-primary-50 border border-primary-200 text-center">
            <CheckCircle2 className="text-primary-600 mx-auto mb-1" size={24} />
            <p className="text-sm text-primary-700 font-medium">Thanks for your review!</p>
          </div>
        )}
      </div>

      {artisan.bio && (
        <div className="px-4 mt-5"><h3 className="font-semibold text-gray-900 mb-1">About</h3><p className="text-sm text-gray-600">{artisan.bio}</p></div>
      )}

      {portfolio.length > 0 && (
        <div className="px-4 mt-5">
          <h3 className="font-semibold text-gray-900 mb-2">Portfolio</h3>
          <div className="grid grid-cols-3 gap-2">
            {portfolio.map((img) => <img key={img.id} src={img.image_url} loading="lazy" className="w-full h-24 object-cover rounded-xl" />)}
          </div>
        </div>
      )}

      <div className="px-4 mt-5">
        <h3 className="font-semibold text-gray-900 mb-2">Reviews ({reviews.length})</h3>
        {reviews.length === 0 ? <p className="text-sm text-gray-400">No reviews yet</p> : (
          <div className="flex flex-col gap-3">
            {reviews.map((r) => (
              <div key={r.id} className="card p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">{r.customer_name}</p>
                  <StarRating rating={r.rating} size={13} showNumber={false} />
                </div>
                {r.comment && <p className="text-sm text-gray-600 mt-1">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 mt-6">
        <button onClick={() => setShowReport(true)} className="flex items-center gap-2 text-red-500 text-sm font-medium mx-auto">
          <Flag size={15} /> Report this Artisan
        </button>
      </div>

      {showReport && <ReportModal artisanId={id} onClose={() => setShowReport(false)} />}
      {showInquiry && <InquiryModal artisan={artisan} onClose={() => setShowInquiry(false)} onSubmitted={handleInquirySubmitted} />}
    </div>
  );
}
