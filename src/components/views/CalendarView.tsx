import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  CheckCircle2,
  Clock,
  RotateCcw,
  AlertTriangle,
  Repeat,
  Trash2,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { AppData, ScheduledTask } from '../../types';

interface CalendarViewProps {
  data: AppData;
  onSaveTask: (task: ScheduledTask) => void;
  onToggleTaskComplete: (taskId: string) => void;
  onPostponeTask: (taskId: string, days: number) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  data,
  onSaveTask,
  onToggleTaskComplete,
  onPostponeTask,
}) => {
  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'completed'>('pending');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New task form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [repeat, setRepeat] = useState<'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly'>('daily');
  const [systemId, setSystemId] = useState<string>(data.systems?.[0]?.id || '');

  const taskList = Array.isArray(data.tasks) ? data.tasks : Array.isArray(data.calendarTasks) ? data.calendarTasks : [];

  const filteredTasks = taskList.filter((t) => {
    if (filterTab === 'pending') return !t.completed;
    if (filterTab === 'completed') return t.completed;
    return true;
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newTask: ScheduledTask = {
      id: 'tsk-' + Date.now().toString(36),
      title,
      description,
      dueDate,
      priority,
      repeat,
      completed: false,
      systemId: systemId || undefined,
    };
    onSaveTask(newTask);
    setIsModalOpen(false);
    setTitle('');
    setDescription('');
  };

  return (
    <div id="view-calendar" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Calendario y Tareas Agrícolas</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Planificación de rutinas diarias de pH/EC, recargas, desinfección, calibración y cosechas
          </p>
        </div>

        <button
          id="btn-add-task"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-900/30 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Programar Nueva Tarea</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between p-2 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex gap-1 text-xs font-bold">
          <button
            onClick={() => setFilterTab('pending')}
            className={`px-3 py-1.5 rounded-xl transition ${
              filterTab === 'pending'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Pendientes ({taskList.filter((t) => !t.completed).length})
          </button>
          <button
            onClick={() => setFilterTab('completed')}
            className={`px-3 py-1.5 rounded-xl transition ${
              filterTab === 'completed'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Completadas ({taskList.filter((t) => t.completed).length})
          </button>
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 rounded-xl transition ${
              filterTab === 'all'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Todas ({taskList.length})
          </button>
        </div>
      </div>

      {/* Task Cards List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-700">¡Al día con las labores del cultivo!</h3>
            <p className="text-xs text-slate-400 mt-1">No hay tareas que coincidan con este filtro.</p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const sys = data.systems.find((s) => s.id === task.systemId);

            return (
              <div
                key={task.id}
                id={`task-row-${task.id}`}
                className={`p-4 rounded-2xl bg-white border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs ${
                  task.completed ? 'opacity-65 border-slate-200 bg-slate-50/50' : 'border-slate-200 hover:border-emerald-500/40'
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => onToggleTaskComplete(task.id)}
                    className={`mt-0.5 w-6 h-6 rounded-lg border flex items-center justify-center transition cursor-pointer shrink-0 ${
                      task.completed
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-slate-300 hover:border-emerald-500 text-transparent'
                    }`}
                  >
                    ✓
                  </button>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4
                        className={`text-sm font-extrabold ${
                          task.completed ? 'line-through text-slate-500' : 'text-slate-900'
                        }`}
                      >
                        {task.title}
                      </h4>

                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          task.priority === 'high'
                            ? 'bg-rose-100 text-rose-700'
                            : task.priority === 'medium'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Baja'}
                      </span>

                      {task.repeat !== 'none' && (
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <Repeat className="w-3 h-3" />
                          <span>{task.repeat}</span>
                        </span>
                      )}
                    </div>

                    {task.description && (
                      <p className="text-xs text-slate-500 mt-0.5">{task.description}</p>
                    )}

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2 font-medium">
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                        <span>Vence: <strong>{task.dueDate}</strong></span>
                      </span>
                      {sys && <span>• Sistema: {sys.name}</span>}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {!task.completed && (
                    <>
                      <button
                        onClick={() => onPostponeTask(task.id, 1)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
                        title="Posponer 1 día"
                      >
                        +1 día
                      </button>
                      <button
                        onClick={() => onPostponeTask(task.id, 7)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
                        title="Posponer 1 semana"
                      >
                        +7 días
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => onToggleTaskComplete(task.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      task.completed
                        ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-xs'
                    }`}
                  >
                    {task.completed ? 'Marcar Pendiente' : 'Completar'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* New Task Modal */}
      {isModalOpen && (
        <div 
          id="modal-new-scheduled-task"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
        >
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 text-slate-900 my-8">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">Planificación</span>
                <h2 className="text-xl font-black mt-0.5">Programar Tarea Agrícola</h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Título de la Tarea</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Medir pH y EC matutino en DWC"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Descripción</label>
                <textarea
                  rows={2}
                  placeholder="Comprobar que el valor esté entre 5.8 y 6.2..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fecha Límite</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Prioridad</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium text-slate-900"
                  >
                    <option value="low">Baja</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta / Crítica</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Repetición</label>
                  <select
                    value={repeat}
                    onChange={(e) => setRepeat(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium text-slate-900"
                  >
                    <option value="none">Una sola vez</option>
                    <option value="daily">Todos los días</option>
                    <option value="weekly">Semanal</option>
                    <option value="biweekly">Quincenal</option>
                    <option value="monthly">Mensual</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sistema Asociado</label>
                  <select
                    value={systemId}
                    onChange={(e) => setSystemId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium text-slate-900"
                  >
                    <option value="">General (Todos)</option>
                    {data.systems.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition cursor-pointer"
                >
                  Guardar Tarea
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
