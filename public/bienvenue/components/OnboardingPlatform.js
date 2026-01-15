import React, { useState, useMemo } from 'react';
import { Calendar, Users, CheckCircle2, Circle, Clock, Plus, Edit2, Trash2, Download, Upload, Filter, Search, ChevronDown, ChevronRight, GripVertical, User, Tag, AlertCircle } from 'lucide-react';

const OnboardingPlatform = () => {
  // Etat initial avec les donnees de Caroline
  const [employee, setEmployee] = useState({
    name: 'Caroline',
    role: 'Conseillere en gestion de patrimoine',
    startDate: '2025-01-06',
    endDate: '2025-01-31'
  });

  const [phases, setPhases] = useState([
    {
      id: 1,
      name: 'Phase 1 : Arrivee au retour des fetes',
      startDate: '2025-01-06',
      endDate: '2025-01-10',
      description: 'Prise de connaissance des outils et premiers contacts',
      color: '#3B82F6',
      expanded: true
    },
    {
      id: 2,
      name: 'Phase 2 : Premiere semaine complete',
      startDate: '2025-01-06',
      endDate: '2025-01-10',
      description: 'Rencontres intensives en rafale',
      color: '#8B5CF6',
      expanded: true
    },
    {
      id: 3,
      name: 'Phase 3 : Consolidation et pratique',
      startDate: '2025-01-13',
      endDate: '2025-01-24',
      description: 'Application des apprentissages',
      color: '#06B6D4',
      expanded: true
    },
    {
      id: 4,
      name: 'Phase 4 : Autonomisation complete',
      startDate: '2025-01-27',
      endDate: '2025-01-31',
      description: 'Finalisation de l\'integration',
      color: '#10B981',
      expanded: true
    }
  ]);

  const [resources, setResources] = useState([
    { id: 1, name: 'Jean-Sebastien', role: 'Planification financiere', color: '#EF4444' },
    { id: 2, name: 'Jonathan', role: 'Coordination', color: '#F59E0B' },
    { id: 3, name: 'Anne-Marie', role: 'Administration', color: '#8B5CF6' },
    { id: 4, name: 'Marie-Helene Lacroix', role: 'Coaching planification', color: '#EC4899' },
    { id: 5, name: 'Hugo', role: 'Clientele', color: '#06B6D4' },
    { id: 6, name: 'Linda', role: 'Support technique', color: '#10B981' },
    { id: 7, name: 'Conseillers', role: 'Mentorat', color: '#6366F1' }
  ]);

  const [tasks, setTasks] = useState([
    // Phase 1 - Outils et environnement
    { id: 1, phaseId: 1, title: 'Confirmation adresse courriel', description: 'Valider que l\'adresse courriel reste inchangee', assignedTo: [2], status: 'pending', priority: 'high', dueDate: '2025-01-06', category: 'administratif' },
    { id: 2, phaseId: 1, title: 'Prevoir acces systemes', description: 'Coordonner avec IT pour acces et portable', assignedTo: [3], status: 'pending', priority: 'high', dueDate: '2025-01-06', category: 'technique' },
    { id: 3, phaseId: 1, title: 'Formation Teams et serveur', description: 'Formation sur outils collaboratifs', assignedTo: [3, 6], status: 'pending', priority: 'medium', dueDate: '2025-01-07', category: 'technique' },
    { id: 4, phaseId: 1, title: 'Rencontre processus administratifs', description: 'Comprendre les processus internes avec Anne-Marie', assignedTo: [3], status: 'pending', priority: 'high', dueDate: '2025-01-07', category: 'administratif' },
    { id: 5, phaseId: 1, title: 'Super Lundi - Coaching', description: 'Session de coaching en planification', assignedTo: [3], status: 'pending', priority: 'medium', dueDate: '2025-01-06', category: 'formation' },
    { id: 6, phaseId: 1, title: 'Formation ouverture de compte', description: 'Processus d\'ouverture et mise a jour', assignedTo: [3], status: 'pending', priority: 'medium', dueDate: '2025-01-08', category: 'formation' },
    { id: 7, phaseId: 1, title: 'Coaching planification - Session 1', description: 'Premiere session avec Marie-Helene', assignedTo: [4], status: 'pending', priority: 'high', dueDate: '2025-01-07', category: 'formation' },
    { id: 8, phaseId: 1, title: 'Reception documents conformite', description: 'Documents de Jean-Sebastien: conformite, processus, gabarits', assignedTo: [1], status: 'pending', priority: 'high', dueDate: '2025-01-06', category: 'documentation' },
    { id: 9, phaseId: 1, title: 'Lecture documents preparatoires', description: 'Prendre connaissance des documents envoyes', assignedTo: [], status: 'pending', priority: 'medium', dueDate: '2025-01-09', category: 'auto-formation' },
    { id: 10, phaseId: 1, title: 'Observation rencontre client 1', description: 'Observer une rencontre avec un conseiller', assignedTo: [7], status: 'pending', priority: 'medium', dueDate: '2025-01-08', category: 'immersion' },
    { id: 11, phaseId: 1, title: 'Rencontre Hugo - Validation clientele', description: 'Discussion sur la clientele assignee', assignedTo: [5], status: 'pending', priority: 'high', dueDate: '2025-01-09', category: 'clientele' },
    { id: 12, phaseId: 1, title: 'Information aux conseillers', description: 'Jonathan informe les conseillers de la prise de contact', assignedTo: [2], status: 'pending', priority: 'high', dueDate: '2025-01-06', category: 'coordination' },
    
    // Phase 2
    { id: 13, phaseId: 2, title: 'Rencontres intensives intervenants', description: 'Sessions avec tous les intervenants cles', assignedTo: [1, 2, 3, 4], status: 'pending', priority: 'high', dueDate: '2025-01-10', category: 'formation' },
    { id: 14, phaseId: 2, title: 'Observations rencontres clients', description: 'Assister a plusieurs rencontres', assignedTo: [7], status: 'pending', priority: 'medium', dueDate: '2025-01-10', category: 'immersion' },
    { id: 15, phaseId: 2, title: 'Reevaluation fin de semaine', description: 'Point de controle et ajustements', assignedTo: [2], status: 'pending', priority: 'high', dueDate: '2025-01-10', category: 'suivi' },
    
    // Phase 3
    { id: 16, phaseId: 3, title: 'Realisation entrevues clients', description: 'Commencer a mener des entrevues', assignedTo: [7], status: 'pending', priority: 'high', dueDate: '2025-01-17', category: 'pratique' },
    { id: 17, phaseId: 3, title: 'Premier dossier planification', description: 'Preparer premier dossier avec Marie-Helene', assignedTo: [4], status: 'pending', priority: 'high', dueDate: '2025-01-20', category: 'pratique' },
    { id: 18, phaseId: 3, title: 'Appropriation outils', description: 'Maitriser tous les outils de travail', assignedTo: [], status: 'pending', priority: 'medium', dueDate: '2025-01-24', category: 'auto-formation' },
    { id: 19, phaseId: 3, title: 'Briefing conseillers individuels', description: 'Rencontre avec chaque conseiller assigne', assignedTo: [7], status: 'pending', priority: 'high', dueDate: '2025-01-22', category: 'clientele' },
    
    // Phase 4
    { id: 20, phaseId: 4, title: 'Finalisation discussions conseillers', description: 'Completer toutes les discussions', assignedTo: [7], status: 'pending', priority: 'high', dueDate: '2025-01-29', category: 'clientele' },
    { id: 21, phaseId: 4, title: 'Validation maitrise outils', description: 'Confirmer l\'autonomie sur les outils', assignedTo: [3, 6], status: 'pending', priority: 'medium', dueDate: '2025-01-30', category: 'validation' },
    { id: 22, phaseId: 4, title: 'Bilan integration complet', description: 'Evaluation finale de l\'integration', assignedTo: [2], status: 'pending', priority: 'high', dueDate: '2025-01-31', category: 'suivi' }
  ]);

  const [viewMode, setViewMode] = useState('timeline');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterResource, setFilterResource] = useState('all');
  const [showAddTask, setShowAddTask] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const statusColors = {
    pending: 'bg-gray-100 text-gray-700 border-gray-300',
    inProgress: 'bg-blue-100 text-blue-700 border-blue-300',
    completed: 'bg-green-100 text-green-700 border-green-300',
    blocked: 'bg-red-100 text-red-700 border-red-300'
  };

  const priorityColors = {
    low: 'bg-gray-100 text-gray-600',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-orange-100 text-orange-700'
  };

  // Statistiques
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const inProgress = tasks.filter(t => t.status === 'inProgress').length;
    const pending = tasks.filter(t => t.status === 'pending').length;
    const blocked = tasks.filter(t => t.status === 'blocked').length;
    
    return {
      total,
      completed,
      inProgress,
      pending,
      blocked,
      progress: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  }, [tasks]);

  // Filtrage des taches
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           task.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
      const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
      const matchesResource = filterResource === 'all' || task.assignedTo.includes(parseInt(filterResource));
      
      return matchesSearch && matchesStatus && matchesPriority && matchesResource;
    });
  }, [tasks, searchTerm, filterStatus, filterPriority, filterResource]);

  // Fonctions de gestion
  const toggleTaskStatus = (taskId) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        const statuses = ['pending', 'inProgress', 'completed'];
        const currentIndex = statuses.indexOf(task.status);
        const nextStatus = statuses[(currentIndex + 1) % statuses.length];
        return { ...task, status: nextStatus };
      }
      return task;
    }));
  };

  const deleteTask = (taskId) => {
    if (confirm('Etes-vous sur de vouloir supprimer cette tache?')) {
      setTasks(tasks.filter(t => t.id !== taskId));
    }
  };

  const togglePhaseExpanded = (phaseId) => {
    setPhases(phases.map(p => 
      p.id === phaseId ? { ...p, expanded: !p.expanded } : p
    ));
  };

  const exportData = () => {
    const data = { employee, phases, resources, tasks };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plan-integration-${employee.name.toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const importData = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (data.employee) setEmployee(data.employee);
          if (data.phases) setPhases(data.phases);
          if (data.resources) setResources(data.resources);
          if (data.tasks) setTasks(data.tasks);
          alert('Donnees importees avec succes!');
        } catch (error) {
          alert('Erreur lors de l\'importation: ' + error.message);
        }
      };
      reader.readAsText(file);
    }
  };

  // Composants de rendu
  const TaskCard = ({ task, compact = false }) => {
    const phase = phases.find(p => p.id === task.phaseId);
    const assignedResources = resources.filter(r => task.assignedTo.includes(r.id));

    return (
      <div className={`task-card bg-white border-2 rounded-lg p-4 hover:shadow-lg transition-all duration-200 ${compact ? 'mb-2' : 'mb-3'}`}>
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-start gap-3 flex-1">
            <button
              onClick={() => toggleTaskStatus(task.id)}
              className="mt-1 hover:scale-110 transition-transform"
            >
              {task.status === 'completed' ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : task.status === 'inProgress' ? (
                <Clock className="w-5 h-5 text-blue-600" />
              ) : task.status === 'blocked' ? (
                <AlertCircle className="w-5 h-5 text-red-600" />
              ) : (
                <Circle className="w-5 h-5 text-gray-400" />
              )}
            </button>
            <div className="flex-1">
              <h4 className={`font-semibold text-gray-900 ${task.status === 'completed' ? 'line-through text-gray-500' : ''}`}>
                {task.title}
              </h4>
              {!compact && (
                <p className="text-sm text-gray-600 mt-1">{task.description}</p>
              )}
            </div>
          </div>
          <div className="flex gap-1 ml-2">
            <button
              onClick={() => setEditingTask(task)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <Edit2 className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={() => deleteTask(task.id)}
              className="p-1 hover:bg-red-50 rounded transition-colors"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          <span className={`text-xs px-2 py-1 rounded-full ${statusColors[task.status]} border`}>
            {task.status === 'pending' ? 'En attente' : 
             task.status === 'inProgress' ? 'En cours' : 
             task.status === 'completed' ? 'Complete' : 'Bloque'}
          </span>
          <span className={`text-xs px-2 py-1 rounded-full ${priorityColors[task.priority]}`}>
            {task.priority === 'high' ? 'Haute' : task.priority === 'medium' ? 'Moyenne' : 'Basse'}
          </span>
          {phase && (
            <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: phase.color + '20', color: phase.color }}>
              {phase.name.split(':')[0]}
            </span>
          )}
          {task.category && (
            <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700">
              {task.category}
            </span>
          )}
          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
             {new Date(task.dueDate).toLocaleDateString('fr-CA')}
          </span>
        </div>

        {assignedResources.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {assignedResources.map(resource => (
              <span
                key={resource.id}
                className="text-xs px-2 py-1 rounded-full flex items-center gap-1"
                style={{ backgroundColor: resource.color + '20', color: resource.color }}
              >
                <User className="w-3 h-3" />
                {resource.name}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  const TimelineView = () => (
    <div className="space-y-6">
      {phases.map(phase => {
        const phaseTasks = filteredTasks.filter(t => t.phaseId === phase.id);
        
        return (
          <div key={phase.id} className="bg-white rounded-xl shadow-sm border-2 overflow-hidden">
            <div
              className="p-4 cursor-pointer hover:opacity-90 transition-opacity"
              style={{ backgroundColor: phase.color + '15', borderLeft: `4px solid ${phase.color}` }}
              onClick={() => togglePhaseExpanded(phase.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {phase.expanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  <div>
                    <h3 className="text-lg font-bold" style={{ color: phase.color }}>{phase.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{phase.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(phase.startDate).toLocaleDateString('fr-CA')} -> {new Date(phase.endDate).toLocaleDateString('fr-CA')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold" style={{ color: phase.color }}>
                    {phaseTasks.filter(t => t.status === 'completed').length}/{phaseTasks.length}
                  </div>
                  <div className="text-xs text-gray-500">taches completees</div>
                </div>
              </div>
            </div>
            
            {phase.expanded && (
              <div className="p-4 bg-gray-50">
                {phaseTasks.length > 0 ? (
                  phaseTasks.map(task => <TaskCard key={task.id} task={task} />)
                ) : (
                  <p className="text-gray-500 text-center py-8">Aucune tache dans cette phase</p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const KanbanView = () => {
    const columns = [
      { id: 'pending', title: 'En attente', color: 'bg-gray-50' },
      { id: 'inProgress', title: 'En cours', color: 'bg-blue-50' },
      { id: 'completed', title: 'Complete', color: 'bg-green-50' },
      { id: 'blocked', title: 'Bloque', color: 'bg-red-50' }
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map(column => {
          const columnTasks = filteredTasks.filter(t => t.status === column.id);
          
          return (
            <div key={column.id} className={`${column.color} rounded-xl p-4 border-2`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">{column.title}</h3>
                <span className="bg-white px-2 py-1 rounded-full text-sm font-semibold">
                  {columnTasks.length}
                </span>
              </div>
              <div className="space-y-2">
                {columnTasks.map(task => <TaskCard key={task.id} task={task} compact />)}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const ListView = () => (
    <div className="bg-white rounded-xl shadow-sm border-2 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b-2">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Statut</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tache</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Phase</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Priorite</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Assigne a</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredTasks.map(task => {
              const phase = phases.find(p => p.id === task.phaseId);
              const assignedResources = resources.filter(r => task.assignedTo.includes(r.id));
              
              return (
                <tr key={task.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <button onClick={() => toggleTaskStatus(task.id)}>
                      {task.status === 'completed' ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : task.status === 'inProgress' ? (
                        <Clock className="w-5 h-5 text-blue-600" />
                      ) : task.status === 'blocked' ? (
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className={task.status === 'completed' ? 'line-through text-gray-500' : ''}>
                      <div className="font-semibold">{task.title}</div>
                      <div className="text-sm text-gray-600">{task.description}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {phase && (
                      <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: phase.color + '20', color: phase.color }}>
                        {phase.name.split(':')[0]}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${priorityColors[task.priority]}`}>
                      {task.priority === 'high' ? 'Haute' : task.priority === 'medium' ? 'Moyenne' : 'Basse'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {assignedResources.map(resource => (
                        <span
                          key={resource.id}
                          className="text-xs px-2 py-1 rounded-full"
                          style={{ backgroundColor: resource.color + '20', color: resource.color }}
                        >
                          {resource.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {new Date(task.dueDate).toLocaleDateString('fr-CA')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => setEditingTask(task)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <Edit2 className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="p-1 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">Plateforme d'Integration RH</h1>
              <p className="text-blue-200 text-lg">Gestion complete de l'integration des nouveaux employes</p>
            </div>
            <div className="text-right">
              <div className="text-5xl font-bold mb-1">{stats.progress}%</div>
              <div className="text-blue-200">Progression globale</div>
            </div>
          </div>
          
          {/* Info employe */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <div className="text-blue-200 text-sm mb-1">Employe</div>
                <div className="font-semibold text-lg">{employee.name}</div>
              </div>
              <div>
                <div className="text-blue-200 text-sm mb-1">Poste</div>
                <div className="font-semibold">{employee.role}</div>
              </div>
              <div>
                <div className="text-blue-200 text-sm mb-1">Debut</div>
                <div className="font-semibold">{new Date(employee.startDate).toLocaleDateString('fr-CA')}</div>
              </div>
              <div>
                <div className="text-blue-200 text-sm mb-1">Fin prevue</div>
                <div className="font-semibold">{new Date(employee.endDate).toLocaleDateString('fr-CA')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats rapides */}
      <div className="max-w-7xl mx-auto px-6 -mt-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl shadow-lg p-4 border-2 border-gray-200">
            <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total taches</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-4 border-2 border-green-200">
            <div className="text-3xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-sm text-gray-600">Completees</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-4 border-2 border-blue-200">
            <div className="text-3xl font-bold text-blue-600">{stats.inProgress}</div>
            <div className="text-sm text-gray-600">En cours</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-4 border-2 border-gray-200">
            <div className="text-3xl font-bold text-gray-600">{stats.pending}</div>
            <div className="text-sm text-gray-600">En attente</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-4 border-2 border-red-200">
            <div className="text-3xl font-bold text-red-600">{stats.blocked}</div>
            <div className="text-sm text-gray-600">Bloquees</div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Barre d'outils */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6 border-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Recherche */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Rechercher une tache..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Filtres */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="inProgress">En cours</option>
              <option value="completed">Complete</option>
              <option value="blocked">Bloque</option>
            </select>

            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
            >
              <option value="all">Toutes priorites</option>
              <option value="high">Haute</option>
              <option value="medium">Moyenne</option>
              <option value="low">Basse</option>
            </select>

            <select
              value={filterResource}
              onChange={(e) => setFilterResource(e.target.value)}
              className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
            >
              <option value="all">Toutes ressources</option>
              {resources.map(resource => (
                <option key={resource.id} value={resource.id}>{resource.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-3 mt-4">
            {/* Modes de vue */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('timeline')}
                className={`px-4 py-2 rounded-lg transition-colors ${viewMode === 'timeline' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-200'}`}
              >
                <Calendar className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-4 py-2 rounded-lg transition-colors ${viewMode === 'kanban' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-200'}`}
              >
                <GripVertical className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-200'}`}
              >
                <Filter className="w-5 h-5" />
              </button>
            </div>

            {/* Actions */}
            <button
              onClick={exportData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Download className="w-5 h-5" /> Exporter
            </button>

            <label className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 cursor-pointer">
              <Upload className="w-5 h-5" /> Importer
              <input type="file" accept=".json" onChange={importData} className="hidden" />
            </label>
          </div>
        </div>

        {/* Vue principale */}
        {viewMode === 'timeline' && <TimelineView />}
        {viewMode === 'kanban' && <KanbanView />}
        {viewMode === 'list' && <ListView />}
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          {/* Avertissement de confidentialite */}
          <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4 mb-4 max-w-3xl mx-auto">
            <p className="text-yellow-300 font-semibold flex items-center justify-center gap-2">
              <AlertCircle className="w-5 h-5" />
               IMPORTANT : N'inscrivez aucune information confidentielle dans cette plateforme
            </p>
          </div>
          <p className="text-gray-400">
            Plateforme d'Integration RH
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Systeme de gestion complete pour l'integration des nouveaux employes
          </p>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPlatform;
