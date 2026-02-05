
import React, { useState, useMemo, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { 
  ChevronRight, User, Target, BarChart3, BrainCircuit, PlayCircle, Plus, Minus,
  Briefcase, GraduationCap, Code2, Trophy, AlertCircle, Lightbulb, CheckCircle2,
  FileText, Upload, Trash2, Loader2, Sparkles, Image as ImageIcon, ArrowRight,
  Monitor, Info, Zap
} from 'lucide-react';

import { UserProfile, SystemScores, AIInsights, AppStep, InputSource } from './types';
import { calculateScores } from './scoringLogic';
import { getAIInsights, extractTextFromImage, extractProfileMetrics } from './geminiService';
import { ROLES } from './constants';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.PROFILE_INPUT);
  const [targetRole, setTargetRole] = useState<string>("Full Stack Developer");
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    education: '',
    input_sources: []
  });
  
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMsg, setLoadingMsg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scores = useMemo(() => calculateScores(profile), [profile]);

  const addInputSource = (source: InputSource) => {
    setProfile(prev => ({
      ...prev,
      input_sources: [...prev.input_sources, source]
    }));
  };

  const removeInputSource = (idx: number) => {
    setProfile(prev => ({
      ...prev,
      input_sources: prev.input_sources.filter((_, i) => i !== idx)
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setLoading(true);
    setLoadingMsg('Scanning documents...');
    setError(null);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const isImage = file.type.startsWith('image/');
        const isPdf = file.type === 'application/pdf';
        const reader = new FileReader();
        const content = await new Promise<string>((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          if (isImage) reader.readAsDataURL(file);
          else reader.readAsText(file);
        });
        let extractedText = content;
        if (isImage) extractedText = await extractTextFromImage(content);
        else if (isPdf) extractedText = `[Simulated PDF Extraction for ${file.name}]: Details for ${profile.name || 'a student'}.`;
        addInputSource({
          type: isImage ? 'image' : isPdf ? 'pdf' : 'text',
          label: file.name,
          filename: file.name,
          content: extractedText
        });
      }
    } catch (err) {
      setError("Document processing failed. Try manual entry.");
    } finally {
      setLoading(false);
      setLoadingMsg('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleGenerateInsights = async () => {
    if (profile.input_sources.length === 0) {
      setError("Minimum one source required for analysis.");
      return;
    }
    setLoading(true);
    setLoadingMsg('Reasoning over profile context...');
    setError(null);
    try {
      const metrics = await extractProfileMetrics(profile);
      const updatedProfile = { ...profile, detected_metrics: metrics };
      setProfile(updatedProfile);
      const currentScores = calculateScores(updatedProfile);
      setLoadingMsg('Synthesizing recommendations...');
      const insights = await getAIInsights(updatedProfile, targetRole, currentScores);
      setAiInsights(insights);
      setStep(AppStep.DASHBOARD);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis pipeline failed');
    } finally {
      setLoading(false);
      setLoadingMsg('');
    }
  };

  const ProgressBar = ({ currentStep }: { currentStep: AppStep }) => {
    const steps = [
      { id: AppStep.PROFILE_INPUT, label: 'Profile', icon: <User size={14} /> },
      { id: AppStep.DASHBOARD, label: 'Dashboard', icon: <BarChart3 size={14} /> },
      { id: AppStep.AI_COACH, label: 'AI Coach', icon: <BrainCircuit size={14} /> },
      { id: AppStep.SIMULATOR, label: 'Simulator', icon: <PlayCircle size={14} /> },
    ];
    return (
      <div className="flex items-center justify-center space-x-2 md:space-x-4 mb-12">
        {steps.map((s, idx) => (
          <React.Fragment key={s.id}>
            <button
              onClick={() => aiInsights && setStep(s.id)}
              disabled={!aiInsights && idx > 0}
              className={`group flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                step === s.id 
                  ? 'bg-blue-600 text-white shadow-xl shadow-blue-200' 
                  : 'bg-white text-slate-400 border border-slate-200 hover:border-blue-300'
              } ${!aiInsights && idx > 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:-translate-y-0.5'}`}
            >
              <span className={`p-1 rounded-md ${step === s.id ? 'bg-blue-500' : 'bg-slate-100 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors'}`}>
                {s.icon}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider">{s.label}</span>
            </button>
            {idx < steps.length - 1 && <div className="w-4 h-px bg-slate-200" />}
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-20 selection:bg-blue-100 selection:text-blue-900">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 px-6 md:px-12 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-3 group cursor-pointer" onClick={() => window.location.reload()}>
          <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">
            <Sparkles className="text-white" size={20} />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight gradient-text">
            Career Intel
          </h1>
        </div>
        <div className="hidden md:flex items-center space-x-4">
          <div className="flex items-center text-xs font-bold text-slate-500 bg-slate-100 px-4 py-2 rounded-2xl border border-slate-200">
            <Target size={14} className="mr-2 text-blue-600" />
            GOAL: <span className="ml-1 text-blue-700">{targetRole.toUpperCase()}</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 md:px-12 pt-10">
        <ProgressBar currentStep={step} />

        {error && (
          <div className="mb-8 bg-red-50 border border-red-100 text-red-800 p-5 rounded-2xl flex items-start animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="mr-4 text-red-500 shrink-0" size={20} />
            <div>
              <p className="font-bold text-sm">System Notification</p>
              <p className="text-sm opacity-90 font-medium">{error}</p>
            </div>
          </div>
        )}

        {step === AppStep.PROFILE_INPUT && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in slide-in-from-bottom-2 duration-700">
            <div className="lg:col-span-8 space-y-8">
              <section className="bg-white p-8 md:p-10 rounded-[32px] shadow-sm border border-slate-200/60 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-40 h-40 bg-blue-50/50 -mr-20 -mt-20 rounded-full blur-3xl transition-all group-hover:scale-125" />
                <h2 className="text-xl font-extrabold mb-8 flex items-center">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg mr-4">
                    <GraduationCap size={20} />
                  </div>
                  Foundational Profile
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Candidate Name</label>
                    <input 
                      type="text"
                      className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all bg-slate-50 font-semibold text-slate-700"
                      placeholder="e.g. Jordan Smith"
                      value={profile.name}
                      onChange={(e) => setProfile(p => ({ ...p, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Current Status</label>
                    <input 
                      type="text"
                      className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all bg-slate-50 font-semibold text-slate-700"
                      placeholder="e.g. Senior CS Undergraduate"
                      value={profile.education}
                      onChange={(e) => setProfile(p => ({ ...p, education: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="mt-8 space-y-2 relative z-10">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Target Trajectory</label>
                   <select
                      className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all bg-slate-50 font-bold text-slate-800"
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                    >
                      {ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                    </select>
                </div>
              </section>

              <section className="bg-white p-8 md:p-10 rounded-[32px] shadow-sm border border-slate-200/60">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                  <h2 className="text-xl font-extrabold flex items-center">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg mr-4">
                      <FileText size={20} />
                    </div>
                    Evidence & Context
                  </h2>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center space-x-2 px-6 py-3 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all text-xs font-bold shadow-lg shadow-slate-200 active:scale-95"
                  >
                    <Upload size={14} />
                    <span>IMPORT EVIDENCE</span>
                  </button>
                  <input type="file" ref={fileInputRef} className="hidden" multiple accept=".pdf,.docx,.txt,image/*" onChange={handleFileUpload} />
                </div>

                <ManualTextInput onAdd={(label: string, content: string) => addInputSource({ type: 'text', label, content })} />

                <div className="mt-10 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Context Sources ({profile.input_sources.length})</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {profile.input_sources.map((src, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 hover:border-blue-200 transition-all group hover:shadow-md">
                        <div className="flex items-center space-x-4">
                          <div className={`p-2.5 rounded-xl border ${
                            src.type === 'text' ? 'bg-blue-50 border-blue-100 text-blue-500' : 
                            src.type === 'image' ? 'bg-emerald-50 border-emerald-100 text-emerald-500' : 
                            'bg-red-50 border-red-100 text-red-500'
                          }`}>
                            {src.type === 'text' && <FileText size={18} />}
                            {src.type === 'image' && <ImageIcon size={18} />}
                            {(src.type === 'pdf' || src.type === 'docx') && <FileText size={18} />}
                          </div>
                          <div className="overflow-hidden">
                            <p className="font-bold text-xs text-slate-800 truncate">{src.label}</p>
                            <p className="text-[9px] text-slate-400 uppercase font-bold mt-0.5 tracking-tight">{src.type}</p>
                          </div>
                        </div>
                        <button onClick={() => removeInputSource(idx)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                  {profile.input_sources.length === 0 && (
                    <div className="text-center py-16 border-2 border-dashed border-slate-100 rounded-[32px] bg-slate-50/30">
                      <div className="mx-auto w-14 h-14 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mb-4">
                        <Upload className="text-slate-300" size={24} />
                      </div>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Awaiting profile context</p>
                      <p className="text-[11px] text-slate-300 mt-2">Upload resume, projects, or text snippets to begin.</p>
                    </div>
                  )}
                </div>
              </section>
            </div>

            <aside className="lg:col-span-4 space-y-8">
              <div className="bg-slate-900 text-white p-10 rounded-[40px] shadow-2xl relative overflow-hidden group">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-600/30 blur-[100px] rounded-full group-hover:bg-blue-600/50 transition-colors" />
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-600/20 blur-[100px] rounded-full" />
                
                <div className="relative z-10 flex flex-col items-center py-6">
                  <div className="text-5xl font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-slate-500 mb-6">
                    {profile.input_sources.length > 0 ? 'STATUS: OK' : 'STATUS: IDLE'}
                  </div>
                  <div className="flex items-center space-x-2 text-slate-400 bg-white/5 px-4 py-2 rounded-xl mb-12">
                    <Info size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Ready for analysis</span>
                  </div>

                  <button
                    onClick={handleGenerateInsights}
                    disabled={loading || profile.input_sources.length === 0}
                    className={`group w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center space-x-3 ${
                      loading ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 shadow-2xl shadow-blue-600/20 active:scale-[0.98]'
                    }`}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        <span>{loadingMsg || 'Processing...'}</span>
                      </>
                    ) : (
                      <>
                        <span>Initiate Intel Engine</span>
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[32px] border border-slate-200/60 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Zap className="text-amber-500" size={40} />
                </div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-4 tracking-[0.2em]">Strategy Note</h4>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Analysis accuracy scales with data quality. Ensure your context sources highlight specific technical tools, impact metrics, and project goals.
                </p>
              </div>
            </aside>
          </div>
        )}

        {step === AppStep.DASHBOARD && aiInsights && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <StatCard label="Intel Score" value={scores.overall_score} suffix="%" color="text-blue-600" />
              <StatCard label="Skill Density" value={profile.detected_metrics?.skills.length || 0} color="text-emerald-600" />
              <StatCard label="Experience Gap" value={100 - scores.overall_score} suffix="pts" color="text-slate-400" />
              <StatCard label="Growth Index" value={scores.overall_score < 50 ? 'High' : 'Stable'} color="text-purple-600" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-200/60 group">
                <h3 className="text-lg font-extrabold mb-10 flex items-center">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg mr-4">
                    <BarChart3 size={20} />
                  </div>
                  Metric Distribution
                </h3>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { name: 'Technical Skills', score: scores.skills_score, fill: '#3b82f6' },
                      { name: 'Project Impact', score: scores.projects_score, fill: '#f59e0b' },
                      { name: 'Applied Exp.', score: scores.internships_score, fill: '#a855f7' },
                      { name: 'Validated Certs', score: scores.certifications_score, fill: '#10b981' },
                    ]} layout="vertical" margin={{ left: 20, right: 30 }}>
                      <CartesianGrid strokeDasharray="4 4" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" domain={[0, 100]} hide />
                      <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                        cursor={{ fill: '#f8fafc', radius: 8 }}
                      />
                      <Bar dataKey="score" radius={[0, 10, 10, 0]} barSize={28}>
                        { [0,1,2,3].map((entry, index) => <Cell key={`c-${index}`} />) }
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-slate-900 text-white p-12 rounded-[40px] shadow-2xl flex flex-col justify-between group overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] -mr-32 -mt-32 rounded-full" />
                <div className="relative z-10">
                  <h3 className="text-2xl font-black mb-8 flex items-center tracking-tight">
                    <Zap className="mr-4 text-blue-400" size={24} />
                    Career Verdict
                  </h3>
                  <p className="text-slate-300 text-lg leading-relaxed mb-10 font-medium">
                    {aiInsights.career_explanation}
                  </p>
                </div>
                <div className="relative z-10 grid grid-cols-2 gap-8 pt-10 border-t border-white/10">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-black block mb-2 tracking-widest">Primary Asset</span>
                    <span className="text-sm text-blue-400 font-extrabold">{aiInsights.strengths[0] || "Foundational Skills"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-black block mb-2 tracking-widest">Critical Pivot</span>
                    <span className="text-sm text-amber-400 font-extrabold">{aiInsights.weaknesses[0] || "Domain Depth"}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center mt-12 pb-10">
              <button onClick={() => setStep(AppStep.AI_COACH)} className="group bg-blue-600 text-white px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-500 transition-all shadow-2xl shadow-blue-600/20 active:scale-95 flex items-center">
                Access AI Career Coach
                <BrainCircuit className="ml-4 group-hover:rotate-12 transition-transform" />
              </button>
            </div>
          </div>
        )}

        {step === AppStep.AI_COACH && aiInsights && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-10 rounded-[40px] border border-slate-200/60 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 text-emerald-500/10 group-hover:scale-110 transition-transform">
                  <Trophy size={80} />
                </div>
                <h3 className="text-lg font-extrabold mb-8 flex items-center text-emerald-800">
                  Validated Strengths
                </h3>
                <div className="grid grid-cols-1 gap-4 relative z-10">
                  {aiInsights.strengths.map((s, i) => (
                    <div key={i} className="flex items-center bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100 hover:bg-white transition-all">
                      <div className="bg-emerald-500 p-1.5 rounded-lg mr-4 text-white shrink-0">
                        <CheckCircle2 size={14} />
                      </div>
                      <span className="text-slate-700 font-bold text-sm tracking-tight">{s}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white p-10 rounded-[40px] border border-slate-200/60 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 text-amber-500/10 group-hover:scale-110 transition-transform">
                  <AlertCircle size={80} />
                </div>
                <h3 className="text-lg font-extrabold mb-8 flex items-center text-amber-800">
                  Critical Gaps
                </h3>
                <div className="grid grid-cols-1 gap-4 relative z-10">
                  {aiInsights.weaknesses.map((w, i) => (
                    <div key={i} className="flex items-center bg-amber-50/50 p-5 rounded-2xl border border-amber-100 hover:bg-white transition-all">
                      <div className="bg-amber-500 p-1.5 rounded-lg mr-4 text-white shrink-0">
                        <Minus size={14} />
                      </div>
                      <span className="text-slate-700 font-bold text-sm tracking-tight">{w}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <section className="bg-slate-50 p-10 rounded-[48px] border border-slate-200/60">
              <h3 className="text-2xl font-black mb-10 flex items-center tracking-tight">
                <Lightbulb className="mr-4 text-blue-600" size={24} />
                Strategic Growth Projects
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {aiInsights.project_recommendations.map((p, i) => (
                  <div key={i} className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-200/60 hover:shadow-xl hover:-translate-y-1 transition-all group">
                    <h4 className="font-extrabold text-lg text-slate-800 mb-4 group-hover:text-blue-600 transition-colors">{p.title}</h4>
                    <p className="text-sm text-slate-500 mb-8 leading-relaxed font-medium">{p.description}</p>
                    <div className="flex flex-wrap gap-2 pt-6 border-t border-slate-100">
                      {p.skills_gained.map((skill, si) => (
                        <span key={si} className="text-[9px] uppercase font-black px-3 py-1.5 bg-slate-100 text-slate-500 rounded-lg tracking-wider">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-8 bg-white p-10 rounded-[40px] border border-slate-200/60 shadow-sm">
                <h3 className="text-2xl font-black mb-10 flex items-center tracking-tight">
                  <Code2 className="mr-4 text-blue-600" size={24} />
                  Precision Roadmap
                </h3>
                <div className="space-y-6">
                  {aiInsights.skill_roadmap.map((item, i) => (
                    <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 bg-slate-50/50 rounded-3xl border border-slate-100 hover:bg-white hover:shadow-lg hover:border-blue-100 transition-all cursor-default">
                      <div className="flex-1 mb-4 sm:mb-0">
                        <div className="flex items-center mb-3">
                          <span className="font-extrabold text-slate-800 text-lg mr-4 tracking-tight">{item.skill}</span>
                          <span className={`text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest ${
                            item.priority === 'High' ? 'bg-red-100 text-red-600' : 
                            item.priority === 'Medium' ? 'bg-amber-100 text-amber-600' : 
                            'bg-blue-100 text-blue-600'
                          }`}>
                            {item.priority}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed font-medium max-w-lg">{item.reason}</p>
                      </div>
                      <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 text-blue-500">
                         <ChevronRight size={20} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-4 space-y-8">
                <VerticalCardList title="Credentials" items={aiInsights.certifications} accent="blue" />
                <VerticalCardList title="Internship Pools" items={aiInsights.internship_categories} accent="purple" />
                <VerticalCardList title="Hackathon Tracks" items={aiInsights.hackathon_categories} accent="emerald" />
              </div>
            </div>
            
            <div className="flex justify-center pb-16">
              <button onClick={() => setStep(AppStep.SIMULATOR)} className="bg-slate-900 text-white px-12 py-6 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-800 transition-all shadow-2xl active:scale-95 flex items-center">
                Launch Growth Simulator
                <PlayCircle className="ml-4 text-blue-400" />
              </button>
            </div>
          </div>
        )}

        {step === AppStep.SIMULATOR && aiInsights && (
          <Simulator initialProfile={profile} targetRole={targetRole} simulationAdvice={aiInsights.future_simulation} />
        )}
      </main>
    </div>
  );
};

const VerticalCardList = ({ title, items, accent }: any) => {
  const colors: any = {
    blue: 'border-blue-100 bg-blue-50/30 text-blue-700',
    purple: 'border-purple-100 bg-purple-50/30 text-purple-700',
    emerald: 'border-emerald-100 bg-emerald-50/30 text-emerald-700'
  };
  return (
    <div className="bg-white p-8 rounded-[32px] border border-slate-200/60 shadow-sm">
      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">{title}</h4>
      <div className="space-y-3">
        {items.map((item: string, i: number) => (
          <div key={i} className={`text-[11px] p-4 rounded-2xl border font-bold hover:shadow-md transition-all ${colors[accent]}`}>
            {item}
          </div>
        ))}
      </div>
    </div>
  );
};

const ManualTextInput = ({ onAdd }: { onAdd: (label: string, content: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [content, setContent] = useState('');

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="w-full py-6 border-2 border-dashed border-slate-200 rounded-[32px] text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50/20 transition-all font-bold flex items-center justify-center space-x-3 text-sm active:scale-[0.99]"
      >
        <Plus size={18} />
        <span>MANUAL CONTEXT ENTRY</span>
      </button>
    );
  }

  return (
    <div className="bg-slate-50 p-8 rounded-[32px] border border-blue-200 shadow-xl shadow-blue-500/5 space-y-6 animate-in zoom-in-95 duration-300">
      <div className="flex justify-between items-center">
        <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-blue-600">Context Capture</h4>
        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600"><Minus size={18} /></button>
      </div>
      <div className="space-y-4">
        <input 
          className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-xs font-bold"
          placeholder="SOURCE LABEL (e.g. Resume Summary)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <textarea 
          className="w-full h-40 px-5 py-5 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-xs leading-relaxed font-medium"
          placeholder="Paste or type content here..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>
      <div className="flex pt-2">
        <button 
          onClick={() => { 
            if(label && content) {
              onAdd(label, content);
              setLabel(''); setContent(''); setIsOpen(false);
            }
          }}
          className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-500 transition-all shadow-lg shadow-blue-200 active:scale-95"
        >
          Inject to Analyzer
        </button>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, suffix, color }: any) => (
  <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-200/60 text-center hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">{label}</p>
    <p className={`text-4xl font-black tracking-tighter ${color}`}>{value}{suffix}</p>
  </div>
);

const Simulator = ({ initialProfile, targetRole, simulationAdvice }: { initialProfile: UserProfile, targetRole: string, simulationAdvice: any }) => {
  const [simProfile, setSimProfile] = useState<UserProfile>({ ...initialProfile });
  const simScores = useMemo(() => calculateScores(simProfile), [simProfile]);

  const toggleAchievement = (label: string) => {
    setSimProfile(prev => {
      const metrics = { ...prev.detected_metrics! };
      if (metrics.projects.includes(label)) metrics.projects = metrics.projects.filter(p => p !== label);
      else metrics.projects = [...metrics.projects, label];
      return { ...prev, detected_metrics: metrics };
    });
  };

  const toggleGeneric = (type: 'internships' | 'certifications') => {
    setSimProfile(prev => {
      const metrics = { ...prev.detected_metrics! };
      const placeholder = type === 'internships' ? 'Future Internship' : 'Future Cert';
      if (metrics[type].includes(placeholder)) metrics[type] = metrics[type].filter(i => i !== placeholder);
      else metrics[type] = [...metrics[type], placeholder];
      return { ...prev, detected_metrics: metrics };
    });
  };

  return (
    <div className="animate-in fade-in zoom-in-95 duration-700">
      <div className="bg-slate-900 text-white p-10 md:p-16 rounded-[60px] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-16 opacity-5">
          <PlayCircle size={400} />
        </div>
        
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-20">
          <div>
            <h2 className="text-4xl font-black mb-4 flex items-center tracking-tight">
              Future Simulator <span className="ml-6 px-4 py-1.5 rounded-full bg-blue-600 text-[9px] font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-500/20">Reactive Engine</span>
            </h2>
            <p className="text-slate-400 text-lg mb-12 max-w-md leading-relaxed font-medium">
              Adjust career milestones to synthesize potential readiness trajectories based on the current context.
            </p>

            <div className="space-y-10">
              <div>
                <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-400 mb-6">Maturity Milestone Toggles</h4>
                <div className="flex flex-col space-y-4">
                  {simulationAdvice.if_user_completes.map((item: string, idx: number) => (
                    <button 
                      key={idx}
                      onClick={() => toggleAchievement(item)}
                      className={`flex items-center justify-between p-6 rounded-3xl border-2 transition-all group ${
                        simProfile.detected_metrics?.projects.includes(item) 
                          ? 'bg-blue-600 border-blue-500 text-white shadow-xl shadow-blue-600/30' 
                          : 'bg-white/5 border-white/5 text-slate-400 hover:border-white/20'
                      }`}
                    >
                      <span className="text-sm font-bold tracking-tight">{item}</span>
                      <div className={`p-1.5 rounded-lg border transition-all ${
                        simProfile.detected_metrics?.projects.includes(item) ? 'bg-white text-blue-600 border-white' : 'bg-white/10 border-white/10'
                      }`}>
                         {simProfile.detected_metrics?.projects.includes(item) ? <CheckCircle2 size={16} /> : <Plus size={16} />}
                      </div>
                    </button>
                  ))}
                  
                  <div className="pt-10 border-t border-white/10 space-y-4">
                    <SimulatorToggle label="Relevant Core Internship" isActive={simProfile.detected_metrics!.internships.length > initialProfile.detected_metrics!.internships.length} onToggle={() => toggleGeneric('internships')} />
                    <SimulatorToggle label="Advanced Domain Validation" isActive={simProfile.detected_metrics!.certifications.length > initialProfile.detected_metrics!.certifications.length} onToggle={() => toggleGeneric('certifications')} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center space-y-20">
            <div className="text-center group">
              <div className="relative inline-block cursor-default">
                <div className="text-[160px] font-black leading-none bg-gradient-to-br from-white via-white to-slate-700 bg-clip-text text-transparent transition-all duration-1000 group-hover:scale-105 tracking-tighter">
                  {simScores.overall_score}
                </div>
                <div className="absolute top-4 -right-12 text-6xl font-black text-slate-700 tracking-tighter">%</div>
              </div>
              <p className="text-slate-500 font-black uppercase tracking-[0.5em] mt-6 text-xs">Simulated Readiness</p>
            </div>

            <div className="w-full max-w-sm bg-white/5 p-12 rounded-[56px] border border-white/5 backdrop-blur-xl shadow-2xl relative">
               <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1.5 bg-slate-800 rounded-full border border-white/10">
                 <span className="text-[9px] font-black uppercase tracking-widest text-blue-400">Live Breakdown</span>
               </div>
               <div className="space-y-8">
                 <SimMiniStat label="Skills" value={simScores.skills_score} color="#3b82f6" />
                 <SimMiniStat label="Projects" value={simScores.projects_score} color="#f59e0b" />
                 <SimMiniStat label="Applied" value={simScores.internships_score} color="#a855f7" />
                 <SimMiniStat label="Validators" value={simScores.certifications_score} color="#10b981" />
               </div>
            </div>

            <div className="text-center text-[9px] text-slate-500 max-w-xs font-bold leading-loose uppercase tracking-[0.2em]">
              AI Target Corridor: <span className="text-blue-400 font-black ml-2">{simulationAdvice.expected_score_range}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SimulatorToggle = ({ label, isActive, onToggle }: any) => (
  <button 
    onClick={onToggle}
    className={`flex items-center justify-between p-6 rounded-3xl border-2 transition-all w-full group ${
      isActive ? 'bg-indigo-600 border-indigo-500 text-white shadow-xl shadow-indigo-600/30' : 'bg-white/5 border-white/5 text-slate-400 hover:border-white/20'
    }`}
  >
    <span className="text-sm font-bold tracking-tight">{label}</span>
    <div className={`p-1.5 rounded-lg border transition-all ${
      isActive ? 'bg-white text-indigo-600 border-white' : 'bg-white/10 border-white/10'
    }`}>
      {isActive ? <CheckCircle2 size={16} /> : <Plus size={16} />}
    </div>
  </button>
);

const SimMiniStat = ({ label, value, color }: any) => (
  <div>
    <div className="flex justify-between text-[9px] font-black uppercase mb-4 tracking-widest">
      <span className="text-slate-500">{label}</span>
      <span style={{ color }}>{value}%</span>
    </div>
    <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden p-0.5">
      <div 
        className="h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(255,255,255,0.1)]" 
        style={{ width: `${value}%`, backgroundColor: color, boxShadow: `0 0 20px ${color}44` }} 
      />
    </div>
  </div>
);

export default App;
