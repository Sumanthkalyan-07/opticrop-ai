import React, { useState } from 'react';
import { UserProfile } from '../types';
import { User, Mail, Map, Phone, Hash, Globe, Sprout, Check, Flame, Droplets, Compass } from 'lucide-react';

interface ProfileProps {
  initialProfile: UserProfile;
  token: string;
  onSaveSuccess: (updatedProfile: UserProfile) => void;
  onClose?: () => void;
}

const INDIAN_STATES = [
  "Andhra Pradesh", "Telangana", "Punjab", "Haryana", "Rajasthan", "Gujarat", "Karnataka", "Kerala", "Tamil Nadu", "Maharashtra"
];

export const Profile: React.FC<ProfileProps> = ({ initialProfile, token, onSaveSuccess, onClose }) => {
  const [profile, setProfile] = useState<UserProfile>({
    name: initialProfile.name || '',
    email: initialProfile.email || '',
    state: initialProfile.state || '',
    district: initialProfile.district || '',
    village: initialProfile.village || '',
    phone: initialProfile.phone || '',
    pincode: initialProfile.pincode || '',
    soilType: initialProfile.soilType || '',
    soilDescription: initialProfile.soilDescription || '',
    soilProperties: initialProfile.soilProperties || undefined
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Initial calculation or representation of the circular plot initials
  const initials = profile.name 
    ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
    : '🌾';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    // Field validation
    const { name, email, state, district, village, phone, pincode } = profile;
    if (!name || !email || !state || !district || !village || !phone || !pincode) {
      setError('Please fill in all profile fields to discover local soil type.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profile)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile.');
      }

      setProfile(data.profile);
      onSaveSuccess(data.profile);
      setSuccessMsg('Farmer profile saved successfully! Soil type detected and mapped.');
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen bg-cover bg-center py-8 px-4 font-sans relative"
      style={{ 
        backgroundImage: `linear-gradient(rgba(10, 26, 14, 0.75), rgba(15, 20, 10, 0.9)), url('https://images.unsplash.com/photo-1464226184884-fa280b87c3a9?auto=format&fit=crop&w=1920&q=80')` 
      }}
    >
      <div className="absolute inset-0 bg-radial-gradient from-emerald-500/10 via-transparent to-transparent pointer-events-none" />

      <div className="max-w-4xl mx-auto bg-zinc-900/90 backdrop-blur-md rounded-3xl border border-emerald-500/15 shadow-2xl p-6 md:p-8 relative overflow-hidden transition-all duration-300">
        
        {/* Glowing header accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-500" />

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white font-display flex items-center gap-2">
              <Sprout className="text-emerald-400" /> Farmer Profile & Soil Mapping
            </h1>
            <p className="text-zinc-400 text-xs md:text-sm mt-1">
              Provide your regional credentials to analyze and detect your regional soil composition.
            </p>
          </div>
          {onClose && (
            <button 
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-800 rounded-xl hover:bg-zinc-700 transition cursor-pointer"
            >
              Back to Dashboard
            </button>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
            ⚠️ {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium">
            ✅ {successMsg}
          </div>
        )}

        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Circular Plot Profile Column */}
          <div className="lg:col-span-4 flex flex-col items-center text-center justify-center bg-zinc-950/60 p-6 rounded-2xl border border-zinc-800 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />
            
            {/* The circular plot profile picture container */}
            <div className="relative mb-4 flex items-center justify-center">
              {/* Spinning/concentric layout circles resembling radar soil plots */}
              <div className="absolute w-36 h-36 rounded-full border border-dashed border-emerald-500/30 animate-[spin_40s_linear_infinite]" />
              <div className="absolute w-32 h-32 rounded-full border border-double border-amber-500/20" />
              <div className="absolute w-28 h-28 rounded-full border border-emerald-500/25" />
              
              {/* Inner Circle picture */}
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-800 to-amber-600 flex items-center justify-center text-white font-display font-extrabold text-2xl shadow-inner relative z-10 select-none">
                {initials}
                <div className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-zinc-900" />
              </div>
            </div>

            <h3 className="text-white font-bold font-display text-lg">
              {profile.name || 'Unnamed Farmer'}
            </h3>
            <p className="text-zinc-500 text-xs font-mono mt-1">
              {profile.email || 'No email associated'}
            </p>

            {/* Micro Soil Properties display if already loaded */}
            {profile.soilType && (
              <div className="mt-6 w-full pt-4 border-t border-zinc-800 space-y-2.5 text-left">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 justify-center mb-1">
                  <Compass size={14} className="animate-spin-slow" /> Regional Soil Signature
                </span>
                <div className="text-xs text-emerald-400 font-extrabold text-center mb-2 px-2 bg-emerald-950/50 py-1.5 rounded-lg border border-emerald-500/10">
                  {profile.soilType}
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-400">
                  <div className="bg-zinc-900 p-2 rounded-lg border border-zinc-800/80">
                    <span className="block text-zinc-500 font-medium">Nitrogen (N)</span>
                    <span className="font-bold text-emerald-400">{profile.soilProperties?.nitrogen}</span>
                  </div>
                  <div className="bg-zinc-900 p-2 rounded-lg border border-zinc-800/80">
                    <span className="block text-zinc-500 font-medium">Phosphorus (P)</span>
                    <span className="font-bold text-emerald-400">{profile.soilProperties?.phosphorus}</span>
                  </div>
                  <div className="bg-zinc-900 p-2 rounded-lg border border-zinc-800/80">
                    <span className="block text-zinc-500 font-medium">Potassium (K)</span>
                    <span className="font-bold text-emerald-400">{profile.soilProperties?.potassium}</span>
                  </div>
                  <div className="bg-zinc-900 p-2 rounded-lg border border-zinc-800/80">
                    <span className="block text-zinc-500 font-medium">Acidity (pH)</span>
                    <span className="font-bold text-amber-500">{profile.soilProperties?.pH}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Form Inputs and Soil Type Card */}
          <div className="lg:col-span-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Farmer Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                  <User size={12} className="text-emerald-500" /> Farmer Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter your name"
                  value={profile.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-zinc-850 border border-zinc-700/80 rounded-xl focus:border-emerald-500 text-white outline-none transition"
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                  <Mail size={12} className="text-emerald-500" /> Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="farmer@example.com"
                  value={profile.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-zinc-850 border border-zinc-700/80 rounded-xl focus:border-emerald-500 text-white outline-none transition"
                  required
                />
              </div>

              {/* State Select */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                  <Globe size={12} className="text-emerald-500" /> State
                </label>
                <select
                  name="state"
                  value={profile.state}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-zinc-850 border border-zinc-700/80 rounded-xl focus:border-emerald-500 text-white outline-none transition cursor-pointer"
                  required
                >
                  <option value="">Select State</option>
                  {INDIAN_STATES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                  <option value="Other">Other Region</option>
                </select>
              </div>

              {/* District */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                  <Map size={12} className="text-emerald-500" /> District
                </label>
                <input
                  type="text"
                  name="district"
                  placeholder="e.g. Guntur"
                  value={profile.district}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-zinc-850 border border-zinc-700/80 rounded-xl focus:border-emerald-500 text-white outline-none transition"
                  required
                />
              </div>

              {/* Mandal / Village */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                  <Map size={12} className="text-emerald-500" /> Mandal / Village
                </label>
                <input
                  type="text"
                  name="village"
                  placeholder="e.g. Tenali"
                  value={profile.village}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-zinc-850 border border-zinc-700/80 rounded-xl focus:border-emerald-500 text-white outline-none transition"
                  required
                />
              </div>

              {/* Phone No */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                  <Phone size={12} className="text-emerald-500" /> Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="10-digit mobile no."
                  value={profile.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-zinc-850 border border-zinc-700/80 rounded-xl focus:border-emerald-500 text-white outline-none transition"
                  required
                />
              </div>

              {/* Pin Code */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                  <Hash size={12} className="text-emerald-500" /> PIN Code
                </label>
                <input
                  type="text"
                  name="pincode"
                  placeholder="6-digit PIN code"
                  value={profile.pincode}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-zinc-850 border border-zinc-700/80 rounded-xl focus:border-emerald-500 text-white outline-none transition"
                  required
                />
              </div>

            </div>

            {/* Detected Soil Description Banner (Displays if we have soil analysis) */}
            {profile.soilType && (
              <div className="p-4 bg-emerald-950/40 border border-emerald-500/20 rounded-2xl flex gap-3.5 items-start">
                <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20 shrink-0">
                  <Sprout size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-white">
                    Soil Diagnosis for village {profile.village}: {profile.soilType}
                  </h4>
                  <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                    {profile.soilDescription}
                  </p>
                  <div className="flex gap-4 mt-3 text-[11px] font-mono text-emerald-400 font-bold">
                    <span className="flex items-center gap-1">
                      <Flame size={12} /> pH: {profile.soilProperties?.pH}
                    </span>
                    <span className="flex items-center gap-1">
                      <Droplets size={12} /> Moisture Capacity: {profile.soilProperties?.moisture}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-semibold rounded-2xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer group"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Check size={18} className="group-hover:scale-110 transition-transform" />
                  <span>Analyze Village Soil & Save Profile</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
