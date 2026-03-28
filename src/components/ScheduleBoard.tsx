import React, { useState, useMemo } from 'react';
import { BookingSlot, ViewMode, Project, Achievement } from '@/types';
// Added missing ListTodo import
import { ShieldBan, Check, Lock, X, ChevronLeft, ChevronRight, Calendar, Sparkles, Plus, Trash2, CheckCircle2, ListTodo } from 'lucide-react';
import { getProjectLineColor } from '@/utils';

interface ScheduleBoardProps {
  bookings: BookingSlot[];
  projects: Project[];
  achievements: Achievement[];
  mode: ViewMode;
  onUpdateBookings: (bookings: BookingSlot[]) => void;
  onUpdateAchievements: (achievements: Achievement[]) => void;
  currentClientId?: string;
  currentClientName?: string;
}

const ScheduleBoard: React.FC<ScheduleBoardProps> = ({ 
  bookings, 
  projects, 
  achievements,
  mode, 
  onUpdateBookings,
  onUpdateAchievements,
  currentClientId,
  currentClientName 
}) => {
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [bookingNote, setBookingNote] = useState('');
  const [newAchievement, setNewAchievement] = useState('');

  const getLocalYYYYMMDD = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getMonthDays = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const days = [];
    for (let i = 0; i < firstDayOfMonth.getDay(); i++) days.push(null);
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) days.push(new Date(year, month, i));
    return days;
  };

  const days = getMonthDays();
  const getSlot = (date: string) => bookings.find(b => b.date === date);

  const getProjectsOnDate = (dateStr: string) => {
    const targetDate = new Date(dateStr + 'T00:00:00'); 
    return projects.filter(p => {
       if (p.status === 'completed') return false;
       if (mode === 'client' && p.targetClientId !== currentClientId) return false;
       const startDay = new Date(new Date(p.startDate).setHours(0,0,0,0));
       const endDay = new Date(new Date(p.deadline).setHours(0,0,0,0));
       return targetDate >= startDay && targetDate <= endDay;
    }).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  };

  // 计算当前查看月份的工单总数
  const projectsInViewMonth = useMemo(() => {
    return projects.filter(p => {
      const d = new Date(p.deadline);
      return d.getFullYear() === viewDate.getFullYear() && d.getMonth() === viewDate.getMonth();
    }).length;
  }, [projects, viewDate]);

  const isMySlot = (clientId?: string, bookedBy?: string) => {
    if (mode === 'artist') return true;
    if (currentClientId && clientId === currentClientId) return true;
    return false;
  };

  const handleDayClick = (date: string) => {
    setSelectedDate(date);
    if (mode === 'artist') {
      // Just select the date to show achievement list
    } else {
      const slot = getSlot(date);
      if (slot?.status === 'blocked' || (slot?.status === 'booked' && !isMySlot(slot.clientId))) return;
      setBookingNote('');
    }
  };

  const toggleBlockedStatus = (date: string) => {
    const newBookings = [...bookings];
    const index = newBookings.findIndex(b => b.date === date);
    if (index >= 0) {
      if (newBookings[index].status === 'blocked') {
        newBookings.splice(index, 1);
      } else if(confirm("该日期已有预约，确定要清除吗？")) {
           newBookings.splice(index, 1);
      }
    } else {
      newBookings.push({ date, status: 'blocked' });
    }
    onUpdateBookings(newBookings);
  };

  const handleClientBook = () => {
    if (!selectedDate) return;
    const newBookings = [...bookings, {
      date: selectedDate,
      status: 'booked' as const,
      bookedBy: currentClientName || 'Client',
      clientId: currentClientId,
      note: bookingNote
    }];
    onUpdateBookings(newBookings);
    setSelectedDate(null);
    alert('预约申请已提交！');
  };

  const handleAddAchievement = () => {
    if (!selectedDate || !newAchievement.trim()) return;
    const item: Achievement = {
      id: Date.now().toString(),
      text: newAchievement.trim(),
      date: selectedDate
    };
    onUpdateAchievements([...achievements, item]);
    setNewAchievement('');
  };

  const handleDeleteAchievement = (id: string) => {
    onUpdateAchievements(achievements.filter(a => a.id !== id));
  };

  const changeMonth = (offset: number) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1));
  };

  const dayAchievements = achievements.filter(a => a.date === selectedDate);

  return (
    <div className="bg-white">
      <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
           <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            排期日历
          </h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
            {viewDate.toLocaleString('zh-CN', { year: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="flex gap-2 bg-slate-50 p-1 rounded-2xl">
          <button onClick={() => changeMonth(-1)} className="p-3 hover:bg-white hover:shadow-sm rounded-xl transition-all text-slate-400 hover:text-indigo-600"><ChevronLeft size={20} /></button>
          <button onClick={() => setViewDate(new Date())} className="px-4 text-xs font-black text-slate-500 hover:text-indigo-600">今天</button>
          <button onClick={() => changeMonth(1)} className="p-3 hover:bg-white hover:shadow-sm rounded-xl transition-all text-slate-400 hover:text-indigo-600"><ChevronRight size={20} /></button>
        </div>
      </div>

      <div className="p-4 md:p-8">
        <div className="grid grid-cols-7 gap-px bg-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
          {['周日', '周一', '周二', '周三', '周四', '周五', '周六'].map(d => (
              <div key={d} className="bg-slate-50 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest py-4 border-b border-slate-100">{d}</div>
          ))}
          {days.map((dateObj, idx) => {
            if (!dateObj) return <div key={`empty-${idx}`} className="bg-slate-50/50 min-h-[100px] md:min-h-[140px]"></div>;
            
            const date = getLocalYYYYMMDD(dateObj);
            const slot = getSlot(date);
            const projectsOnDay = getProjectsOnDate(date);
            const status = slot?.status;
            const isToday = getLocalYYYYMMDD(new Date()) === date;
            const isMine = isMySlot(slot?.clientId, slot?.bookedBy);
            const hasAchievements = achievements.some(a => a.date === date);

            let dayContent = null;
            let bgClass = 'bg-white hover:bg-slate-50 transition-colors';
            
            if (status === 'blocked') {
              bgClass = 'bg-slate-50 text-slate-300';
              dayContent = <Lock size={14} className="opacity-20 absolute bottom-3 right-3" />;
            } else if (status === 'booked') {
              if (mode === 'client' && !isMine) {
                bgClass = 'bg-slate-100 text-slate-300 cursor-not-allowed';
              } else {
                bgClass = 'bg-indigo-600 text-white shadow-inner';
                dayContent = <Check size={18} strokeWidth={3} className="absolute bottom-3 right-3 text-white/50" />;
              }
            }

            if (selectedDate === date) bgClass = 'ring-4 ring-indigo-500 ring-inset bg-indigo-50';

            return (
              <div 
                key={date}
                onClick={() => handleDayClick(date)}
                className={`min-h-[100px] md:min-h-[140px] p-3 flex flex-col relative group cursor-pointer ${bgClass}`}
              >
                <div className="flex justify-between items-start">
                  <span className={`text-sm font-black transition-all ${isToday ? 'bg-indigo-600 text-white w-7 h-7 flex items-center justify-center rounded-lg shadow-lg shadow-indigo-100' : 'text-slate-400 group-hover:text-slate-900'}`}>
                    {dateObj.getDate()}
                  </span>
                  {hasAchievements && mode === 'artist' && (
                    <div className="bg-emerald-500 text-white p-1 rounded-full shadow-sm">
                      <Sparkles size={10} />
                    </div>
                  )}
                </div>
                
                {dayContent}

                <div className="mt-auto space-y-1.5 w-full">
                   {projectsOnDay.map((p) => (
                     <div key={p.id} className={`h-1.5 md:h-2 w-full rounded-full ${getProjectLineColor(p.startDate, p.deadline)} transition-all group-hover:opacity-100`} title={p.clientName} />
                   ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* 统计概览面板 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
            <div className="lg:col-span-2 bg-indigo-50 border border-indigo-100 p-8 rounded-[2.5rem]">
              <h4 className="font-black text-indigo-900 mb-4 flex items-center gap-2"><Calendar size={20}/> 排期概览</h4>
              <p className="text-sm text-indigo-700/70 font-medium leading-relaxed">
                日历中的彩色横线条代表正在进行中的工单。颜色根据截稿日期的紧急程度变化：<br/>
                <span className="inline-flex items-center gap-1.5 mt-2 shadow-sm bg-white px-3 py-1 rounded-full mr-4"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> <span className="text-[11px] font-bold">2天内截稿</span></span>
                <span className="inline-flex items-center gap-1.5 shadow-sm bg-white px-3 py-1 rounded-full mr-4"><span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span> <span className="text-[11px] font-bold">5天内截稿</span></span>
                <span className="inline-flex items-center gap-1.5 shadow-sm bg-white px-3 py-1 rounded-full"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> <span className="text-[11px] font-bold">时间充裕</span></span>
              </p>
            </div>
            <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] flex flex-col justify-center text-center shadow-sm">
              <span className="text-4xl font-black text-slate-800">{projectsInViewMonth}</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">本月工单总数</span>
            </div>
        </div>

        {/* Artist View: Achievements / Done List Panel */}
        {mode === 'artist' && selectedDate && (
          <div className="mt-8 animate-slide-up bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-100/50">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
              <div className="flex items-center gap-4">
                <div className="bg-emerald-100 text-emerald-600 p-3 rounded-2xl">
                  <Sparkles size={24}/>
                </div>
                <div>
                  <h4 className="text-xl font-black text-slate-800">今日成就 - {selectedDate}</h4>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">记录下今天的每一分努力</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => toggleBlockedStatus(selectedDate)}
                  className={`px-6 py-3 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${getSlot(selectedDate)?.status === 'blocked' ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  <Lock size={14}/> {getSlot(selectedDate)?.status === 'blocked' ? '取消休假标记' : '标记为休息/占位'}
                </button>
                <button onClick={() => setSelectedDate(null)} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-2xl transition-all">
                  <X size={20}/>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {/* Done List */}
              <div className="space-y-3">
                {dayAchievements.length > 0 ? (
                  dayAchievements.map(ach => (
                    <div key={ach.id} className="flex items-center justify-between p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl group animate-fade-in">
                      <div className="flex items-center gap-3">
                        <div className="text-emerald-500">
                          <CheckCircle2 size={18}/>
                        </div>
                        <span className="font-bold text-slate-700">{ach.text}</span>
                      </div>
                      <button onClick={() => handleDeleteAchievement(ach.id)} className="text-slate-300 hover:text-rose-500 p-2 opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 size={16}/>
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="py-12 border-2 border-dashed border-slate-100 rounded-[2rem] flex flex-col items-center justify-center text-slate-300">
                    <ListTodo size={32} className="mb-2 opacity-20"/>
                    <p className="text-sm font-bold">还没有记录今天的成就哦</p>
                  </div>
                )}
              </div>

              {/* Add Input */}
              <div className="flex gap-3 pt-6 border-t border-slate-50">
                <input 
                  type="text" 
                  value={newAchievement}
                  onChange={e => setNewAchievement(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddAchievement()}
                  placeholder="记下一笔今日进展，哪怕只是微小的..." 
                  className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
                <button 
                  onClick={handleAddAchievement}
                  disabled={!newAchievement.trim()}
                  className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-sm shadow-lg shadow-emerald-100 flex items-center gap-2 hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
                >
                  <Plus size={18}/> 记录
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Client View: Booking Request Panel */}
        {mode === 'client' && selectedDate && (
          <div className="mt-8 animate-slide-up bg-white p-6 rounded-[2rem] border border-indigo-100 shadow-xl shadow-indigo-50/50 flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 text-white p-3 rounded-2xl shadow-lg shadow-indigo-100"><Calendar size={24}/></div>
              <div>
                <h4 className="font-black text-slate-800">申请预约: {selectedDate}</h4>
                <p className="text-xs text-slate-400 font-bold">请填写备注说明您的具体需求</p>
              </div>
            </div>
            <div className="flex-1 flex gap-3">
              <input 
                type="text" 
                placeholder="例如：想要约一张半身彩色，已有构图思路..."
                value={bookingNote}
                onChange={(e) => setBookingNote(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
              <button 
                onClick={handleClientBook}
                className="bg-indigo-600 text-white px-8 py-4 rounded-2xl text-sm font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all"
              >
                立即提交
              </button>
            </div>
            <button onClick={() => setSelectedDate(null)} className="text-slate-400 hover:text-slate-600 p-2"><X size={20}/></button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleBoard;