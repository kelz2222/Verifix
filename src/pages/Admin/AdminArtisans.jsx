import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, BadgeCheck, Star, Eye, X, Trash2 } from 'lucide-react';

export default function AdminArtisans() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [artisans, setArtisans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(searchParams.get('filter') || 'all');
  const [viewingDocs, setViewingDocs] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => { loadArtisans(); }, [filter]);

  async function loadArtisans() {
    setLoading(true);
    let query = supabase.from('artisans').select(`*, areas(name), categories(name, icon)`).order('created_at', { ascending: false });
    if (filter === 'pending') query = query.eq('status', 'pending');
    if (filter === 'approved') query = query.eq('status', 'approved');
    if (filter === 'rejected') query = query.eq('status', 'rejected');
    const { data } = await query;
    setArtisans(data || []);
    setLoading(false);
  }

  async function updateStatus(id, status) { await supabase.from('artisans').update({ status }).eq('id', id); loadArtisans(); }
  async function toggleVerified(id, current) { await supabase.from('artisans').update({ is_verified: !current }).eq('id', id); loadArtisans(); }
  async function toggleFeatured(id, current) { await supabase.from('artisans').update({ is_featured: !current }).eq('id', id); loadArtisans(); }

  async function viewDocs(artisan) {
    if (!artisan.nin_document_url) return alert('No NIN document uploaded');
    const { data: ninData, error: ninError } = await supabase.storage.from('nin-documents').createSignedUrl(artisan.nin_document_url, 60);
    if (ninError) return alert('Could not load NIN document: ' + ninError.message);
    let selfieUrl = null;
    if (artisan.selfie_url) {
      const { data: selfieData } = await supabase.storage.from('selfies').createSignedUrl(artisan.selfie_url, 60);
      selfieUrl = selfieData?.signedUrl || null;
    }
    setViewingDocs({ ninUrl: ninData.signedUrl, selfieUrl, ninNumber: artisan.nin_number, name: artisan.full_name });
  }

  async function handleDelete(artisan) {
    if (artisan.nin_document_url) await supabase.storage.from('nin-documents').remove([artisan.nin_document_url]);
    if (artisan.selfie_url) await supabase.storage.from('selfies').remove([artisan.selfie_url]);
    await supabase.from('artisans').delete().eq('id', artisan.id);
    setConfirmDelete(null);
    loadArtisans();
  }

  return (
    <div className="min-h-screen px-4 pt-6 pb-10">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate('/admin/dashboard')}><ArrowLeft size={22} /></button>
        <h1 className="font-bold text-lg text-gray-900">Manage Artisans</h1>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto">
        {['all', 'pending', 'approved', 'rejected'].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap capitalize ${filter === f ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
            {f}
          </button>
        ))}
      </div>

      {loading ? <p className="text-center text-gray-400 py-10">Loading...</p> : artisans.length === 0 ? (
        <p className="text-center text-gray-400 py-10">No artisans in this category</p>
      ) : (
        <div className="flex flex-col gap-3">
          {artisans.map((a) => (
            <div key={a.id} className="card p-4">
              <div className="flex gap-3">
                <img src={a.profile_photo_url || 'https://placehold.co/60x60/0F2A4A/ffffff?text=VF'} className="w-14 h-14 rounded-xl object-cover" />
                <div className="flex-1">
                  <div className="flex items-center gap-1">
                    <p className="font-semibold text-gray-900">{a.full_name}</p>
                    {a.is_verified && <BadgeCheck size={15} className="text-primary-600" />}
                  </div>
                  <p className="text-xs text-gray-500">{a.categories?.icon} {a.categories?.name} • {a.areas?.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{a.phone} • {a.years_experience}yrs exp</p>
                  <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    a.status === 'approved' ? 'bg-primary-50 text-primary-700' : a.status === 'rejected' ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-700'
                  }`}>{a.status}</span>
                </div>
              </div>

              {(a.bank_name || a.bank_account_number) && (
                <div className="mt-3 bg-gray-50 rounded-xl p-3 text-xs text-gray-600">
                  <p className="font-medium text-gray-700 mb-1">Bank Details</p>
                  <p>{a.bank_name} — {a.bank_account_number}</p>
                  <p>{a.bank_account_name}</p>
                </div>
              )}

              <button onClick={() => viewDocs(a)} className="w-full mt-3 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-2 rounded-xl text-sm font-medium">
                <Eye size={15} /> View NIN & Selfie
              </button>

              <div className="flex gap-2 mt-2">
                {a.status !== 'approved' && <button onClick={() => updateStatus(a.id, 'approved')} className="flex-1 bg-primary-600 text-white py-2 rounded-xl text-sm font-medium">Approve</button>}
                {a.status !== 'rejected' && <button onClick={() => updateStatus(a.id, 'rejected')} className="flex-1 bg-red-500 text-white py-2 rounded-xl text-sm font-medium">Reject</button>}
              </div>

              {a.status === 'approved' && (
                <div className="flex gap-2 mt-2">
                  <button onClick={() => toggleVerified(a.id, a.is_verified)}
                    className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-sm font-medium ${a.is_verified ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                    <BadgeCheck size={14} /> {a.is_verified ? 'Verified' : 'Verify'}
                  </button>
                  <button onClick={() => toggleFeatured(a.id, a.is_featured)}
                    className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-sm font-medium ${a.is_featured ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                    <Star size={14} /> {a.is_featured ? 'Featured' : 'Feature'}
                  </button>
                </div>
              )}

              {a.status === 'rejected' && (
                <button onClick={() => setConfirmDelete(a)} className="w-full mt-2 flex items-center justify-center gap-2 bg-red-50 text-red-600 py-2 rounded-xl text-sm font-medium border border-red-200">
                  <Trash2 size={14} /> Delete Permanently
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {viewingDocs && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setViewingDocs(null)}>
          <div className="bg-white rounded-2xl p-4 max-w-sm w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <p className="font-semibold text-gray-900">{viewingDocs.name}'s Verification</p>
              <button onClick={() => setViewingDocs(null)}><X size={20} /></button>
            </div>
            <p className="text-sm text-gray-600 mb-2">NIN Number: <span className="font-mono">{viewingDocs.ninNumber}</span></p>
            <img src={viewingDocs.ninUrl} className="w-full rounded-xl mb-4" />
            {viewingDocs.selfieUrl && <img src={viewingDocs.selfieUrl} className="w-full rounded-xl" />}
            <p className="text-[11px] text-gray-400 mt-3">These links expire in 60 seconds.</p>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <p className="font-bold text-gray-900 mb-2">Delete {confirmDelete.full_name}?</p>
            <p className="text-sm text-gray-600 mb-5">This permanently removes their profile and documents. This cannot be undone.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl text-sm font-medium">Cancel</button>
              <button onClick={() => handleDelete(confirmDelete)} className="flex-1 bg-red-500 text-white py-2.5 rounded-xl text-sm font-medium">Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
