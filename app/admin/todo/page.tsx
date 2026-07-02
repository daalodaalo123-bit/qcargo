'use client';

import { useState, useEffect } from 'react';
import {
  CheckSquare,
  Plus,
  Trash2,
  User,
  Users,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Play,
  Filter,
  X,
  Save,
  Loader2
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  assignee: string;
  status: 'Pending' | 'In_Progress' | 'Completed';
  priority: 'High' | 'Medium' | 'Low';
  dueDate: string;
  createdAt: string;
}

interface Person {
  id: string;
  name: string;
}

// Demo fallback data removed — real tasks come only from the database.

export default function TodoPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filterAssignee, setFilterAssignee] = useState<string>('All');

  // People (assignees) — managed by the office
  const [people, setPeople] = useState<Person[]>([]);
  const [showManagePeople, setShowManagePeople] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');
  const [addingPerson, setAddingPerson] = useState(false);

  // New Task Form State
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignee, setAssignee] = useState<string>('');
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [dueDate, setDueDate] = useState('');

  // Task detail / description modal
  const [viewTask, setViewTask] = useState<Task | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [savingDescription, setSavingDescription] = useState(false);

  // Load from MongoDB
  const loadTasks = async () => {
    try {
      const res = await fetch('/api/tasks');
      if (!res.ok) throw new Error('Failed to load tasks');
      const data = await res.json();
      setTasks(data.map((t: any) => ({
        id: t._id || t.id,
        title: t.title,
        description: t.description || '',
        assignee: t.assignee,
        status: t.status === 'In Progress' ? 'In_Progress' : t.status,
        priority: t.priority,
        dueDate: t.dueDate,
        createdAt: t.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0]
      })));
    } catch (e) {
      console.error(e);
      setTasks([]);
    }
  };

  const loadPeople = async () => {
    try {
      const res = await fetch('/api/todo-people');
      if (!res.ok) throw new Error('Failed to load people');
      const data = await res.json();
      const list: Person[] = data.map((p: any) => ({ id: p._id || p.id, name: p.name }));
      setPeople(list);
      setAssignee((prev) => prev || list[0]?.name || '');
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadTasks();
    loadPeople();
  }, []);

  const handleAddPerson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPersonName.trim()) return;
    setAddingPerson(true);
    try {
      const res = await fetch('/api/todo-people', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newPersonName.trim() }),
      });
      if (!res.ok) throw new Error('Failed to add person');
      setNewPersonName('');
      await loadPeople();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setAddingPerson(false);
    }
  };

  const handleRemovePerson = async (id: string) => {
    if (!confirm('Remove this person from the assignee list? Their existing tasks are kept.')) return;
    try {
      const res = await fetch(`/api/todo-people?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to remove person');
      setPeople((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const payload = {
      title,
      description,
      assignee,
      status: 'Pending',
      priority,
      dueDate: dueDate || new Date().toISOString().split('T')[0],
    };

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to save task');
      const saved = await res.json();
      setTasks(prev => [{
        ...saved,
        id: saved._id || saved.id,
        status: saved.status === 'In Progress' ? 'In_Progress' : saved.status
      }, ...prev]);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
    
    // Reset Form
    setTitle('');
    setDescription('');
    setAssignee(people[0]?.name || '');
    setPriority('Medium');
    setDueDate('');
    setIsAdding(false);
  };

  const handleDeleteTask = async (id: string) => {
    try {
      const res = await fetch(`/api/tasks?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete task');
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: 'Pending' | 'In_Progress' | 'Completed') => {
    const apiStatus = newStatus === 'In_Progress' ? 'In Progress' : newStatus;
    try {
      const res = await fetch(`/api/tasks?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: apiStatus }),
      });
      if (!res.ok) throw new Error('Failed to update task status');
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const openTaskDetail = (task: Task) => {
    setViewTask(task);
    setEditDescription(task.description || '');
  };

  const closeTaskDetail = () => {
    setViewTask(null);
    setEditDescription('');
  };

  const handleSaveDescription = async () => {
    if (!viewTask) return;
    setSavingDescription(true);
    try {
      const res = await fetch(`/api/tasks?id=${viewTask.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: editDescription }),
      });
      if (!res.ok) throw new Error('Failed to save description');
      setTasks(prev => prev.map(t => t.id === viewTask.id ? { ...t, description: editDescription } : t));
      closeTaskDetail();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setSavingDescription(false);
    }
  };

  const getPriorityColor = (p: 'High' | 'Medium' | 'Low') => {
    switch (p) {
      case 'High': return 'bg-rose-950/40 text-rose-400 border border-rose-800/30';
      case 'Medium': return 'bg-amber-950/40 text-amber-400 border border-amber-800/30';
      case 'Low': return 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/30';
    }
  };

  const filteredTasks = tasks.filter(t => filterAssignee === 'All' || t.assignee === filterAssignee);

  const pendingTasks = filteredTasks.filter(t => t.status === 'Pending');
  const inProgressTasks = filteredTasks.filter(t => t.status === 'In_Progress');
  const completedTasks = filteredTasks.filter(t => t.status === 'Completed');

  return (
    <div className="admin-container pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-100 tracking-tight flex items-center gap-3">
            <CheckSquare className="text-[#F15D38]" size={32} />
            Co-Ops Task Board
          </h1>
          <p className="text-slate-400 font-medium">Daily operations manifest for your team</p>
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <div className="flex flex-wrap bg-[#131B2E] border border-slate-800 rounded-xl p-1">
            <button
              onClick={() => setFilterAssignee('All')}
              className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${filterAssignee === 'All' ? 'bg-[#F15D38] text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              All
            </button>
            {people.map((p) => (
              <button
                key={p.id}
                onClick={() => setFilterAssignee(p.name)}
                className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${filterAssignee === p.name ? 'bg-[#F15D38] text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                {p.name}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowManagePeople(true)}
            className="btn bg-[#131B2E] border border-slate-800 text-slate-300 hover:bg-slate-800 flex items-center justify-center gap-2"
          >
            <Users size={18} />
            People
          </button>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="btn btn-primary flex items-center justify-center gap-2 shadow-lg"
          >
            <Plus size={18} />
            Create Task
          </button>
        </div>
      </div>

      {/* Task Creation Form */}
      {isAdding && (
        <form onSubmit={handleAddTask} className="shipment-card mb-10 border border-slate-800 p-8 rounded-2xl bg-[#131B2E] animate-in slide-in-from-top-4 duration-300">
          <h3 className="text-base font-black text-slate-100 uppercase tracking-widest mb-6">Create Operational Task</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">Task Description/Title</label>
              <input 
                type="text" 
                required 
                placeholder="e.g. Verify custom manifest for China sea freighter" 
                className="search-input w-full"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">Detailed Instructions</label>
              <textarea 
                placeholder="Provide notes or steps required to complete this task..." 
                className="search-input w-full min-h-[80px]"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">Assign To</label>
              <select
                className="search-input w-full"
                value={assignee}
                onChange={e => setAssignee(e.target.value)}
              >
                {people.length === 0 && <option value="">Add a person first…</option>}
                {people.map((p) => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">Priority Level</label>
              <select 
                className="search-input w-full"
                value={priority}
                onChange={e => setPriority(e.target.value as 'High' | 'Medium' | 'Low')}
              >
                <option value="High">🔴 High Priority</option>
                <option value="Medium">🟡 Medium Priority</option>
                <option value="Low">🟢 Low Priority</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">Target Due Date</label>
              <input 
                type="date" 
                className="search-input w-full"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button 
              type="button" 
              onClick={() => setIsAdding(false)} 
              className="px-6 py-2 rounded-xl text-xs font-black uppercase text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
            >
              Dispatch Task
            </button>
          </div>
        </form>
      )}

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Column: Pending */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Clock size={16} className="text-amber-500" />
              Pending ({pendingTasks.length})
            </h3>
            <div className="w-6 h-6 bg-slate-800/40 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-400">
              {pendingTasks.length}
            </div>
          </div>
          <div className="bg-[#0B0F19] border border-slate-900 rounded-[1.5rem] p-3 space-y-4 min-h-[400px]">
            {pendingTasks.map(task => (
              <div key={task.id} onClick={() => openTaskDetail(task)} className="shipment-card !p-5 relative group border border-slate-800 cursor-pointer hover:border-[#F15D38]/40 transition-colors">
                <div className="flex justify-between items-start gap-2 mb-3">
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleUpdateStatus(task.id, 'In_Progress'); }}
                      className="p-1 text-slate-400 hover:text-[#F15D38] hover:bg-slate-800 rounded transition-colors"
                      title="Start Task"
                    >
                      <Play size={12} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }}
                      className="p-1 text-slate-400 hover:text-rose-500 hover:bg-slate-800 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                <h4 className="text-sm font-black text-slate-100 mb-2 leading-snug">{task.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed mb-4 line-clamp-2">{task.description || 'No description — click to add one.'}</p>
                <div className="flex items-center justify-between pt-3 border-t border-slate-800/40">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                    <Calendar size={12} />
                    <span>Due {task.dueDate}</span>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider text-slate-300">
                    <User size={10} className="text-[#F15D38]" />
                    {task.assignee}
                  </div>
                </div>
              </div>
            ))}
            {pendingTasks.length === 0 && (
              <div className="h-[200px] flex flex-col items-center justify-center text-center text-slate-500">
                <CheckCircle2 size={32} className="opacity-20 mb-3" />
                <p className="text-xs font-bold uppercase tracking-wider">No Pending Tasks</p>
              </div>
            )}
          </div>
        </div>

        {/* Column: In Progress */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Play size={16} className="text-[#F15D38]" />
              In Progress ({inProgressTasks.length})
            </h3>
            <div className="w-6 h-6 bg-slate-800/40 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-400">
              {inProgressTasks.length}
            </div>
          </div>
          <div className="bg-[#0B0F19] border border-slate-900 rounded-[1.5rem] p-3 space-y-4 min-h-[400px]">
            {inProgressTasks.map(task => (
              <div key={task.id} onClick={() => openTaskDetail(task)} className="shipment-card !p-5 relative group border border-slate-800 cursor-pointer hover:border-[#F15D38]/40 transition-colors">
                <div className="flex justify-between items-start gap-2 mb-3">
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleUpdateStatus(task.id, 'Completed'); }}
                      className="p-1 text-slate-400 hover:text-emerald-500 hover:bg-slate-800 rounded transition-colors"
                      title="Mark Completed"
                    >
                      <CheckCircle2 size={12} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }}
                      className="p-1 text-slate-400 hover:text-rose-500 hover:bg-slate-800 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                <h4 className="text-sm font-black text-slate-100 mb-2 leading-snug">{task.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed mb-4 line-clamp-2">{task.description || 'No description — click to add one.'}</p>
                <div className="flex items-center justify-between pt-3 border-t border-slate-800/40">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                    <Calendar size={12} />
                    <span>Due {task.dueDate}</span>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider text-slate-300">
                    <User size={10} className="text-[#F15D38]" />
                    {task.assignee}
                  </div>
                </div>
              </div>
            ))}
            {inProgressTasks.length === 0 && (
              <div className="h-[200px] flex flex-col items-center justify-center text-center text-slate-500">
                <Play size={32} className="opacity-20 mb-3" />
                <p className="text-xs font-bold uppercase tracking-wider">No Active Tasks</p>
              </div>
            )}
          </div>
        </div>

        {/* Column: Completed */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-500" />
              Completed ({completedTasks.length})
            </h3>
            <div className="w-6 h-6 bg-slate-800/40 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-400">
              {completedTasks.length}
            </div>
          </div>
          <div className="bg-[#0B0F19] border border-slate-900 rounded-[1.5rem] p-3 space-y-4 min-h-[400px]">
            {completedTasks.map(task => (
              <div key={task.id} onClick={() => openTaskDetail(task)} className="shipment-card !p-5 relative group border border-slate-800 opacity-75 hover:opacity-100 transition-opacity cursor-pointer">
                <div className="flex justify-between items-start gap-2 mb-3">
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleUpdateStatus(task.id, 'In_Progress'); }}
                      className="p-1 text-slate-400 hover:text-[#F15D38] hover:bg-slate-800 rounded transition-colors"
                      title="Reopen Task"
                    >
                      <Clock size={12} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }}
                      className="p-1 text-slate-400 hover:text-rose-500 hover:bg-slate-800 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                <h4 className="text-sm font-black text-slate-400 line-through mb-2 leading-snug">{task.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed mb-4 line-clamp-2">{task.description || 'No description'}</p>
                <div className="flex items-center justify-between pt-3 border-t border-slate-800/40">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                    <Calendar size={12} />
                    <span>Completed</span>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider text-slate-300">
                    <User size={10} className="text-[#F15D38]" />
                    {task.assignee}
                  </div>
                </div>
              </div>
            ))}
            {completedTasks.length === 0 && (
              <div className="h-[200px] flex flex-col items-center justify-center text-center text-slate-500">
                <CheckSquare size={32} className="opacity-20 mb-3" />
                <p className="text-xs font-bold uppercase tracking-wider">No Completed Tasks</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Manage People Modal */}
      {showManagePeople && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowManagePeople(false)}>
          <div
            className="w-full max-w-md bg-[#131B2E] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0B0F19]">
              <h2 className="text-sm font-black text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <Users size={16} className="text-[#F15D38]" /> Manage People
              </h2>
              <button type="button" onClick={() => setShowManagePeople(false)} className="p-2 text-slate-400 hover:text-slate-200 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <form onSubmit={handleAddPerson} className="flex gap-2">
                <input
                  type="text"
                  value={newPersonName}
                  onChange={(e) => setNewPersonName(e.target.value)}
                  placeholder="New person's name (e.g. salesperson)"
                  className="search-input flex-1"
                />
                <button
                  type="submit"
                  disabled={addingPerson || !newPersonName.trim()}
                  className="btn btn-primary flex items-center gap-2 disabled:opacity-60 shrink-0"
                >
                  {addingPerson ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                  Add
                </button>
              </form>

              <div className="space-y-2">
                {people.length === 0 && (
                  <p className="text-xs text-slate-500 text-center py-4">No people yet — add someone above.</p>
                )}
                {people.map((p) => (
                  <div key={p.id} className="flex items-center justify-between bg-[#0B0F19] border border-slate-800 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-[#F15D38]" />
                      <span className="text-sm font-bold text-slate-200">{p.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemovePerson(p.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                      title="Remove person"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-500">Removing a person only takes them off the assignee list — tasks already assigned to them are kept.</p>
            </div>
          </div>
        </div>
      )}

      {/* Task Detail / Description Modal */}
      {viewTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={closeTaskDetail}>
          <div
            className="w-full max-w-lg bg-[#131B2E] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0B0F19]">
              <div>
                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${getPriorityColor(viewTask.priority)}`}>
                  {viewTask.priority}
                </span>
                <h2 className="text-sm font-black text-slate-100 mt-2 leading-snug">{viewTask.title}</h2>
              </div>
              <button type="button" onClick={closeTaskDetail} className="p-2 text-slate-400 hover:text-slate-200 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <div className="flex items-center gap-1.5">
                  <Calendar size={12} />
                  <span>Due {viewTask.dueDate}</span>
                </div>
                <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-full text-slate-300">
                  <User size={10} className="text-[#F15D38]" />
                  {viewTask.assignee}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">Detailed Instructions</label>
                <textarea
                  className="search-input w-full min-h-[140px]"
                  placeholder="Provide notes or steps required to complete this task..."
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeTaskDetail}
                  className="flex-1 py-3 text-slate-400 text-xs font-bold uppercase hover:text-slate-200"
                  disabled={savingDescription}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveDescription}
                  disabled={savingDescription}
                  className="flex-1 py-3 bg-[#F15D38] hover:bg-[#d64420] disabled:opacity-60 text-white rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2 transition-all"
                >
                  {savingDescription ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  {savingDescription ? 'Saving...' : 'Save Description'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
