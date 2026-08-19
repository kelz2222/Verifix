import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, PUBLIC_ARTISAN_FIELDS } from '../lib/supabase';
import CategoryGrid from '../components/CategoryGrid';
import ArtisanCard from '../components/ArtisanCard';
import { BadgeCheck, MessageCircle, ShieldCheck, UserPlus, UtensilsCrossed } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [nearYou, setNearYou] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [categoriesRes, featuredRes, nearRes] = await Promise.all([
      supabase.from('categories').select('*').eq('is_active', true).order('name'),
      supabase.from('artisans').select(PUBLIC_ARTISAN_FIELDS).eq('status', 'approved').eq('is_featured', true).limit(6),
      supabase.from('artisans').select(PUBLIC_ARTISAN_FIELDS).eq('status', 'approved').order('created_at', { ascending: false }).limit(8),
    ]);

    setCategories(categoriesRes.data || []);
    setFeatured(featuredRes.data || []);
    setNearYou(nearRes.data || []);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Loading VeriFix...</p>
      </div>
    );
  }

  return (
    <div className="pb-24 min-h-screen">
      <div className="bg-navy-700 px-4 pt-6 pb-8 rounded-b-[32px]">
        <div className="flex items-center gap-2 mb-1">
          <img src="/logo.png" alt="VeriFix" className="w-9 h-9 rounded-lg" />
          <h1 className="text-white text-xl font-bold">VeriFix</h1>
        </div>
        <p className="text-gray-300 text-sm mb-4">Verified Artisan Platform — Aba, Abia State</p>

        <button
          onClick={() => navigate('/browse')}
          className="w-full bg-white text-navy-700 font-semibold py-3 rounded-2xl active:scale-[0.98] transition-transform"
        >
          Find an Artisan Now
        </button>
      </div>

      <div className="px-4 mt-6">
        <h2 className="font-bold text-gray-900 mb-3">Browse by Category</h2>
        <CategoryGrid categories={categories} />
      </div>

      <div className="px-4 mt-7">
        <div
          onClick={() => navigate('/food')}
          className="bg-red-700 rounded-2xl p-5 flex items-center justify-between active:scale-[0.98] transition-transform cursor-pointer"
        >
          <div>
            <p className="text-white font-bold flex items-center gap-2"><UtensilsCrossed size={18} /> Nwanyi Owerri Kitchen</p>
            <p className="text-red-100 text-sm mt-0.5">Delicious native meals, order now</p>
          </div>
        </div>
      </div>

      {featured.length > 0 && (
        <div className="px-4 mt-7">
          <h2 className="font-bold text-gray-900 mb-3">Featured Artisans</h2>
          <div className="flex flex-col gap-2">
            {featured.map((a) => <ArtisanCard key={a.id} artisan={a} />)}
          </div>
        </div>
      )}

      <div className="px-4 mt-7">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-900">Artisans Near You</h2>
          <button onClick={() => navigate('/browse')} className="text-primary-600 text-sm font-medium">See all</button>
        </div>
        <div className="flex flex-col gap-2">
          {nearYou.length > 0 ? (
            nearYou.map((a) => <ArtisanCard key={a.id} artisan={a} />)
          ) : (
            <p className="text-gray-400 text-sm text-center py-6">No artisans yet. Be the first!</p>
          )}
        </div>
      </div>

      <div className="px-4 mt-7">
        <div className="bg-navy-900 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-white font-bold">Are you an Artisan?</p>
              <p className="text-gray-300 text-sm mt-0.5">Join VeriFix and get more customers</p>
            </div>
            <UserPlus className="text-primary-500 flex-shrink-0" size={28} />
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate('/register')} className="flex-1 bg-primary-600 text-white py-2.5 rounded-xl text-sm font-medium">
              Register
            </button>
            <button onClick={() => navigate('/my-jobs')} className="flex-1 bg-white/10 text-white py-2.5 rounded-xl text-sm font-medium">
              Log In
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 mt-7">
        <h2 className="font-bold text-gray-900 mb-3">Why VeriFix</h2>
        <div className="grid grid-cols-1 gap-3">
          <div className="card p-4 flex items-center gap-3">
            <BadgeCheck className="text-primary-600 flex-shrink-0" size={26} />
            <div>
              <p className="font-semibold text-sm text-gray-900">Verified Artisans</p>
              <p className="text-xs text-gray-500">ID-checked and admin-approved before listing</p>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <MessageCircle className="text-primary-600 flex-shrink-0" size={26} />
            <div>
              <p className="font-semibold text-sm text-gray-900">We Handle the Details</p>
              <p className="text-xs text-gray-500">Our team confirms availability and connects you directly</p>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <ShieldCheck className="text-primary-600 flex-shrink-0" size={26} />
            <div>
              <p className="font-semibold text-sm text-gray-900">Local & Reliable</p>
              <p className="text-xs text-gray-500">Real reviews from real customers in Aba</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
