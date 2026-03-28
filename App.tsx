import React, { useState, useEffect } from 'react';
import { Project, BookingSlot, ViewMode, Achievement } from './types';
import ProjectCard from './components/ProjectCard';
import ScheduleBoard from './components/ScheduleBoard';
import PTypePlanner from './components/PTypePlanner';
import { generateArtistId, generateClientId } from './utils';
import { 
  Layout, 
  Plus, 
  CalendarDays, 
  Paintbrush, 
  X,
  Copy,
  UserCircle2,
  CheckCircle2,
  BrainCircuit,
  ListTodo,
  Coins
} from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'projects' | 'schedule' | 'planning'>('projects');
  const [projectSubTab, setProjectSubTab] = useState<'active' | 'completed'>('active');
  
  const [viewMode, setViewMode] = useState<ViewMode>('artist');
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Identity State
  const [myArtistId, setMyArtistId] = useState<string>('');
  const [myClientId, setMyClientId] = useState<string>('');
  const [searchId, setSearchId] = useState('');
  const [connectedArtistId, setConnectedArtistId] = useState<string | null>(null);

  // Data State
  const [projects, setProjects] = useState<Project[]>([]);
  const [bookings, setBookings] = useState<BookingSlot[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  // New/Edit Project Form State
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [newProject, setNewProject] = useState<Partial<Project>>({
    clientName: '',
    targetClientId: '', 
    description: '',
    amount: '',
    startDate: '',
    deadline: ''
  });

  // Initialization
  useEffect(() => {
    const storedArtistId = localStorage.getItem('artflow_artist_id');
    if (storedArtistId) {
      setMyArtistId(storedArtistId);
    } else {
      const newId = generateArtistId();
      localStorage.setItem('artflow_artist_id', newId);
      setMyArtistId(newId);
    }

    const storedClientId = localStorage.getItem('artflow_client_id');
    if (storedClientId) {
      setMyClientId(storedClientId);
    } else {
      const newId = generateClientId();
      localStorage.setItem('artflow_client_id', newId);
      setMyClientId(newId);
    }

    const storedConnectedId = localStorage.getItem('artflow_connected_artist_id');
    if (storedConnectedId) setConnectedArtistId(storedConnectedId);
  }, []);

  const currentDataId = viewMode === 'artist' ? myArtistId : connectedArtistId;

  useEffect(() => {
    if (!currentDataId) {
      setProjects([]);
      setBookings([]);
      setAchievements([]);
      return;
    }
    const storedProjects = localStorage.getItem(`artflow_data_${currentDataId}_projects`);
    const storedBookings = localStorage.getItem(`artflow_data_${currentDataId}_bookings`);
    const storedAchievements = localStorage.getItem(`artflow_data_${currentDataId}_achievements`);
    
    setProjects(storedProjects ? JSON.parse(storedProjects) : []);
    setBookings(storedBookings ? JSON.parse(storedBookings) : []);
    setAchievements(storedAchievements ? JSON.parse(storedAchievements) : []);
  }, [currentDataId, viewMode]);

  useEffect(() => {
    if (currentDataId && viewMode === 'artist') {
      localStorage.setItem(`artflow_data_${currentDataId}_projects`, JSON.stringify(projects));
      localStorage.setItem(`artflow_data_${currentDataId}_bookings`, JSON.stringify(bookings));
      localStorage.setItem(`artflow_data_${currentDataId}_achievements`, JSON.stringify(achievements));
    }
  }, [projects, bookings, achievements, currentDataId, viewMode]);

  const handleSearchArtist = () => {
    if (!searchId.trim()) return;
    setConnectedArtistId(searchId);
    localStorage.setItem('artflow_connected_artist_id', searchId);
  };

  const handleDisconnect = () => {
    setConnectedArtistId(null);
    setSearchId('');
    localStorage.removeItem('artflow_connected_artist_id');
  };

  const handleSaveProject = () => {
    if (!newProject.clientName || !newProject.startDate || !newProject.deadline) return;
    if (editingProjectId) {
      setProjects(projects.map(p => p.id === editingProjectId ? {
          ...p,
          clientName: newProject.clientName!,
          targetClientId: newProject.targetClientId || '',
          description: newProject.description || '',
          amount: newProject.amount || '',
          startDate: newProject.startDate!,
          deadline: newProject.deadline!
      } : p));
    } else {
      const project: Project = {
        id: Date.now().toString(),
        clientName: newProject.clientName!,
        targetClientId: newProject.targetClientId || '', 
        description: newProject.description || '无具体描述',
        amount: newProject.amount || '',
        startDate: newProject.startDate!,
        deadline: newProject.deadline!,
        status: 'pending'
      };
      setProjects([...projects, project]);
    }
    handleCloseModal();
  };

  const handleEditProject = (project: Project) => {
    setNewProject({ ...project });
    setEditingProjectId(project.id);
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingProjectId(null);
    setNewProject({ clientName: '', targetClientId: '', description: '', amount: '', startDate: '', deadline: '' });
  };

  const handleCompleteProject = (id: string) => {
    setProjects(projects.map(p => p.id === id ? { ...p, status: 'completed' } : p));
  };

  const handleDeleteProject = (id: string) => {
    if(confirm('确定要删除这个项目吗？')) {
        setProjects(prevProjects => prevProjects.filter(p => p.id !== id));
    }
  };

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    alert(`${label} 已复制`);
  };

  const toggleViewMode = () => {
    const newMode = viewMode === 'artist' ? 'client' : 'artist';
    setViewMode(newMode);
    if (newMode === 'artist') handleDisconnect();
  };

  const allVisibleProjects = viewMode === 'artist' 
    ? projects 
    : projects.filter(p => p.targetClientId === myClientId);

  const displayedProjects = allVisibleProjects.filter(p => {
    if (projectSubTab === 'active') return p.status !== 'completed';
    if (projectSubTab === 'completed') return p.status === 'completed';
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f8fafc] text-slate-800">
      
      {/* PC Side Navigation */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 sticky top-0 h-screen z-40">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-gradient-to-tr from-indigo-600 to-violet-600 text-white p-2 rounded-xl">
            <Paintbrush size={24} />
          </div>
          <h1 className="text-xl font-black tracking-tight text-slate-900">ArtFlow</h1>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <button onClick={() => setActiveTab('projects')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'projects' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}>
            <Layout size={20} /> 排单工单
          </button>
          <button onClick={() => setActiveTab('schedule')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'schedule' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}>
            <CalendarDays size={20} /> 排期日历
          </button>
          {viewMode === 'artist' && (
            <button onClick={() => setActiveTab('planning')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'planning' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}>
              <BrainCircuit size={20} /> 辅助规划
            </button>
          )}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase">当前角色</span>
              <button onClick={toggleViewMode} className="text-[10px] font-black text-indigo-600 hover:underline">切换</button>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                {viewMode === 'artist' ? <Paintbrush size={16} /> : <UserCircle2 size={16} />}
              </div>
              <div>
                <p className="text-xs font-bold">{viewMode === 'artist' ? '画手' : '单主'}</p>
                <p className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]">{viewMode === 'artist' ? myArtistId : (connectedArtistId || '未连接')}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-100 px-5 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Paintbrush size={20} className="text-indigo-600" />
          <h1 className="text-base font-bold text-slate-900">ArtFlow</h1>
        </div>
        <button onClick={toggleViewMode} className="text-xs font-black bg-slate-900 text-white px-3 py-1.5 rounded-full">
          {viewMode === 'artist' ? '画手' : '单主'}
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 min-h-screen overflow-x-hidden p-5 md:p-8">
        {activeTab === 'projects' && (
          <div className="space-y-6 animate-fade-in max-w-screen-2xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-slate-800">{viewMode === 'artist' ? '所有工单' : '我的约稿'}</h2>
                <p className="text-slate-400 text-sm font-medium">共计 {displayedProjects.length} 个项目</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex p-1 bg-slate-200/50 rounded-xl w-fit">
                  <button onClick={() => setProjectSubTab('active')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${projectSubTab === 'active' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>进行中</button>
                  <button onClick={() => setProjectSubTab('completed')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${projectSubTab === 'completed' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}>已完成</button>
                </div>
                {viewMode === 'artist' && (
                  <button onClick={() => setShowAddModal(true)} className="bg-slate-900 text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 hover:opacity-90 shadow-lg">
                    <Plus size={18} /> 新建排单
                  </button>
                )}
              </div>
            </div>

            {displayedProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
                <ListTodo size={48} className="text-slate-200 mb-4" />
                <p className="text-slate-400 font-bold">暂无工单记录</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {displayedProjects.map(project => (
                  <ProjectCard key={project.id} project={project} onComplete={handleCompleteProject} onDelete={handleDeleteProject} onEdit={handleEditProject} readOnly={viewMode === 'client'} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="animate-fade-in max-w-screen-2xl mx-auto">
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
              <ScheduleBoard bookings={bookings} projects={projects} achievements={achievements} mode={viewMode} onUpdateBookings={setBookings} onUpdateAchievements={setAchievements} currentClientId={viewMode === 'client' ? myClientId : undefined} />
            </div>
          </div>
        )}

        {activeTab === 'planning' && viewMode === 'artist' && (
          <div className="animate-fade-in max-w-4xl mx-auto">
            <PTypePlanner onBack={() => setActiveTab('projects')} projects={projects} bookings={bookings} />
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t pb-[env(safe-area-inset-bottom)] z-40 flex justify-around items-center h-16 shadow-lg">
        <button onClick={() => setActiveTab('projects')} className={`flex flex-col items-center gap-1 ${activeTab === 'projects' ? 'text-indigo-600' : 'text-slate-400'}`}>
          <Layout size={20} /> <span className="text-[10px] font-bold">工单</span>
        </button>
        <button onClick={() => setActiveTab('schedule')} className={`flex flex-col items-center gap-1 ${activeTab === 'schedule' ? 'text-indigo-600' : 'text-slate-400'}`}>
          <CalendarDays size={20} /> <span className="text-[10px] font-bold">排期</span>
        </button>
        {viewMode === 'artist' && (
          <button onClick={() => setActiveTab('planning')} className={`flex flex-col items-center gap-1 ${activeTab === 'planning' ? 'text-indigo-600' : 'text-slate-400'}`}>
            <BrainCircuit size={20} /> <span className="text-[10px] font-bold">规划</span>
          </button>
        )}
      </nav>

      {/* New Project Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="absolute inset-0" onClick={handleCloseModal}></div>
          <div className="relative bg-white w-full max-w-xl rounded-[2.5rem] p-8 md:p-10 shadow-2xl transition-all">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-slate-800">{editingProjectId ? '编辑项目' : '创建新项目'}</h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600"><X size={24}/></button>
            </div>
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <input type="text" value={newProject.clientName} onChange={e => setNewProject({...newProject, clientName: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="单主名称" />
                <div className="relative">
                   <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">¥</span>
                   <input type="text" value={newProject.amount} onChange={e => setNewProject({...newProject, amount: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-8 pr-5 py-3.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="金额" />
                </div>
              </div>
              <input type="text" value={newProject.targetClientId} onChange={e => setNewProject({...newProject, targetClientId: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm outline-none font-mono focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="单主 ID (CLI-xxxx)" />
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 ml-2 uppercase">开始日期</label>
                  <input type="date" value={newProject.startDate} onChange={e => setNewProject({...newProject, startDate: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm outline-none" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 ml-2 uppercase">截稿日期</label>
                  <input type="date" value={newProject.deadline} onChange={e => setNewProject({...newProject, deadline: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm outline-none" />
                </div>
              </div>
              <textarea rows={3} value={newProject.description} onChange={e => setNewProject({...newProject, description: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm outline-none resize-none focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="需求备注..." />
              <button onClick={handleSaveProject} className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">确认保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;