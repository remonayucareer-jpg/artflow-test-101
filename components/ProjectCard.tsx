import React from 'react';
import { Project } from '../types';
import { calculateUrgencyColor, formatDate, getStatusLabel } from '../utils';
import { Clock, CheckCircle2, User, Trash2, Edit2, Copy, Link, Coins } from 'lucide-react';

interface ProjectCardProps {
  project: Project;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (project: Project) => void;
  readOnly?: boolean;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onComplete, onDelete, onEdit, readOnly = false }) => {
  const bgClass = project.status === 'completed' 
    ? 'bg-slate-50 border border-slate-200 text-slate-400' 
    : calculateUrgencyColor(project.startDate, project.deadline);

  const buttonBaseClass = "bg-white/80 backdrop-blur-sm shadow-sm border border-slate-100 p-2.5 rounded-xl transition-all hover:scale-110 hover:shadow-md active:scale-95 hover:bg-white";

  const handleCopyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(project.id);
    alert(`已复制排单 ID: ${project.id}\n可在“辅助规划”中关联。`);
  };

  return (
    <div className={`relative p-6 rounded-[2rem] transition-all duration-300 flex flex-col h-full group ${bgClass} ${project.status !== 'completed' ? 'shadow-sm hover:shadow-xl hover:-translate-y-1' : ''}`}>
      
      <div className="flex justify-between items-start mb-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <User size={16} className="opacity-40" />
            <h3 className="font-black text-lg tracking-tight truncate max-w-[120px]">{project.clientName}</h3>
          </div>
          {project.amount && !readOnly && (
            <div className="flex items-center gap-1.5 text-slate-900 font-black text-sm bg-white/40 px-2.5 py-1 rounded-full w-fit">
              <Coins size={12} className="text-amber-500" />
              <span>¥{project.amount}</span>
            </div>
          )}
        </div>
        <div className="flex gap-2 items-center">
            {!readOnly && project.status !== 'completed' && (
                <button 
                  onClick={handleCopyId}
                  className="bg-white/50 hover:bg-white text-slate-500 hover:text-indigo-600 p-2 rounded-xl transition-all"
                  title="复制 ID"
                >
                  <Link size={14} />
                </button>
            )}
            {project.status !== 'completed' && (
              <span className="text-[10px] font-black uppercase tracking-widest bg-white/80 px-3 py-1.5 rounded-lg border border-black/5">
                {getStatusLabel(project.startDate, project.deadline)}
              </span>
            )}
        </div>
      </div>

      <p className="text-sm opacity-80 mb-8 font-medium line-clamp-4 leading-relaxed flex-1">
        {project.description}
      </p>

      <div className="mt-auto space-y-4">
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-black/5">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-black opacity-40 uppercase tracking-widest">开始日期</span>
            <span className="text-xs font-bold">{formatDate(project.startDate)}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-black opacity-40 uppercase tracking-widest">截稿日期</span>
            <span className="text-xs font-bold">{formatDate(project.deadline)}</span>
          </div>
        </div>

        {!readOnly && (
          <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
             <button onClick={() => onEdit(project)} className={`${buttonBaseClass} text-slate-600 hover:text-indigo-600`}><Edit2 size={16} /></button>
             {project.status !== 'completed' && (
              <button onClick={() => onComplete(project.id)} className={`${buttonBaseClass} text-slate-600 hover:text-emerald-600`}><CheckCircle2 size={16} /></button>
             )}
             <button onClick={() => onDelete(project.id)} className={`${buttonBaseClass} text-slate-400 hover:text-rose-600`}><Trash2 size={16} /></button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectCard;