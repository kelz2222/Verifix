import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { SERVICE_FEE_PERCENT } from '../lib/config';
import { ShieldCheck, Camera, Upload, ChevronRight, ChevronLeft, Check } from 'lucide-react';

export default function ArtisanRegister() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [areas, setAreas] = useState([]);
  const [categories, setCategories] = useState([]);
  const [abaCityId, setAbaCityId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [done, setDone] = useState(false);

  const [form, setForm] = useState({
    email: '', password: '', fullName: '', phone: '', whatsapp: '',
    yearsExperience: '', bio: '', areaId: '', categoryId: '',
    profilePhotoFile: null, portfolioFiles: [],
    ninNumber: '', ninDocFile: null, selfieFile: null,
    bankName: '', bankAccountNumber: '', bankAccountName: '',
    feeConsent: false,
  });

  useEffect(() => { loadOptions(); }, []);

  async function loadOptions() {
    const { data: cityData } = await supabase.from('cities').select('*').eq('slug', 'aba').single();
    if (cityData) {
      setAbaCityId(cityData.id);
      const { data: areasData } = await supabase.from('areas').select('*').eq('city_id', cityData.id).order('name');
      setAreas(areasData || []);
    }
    const { data: categoriesData } = await supabase.from('categories').select('*').eq('is_active', true).order('name');
    setCategories(categoriesData || []);
  }

  function update(key, value) { setForm((prev) => ({ ...prev, [key]: value })); }

  async function handleCreateAccount() {
    if (!form.email || !form.password || form.password.length < 6) {
      return alert('Please enter a valid email and a password with at least 6 characters');
    }
    setCreatingAccount(true);
    try {
      const { error: signUpError } = await supabase.auth.signUp({ email: form.email, password: form.password });
      if (signUpError) throw signUpError;
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
      if (signInError) throw signInError;
      const { data: sessionCheck } = await supabase.auth.getSession();
      if (!sessionCheck.session) throw new Error('Could not confirm login session. Please try again.');
      setStep(2);
    } catch (err) {
      alert('Account creation failed: ' + err.message);
    } finally {
      setCreatingAccount(false);
    }
  }

  function nextStep() {
    if (step === 2 && (!form.fullName || !form.phone || !form.whatsapp || !form.categoryId)) {
      return alert('Please fill in all required fields');
    }
    if (step === 3 && !form.areaId) {
      return alert('Please select your area in Aba');
    }
    setStep((s) => s + 1);
  }
  function prevStep() { setStep((s) => s - 1); }

  async function handleSubmit() {
    if (!form.ninNumber || !form.ninDocFile || !form.selfieFile) {
      return alert('NIN number, NIN document, and a selfie are all required for verification');
    }
    if (!form.feeConsent) {
      return alert('Please confirm you understand and agree to the service fee before submitting');
    }
    setSubmitting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) throw new Error('Your session expired. Please log in again.');
      const userId = sessionData.session.user.id;

      let profile_photo_url = null;
      if (form.profilePhotoFile) {
        const fileName = `${userId}-${Date.now()}-${form.profilePhotoFile.name}`;
        const { error: upErr } = await supabase.storage.from('profile-photos').upload(fileName, form.profilePhotoFile);
        if (!upErr) {
          const { data: urlData } = supabase.storage.from('profile-photos').getPublicUrl(fileName);
          profile_photo_url = urlData.publicUrl;
        }
      }

      const ninFileName = `${userId}-${Date.now()}-nin-${form.ninDocFile.name}`;
      const { error: ninUpErr } = await supabase.storage.from('nin-documents').upload(ninFileName, form.ninDocFile);
      if (ninUpErr) throw ninUpErr;

      const selfieFileName = `${userId}-${Date.now()}-selfie-${form.selfieFile.name}`;
      const { error: selfieUpErr } = await supabase.storage.from('selfies').upload(selfieFileName, form.selfieFile);
      if (selfieUpErr) throw selfieUpErr;

      const { data: artisanRow, error: artisanError } = await supabase.from('artisans').insert({
        auth_user_id: userId,
        full_name: form.fullName,
        phone: form.phone,
        whatsapp_number: form.whatsapp,
        city_id: abaCityId,
        area_id: form.areaId,
        category_id: form.categoryId,
        years_experience: parseInt(form.yearsExperience) || 0,
        bio: form.bio,
        profile_photo_url,
        nin_number: form.ninNumber,
        nin_document_url: ninFileName,
        selfie_url: selfieFileName,
        bank_name: form.bankName,
        bank_account_number: form.bankAccountNumber,
        bank_account_name: form.bankAccountName,
        status: 'pending',
      }).select().single();

      if (artisanError) throw artisanError;

      for (const file of form.portfolioFiles) {
        const fileName = `${artisanRow.id}-${Date.now()}-${file.name}`;
        const { error: upErr } = await supabase.storage.from('portfolio-images').upload(fileName, file);
        if (!upErr) {
          const { data: urlData } = supabase.storage.from('portfolio-images').getPublicUrl(fileName);
          await supabase.from('portfolio_images').insert({ artisan_id: artisanRow.id, image_url: urlData.publicUrl });
        }
      }

      setDone(true);
    } catch (err) {
      alert('Registration failed: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <ShieldCheck size={56} className="text-primary-600 mb-4" />
        <h1 className="font-bold text-xl text-gray-900 mb-2">Registration Submitted!</h1>
        <p className="text-sm text-gray-500 mb-6">Your profile is pending admin review. You'll be able to appear on VeriFix once approved and verified.</p>
        <button onClick={() => navigate('/')} className="btn-primary w-full max-w-xs">Back to Home</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 pt-6 pb-10">
      <h1 className="font-bold text-xl text-gray-900 mb-1">Become an Artisan</h1>
      <p className="text-sm text-gray-500 mb-5">Step {step} of 4</p>

      <div className="flex gap-1 mb-6">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className={`flex-1 h-1.5 rounded-full ${s <= step ? 'bg-primary-600' : 'bg-gray-200'}`} />
        ))}
      </div>

      {step === 1 && (
        <div className="flex flex-col gap-3">
          <p className="font-semibold text-gray-800">Create your account</p>
          <p className="text-xs text-gray-500 -mt-1">You'll be logged in right away, then continue to your profile.</p>
          <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="Email address" className="w-full p-3 rounded-xl border border-gray-200" />
          <input type="password" value={form.password} onChange={(e) => update('password', e.target.value)} placeholder="Password (min 6 characters)" className="w-full p-3 rounded-xl border border-gray-200" />
          <button onClick={handleCreateAccount} disabled={creatingAccount} className="btn-primary w-full disabled:opacity-50 mt-2">
            {creatingAccount ? 'Creating account...' : 'Create Account & Continue'}
          </button>
          <button onClick={() => navigate('/my-jobs')} className="text-primary-600 text-sm font-medium text-center mt-2">
            Already registered? Log in instead
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-3">
          <p className="font-semibold text-gray-800">Your profile</p>
          <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl py-6 cursor-pointer">
            <Camera size={24} className="text-gray-400" />
            <span className="text-sm text-gray-500">{form.profilePhotoFile ? form.profilePhotoFile.name : 'Upload profile photo'}</span>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => update('profilePhotoFile', e.target.files[0])} />
          </label>
          <input value={form.fullName} onChange={(e) => update('fullName', e.target.value)} placeholder="Full name" className="w-full p-3 rounded-xl border border-gray-200" />
          <input value={form.phone} onChange={(e) => update('phone', e.target.value)} type="tel" placeholder="Phone number" className="w-full p-3 rounded-xl border border-gray-200" />
          <input value={form.whatsapp} onChange={(e) => update('whatsapp', e.target.value)} type="tel" placeholder="WhatsApp number" className="w-full p-3 rounded-xl border border-gray-200" />
          <input value={form.yearsExperience} onChange={(e) => update('yearsExperience', e.target.value)} type="number" placeholder="Years of experience" className="w-full p-3 rounded-xl border border-gray-200" />

          <p className="text-sm font-medium text-gray-700 mt-2">Category</p>
          <div className="grid grid-cols-3 gap-2">
            {categories.map((cat) => (
              <button key={cat.id} onClick={() => update('categoryId', cat.id)}
                className={`px-2 py-2 rounded-xl text-xs ${form.categoryId === cat.id ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>

          <textarea value={form.bio} onChange={(e) => update('bio', e.target.value)} placeholder="Short bio & services offered" rows={3} className="w-full p-3 rounded-xl border border-gray-200 mt-2" />
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-3">
          <p className="font-semibold text-gray-800">Where in Aba do you work?</p>
          <div className="grid grid-cols-2 gap-2">
            {areas.map((a) => (
              <button key={a.id} onClick={() => update('areaId', a.id)}
                className={`px-3 py-3 rounded-xl text-sm ${form.areaId === a.id ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
                {a.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="flex flex-col gap-3">
          <p className="font-semibold text-gray-800">Portfolio & Verification</p>

          <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl py-6 cursor-pointer">
            <Upload size={24} className="text-gray-400" />
            <span className="text-sm text-gray-500">
              {form.portfolioFiles.length > 0 ? `${form.portfolioFiles.length} photo(s) selected` : 'Upload portfolio photos (optional)'}
            </span>
            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => update('portfolioFiles', Array.from(e.target.files))} />
          </label>

          <div className="bg-gray-50 rounded-xl p-4 mt-2">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck size={16} className="text-primary-600" />
              <p className="text-sm font-semibold text-gray-800">Identity Verification</p>
            </div>
            <p className="text-xs text-gray-500 mb-3">Required for admin approval. Your NIN and selfie are private and visible only to VeriFix admins — never shown publicly.</p>
            <input value={form.ninNumber} onChange={(e) => update('ninNumber', e.target.value)} placeholder="NIN Number" className="w-full p-3 rounded-xl border border-gray-200 mb-3" />
            <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl py-6 cursor-pointer bg-white mb-3">
              <Camera size={22} className="text-gray-400" />
              <span className="text-sm text-gray-500">{form.ninDocFile ? form.ninDocFile.name : 'Upload NIN slip or card photo'}</span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => update('ninDocFile', e.target.files[0])} />
            </label>
            <p className="text-xs text-gray-500 mb-2">Take a quick selfie so our admin can confirm it's really you.</p>
            <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl py-6 cursor-pointer bg-white">
              <Camera size={22} className="text-gray-400" />
              <span className="text-sm text-gray-500">{form.selfieFile ? form.selfieFile.name : 'Take or upload a selfie'}</span>
              <input type="file" accept="image/*" capture="user" className="hidden" onChange={(e) => update('selfieFile', e.target.files[0])} />
            </label>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 mt-2">
            <p className="text-sm font-semibold text-gray-800 mb-1">Bank Details (for job payouts)</p>
            <p className="text-xs text-gray-500 mb-3">This is where you'll receive payment after each completed job.</p>
            <input value={form.bankName} onChange={(e) => update('bankName', e.target.value)} placeholder="Bank name" className="w-full p-3 rounded-xl border border-gray-200 mb-3" />
            <input value={form.bankAccountNumber} onChange={(e) => update('bankAccountNumber', e.target.value)} placeholder="Account number" className="w-full p-3 rounded-xl border border-gray-200 mb-3" />
            <input value={form.bankAccountName} onChange={(e) => update('bankAccountName', e.target.value)} placeholder="Account name" className="w-full p-3 rounded-xl border border-gray-200" />
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mt-2">
            <button onClick={() => update('feeConsent', !form.feeConsent)} className="flex items-start gap-3 text-left w-full">
              <div className={`flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center mt-0.5 ${form.feeConsent ? 'bg-primary-600 border-primary-600' : 'bg-white border-gray-300'}`}>
                {form.feeConsent && <Check size={14} className="text-white" />}
              </div>
              <p className="text-sm text-gray-700">
                I understand and agree that VeriFix charges a <span className="font-semibold">{SERVICE_FEE_PERCENT}% service fee</span> deducted
                from my payout after each completed job.
              </p>
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-2 mt-6">
        {step > 1 && (
          <button onClick={prevStep} className="flex-1 flex items-center justify-center gap-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-medium">
            <ChevronLeft size={18} /> Back
          </button>
        )}
        {step > 1 && step < 4 && (
          <button onClick={nextStep} className="flex-1 flex items-center justify-center gap-1 btn-primary">
            Next <ChevronRight size={18} />
          </button>
        )}
        {step === 4 && (
          <button onClick={handleSubmit} disabled={submitting || !form.feeConsent} className="flex-1 btn-primary disabled:opacity-50">
            {submitting ? 'Submitting...' : 'Submit Registration'}
          </button>
        )}
      </div>
    </div>
  );
}
