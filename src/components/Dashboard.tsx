import React, { useState, useEffect } from 'react';
import { Logo } from './Logo';
import { Marquee } from './Marquee';
import { Chatbot } from './Chatbot';
import { UserProfile, PredictionResult } from '../types';
import { predictTopCrops, TopCropPrediction } from '../utils/predictor';
import Markdown from 'react-markdown';
import { 
  Sprout, Thermometer, Droplets, Wind, CloudRain, 
  User, History, MessageSquare, Compass, LogOut, 
  Check, Info, RotateCcw, AlertTriangle, Calendar,
  TrendingUp, TrendingDown, Sparkles, ExternalLink
} from 'lucide-react';

interface DashboardProps {
  token: string;
  username: string;
  profile: UserProfile;
  onLogout: () => void;
  onEditProfile: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  token, username, profile, onLogout, onEditProfile 
}) => {
  // Inputs
  const [nitrogen, setNitrogen] = useState<number>(50);
  const [phosphorus, setPhosphorus] = useState<number>(50);
  const [potassium, setPotassium] = useState<number>(50);
  const [temperature, setTemperature] = useState<number>(25);
  const [humidity, setHumidity] = useState<number>(60);
  const [pH, setPH] = useState<number>(6.5);
  const [rainfall, setRainfall] = useState<number>(100);

  const [autoPilot, setAutoPilot] = useState<boolean>(profile.soilType ? true : false);
  const [weatherCondition, setWeatherCondition] = useState<'normal' | 'summer' | 'monsoon' | 'winter'>('normal');

  // Automated environmental parameters based on profile geographical data and dynamic weather condition
  const getAutomatedEnvironmentalValues = (season: 'normal' | 'summer' | 'monsoon' | 'winter') => {
    const stateName = (profile.state || '').toLowerCase();
    const soilType = (profile.soilType || '').toLowerCase();
    
    // Default pH by regional soil classification
    let basePH = 6.5;
    if (soilType.includes('alluvial') || soilType.includes('delta')) {
      basePH = 7.0;
    } else if (soilType.includes('red sandy') || soilType.includes('chalka')) {
      basePH = 6.4;
    } else if (soilType.includes('black cotton') || soilType.includes('regur')) {
      basePH = 8.0;
    } else if (soilType.includes('arid') || soilType.includes('sandy')) {
      basePH = 8.5;
    } else if (soilType.includes('laterite')) {
      basePH = 5.5;
    } else if (soilType.includes('loamy')) {
      basePH = 6.8;
    } else if (soilType.includes('clayey red')) {
      basePH = 6.3;
    } else if (soilType.includes('sandy loam')) {
      basePH = 6.2;
    }

    let temp = 25;
    let humid = 60;
    let rain = 100;

    const isSouth = stateName.includes('andhra') || stateName.includes('telangana') || stateName.includes('ap') || stateName.includes('tg') || stateName.includes('karnataka') || stateName.includes('tamil') || stateName.includes('kerala');
    const isNorth = stateName.includes('punjab') || stateName.includes('haryana') || stateName.includes('uttar') || stateName.includes('bihar') || stateName.includes('up');
    const isDesert = stateName.includes('rajasthan') || stateName.includes('gujarat');

    if (isDesert) {
      if (season === 'summer') {
        temp = 38; humid = 25; rain = 25;
      } else if (season === 'monsoon') {
        temp = 31; humid = 60; rain = 90;
      } else if (season === 'winter') {
        temp = 19; humid = 40; rain = 15;
      } else { // normal/baseline
        temp = 29; humid = 45; rain = 45;
      }
    } else if (isSouth) {
      if (season === 'summer') {
        temp = 34; humid = 65; rain = 60;
      } else if (season === 'monsoon') {
        temp = 27; humid = 85; rain = 240;
      } else if (season === 'winter') {
        temp = 22; humid = 70; rain = 40;
      } else { // normal/baseline
        temp = 28; humid = 75; rain = 120;
      }
    } else if (isNorth) {
      if (season === 'summer') {
        temp = 36; humid = 50; rain = 80;
      } else if (season === 'monsoon') {
        temp = 29; humid = 80; rain = 180;
      } else if (season === 'winter') {
        temp = 14; humid = 65; rain = 35;
      } else { // normal/baseline
        temp = 26; humid = 65; rain = 100;
      }
    } else { // general/other
      if (season === 'summer') {
        temp = 32; humid = 60; rain = 70;
      } else if (season === 'monsoon') {
        temp = 26; humid = 80; rain = 210;
      } else if (season === 'winter') {
        temp = 18; humid = 55; rain = 30;
      } else {
        temp = 25; humid = 65; rain = 100;
      }
    }

    return { temp, humid, pH: basePH, rain };
  };

  // Predict NPK baseline based on soil characteristics adjusted by current environmental constraints
  const predictOptimalNPK = (
    temp: number,
    humid: number,
    pHVal: number,
    rainVal: number
  ) => {
    const sType = (profile.soilType || '').toLowerCase();
    
    // Base nutrients target defaults based on regional soil chemistry benchmarks
    let n = 60;
    let p = 40;
    let k = 60;

    if (sType.includes('alluvial') || sType.includes('delta')) {
      n = 75; p = 50; k = 95;
    } else if (sType.includes('red sandy') || sType.includes('chalka')) {
      n = 35; p = 25; k = 45;
    } else if (sType.includes('black cotton') || sType.includes('regur')) {
      n = 65; p = 30; k = 110;
    } else if (sType.includes('arid') || sType.includes('sandy')) {
      n = 20; p = 20; k = 35;
    } else if (sType.includes('laterite')) {
      n = 30; p = 15; k = 30;
    } else if (sType.includes('loamy')) {
      n = 60; p = 45; k = 70;
    } else if (sType.includes('clayey red')) {
      n = 55; p = 30; k = 60;
    } else if (sType.includes('sandy loam')) {
      n = 40; p = 35; k = 50;
    }

    // High temperature causes nitrogen to mineralize and volatilize rapidly, necessitating higher target nitrogen defaults
    if (temp > 30) {
      n += 12;
    } else if (temp < 18) {
      n -= 8;
    }

    // Heavy water/rain triggers intense potassium (K) leaching in red and porous soils, necessitating higher target K defaults
    if (rainVal > 150) {
      k += 15;
      n -= 5; // heavy rain washes surface nitrogen
    } else if (rainVal < 50) {
      // Under drought conditions, phosphorus diffusion to root hair drops; we need a higher default P level to ensure sufficient intake
      p += 10;
      k -= 5;
    }

    // Extreme pH ranges block phosphorus (phosphate fixation with iron/calcium) - elevate target P to ensure supply
    if (pHVal < 6.0 || pHVal > 7.5) {
      p += 10;
    }

    return {
      n: Math.max(0, Math.min(400, Math.round(n))),
      p: Math.max(5, Math.min(400, Math.round(p))),
      k: Math.max(5, Math.min(400, Math.round(k)))
    };
  };

  useEffect(() => {
    if (autoPilot && profile.soilType) {
      // Calculate automated environment parameters
      const env = getAutomatedEnvironmentalValues(weatherCondition);
      setTemperature(env.temp);
      setHumidity(env.humid);
      setPH(env.pH);
      setRainfall(env.rain);

      // Predict target NPK baseline defaults based on these parameters
      const optNPK = predictOptimalNPK(env.temp, env.humid, env.pH, env.rain);
      setNitrogen(optNPK.n);
      setPhosphorus(optNPK.p);
      setPotassium(optNPK.k);
    }
  }, [autoPilot, weatherCondition, profile.soilType, profile.state]);

  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<{ 
    crop: string; 
    desc: string;
    geminiVerdict?: string;
    geminiCrop?: string;
    groundingSources?: Array<{ title: string; url: string }>;
  } | null>(null);
  const [history, setHistory] = useState<PredictionResult[]>([]);

  const top3Crops = predictTopCrops({
    nitrogen,
    phosphorus,
    potassium,
    temperature,
    humidity,
    pH,
    rainfall,
    soilType: profile.soilType,
    district: profile.district,
    state: profile.state
  });
  const [error, setError] = useState('');
  
  // Right side panel tab: 'chat' or 'history'
  const [activeTab, setActiveTab] = useState<'chat' | 'history'>('chat');

  const renderParamInput = (
    label: string,
    subLabel: string,
    value: number,
    min: number,
    max: number,
    step: number,
    unit: string,
    description: string,
    icon: React.ReactNode,
    setValue: (val: number) => void,
    zones: { threshold1: number; threshold2: number; labels: [string, string, string]; colors: [string, string, string] },
    disabled: boolean = false
  ) => {
    // Determine current zone
    let statusLabel = '';
    let badgeClass = '';
    
    if (value < zones.threshold1) {
      statusLabel = zones.labels[0];
      badgeClass = zones.colors[0];
    } else if (value <= zones.threshold2) {
      statusLabel = zones.labels[1];
      badgeClass = zones.colors[1];
    } else {
      statusLabel = zones.labels[2];
      badgeClass = zones.colors[2];
    }

    const increment = () => {
      if (disabled) return;
      const next = Number((value + step).toFixed(1));
      if (next <= max) setValue(next);
    };

    const decrement = () => {
      if (disabled) return;
      const prev = Number((value - step).toFixed(1));
      if (prev >= min) setValue(prev);
    };

    // Calculate percentage positions for the zone color stripes
    const pct1 = ((zones.threshold1 - min) / (max - min)) * 100;
    const pct2 = ((zones.threshold2 - min) / (max - min)) * 100;
    
    const zoneWidth1 = `${pct1}%`;
    const zoneWidth2 = `${pct2 - pct1}%`;
    const zoneWidth3 = `${100 - pct2}%`;

    return (
      <div className={`p-4 rounded-2xl border transition-all duration-200 ${
        disabled 
          ? "bg-zinc-950/20 border-zinc-800/40 opacity-75" 
          : "bg-zinc-950/40 border-zinc-800/80 hover:border-emerald-500/20"
      }`}>
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-1.5">
            <div className={`p-1.5 rounded-lg ${disabled ? "bg-zinc-950 text-zinc-600" : "bg-zinc-900 text-zinc-400"}`}>
              {icon}
            </div>
            <div>
              <span className={`text-xs font-bold block ${disabled ? "text-zinc-400" : "text-zinc-200"}`}>{label}</span>
              <span className="text-[10px] text-zinc-500 font-mono">{subLabel}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {disabled && (
              <span className="text-[9px] bg-sky-950/40 text-sky-400 border border-sky-500/10 px-1.5 py-0.5 rounded font-mono font-bold animate-pulse">
                Auto-Synced
              </span>
            )}
            <span className={`text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full ${badgeClass}`}>
              {statusLabel}
            </span>
            <div className={`flex items-center border rounded-xl px-1.5 py-0.5 ${
              disabled ? "bg-zinc-950/50 border-zinc-900" : "bg-zinc-900 border-zinc-800"
            }`}>
              <button
                type="button"
                onClick={decrement}
                disabled={disabled}
                className={`w-5 h-5 flex items-center justify-center text-xs rounded-md transition select-none font-bold ${
                  disabled 
                    ? "text-zinc-600 cursor-not-allowed" 
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
                }`}
              >
                -
              </button>
              <span className={`text-xs font-mono font-extrabold min-w-[50px] text-center px-1 ${
                disabled ? "text-zinc-400" : "text-white"
              }`}>
                {value} {unit}
              </span>
              <button
                type="button"
                onClick={increment}
                disabled={disabled}
                className={`w-5 h-5 flex items-center justify-center text-xs rounded-md transition select-none font-bold ${
                  disabled 
                    ? "text-zinc-600 cursor-not-allowed" 
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
                }`}
              >
                +
              </button>
            </div>
          </div>
        </div>
        
        <div className="relative flex items-center py-1">
          {/* Visual Level color range zone indicator underneath the slider */}
          <div className="absolute inset-x-0 h-1.5 bg-zinc-800 rounded-full overflow-hidden flex">
            <div style={{ width: zoneWidth1 }} className="h-full bg-amber-500/30" title="Low / Deficient range" />
            <div style={{ width: zoneWidth2 }} className="h-full bg-emerald-500/30" title="Optimal / Balanced range" />
            <div style={{ width: zoneWidth3 }} className="h-full bg-blue-500/30" title="High / Surplus range" />
          </div>
          
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            disabled={disabled}
            onChange={(e) => setValue(Number(e.target.value))}
            className={`w-full h-1.5 bg-transparent rounded-lg appearance-none focus:outline-none relative z-10 ${
              disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer accent-emerald-500"
            }`}
          />
        </div>
        
        <div className="flex justify-between items-center text-[10px] text-zinc-500 mt-2 font-mono">
          <span>Min: {min}</span>
          <span className="text-[10px] italic text-zinc-400 text-center flex-1 px-4 truncate" title={description}>
            {description}
          </span>
          <span>Max: {max}</span>
        </div>
      </div>
    );
  };

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/predictions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setHistory(data.history || []);
      }
    } catch (err) {
      console.error('Failed to load predictions history:', err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [token]);

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setPrediction(null);

    // Strict input bounds checking
    if (pH < 0 || pH > 14) {
      setError('Soil pH must be between 0 and 14.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nitrogen,
          phosphorus,
          potassium,
          temperature,
          humidity,
          pH,
          rainfall
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Prediction failed.');
      }

      setPrediction({
        crop: data.recommended_crop,
        desc: data.description,
        geminiVerdict: data.geminiVerdict,
        geminiCrop: data.geminiCrop,
        groundingSources: data.groundingSources
      });
      
      // Refresh prediction list history
      fetchHistory();
    } catch (err: any) {
      setError(err.message || 'Failed to analyze crop suitability.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to load templates (preset ranges for standard soils)
  const applyPreset = (type: 'clayey' | 'sandy' | 'fertile') => {
    if (type === 'clayey') {
      setNitrogen(80);
      setPhosphorus(45);
      setPotassium(40);
      setTemperature(26);
      setHumidity(80);
      setPH(6.2);
      setRainfall(180);
    } else if (type === 'sandy') {
      setNitrogen(25);
      setPhosphorus(20);
      setPotassium(30);
      setTemperature(28);
      setHumidity(55);
      setPH(7.1);
      setRainfall(45);
    } else {
      setNitrogen(100);
      setPhosphorus(60);
      setPotassium(80);
      setTemperature(22);
      setHumidity(65);
      setPH(6.5);
      setRainfall(110);
    }
  };

  const applyVillageSoil = () => {
    if (!profile || !profile.soilType) return;
    const type = profile.soilType.toLowerCase();
    
    if (type.includes('alluvial') || type.includes('delta') || type.includes('guntur')) {
      setNitrogen(70);
      setPhosphorus(50);
      setPotassium(90);
      setTemperature(26);
      setHumidity(80);
      setPH(7.0);
      setRainfall(190);
    } else if (type.includes('red sandy') || type.includes('anantapur')) {
      setNitrogen(35);
      setPhosphorus(25);
      setPotassium(45);
      setTemperature(28);
      setHumidity(50);
      setPH(6.5);
      setRainfall(65);
    } else if (type.includes('arid') || type.includes('sandy')) {
      setNitrogen(15);
      setPhosphorus(20);
      setPotassium(40);
      setTemperature(30);
      setHumidity(35);
      setPH(8.5);
      setRainfall(35);
    } else if (type.includes('laterite')) {
      setNitrogen(30);
      setPhosphorus(15);
      setPotassium(30);
      setTemperature(25);
      setHumidity(60);
      setPH(5.5);
      setRainfall(160);
    } else {
      // Default Black Cotton Soil
      setNitrogen(65);
      setPhosphorus(25);
      setPotassium(120);
      setTemperature(26);
      setHumidity(75);
      setPH(8.0);
      setRainfall(120);
    }
  };

  const resetForm = () => {
    setNitrogen(50);
    setPhosphorus(50);
    setPotassium(50);
    setTemperature(25);
    setHumidity(60);
    setPH(6.5);
    setRainfall(100);
    setPrediction(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      {/* Slogan scrolling at the top in Telugu */}
      <Marquee />

      {/* Nav Bar */}
      <header className="border-b border-zinc-800 bg-zinc-900/60 backdrop-blur-md px-6 py-4 sticky top-0 z-20 flex justify-between items-center">
        <Logo size="md" />

        {/* Center regional soil identification */}
        {profile.name ? (
          <div className="hidden md:flex items-center gap-2 bg-emerald-950/40 px-3.5 py-1.5 rounded-full border border-emerald-500/10">
            <Compass size={14} className="text-emerald-400 animate-spin-slow" />
            <span className="text-[11px] font-mono text-zinc-300">
              Village Soil detected: <strong className="text-emerald-400">{profile.soilType || 'Pending Setup'}</strong>
            </span>
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-2 bg-amber-950/40 px-3.5 py-1.5 rounded-full border border-amber-500/10">
            <AlertTriangle size={14} className="text-amber-400" />
            <span className="text-[11px] font-mono text-zinc-300">
              Please <button onClick={onEditProfile} className="underline text-amber-400 font-bold hover:text-amber-300">configure profile</button> to analyze soil
            </span>
          </div>
        )}

        <div className="flex items-center gap-4">
          <button 
            onClick={onEditProfile}
            className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-xl text-xs font-semibold text-white transition cursor-pointer"
          >
            <User size={14} />
            <span>Profile Settings</span>
          </button>
          
          <button 
            onClick={onLogout}
            className="p-1.5 bg-red-950/20 hover:bg-red-900/30 text-red-400 hover:text-red-300 rounded-xl transition border border-red-500/10 cursor-pointer"
            title="Log Out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </header>

      {/* Dashboard Highlighted Main Container Grid */}
      <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Input Form Section (5/12 widths) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-zinc-900/90 rounded-3xl border border-zinc-800/80 p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500/20" />
            
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-extrabold text-white font-display flex items-center gap-2">
                  <Sprout className="text-emerald-400" /> Soil & Environmental Inputs
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Adjust parameter values to compute recommendations.
                </p>
              </div>
              <button 
                onClick={resetForm}
                className="p-2 text-zinc-500 hover:text-white bg-zinc-950 border border-zinc-800 rounded-xl hover:border-zinc-700 transition cursor-pointer"
                title="Reset Parameters"
              >
                <RotateCcw size={14} />
              </button>
            </div>

            {/* 🤖 Dynamic Soil & Weather Auto-Pilot Panel */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 mb-5 space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-emerald-950/60 border border-emerald-500/20 rounded-xl text-emerald-400">
                    <CloudRain size={15} className={autoPilot ? "animate-bounce" : ""} />
                  </span>
                  <div>
                    <h3 className="text-xs font-extrabold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                      Auto-Pilot Mode 
                      {autoPilot && (
                        <span className="text-[9px] bg-emerald-950/50 text-emerald-400 px-1.5 py-0.5 rounded-full border border-emerald-500/20 font-bold animate-pulse">
                          Active
                        </span>
                      )}
                    </h3>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Automates environment & predicts optimal N-P-K defaults</p>
                  </div>
                </div>
                
                {/* AutoPilot toggle */}
                <button
                  type="button"
                  onClick={() => {
                    setAutoPilot(!autoPilot);
                  }}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    autoPilot ? 'bg-emerald-500' : 'bg-zinc-800'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      autoPilot ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {autoPilot ? (
                profile.soilType ? (
                  <div className="pt-2.5 border-t border-zinc-800/80 space-y-2.5">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] text-zinc-400 font-mono flex items-center gap-1">
                        <Calendar size={11} className="text-zinc-500" />
                        Dynamic Weather Station Simulation
                      </span>
                      <div className="grid grid-cols-4 gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800/80">
                        {(['normal', 'summer', 'monsoon', 'winter'] as const).map((mode) => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => setWeatherCondition(mode)}
                            className={`text-[9px] font-extrabold py-1 rounded-lg capitalize transition-all duration-150 cursor-pointer ${
                              weatherCondition === mode 
                                ? 'bg-emerald-950 border border-emerald-500/20 text-emerald-400 shadow-sm' 
                                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40'
                            }`}
                          >
                            {mode === 'normal' ? 'Annual' : mode}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="bg-zinc-950/80 p-2.5 rounded-xl border border-zinc-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-left">
                      <div>
                        <span className="text-[9px] font-mono text-emerald-400 font-extrabold flex items-center gap-1">
                          <Compass size={11} className="animate-spin-slow text-emerald-400" /> Predicted Target N-P-K Defaults
                        </span>
                        <p className="text-[10px] text-zinc-500 mt-0.5">
                          Calculated for regional <strong className="text-zinc-300 font-medium">{profile.soilType}</strong>
                        </p>
                      </div>
                      <div className="flex items-center gap-1 bg-zinc-900 px-2 py-1 rounded-lg border border-zinc-800 text-[11px] font-mono font-extrabold text-white">
                        <span className="text-emerald-400">{nitrogen}N</span> • <span className="text-emerald-400">{phosphorus}P</span> • <span className="text-emerald-400">{potassium}K</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-amber-950/20 border border-amber-500/10 text-[10px] text-amber-400 leading-relaxed font-mono flex items-center gap-1.5">
                    <AlertTriangle size={12} className="shrink-0 text-amber-400" />
                    <span>Configure your farmer profile to enable automated weather/soil predictions!</span>
                  </div>
                )
              ) : (
                <div className="pt-2 border-t border-zinc-800/80 flex flex-wrap items-center gap-1.5 text-[11px] text-zinc-400">
                  <span className="font-mono text-[10px] text-zinc-500 mr-1 uppercase tracking-wider">Manual Baselines:</span>
                  <button 
                    type="button"
                    onClick={() => applyPreset('clayey')}
                    className="bg-zinc-950 hover:bg-emerald-950/30 px-2.5 py-1 rounded-lg border border-zinc-800 hover:border-emerald-500/30 transition text-zinc-300 cursor-pointer"
                  >
                    Clayey Delta
                  </button>
                  <button 
                    type="button"
                    onClick={() => applyPreset('sandy')}
                    className="bg-zinc-950 hover:bg-amber-950/30 px-2.5 py-1 rounded-lg border border-zinc-800 hover:border-amber-500/30 transition text-zinc-300 cursor-pointer"
                  >
                    Sandy Arid
                  </button>
                  <button 
                    type="button"
                    onClick={() => applyPreset('fertile')}
                    className="bg-zinc-950 hover:bg-emerald-950/30 px-2.5 py-1 rounded-lg border border-zinc-800 hover:border-emerald-500/30 transition text-zinc-300 cursor-pointer"
                  >
                    Loamy Highland
                  </button>
                  
                  {profile && profile.soilType && (
                    <button 
                      type="button"
                      onClick={applyVillageSoil}
                      className="bg-emerald-950/50 hover:bg-emerald-900/60 px-2.5 py-1 rounded-lg border border-emerald-500/30 hover:border-emerald-400 transition text-emerald-400 font-bold cursor-pointer flex items-center gap-1 sm:ml-auto"
                      title={`Autofill parameters using the regional ${profile.soilType} composition for ${profile.village || 'your village'}`}
                    >
                      <Compass size={11} className="animate-spin-slow" />
                      Apply Local Baseline
                    </button>
                  )}
                </div>
              )}
            </div>

            <form onSubmit={handlePredict} className="space-y-4">
              {renderParamInput(
                "Nitrogen",
                "Nutrient (N)",
                nitrogen,
                0,
                400,
                1,
                "kg/ha",
                "Promotes vegetative leaf canopy and plant protein.",
                <Sprout size={14} className="text-emerald-400" />,
                setNitrogen,
                {
                  threshold1: 80,
                  threshold2: 200,
                  labels: ["Deficient", "Optimal", "Surplus"],
                  colors: [
                    "bg-amber-950/50 text-amber-400 border border-amber-500/10",
                    "bg-emerald-950/50 text-emerald-400 border border-emerald-500/10",
                    "bg-blue-950/50 text-blue-400 border border-blue-500/10"
                  ]
                }
              )}

              {renderParamInput(
                "Phosphorus",
                "Nutrient (P)",
                phosphorus,
                5,
                400,
                1,
                "kg/ha",
                "Vital for root structure, flowering, and cellular energy.",
                <Sprout size={14} className="text-emerald-400" />,
                setPhosphorus,
                {
                  threshold1: 80,
                  threshold2: 180,
                  labels: ["Deficient", "Optimal", "Surplus"],
                  colors: [
                    "bg-amber-950/50 text-amber-400 border border-amber-500/10",
                    "bg-emerald-950/50 text-emerald-400 border border-emerald-500/10",
                    "bg-blue-950/50 text-blue-400 border border-blue-500/10"
                  ]
                }
              )}

              {renderParamInput(
                "Potassium",
                "Nutrient (K)",
                potassium,
                5,
                400,
                1,
                "kg/ha",
                "Enhances plant turgor, water control, and crop immunity.",
                <Sprout size={14} className="text-emerald-400" />,
                setPotassium,
                {
                  threshold1: 100,
                  threshold2: 220,
                  labels: ["Deficient", "Optimal", "Surplus"],
                  colors: [
                    "bg-amber-950/50 text-amber-400 border border-amber-500/10",
                    "bg-emerald-950/50 text-emerald-400 border border-emerald-500/10",
                    "bg-blue-950/50 text-blue-400 border border-blue-500/10"
                  ]
                }
              )}

              {renderParamInput(
                "Temperature",
                "Environment (°C)",
                temperature,
                10,
                50,
                1,
                "°C",
                "Drives enzyme kinetics and plant respiration levels.",
                <Thermometer size={14} className="text-amber-500" />,
                setTemperature,
                {
                  threshold1: 18,
                  threshold2: 32,
                  labels: ["Cool", "Optimal", "Hot"],
                  colors: [
                    "bg-blue-950/50 text-blue-400 border border-blue-500/10",
                    "bg-emerald-950/50 text-emerald-400 border border-emerald-500/10",
                    "bg-red-950/50 text-red-400 border border-red-500/10"
                  ]
                },
                autoPilot
              )}

              {renderParamInput(
                "Humidity",
                "Environment (%)",
                humidity,
                10,
                100,
                1,
                "%",
                "Controls evapotranspiration and relative air dryness.",
                <Droplets size={14} className="text-blue-400" />,
                setHumidity,
                {
                  threshold1: 45,
                  threshold2: 75,
                  labels: ["Dry", "Optimal", "Highly Humid"],
                  colors: [
                    "bg-amber-950/50 text-amber-400 border border-amber-500/10",
                    "bg-emerald-950/50 text-emerald-400 border border-emerald-500/10",
                    "bg-blue-950/50 text-blue-400 border border-blue-500/10"
                  ]
                },
                autoPilot
              )}

              {renderParamInput(
                "pH Level",
                "Soil Acidity (pH)",
                pH,
                3.5,
                9.9,
                0.1,
                "pH",
                "Determines nutrient solubility and microbial activity.",
                <Wind size={14} className="text-indigo-400" />,
                setPH,
                {
                  threshold1: 6.0,
                  threshold2: 7.5,
                  labels: ["Acidic 🍋", "Optimal Neutral 💧", "Alkaline 🧪"],
                  colors: [
                    "bg-amber-950/50 text-amber-400 border border-amber-500/10",
                    "bg-emerald-950/50 text-emerald-400 border border-emerald-500/10",
                    "bg-indigo-950/50 text-indigo-400 border border-indigo-500/10"
                  ]
                },
                autoPilot
              )}

              {renderParamInput(
                "Annual Rainfall",
                "Environment (mm)",
                rainfall,
                20,
                300,
                1,
                "mm",
                "Main source of natural irrigation and moisture recharge.",
                <CloudRain size={14} className="text-sky-400" />,
                setRainfall,
                {
                  threshold1: 80,
                  threshold2: 185,
                  labels: ["Low / Arid", "Optimal / Balanced", "Heavy / Wetland"],
                  colors: [
                    "bg-amber-950/50 text-amber-400 border border-amber-500/10",
                    "bg-emerald-950/50 text-emerald-400 border border-emerald-500/10",
                    "bg-blue-950/50 text-blue-400 border border-blue-500/10"
                  ]
                },
                autoPilot
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-emerald-500/20 transition-all duration-200 mt-6 flex items-center justify-center gap-2 group cursor-pointer"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Sprout className="group-hover:scale-110 transition-transform" size={18} />
                    <span>Predict Optimal Crop</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* MIDDLE/RIGHT: Main Prediction Results and Tabs Panel (7/12 widths) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* CROP RECOMMENDATION RESULT SCREEN (Highlighted) */}
          <div className="bg-zinc-900/90 rounded-3xl border border-zinc-800 p-6 shadow-xl relative overflow-hidden flex flex-col justify-center min-h-[180px]">
            {/* Visual background decorations for soil/farm overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.06),transparent_60%)] pointer-events-none" />
            
            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
                ⚠️ Error: {error}
              </div>
            )}

            {!prediction && !error && !loading && (
              <div className="text-center py-4 space-y-2">
                <div className="w-12 h-12 bg-zinc-950 text-zinc-600 rounded-full flex items-center justify-center mx-auto border border-zinc-800">
                  <Info size={20} />
                </div>
                <h3 className="text-zinc-200 font-semibold text-sm">No Active Prediction</h3>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  Adjust the soil properties panel on the left and click <strong>"Predict Optimal Crop"</strong> to compute machine learning recommendations.
                </p>
              </div>
            )}

            {loading && (
              <div className="text-center py-6 space-y-3">
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <h3 className="text-emerald-400 font-bold text-sm">Running Random Forest Classifier...</h3>
                <p className="text-xs text-zinc-500">Analyzing soil composition vector thresholds.</p>
              </div>
            )}

            {prediction && !loading && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row gap-5 items-center">
                  
                  {/* Large Result visual circle */}
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500/20 to-amber-500/10 border-2 border-emerald-500/40 flex flex-col items-center justify-center shrink-0 shadow-lg relative">
                    <Sprout className="text-emerald-400" size={32} />
                    <span className="text-[9px] font-mono font-bold text-amber-400 mt-1 uppercase">Perfect Suit</span>
                  </div>

                  <div className="text-center md:text-left flex-1 space-y-1">
                    <div className="text-xs text-zinc-400 font-bold uppercase tracking-widest">
                      Machine Learning Model Verdict
                    </div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-white font-display">
                      Recommended Crop: <span className="text-emerald-400">{prediction.crop}</span>
                    </h1>
                    <p className="text-xs text-zinc-300 leading-relaxed max-w-md pt-1">
                      {prediction.desc} 
                    </p>
                    
                    {/* Micronutrient Comparison bar tags */}
                    <div className="flex flex-wrap gap-2 pt-3">
                      <span className="text-[10px] bg-zinc-950 px-2.5 py-1.5 rounded-lg border border-zinc-800 text-zinc-400">
                        Nitrogen Status: <strong className={nitrogen > 50 ? "text-emerald-400" : "text-amber-500"}>{nitrogen > 50 ? "Satisfied" : "Moderate"}</strong>
                      </span>
                      <span className="text-[10px] bg-zinc-950 px-2.5 py-1.5 rounded-lg border border-zinc-800 text-zinc-400">
                        pH Comfort: <strong className="text-emerald-400">Optimal ({pH.toFixed(1)})</strong>
                      </span>
                    </div>
                  </div>

                </div>

                {/* Gemini & Google Search Grounded Prediction Block */}
                {prediction.geminiVerdict && (
                  <div className="mt-6 pt-6 border-t border-zinc-900/80 space-y-4">
                    <div className="bg-gradient-to-br from-emerald-950/20 via-zinc-950/40 to-amber-950/10 border border-emerald-500/20 rounded-2xl p-5 relative overflow-hidden">
                      {/* Accent glow */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl pointer-events-none" />
                      
                      <div className="flex items-center justify-between gap-4 flex-wrap border-b border-zinc-900 pb-3">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-emerald-400">
                            <Sparkles size={16} />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-widest flex items-center gap-1.5">
                              Gemini Search-Grounded AI Analysis
                            </h3>
                            <p className="text-[10px] text-zinc-500">Real-time weather reports, regional market pricing, and agricultural advisories</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 px-2 py-0.5 rounded-lg animate-pulse">
                          Grounded in Live Google Search Data
                        </span>
                      </div>

                      <div className="mt-4 space-y-4">
                        <div className="text-xs text-zinc-300 leading-relaxed max-w-none">
                          <div className="markdown-body text-zinc-300 bg-zinc-950/50 p-4 rounded-xl border border-zinc-900/80 prose prose-sm prose-invert whitespace-pre-line leading-relaxed">
                            <Markdown>{prediction.geminiVerdict}</Markdown>
                          </div>
                        </div>

                        {/* Grounding Sources */}
                        {prediction.groundingSources && prediction.groundingSources.length > 0 && (
                          <div className="space-y-2 pt-2 border-t border-zinc-900/50">
                            <span className="block text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                              <ExternalLink size={10} /> Live Google Search Grounding Citations:
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {prediction.groundingSources.map((source, sIdx) => (
                                <a
                                  key={sIdx}
                                  href={source.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] font-mono bg-zinc-900/60 hover:bg-zinc-900 text-zinc-400 hover:text-emerald-400 border border-zinc-800/80 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                                >
                                  <span className="truncate max-w-[200px]">{source.title}</span>
                                  <ExternalLink size={10} className="shrink-0" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Top 3 Yielding Crops Section */}
                <div className="mt-6 pt-6 border-t border-zinc-900/80 space-y-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-2">
                        <TrendingUp className="text-amber-500" size={16} />
                        Top 3 Cultivation Candidates & 5-Year Performance Statistics
                      </h3>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Yield potential forecasting and historical yield gain analysis over the last 5 years
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500 bg-zinc-900/50 px-2 py-1 rounded-lg border border-zinc-800/40 shrink-0 self-start md:self-auto">
                      <span>Location:</span>
                      <span className="text-zinc-300 font-bold">{profile.district || 'Regional Cluster'}, {profile.state || 'General India'}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {top3Crops.map((tc, idx) => {
                      const isWinner = tc.crop.toLowerCase() === prediction.crop.toLowerCase();
                      
                      return (
                        <div 
                          key={tc.crop}
                          className={`relative bg-zinc-950/80 border rounded-2xl p-4 flex flex-col justify-between transition-all duration-300 ${
                            isWinner 
                              ? 'border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.05)] bg-emerald-950/5' 
                              : 'border-zinc-900 hover:border-zinc-800'
                          }`}
                        >
                          {/* Badge for Rank */}
                          <div className="absolute top-3 right-3 flex items-center gap-1.5">
                            <span className={`text-[9px] font-mono font-extrabold px-1.5 py-0.5 rounded ${
                              idx === 0 
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                                : idx === 1 
                                  ? 'bg-zinc-400/10 text-zinc-300 border border-zinc-400/20' 
                                  : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                            }`}>
                              Rank #{idx + 1}
                            </span>
                            <span className="text-[10px] font-mono font-bold bg-emerald-950/50 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/10">
                              {tc.matchScore}% Match
                            </span>
                          </div>

                          <div className="space-y-3">
                            <div className="pr-20">
                              <h4 className="text-base font-black text-white font-display flex items-center gap-1.5">
                                <Sprout className={isWinner ? "text-emerald-400" : "text-zinc-400"} size={16} />
                                {tc.crop}
                              </h4>
                            </div>
                            
                            <p className="text-[11px] text-zinc-400 leading-normal min-h-[36px]">
                              {tc.description}
                            </p>

                            {/* Yield Stats */}
                            <div className="grid grid-cols-2 gap-2 bg-zinc-900/40 p-2.5 rounded-xl border border-zinc-900">
                              <div>
                                <span className="block text-[8px] text-zinc-500 font-bold uppercase tracking-wider">Projected Yield</span>
                                <span className="text-sm font-black text-white font-mono">{tc.currentYield} <span className="text-[10px] font-normal text-zinc-400">t/ha</span></span>
                              </div>
                              <div>
                                <span className="block text-[8px] text-zinc-500 font-bold uppercase tracking-wider">Yield Gain Trend</span>
                                <span className={`text-xs font-black font-mono flex items-center gap-0.5 mt-0.5 ${
                                  tc.yieldGain >= 0 ? "text-emerald-400" : "text-red-400"
                                }`}>
                                  {tc.yieldGain >= 0 ? "+" : ""}{tc.yieldGain}%
                                  {tc.yieldGain >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                </span>
                              </div>
                            </div>

                            {/* 5-Year Historical Statistics Sparkline / Bars */}
                            <div className="space-y-1.5 pt-1">
                              <span className="block text-[8px] text-zinc-500 font-bold uppercase tracking-wider">5-Year Historical Statistics (2021-2025)</span>
                              <div className="space-y-1 bg-zinc-900/20 p-2 rounded-xl border border-zinc-900/50">
                                {tc.historicalYields.map((yieldVal, yIdx) => {
                                  const year = 2021 + yIdx;
                                  const maxScale = Math.max(...tc.historicalYields, tc.currentYield);
                                  const barWidth = `${Math.max(10, Math.min(100, (yieldVal / maxScale) * 100))}%`;
                                  
                                  return (
                                    <div key={year} className="flex items-center text-[9px] font-mono text-zinc-500 gap-1.5">
                                      <span className="w-6 text-left">{year}</span>
                                      <div className="flex-1 bg-zinc-900 h-1.5 rounded-full overflow-hidden relative">
                                        <div 
                                          className={`h-full rounded-full transition-all duration-500 ${
                                            isWinner 
                                              ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-400' 
                                              : 'bg-gradient-to-r from-zinc-600/30 to-zinc-400'
                                          }`} 
                                          style={{ width: barWidth }}
                                        />
                                      </div>
                                      <span className="w-12 text-right font-bold text-zinc-400">{yieldVal.toFixed(1)} <span className="text-[7px] text-zinc-600">t/ha</span></span>
                                    </div>
                                  );
                                })}
                                
                                {/* Current Projected Row */}
                                <div className="flex items-center text-[9px] font-mono text-amber-400 gap-1.5 mt-1 border-t border-zinc-900/60 pt-1">
                                  <span className="w-6 text-left font-bold">2026</span>
                                  <div className="flex-1 bg-zinc-900 h-2 rounded-full overflow-hidden relative border border-amber-500/10">
                                    <div 
                                      className="h-full rounded-full bg-gradient-to-r from-amber-500/40 to-amber-400 animate-pulse" 
                                      style={{ width: `${(tc.currentYield / Math.max(...tc.historicalYields, tc.currentYield)) * 100}%` }}
                                    />
                                  </div>
                                  <span className="w-12 text-right font-black">{tc.currentYield.toFixed(1)} <span className="text-[7px] text-amber-500">t/ha</span></span>
                                </div>
                              </div>
                            </div>

                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* LOWER TABS FOR AI CHATBOT & PREVIOUS HISTORICAL DIRECTORY */}
          <div className="space-y-3">
            <div className="flex border-b border-zinc-900 gap-1.5">
              <button
                onClick={() => setActiveTab('chat')}
                className={`px-4 py-2 text-xs font-bold font-display rounded-t-xl border-t border-x transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'chat'
                    ? 'bg-zinc-950 border-emerald-500/20 text-white'
                    : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <MessageSquare size={14} />
                <span>Agricultural AI Advisor</span>
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-4 py-2 text-xs font-bold font-display rounded-t-xl border-t border-x transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'history'
                    ? 'bg-zinc-950 border-emerald-500/20 text-white'
                    : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <History size={14} />
                <span>Prediction History ({history.length})</span>
              </button>
            </div>

            {/* TAB PANES */}
            {activeTab === 'chat' ? (
              <Chatbot token={token} />
            ) : (
              <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-4 h-[550px] overflow-y-auto space-y-3">
                {history.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-zinc-500 text-center gap-2">
                    <History size={24} className="text-zinc-700" />
                    <span className="text-xs">No prediction history on file.</span>
                  </div>
                ) : (
                  history.map((record) => (
                    <div 
                      key={record.id}
                      className="bg-zinc-900/60 border border-zinc-800/80 p-4 rounded-2xl flex flex-col md:flex-row justify-between gap-3.5 items-start md:items-center hover:border-emerald-500/20 transition-all"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-zinc-500 flex items-center gap-1">
                            <Calendar size={12} /> {new Date(record.createdAt).toLocaleDateString()}
                          </span>
                          <span className="text-[10px] font-mono bg-emerald-950/40 text-emerald-400 border border-emerald-500/10 px-2 py-0.5 rounded-full font-bold">
                            #{record.id}
                          </span>
                        </div>
                        <h4 className="text-sm font-extrabold text-white mt-1">
                          Recommended Crop: <span className="text-emerald-400">{record.recommendedCrop}</span>
                        </h4>
                        
                        {/* Nutrient Parameters breakdown */}
                        <div className="grid grid-cols-4 md:grid-cols-7 gap-2 mt-3 text-[10px] font-mono text-zinc-400">
                          <div className="bg-zinc-950 p-1.5 rounded text-center">
                            <span className="block text-zinc-600">N</span>
                            <span className="font-bold">{record.inputs.nitrogen}</span>
                          </div>
                          <div className="bg-zinc-950 p-1.5 rounded text-center">
                            <span className="block text-zinc-600">P</span>
                            <span className="font-bold">{record.inputs.phosphorus}</span>
                          </div>
                          <div className="bg-zinc-950 p-1.5 rounded text-center">
                            <span className="block text-zinc-600">K</span>
                            <span className="font-bold">{record.inputs.potassium}</span>
                          </div>
                          <div className="bg-zinc-950 p-1.5 rounded text-center">
                            <span className="block text-zinc-600">Temp</span>
                            <span className="font-bold">{record.inputs.temperature}°C</span>
                          </div>
                          <div className="bg-zinc-950 p-1.5 rounded text-center">
                            <span className="block text-zinc-600">Hum</span>
                            <span className="font-bold">{record.inputs.humidity}%</span>
                          </div>
                          <div className="bg-zinc-950 p-1.5 rounded text-center">
                            <span className="block text-zinc-600">pH</span>
                            <span className="font-bold">{record.inputs.pH}</span>
                          </div>
                          <div className="bg-zinc-950 p-1.5 rounded text-center">
                            <span className="block text-zinc-600">Rain</span>
                            <span className="font-bold">{record.inputs.rainfall}mm</span>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0">
                        <button
                          onClick={() => {
                            setNitrogen(record.inputs.nitrogen);
                            setPhosphorus(record.inputs.phosphorus);
                            setPotassium(record.inputs.potassium);
                            setTemperature(record.inputs.temperature);
                            setHumidity(record.inputs.humidity);
                            setPH(record.inputs.pH);
                            setRainfall(record.inputs.rainfall);
                            setPrediction({
                              crop: record.recommendedCrop,
                              desc: `Recalculating statistics for historical metrics: N:${record.inputs.nitrogen}, P:${record.inputs.phosphorus}, K:${record.inputs.potassium}, pH:${record.inputs.pH}`,
                              geminiVerdict: record.geminiVerdict,
                              geminiCrop: record.geminiCrop,
                              groundingSources: record.groundingSources
                            });
                            window.scrollTo({ top: 120, behavior: 'smooth' });
                          }}
                          className="px-3 py-1.5 bg-zinc-950 hover:bg-zinc-900 text-zinc-300 hover:text-emerald-400 border border-zinc-800 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <RotateCcw size={12} />
                          <span>Apply Inputs</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

          </div>

        </div>

      </main>
    </div>
  );
};
