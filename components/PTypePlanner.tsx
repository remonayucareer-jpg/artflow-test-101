import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ArrowLeft, 
  Plus, 
  GripVertical, 
  X, 
  Check, 
  ArrowUp, 
  Link, 
  Hourglass, 
  ChevronRight, 
  ChevronLeft, 
  Rocket, 
  Trash2, 
  Edit3, 
  Layout, 
  ChevronUp, 
  ChevronDown,
  Calendar,
  History,
  AlertCircle,
  RefreshCcw,
  Palette,
  Eye,
  Image as ImageIcon,
  Edit2,
  Play,
  Pause,
  RotateCcw,
  Link2Off,
  Link2,
  Save
} from 'lucide-react';
import { PlannerStage, Project, BookingSlot, PlanningSession } from '../types';
import { formatDate, getProjectLineColor } from '../utils';

interface PTypePlannerProps {
  onBack: () => void;
  projects?: Project[];
  bookings?: BookingSlot[];
  onUpdateBookings?: (bookings: BookingSlot[]) => void;
}

const PTypePlanner: React.FC<PTypePlannerProps> = ({ onBack, projects = [], bookings = [] }) => {
  const [mode, setMode] = useState<'dashboard' | 'planner'>('dashboard');
  const [sessions, setSessions] = useState<PlanningSession[]>([]);
  const [viewingSession, setViewingSession] = useState<PlanningSession | null>(null);
  const [planningStep, setPlanningStep] = useState<'setup' | 'off-days' | 'time-entry' | 'finished' | 'micro-action' | 'focus-timer'>('setup');
  
  const [stages, setStages] = useState<PlannerStage[]>([
    { id: '1', title: '草稿' }, { id: '2', title: '线稿' }, { id: '3', title: '上色' }, { id: '4', title: '细节调整' }
  ]);
  
  const [offDayViewDate, setOffDayViewDate] = useState(new Date());
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [editingStageTitle, setEditingStageTitle] = useState('');
  const [showSyncInput, setShowSyncInput] = useState(false);
  const [syncId, setSyncId] = useState('');
  const [syncedProject, setSyncedProject] = useState<Project | null>(null);
  const [activeTimeIndex, setActiveTimeIndex] = useState<number>(-1);
  const [currentInputTime, setCurrentInputTime] = useState('');
  const [estimates, setEstimates] = useState<Record<string, string>>({});
  const [sessionBlockedDates, setSessionBlockedDates] = useState<string[]>([]);
  const [newStageInput, setNewStageInput] = useState('');

  // Micro-action states
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [customAction, setCustomAction] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [timerActive, setTimerActive] = useState(false);
  const timerRef = useRef<number | null>(null);

  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved sessions and draft on mount
  useEffect(() => {
    const storedSessions = localStorage.getItem('artflow_planning_sessions');
    if (storedSessions) setSessions(JSON.parse(storedSessions));

    const storedDraft = localStorage.getItem('artflow_planning_draft');
    if (storedDraft) {
      const draft = JSON.parse(storedDraft);
      setMode(draft.mode || 'dashboard');
      setPlanningStep(draft.planningStep || 'setup');
      setStages(draft.stages || []);
      setEstimates(draft.estimates || {});
      setSessionBlockedDates(draft.sessionBlockedDates || []);
      setActiveTimeIndex(draft.activeTimeIndex ?? -1);
      setCurrentInputTime(draft.currentInputTime || '');
      setSelectedAction(draft.selectedAction || '');
      setCustomAction(draft.customAction || '');
      setTimeLeft(draft.timeLeft ?? 600);
      
      if (draft.syncedProjectId && projects) {
        const proj = projects.find(p => p.id === draft.syncedProjectId);
        if (proj) setSyncedProject(proj);
      }
    }
    setIsLoaded(true);
  }, []); // Only run once on mount

  // Save draft whenever state changes (after initial load)
  useEffect(() => {
    if (!isLoaded) return;

    const draft = {
      mode,
      planningStep,
      stages,
      estimates,
      sessionBlockedDates,
      activeTimeIndex,
      currentInputTime,
      selectedAction,
      customAction,
      timeLeft,
      syncedProjectId: syncedProject?.id
    };
    localStorage.setItem('artflow_planning_draft', JSON.stringify(draft));
  }, [
    mode, 
    planningStep, 
    stages, 
    estimates, 
    sessionBlockedDates, 
    activeTimeIndex, 
    currentInputTime, 
    selectedAction, 
    customAction, 
    timeLeft, 
    syncedProject, 
    isLoaded
  ]);

  useEffect(() => {
    if (timerActive && timeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (timeLeft === 0) setTimerActive(false);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerActive, timeLeft]);

  const persistSessions = (newSessions: PlanningSession[]) => {
      localStorage.setItem('artflow_planning_sessions', JSON.stringify(newSessions));
      setSessions(newSessions);
  };

  const getYYYYMMDD = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getProjectsOnDate = (dateStr: string) => {
    const targetDate = new Date(dateStr + 'T00:00:00'); 
    return projects.filter(p => {
       if (p.status === 'completed') return false;
       const startDay = new Date(new Date(p.startDate).setHours(0,0,0,0));
       const endDay = new Date(new Date(p.deadline).setHours(0,0,0,0));
       return targetDate >= startDay && targetDate <= endDay;
    });
  };

  const totalAvailableDays = useMemo(() => {
    if (!syncedProject) return 30; 
    const start = new Date(syncedProject.startDate);
    const end = new Date(syncedProject.deadline);
    let count = 0; let curr = new Date(start);
    while (curr <= end) {
      const dStr = getYYYYMMDD(curr);
      const isBlocked = bookings?.some(b => b.date === dStr && (b.status === 'blocked' || b.status === 'booked')) || sessionBlockedDates.includes(dStr);
      if (!isBlocked) count++;
      curr.setDate(curr.getDate() + 1);
    }
    return count;
  }, [syncedProject, bookings, sessionBlockedDates]);

  const currentPlannedDays = useMemo(() => {
    return (Object.values(estimates) as string[]).reduce((a, b) => a + (Number(b) || 0), 0);
  }, [estimates]);

  const remainingDays = totalAvailableDays - currentPlannedDays;

  const validateAndProceed = (stageId: string, inputVal: string, currentIndex: number) => {
    const newVal = Number(inputVal) || 0;
    const oldVal = Number(estimates[stageId]) || 0;
    
    if (newVal < 0 || isNaN(newVal)) {
        alert("请输入有效的工期天数。");
        return;
    }

    const potentialRemaining = remainingDays + oldVal - newVal;

    if (potentialRemaining < 0) {
        alert(`❌ 预估工期已超出实际可用时间！\n\n当前阶段预估: ${newVal} 天\n剩余总可用: ${remainingDays + oldVal} 天\n\n请重新判断自己的工期，合理分配创作节奏。`);
        return;
    }

    setEstimates(prev => ({...prev, [stageId]: inputVal}));
    
    if (currentIndex > 0) {
      const nextIdx = currentIndex - 1;
      setActiveTimeIndex(nextIdx);
      setCurrentInputTime(estimates[stages[nextIdx].id] || '');
    } else {
      const allFilled = stages.every(s => estimates[s.id] || s.id === stageId);
      if (allFilled) {
        setActiveTimeIndex(-1);
        setPlanningStep('finished');
      } else {
        setActiveTimeIndex(-1);
      }
    }
  };

  const moveStageUp = (index: number) => {
    if (index === 0) return;
    const newStages = [...stages];
    [newStages[index - 1], newStages[index]] = [newStages[index], newStages[index - 1]];
    setStages(newStages);
  };

  const moveStageDown = (index: number) => {
    if (index === stages.length - 1) return;
    const newStages = [...stages];
    [newStages[index + 1], newStages[index]] = [newStages[index], newStages[index + 1]];
    setStages(newStages);
  };

  const handleAddStage = () => {
    if (!newStageInput.trim()) return;
    setStages([...stages, { id: Date.now().toString(), title: newStageInput.trim() }]);
    setNewStageInput('');
  };

  const startEditStage = (stage: PlannerStage) => {
    setEditingStageId(stage.id);
    setEditingStageTitle(stage.title);
  };

  const saveStageEdit = () => {
    if (!editingStageId) return;
    setStages(stages.map(s => s.id === editingStageId ? { ...s, title: editingStageTitle } : s));
    setEditingStageId(null);
  };

  const handleCreateNew = () => {
      // Clear draft explicitly
      localStorage.removeItem('artflow_planning_draft');
      
      setMode('planner'); 
      setPlanningStep('setup'); 
      setSyncedProject(null);
      setEstimates({}); 
      setSessionBlockedDates([]);
      setShowSyncInput(false);
      setSyncId('');
      setStages([{ id: '1', title: '草稿' }, { id: '2', title: '线稿' }, { id: '3', title: '上色' }, { id: '4', title: '细节调整' }]);
      setSelectedAction('');
      setCustomAction('');
      setTimeLeft(600);
      setTimerActive(false);
  };

  const handleFinalize = () => {
      const newSession: PlanningSession = {
          id: Date.now().toString(), projectId: syncedProject?.id,
          clientName: syncedProject ? syncedProject.clientName : '未命名规划',
          stages, estimates, blockedDates: sessionBlockedDates,
          createdAt: new Date().toISOString(), lastUpdated: new Date().toISOString(), completedDays: [],
      };
      persistSessions([newSession, ...sessions]);
      
      // Clear draft after completion
      localStorage.removeItem('artflow_planning_draft');
      
      setMode('dashboard'); setPlanningStep('setup');
      setTimerActive(false); setTimeLeft(600);
      setSyncedProject(null);
      setEstimates({});
      setStages([{ id: '1', title: '草稿' }, { id: '2', title: '线稿' }, { id: '3', title: '上色' }, { id: '4', title: '细节调整' }]);
  };

  const handleSyncProject = () => {
    const p = projects?.find(pr => pr.id === syncId);
    if (p) {
      setSyncedProject(p);
      setShowSyncInput(false);
    } else {
      alert('未找到该 ID 的排单项目，请检查 ID 是否正确。');
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (mode === 'dashboard') {
    return (
      <div className="animate-fade-in space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">辅助规划</h2>
            <p className="text-slate-400 font-medium">克服拖延，从微小的第一步开始</p>
          </div>
          {planningStep !== 'setup' && (
            <button 
              onClick={() => setMode('planner')} 
              className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-black hover:bg-indigo-100 transition-all border border-indigo-100"
            >
              <History size={14}/> 继续上次进度
            </button>
          )}
        </div>

        {viewingSession ? (
          <div className="bg-white rounded-[3rem] p-10 shadow-xl border border-slate-100 animate-slide-up">
            <button onClick={() => setViewingSession(null)} className="flex items-center text-indigo-600 mb-8 text-sm font-black hover:translate-x-1 transition-transform">
              <ArrowLeft size={16} className="mr-2" /> 返回规划列表
            </button>
            <div className="flex flex-col md:flex-row justify-between gap-8">
              <div className="flex-1">
                <h3 className="text-4xl font-black text-slate-900 mb-2">{viewingSession.clientName}</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-10">规划时间: {formatDate(viewingSession.createdAt)}</p>
                <div className="space-y-4">
                  {viewingSession.stages.map(s => (
                    <div key={s.id} className="flex justify-between items-center p-6 bg-slate-50 rounded-3xl">
                      <span className="font-black text-slate-700">{s.title}</span>
                      <span className="bg-white px-4 py-2 rounded-xl font-black text-indigo-600 shadow-sm">{viewingSession.estimates[s.id]} 天</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="w-full md:w-80 bg-slate-900 rounded-[2.5rem] p-8 text-white">
                <h4 className="font-black text-lg mb-4">规划概览</h4>
                <div className="space-y-4 opacity-70">
                   <div className="flex justify-between text-sm"><span>阶段总数</span><span>{viewingSession.stages.length}</span></div>
                   <div className="flex justify-between text-sm"><span>总预算工期</span><span>{(Object.values(viewingSession.estimates) as string[]).reduce((a,b)=>a+Number(b),0)} 天</span></div>
                   <div className="flex justify-between text-sm"><span>休息日设置</span><span>{viewingSession.blockedDates.length} 天</span></div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <button onClick={handleCreateNew} className="xl:col-span-1 bg-white border-4 border-dashed border-slate-200 rounded-[3rem] p-12 flex flex-col items-center justify-center gap-6 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all group">
               <div className="bg-slate-100 p-6 rounded-[2rem] text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all"><Plus size={48}/></div>
               <div className="text-center">
                 <h4 className="text-xl font-black text-slate-800">创建新规划</h4>
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Start Brainstorming</p>
               </div>
            </button>

            <div className="xl:col-span-2 space-y-4">
              <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">已保存的规划 ({sessions.length})</h5>
              {sessions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sessions.map(s => (
                    <div key={s.id} onClick={() => setViewingSession(s)} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600"><Layout size={24}/></div>
                        <div>
                          <h4 className="font-black text-slate-800 group-hover:text-indigo-600 transition-colors">{s.clientName}</h4>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">{s.stages.length} 阶段 · {formatDate(s.createdAt)}</p>
                        </div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); if(confirm('删除规划？')) persistSessions(sessions.filter(ses => ses.id !== s.id)); }} className="p-2 text-slate-200 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={18}/></button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-slate-300 font-bold border-2 border-dashed border-slate-100 rounded-[2.5rem]">暂无记录</div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-32 animate-fade-in">
       {planningStep !== 'focus-timer' && (
         <button onClick={() => setMode('dashboard')} className="flex items-center text-slate-400 mb-8 font-black hover:text-slate-900 transition-colors"><ArrowLeft size={18} className="mr-2" /> 返回规划大厅</button>
       )}
       
       <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden min-h-[600px] flex flex-col">
          {(planningStep !== 'micro-action' && planningStep !== 'focus-timer') && (
            <div className="bg-slate-900 p-10 text-white relative shrink-0">
               <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
               <div className="relative z-10">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h2 className="text-3xl font-black tracking-tight">{syncedProject ? syncedProject.clientName : '自定义创作节奏'}</h2>
                        {syncedProject && (
                          <span className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-lg text-[10px] font-black border border-indigo-500/30 flex items-center gap-1">
                            <Link2 size={12}/> ID: {syncedProject.id}
                          </span>
                        )}
                        <span className="ml-2 flex items-center gap-1 text-[10px] font-bold text-white/40"><Save size={10}/> 实时自动保存</span>
                      </div>
                      <p className="text-slate-400 font-medium text-sm">
                        {planningStep === 'setup' ? '灵活定义和排序你的绘画阶段' : planningStep === 'off-days' ? '标记你的休息日（灰色条带代表已有工单）' : '倒推法分配工期：点击任意卡片可重新调整'}
                      </p>
                    </div>

                    {planningStep === 'setup' && (
                      <div className="flex gap-2">
                        {syncedProject && (
                           <button onClick={() => setSyncedProject(null)} className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 px-4 py-3 rounded-2xl text-xs font-black flex items-center gap-2 transition-all border border-rose-500/20">
                              <Link2Off size={16}/> 解除关联
                           </button>
                        )}
                        <button onClick={() => setShowSyncInput(!showSyncInput)} className={`px-6 py-3 rounded-2xl text-xs font-black flex items-center gap-2 transition-all border ${showSyncInput ? 'bg-white text-slate-900 border-white' : 'bg-white/10 hover:bg-white/20 text-white border-white/20'}`}>
                           <Link size={16}/> {showSyncInput ? '收起面板' : syncedProject ? '更换关联项目' : '关联现有排单项目'}
                        </button>
                      </div>
                    )}
                  </div>

                  {showSyncInput && planningStep === 'setup' && (
                    <div className="mt-8 p-6 bg-white/5 border border-white/10 rounded-[2rem] flex flex-col md:flex-row gap-3 animate-slide-up">
                      <div className="flex-1 relative">
                        <input 
                          autoFocus 
                          type="text" 
                          value={syncId} 
                          onChange={(e) => setSyncId(e.target.value)} 
                          onKeyDown={(e) => e.key === 'Enter' && handleSyncProject()}
                          placeholder="输入排单 ID (例如: 17123456789...)" 
                          className="w-full bg-slate-800/50 border border-white/10 rounded-2xl pl-5 pr-5 py-4 text-sm text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-white/20" 
                        />
                      </div>
                      <button 
                        onClick={handleSyncProject}
                        className="bg-indigo-500 hover:bg-indigo-600 text-white px-10 py-4 rounded-2xl text-sm font-black transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                      >
                        确认同步
                      </button>
                    </div>
                  )}
               </div>
            </div>
          )}

          <div className="p-8 md:p-12 flex-1 flex flex-col">
            {planningStep === 'setup' && (
              <div className="space-y-6">
                 <div className="space-y-3">
                   {stages.map((s, idx) => (
                     <div key={s.id} className="bg-slate-50 p-5 rounded-[2rem] flex items-center justify-between group border-2 border-transparent hover:border-indigo-100 transition-all">
                        <div className="flex items-center gap-4 flex-1">
                           <div className="flex flex-col gap-1">
                              <button onClick={() => moveStageUp(idx)} disabled={idx === 0} className={`text-slate-300 hover:text-indigo-600 transition-colors ${idx === 0 ? 'opacity-20 cursor-not-allowed' : ''}`}><ChevronUp size={16}/></button>
                              <button onClick={() => moveStageDown(idx)} disabled={idx === stages.length - 1} className={`text-slate-300 hover:text-indigo-600 transition-colors ${idx === stages.length - 1 ? 'opacity-20 cursor-not-allowed' : ''}`}><ChevronDown size={16}/></button>
                           </div>
                           <span className="text-xs font-black text-slate-300">0{idx+1}</span>
                           {editingStageId === s.id ? (
                             <div className="flex items-center gap-2 flex-1">
                                <input autoFocus value={editingStageTitle} onChange={e => setEditingStageTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveStageEdit()} className="flex-1 bg-white border border-indigo-200 rounded-xl px-3 py-1.5 text-sm font-black text-indigo-600 outline-none" />
                                <button onClick={saveStageEdit} className="text-emerald-500 hover:bg-emerald-50 p-1.5 rounded-lg"><Check size={18}/></button>
                             </div>
                           ) : (
                             <span className="font-black text-slate-700">{s.title}</span>
                           )}
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                           <button onClick={() => startEditStage(s)} className="text-slate-400 hover:text-indigo-600 p-2"><Edit3 size={18}/></button>
                           <button onClick={() => setStages(stages.filter(st => st.id !== s.id))} className="text-slate-400 hover:text-rose-500 p-2"><Trash2 size={18}/></button>
                        </div>
                     </div>
                   ))}
                 </div>
                 <div className="flex gap-3 pt-4 border-t border-slate-100">
                    <input type="text" value={newStageInput} onChange={e => setNewStageInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddStage()} placeholder="输入新的阶段名称..." className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
                    <button onClick={handleAddStage} className="bg-white border-2 border-indigo-500 text-indigo-600 px-6 py-4 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-indigo-50 transition-all">
                       <Plus size={20}/> 添加阶段
                    </button>
                 </div>
                 <button onClick={() => setPlanningStep('off-days')} className="w-full mt-10 bg-slate-900 text-white py-5 rounded-[2rem] font-black text-lg hover:bg-slate-800 transition-all shadow-xl shadow-slate-100">确认阶段，去设置休息日</button>
              </div>
            )}

            {planningStep === 'off-days' && (
              <div className="space-y-8">
                 <div className="flex justify-between items-center px-4">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm"><Calendar size={20}/></div>
                        <h4 className="text-2xl font-black text-slate-800 tracking-tight">{offDayViewDate.toLocaleString('zh-CN', {month:'long', year:'numeric'})}</h4>
                    </div>
                    <div className="flex gap-2 bg-slate-50 p-1 rounded-xl">
                       <button onClick={() => setOffDayViewDate(new Date(offDayViewDate.getFullYear(), offDayViewDate.getMonth()-1, 1))} className="p-3 bg-white shadow-sm rounded-lg hover:text-indigo-600 transition-all"><ChevronLeft size={20}/></button>
                       <button onClick={() => setOffDayViewDate(new Date(offDayViewDate.getFullYear(), offDayViewDate.getMonth()+1, 1))} className="p-3 bg-white shadow-sm rounded-lg hover:text-indigo-600 transition-all"><ChevronRight size={20}/></button>
                    </div>
                 </div>
                 <div className="grid grid-cols-7 gap-3">
                    {['日','一','二','三','四','五','六'].map(d => <div key={d} className="text-center text-[10px] font-black text-slate-300 uppercase py-2">{d}</div>)}
                    {Array.from({length: new Date(offDayViewDate.getFullYear(), offDayViewDate.getMonth(), 1).getDay()}).map((_, i) => <div key={`e-${i}`} className="bg-slate-50/30 rounded-2xl" />)}
                    {Array.from({length: new Date(offDayViewDate.getFullYear(), offDayViewDate.getMonth()+1, 0).getDate()}).map((_, i) => {
                       const d = new Date(offDayViewDate.getFullYear(), offDayViewDate.getMonth(), i+1);
                       const dStr = getYYYYMMDD(d);
                       const isSel = sessionBlockedDates.includes(dStr);
                       const projectsOnDay = getProjectsOnDate(dStr);
                       return (
                        <div key={dStr} onClick={() => setSessionBlockedDates(isSel ? sessionBlockedDates.filter(x=>x!==dStr) : [...sessionBlockedDates, dStr])} className={`aspect-square rounded-2xl flex flex-col items-center justify-center font-black cursor-pointer transition-all border-2 relative overflow-hidden group ${isSel ? 'bg-rose-500 border-rose-600 text-white shadow-lg shadow-rose-100' : 'bg-white border-slate-50 text-slate-700 hover:border-indigo-100 hover:bg-slate-50 shadow-sm'}`}>
                          <span className="z-10">{i+1}</span>
                          {!isSel && projectsOnDay.length > 0 && (
                            <div className="absolute bottom-1.5 left-0 w-full px-1.5 flex flex-col gap-0.5">
                              {projectsOnDay.map(p => (
                                <div key={p.id} className={`h-1 w-full rounded-full ${getProjectLineColor(p.startDate, p.deadline)}`} />
                              ))}
                            </div>
                          )}
                        </div>
                       )
                    })}
                 </div>
                 <button onClick={() => { setPlanningStep('time-entry'); setActiveTimeIndex(stages.length - 1); }} className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black text-lg shadow-xl hover:bg-slate-800 transition-all">确认休息，开始“倒推”工期</button>
              </div>
            )}

            {planningStep === 'time-entry' && (
              <div className="space-y-10">
                 <div className="bg-indigo-600 p-8 rounded-[2.5rem] shadow-xl shadow-indigo-100 flex items-center justify-between text-white transition-all">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1"><History size={14} className="opacity-60" /><span className="text-[10px] font-black uppercase tracking-widest opacity-60">倒推预估：工期预算余额</span></div>
                      <div className="flex items-baseline gap-2"><span className={`text-5xl font-black ${remainingDays < 0 ? 'text-rose-300 animate-pulse' : remainingDays === 0 ? 'text-rose-200' : 'text-white'}`}>{remainingDays}</span><span className="text-sm font-bold opacity-40">/ {totalAvailableDays} 天</span></div>
                    </div>
                 </div>
                 <div className="space-y-6">
                    {stages.map((s, idx) => (
                       <div key={s.id} onClick={() => { if (activeTimeIndex !== idx) { setActiveTimeIndex(idx); setCurrentInputTime(estimates[s.id] || ''); } }} className={`p-8 rounded-[2.5rem] border-2 transition-all cursor-pointer ${activeTimeIndex === idx ? 'bg-white border-indigo-500 shadow-2xl scale-105' : 'bg-slate-50 border-transparent hover:border-slate-200 opacity-60'}`}>
                          <div className="flex justify-between items-center mb-4">
                             <div className="flex items-center gap-3"><span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${activeTimeIndex === idx ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'}`}>{idx + 1}</span><span className="font-black text-slate-800 text-xl">{s.title}</span></div>
                             {estimates[s.id] && <span className={`${activeTimeIndex === idx ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-600'} px-4 py-1.5 rounded-full text-xs font-black`}>{estimates[s.id]} 天</span>}
                          </div>
                          {activeTimeIndex === idx && (
                             <div className="flex items-center gap-4 animate-fade-in" onClick={e => e.stopPropagation()}>
                                <input autoFocus type="number" value={currentInputTime} onChange={e => setCurrentInputTime(e.target.value)} placeholder="几天？" className="flex-1 bg-slate-100 rounded-2xl px-6 py-4 font-black text-indigo-600 outline-none" onKeyDown={e => e.key === 'Enter' && validateAndProceed(s.id, currentInputTime, idx)} />
                                <button onClick={() => validateAndProceed(s.id, currentInputTime, idx)} className="bg-slate-900 text-white p-4 rounded-2xl hover:bg-slate-800 transition-all"><ArrowUp size={24}/></button>
                             </div>
                          )}
                       </div>
                    ))}
                 </div>
              </div>
            )}

            {planningStep === 'finished' && (
              <div className="text-center py-10 flex-1 flex flex-col justify-center animate-fade-in">
                 <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-50"><Check size={48} strokeWidth={3}/></div>
                 <h3 className="text-3xl font-black text-slate-900 mb-2">倒推规划已就绪</h3>
                 <p className="text-slate-400 font-medium mb-12">从结果出发，创作不再心虚</p>
                 <div className="flex flex-col md:flex-row justify-center gap-4">
                    <button onClick={() => setPlanningStep('time-entry')} className="px-8 py-5 rounded-[2rem] font-black text-slate-500 hover:bg-slate-50 transition-all">重新检查工期</button>
                    <button onClick={() => setPlanningStep('micro-action')} className="bg-slate-900 text-white px-12 py-5 rounded-[2rem] font-black text-xl hover:bg-slate-800 shadow-2xl shadow-slate-200 transition-all flex items-center gap-3">
                        <Rocket size={24}/> 开启第一步
                    </button>
                 </div>
              </div>
            )}

            {planningStep === 'micro-action' && (
              <div className="flex-1 flex flex-col animate-fade-in">
                 <div className="mb-10">
                    <h3 className="text-3xl font-black text-slate-900">万事开头难</h3>
                    <p className="text-slate-400 font-medium">选一个只需 10 分钟的小行动，立刻打破僵局</p>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                    {[
                      { id: 'canvas', icon: <Palette/>, title: '打开画布画五笔', desc: '不求完美，只求动笔' },
                      { id: 'requirement', icon: <Eye/>, title: '再看一次单主需求', desc: '确认细节，减少返工' },
                      { id: 'ref', icon: <ImageIcon/>, title: '找点参考图', desc: '激发灵感，构建画面' },
                    ].map(act => (
                      <button 
                        key={act.id} 
                        onClick={() => { setSelectedAction(act.title); setPlanningStep('focus-timer'); }}
                        className="bg-slate-50 p-6 rounded-[2.5rem] border-2 border-transparent hover:border-indigo-500 hover:bg-white transition-all text-left group"
                      >
                         <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 shadow-sm mb-4 transition-colors">{act.icon}</div>
                         <h4 className="font-black text-slate-800 text-lg">{act.title}</h4>
                         <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">{act.desc}</p>
                      </button>
                    ))}
                    <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white flex flex-col justify-between">
                       <div>
                         <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mb-4"><Edit2 size={20}/></div>
                         <h4 className="font-black text-lg">自定义微行动</h4>
                         <input 
                            type="text" 
                            value={customAction} 
                            onChange={e => setCustomAction(e.target.value)}
                            placeholder="输入你想做的..." 
                            className="w-full bg-transparent border-b border-white/20 py-3 text-sm outline-none focus:border-white transition-all mt-4 placeholder:text-white/30"
                         />
                       </div>
                       <button 
                        disabled={!customAction.trim()}
                        onClick={() => { setSelectedAction(customAction); setPlanningStep('focus-timer'); }}
                        className="mt-6 bg-white text-slate-900 py-4 rounded-2xl font-black text-sm hover:bg-indigo-50 transition-all disabled:opacity-30"
                       >
                         设定该任务
                       </button>
                    </div>
                 </div>
              </div>
            )}

            {planningStep === 'focus-timer' && (
              <div className="flex-1 flex flex-col items-center justify-center animate-fade-in relative">
                 <button onClick={() => setPlanningStep('micro-action')} className="absolute top-0 left-0 text-slate-400 hover:text-slate-900 font-black flex items-center gap-2"><ArrowLeft size={18}/> 换个任务</button>
                 
                 <div className="text-center space-y-2 mb-12">
                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em]">Focusing On</span>
                    <h3 className="text-4xl font-black text-slate-900">{selectedAction}</h3>
                 </div>

                 <div className="relative w-72 h-72 flex items-center justify-center">
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                       <circle cx="144" cy="144" r="130" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                       <circle 
                          cx="144" cy="144" r="130" fill="none" stroke="#4f46e5" strokeWidth="12" 
                          strokeDasharray={816} 
                          strokeDashoffset={816 * (timeLeft / 600)} 
                          className="transition-all duration-1000 ease-linear"
                          strokeLinecap="round"
                       />
                    </svg>
                    <div className="text-7xl font-black tabular-nums tracking-tighter text-slate-900 animate-pulse-subtle">
                       {formatTime(timeLeft)}
                    </div>
                 </div>

                 <div className="mt-16 flex items-center gap-6">
                    {!timerActive ? (
                      <button 
                        onClick={() => setTimerActive(true)}
                        className="bg-slate-900 text-white px-12 py-5 rounded-[2.5rem] font-black text-xl flex items-center gap-3 hover:bg-slate-800 shadow-2xl shadow-slate-200 active:scale-95 transition-all"
                      >
                        <Play size={24} fill="currentColor"/> 开始吧
                      </button>
                    ) : (
                      <button 
                        onClick={() => setTimerActive(false)}
                        className="bg-white border-4 border-slate-900 text-slate-900 px-12 py-5 rounded-[2.5rem] font-black text-xl flex items-center gap-3 hover:bg-slate-50 active:scale-95 transition-all"
                      >
                        <Pause size={24} fill="currentColor"/> 暂停下
                      </button>
                    )}
                    
                    {timeLeft < 600 && !timerActive && (
                      <button onClick={() => { setTimeLeft(600); setTimerActive(false); }} className="p-5 bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-all">
                        <RotateCcw size={24}/>
                      </button>
                    )}
                 </div>

                 {timeLeft === 0 && (
                   <div className="mt-12 animate-slide-up">
                      <p className="text-emerald-600 font-black text-lg mb-4">🎉 太棒了！你已经完成了第一步！</p>
                      <button onClick={handleFinalize} className="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black hover:bg-emerald-700 transition-all">完成规划并开始创作</button>
                   </div>
                 )}
              </div>
            )}
          </div>
       </div>
    </div>
  );
};

export default PTypePlanner;