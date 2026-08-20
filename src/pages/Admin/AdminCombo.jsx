import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Wine } from 'lucide-react';

export default function AdminCombo() {
  const navigate = useNavigate();
  const [promo, setPromo] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [bannerFile, setBannerFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const [promoRes, itemsRes] = await Promise.all([
      supabase.from('combo_promotions').select('*').limit(1).single(),
      supabase.from('menu_items').select('id, name').order('display_order'),
    ]);
    setPromo(promoRes.data);
    setMenuItems(itemsRes.data || []);
    setLoading(false);
  }

  function update(key, value) { setPromo((prev) => ({ ...prev, [key]: value })); }

  async function handleSave() {
    setSaving(true);
    let banner_image_url = promo.banner_image_url;

    if (bannerFile) {
      const fileName = `combo-${Date.now()}-${bannerFile.name}`;
      const { error: upErr } = await supabase.storage.from('combo-banners').upload(fileName, bannerFile);
      if (!upErr) {
        const { data: urlData } = supabase.storage.from('combo-banners').getPublicUrl(fileName);
        banner_image_url = urlData.publicUrl;
      }
    }

    await supabase.from('combo_promotions').update({
      is_active: promo.is_active,
      menu_item_id: promo.menu_item_id,
      wine_name: promo.wine_name,
      discount_type: promo.discount_type,
      discount_value: promo.discount_value,
      description: promo.description,
      banner_image_url,
      updated_at: new Date().toISOString(),
    }).eq('id', promo.id);

    setSaving(false);
    alert('Combo promotion saved');
    loadData();
  }

  if (loading || !promo) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;

  return (
    <div className="min-h-screen px-4 pt-6 pb-10">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate('/admin/dashboard')}><ArrowLeft size={22} /></button>
        <h1 className="font-bold text-lg text-gray-900">Combo Promotion</h1>
      </div>

      <div className="card p-4 mb-4">
        <button onClick={() => update('is_active', !promo.is_active)} className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Wine size={18} className="text-purple-600" />
            <span className="font-medium text-gray-800">Promotion Active</span>
          </div>
          <div className={`w-12 h-7 rounded-full flex items-center px-1 transition-colors ${promo.is_active ? 'bg-primary-600 justify-end' : 'bg-gray-200 justify-start'}`}>
            <div className="w-5 h-5 bg-white rounded-full" />
          </div>
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-gray-700">Paired food item</p>
        <select value={promo.menu_item_id || ''} onChange={(e) => update('menu_item_id', e.target.value)} className="w-full p-3 rounded-xl border border-gray-200 text-sm">
          <option value="">Select a dish</option>
          {menuItems.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>

        <input value={promo.wine_name || ''} onChange={(e) => update('wine_name', e.target.value)} placeholder="Wine name (e.g. Moscato)" className="w-full p-3 rounded-xl border border-gray-200 text-sm" />

        <div className="flex gap-2">
          <select value={promo.discount_type || 'fixed'} onChange={(e) => update('discount_type', e.target.value)} className="flex-1 p-3 rounded-xl border border-gray-200 text-sm">
            <option value="fixed">Fixed Amount Off</option>
            <option value="percent">Percentage Off</option>
          </select>
          <input value={promo.discount_value || ''} onChange={(e) => update('discount_value', e.target.value)} type="number" placeholder="Value" className="flex-1 p-3 rounded-xl border border-gray-200 text-sm" />
        </div>

        <textarea value={promo.description || ''} onChange={(e) => update('description', e.target.value)} placeholder="Short promo description shown to customers" rows={2} className="w-full p-3 rounded-xl border border-gray-200 text-sm" />

        <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl py-6 cursor-pointer bg-white">
          <span className="text-sm text-gray-500">{bannerFile ? bannerFile.name : 'Upload designed banner image (optional)'}</span>
          <input type="file" accept="image/*" className="hidden" onChange={(e) => setBannerFile(e.target.files[0])} />
        </label>
        {promo.banner_image_url && !bannerFile && (
          <img src={promo.banner_image_url} className="w-full rounded-xl" />
        )}

        <button onClick={handleSave} disabled={saving} className="btn-primary w-full mt-2 disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Combo Promotion'}
        </button>
      </div>
    </div>
  );
}
