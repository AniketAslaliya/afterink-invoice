import React, { useState, useEffect } from 'react'
import { Plus, Search, Filter, Edit, Eye, FileText, Clock, CheckCircle, Pause, PlayCircle } from 'lucide-react'
import { apiGet, apiPost, apiPut } from '../api'
import { useAppSelector, useAppDispatch } from '../store';
import { fetchProjects } from '../store/projectsSlice';

interface Project {
  _id: string
  name: string
  description?: string
  category?: string
  client: {
    _id: string
    name: string
  }
  startDate: string
  endDate?: string
  budget?: number
  status: 'planning' | 'active' | 'completed' | 'on-hold'
  createdAt: string
}

const ProjectsPage: React.FC = () => {
  const projects = useAppSelector((state: any) => state.projects.projects);
  const loading = useAppSelector((state: any) => state.projects.loading);
  const error = useAppSelector((state: any) => state.projects.error);
  const dispatch = useAppDispatch();
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [clients, setClients] = useState<any[]>([])
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    clientId: '',
    category: 'Web Development',
    startDate: '',
    endDate: '',
    budget: 0,
    status: 'planning' as 'planning' | 'active' | 'completed' | 'on-hold'
  })
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    dispatch(fetchProjects());
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      console.log('Fetching clients from API...')
      const res = await apiGet('/clients')
      console.log('Clients API Response:', res)
      
      // Handle different response structures
      let clientsArray = [];
      if (res && res.data && res.data.clients) {
        clientsArray = res.data.clients;
      } else if (res && Array.isArray(res.clients)) {
        clientsArray = res.clients;
      } else if (res && Array.isArray(res)) {
        clientsArray = res;
      } else {
        console.warn('Unexpected clients response structure:', res);
        clientsArray = []; // Default to empty array
      }
      
      setClients(clientsArray)
    } catch (error) {
      console.error('Error fetching clients:', error)
    }
  }

  const handleAddProject = async () => {
    try {
      setSubmitting(true)
      const res = await apiPost('/projects', newProject)
      console.log('Project created:', res)
      
      // Add to local state
      const projectData = res.data?.project || res.project || res
      dispatch(fetchProjects())
      
      setShowCreateModal(false)
      setNewProject({
        name: '',
        clientId: '',
        description: '',
        category: 'Web Development',
        startDate: '',
        endDate: '',
        budget: 0,
        status: 'planning'
      })
    } catch (error: any) {
      console.error('Error creating project:', error)
      alert('Error creating project: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateProjectStatus = async (projectId: string, newStatus: 'planning' | 'active' | 'on-hold' | 'completed') => {
    try {
      setSubmitting(true)
      await apiPut(`/api/projects/${projectId}`, { status: newStatus })
      
      // Refresh projects from server
      dispatch(fetchProjects())
      
      console.log(`Project status updated to ${newStatus}`)
    } catch (error: any) {
      console.error('Error updating project status:', error)
      alert('Error updating project status: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditProject = (project: Project) => {
    if (!project || !project.client || !project.client._id) {
      alert('Project or client information is missing.');
      return;
    }
    setSelectedProject(project)
    setNewProject({
      name: project.name,
      clientId: project.client._id,
      description: project.description || '',
      category: project.category || 'Web Development',
      startDate: project.startDate?.split('T')[0] || '',
      endDate: project.endDate?.split('T')[0] || '',
      budget: project.budget || 0,
      status: project.status
    })
    setShowEditModal(true)
  }

  const handleUpdateProject = async () => {
    if (!selectedProject) return
    
    try {
      setSubmitting(true)
      await apiPut(`/api/projects/${selectedProject._id}`, newProject)
      
      // Refresh projects from server
      dispatch(fetchProjects())
      
      setShowEditModal(false)
      setSelectedProject(null)
    } catch (error: any) {
      console.error('Error updating project:', error)
      alert('Error updating project: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleViewProject = (project: Project) => {
    setSelectedProject(project)
    setShowViewModal(true)
  }

  const handleCreateInvoice = (project: Project) => {
    if (!project || !project._id || !project.client || !project.client._id) {
      alert('Project or client information is missing.');
      return;
    }
    sessionStorage.setItem('preselectedProject', JSON.stringify({
      id: project._id,
      name: project.name,
      clientId: project.client._id
    }))
    window.location.href = '/invoices'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-blue-100 text-blue-800'
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      case 'on-hold': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'N/A'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-purple-600/10 rounded-3xl blur-3xl"></div>
        <div className="relative bg-gradient-to-r from-secondary-200/60 to-secondary-300/60 backdrop-blur-lg rounded-2xl p-8 border border-secondary-300/30">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div>
              <h1 className="text-3xl font-bold text-gradient-secondary">Projects</h1>
              <p className="text-secondary-700 mt-2">Manage your project portfolio and track progress</p>
            </div>
            <div className="flex items-center space-x-3">
              <button className="btn btn-outline group">
                <Search className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                Search
              </button>
              <button className="btn btn-outline group">
                <Filter className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform" />
                Filter
              </button>
        <button 
                className="btn btn-primary group" 
                onClick={() => setShowCreateModal(true)}
                data-testid="add-project-btn"
        >
                <Plus className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform" />
                New Project
        </button>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Search and Filters */}
      <div className="bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-600 mb-8">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search projects by name, client, or description..."
              className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
            />
          </div>
          
          {/* Status Filter */}
          <select className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="on-hold">On Hold</option>
            <option value="planning">Planning</option>
          </select>
          
          {/* Sort Options */}
          <select className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white">
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name-az">Name A-Z</option>
            <option value="deadline">By Deadline</option>
          </select>
        </div>
      </div>

      {/* Project Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-2xl p-6 border border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-400 text-sm font-medium">Total Projects</p>
              <p className="text-2xl font-bold text-white">{projects.length}</p>
            </div>
            <div className="bg-blue-600 p-3 rounded-xl">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-2xl p-6 border border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-400 text-sm font-medium">Active</p>
              <p className="text-2xl font-bold text-white">{projects.filter((p: Project) => p.status === 'active').length}</p>
            </div>
            <div className="bg-green-600 p-3 rounded-xl">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-2xl p-6 border border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-400 text-sm font-medium">Planning</p>
              <p className="text-2xl font-bold text-white">{projects.filter((p: Project) => p.status === 'planning').length}</p>
            </div>
            <div className="bg-yellow-600 p-3 rounded-xl">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-2xl p-6 border border-gray-600">
          <div className="flex items-center justify-between">
                      <div>
              <p className="text-orange-400 text-sm font-medium">On Hold</p>
              <p className="text-2xl font-bold text-white">{projects.filter((p: Project) => p.status === 'on-hold').length}</p>
            </div>
            <div className="bg-orange-600 p-3 rounded-xl">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Projects List */}
      <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-600">
        <div className="p-6 border-b border-gray-600">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">All Projects</h2>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400">{projects.length} total projects</span>
              <button className="p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-700 rounded-lg transition-colors">
                <Filter size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-300">Loading projects...</span>
            </div>
          )}
          
          {error === 'authentication' && (
            <div className="text-center py-12">
              <div className="bg-gray-700 border border-gray-600 rounded-xl p-6 max-w-md mx-auto">
                <div className="text-yellow-400 text-4xl mb-4">🔒</div>
                <h3 className="text-lg font-semibold text-white mb-2">Authentication Required</h3>
                <p className="text-gray-300 text-sm mb-4">Please log in to view your projects</p>
                <a 
                  href="/login" 
                  className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  Go to Login
                </a>
              </div>
            </div>
          )}
          
          {error && error !== 'authentication' && (
            <div className="text-center py-12">
              <div className="bg-gray-700 border border-gray-600 rounded-xl p-6 max-w-md mx-auto">
                <div className="text-red-400 text-4xl mb-4">⚠️</div>
                <h3 className="text-lg font-semibold text-white mb-2">Error Loading Projects</h3>
                <p className="text-gray-300 text-sm">{error}</p>
              </div>
            </div>
          )}
          
          {!loading && (!error || error === 'authentication') && projects.length === 0 && (
            <div className="text-center py-12">
              <div className="bg-gray-700 border border-gray-600 rounded-xl p-8 max-w-md mx-auto">
                <div className="text-gray-500 text-6xl mb-4">📁</div>
                <h3 className="text-lg font-semibold text-white mb-2">No Projects Yet</h3>
                <p className="text-gray-300 text-sm mb-6">Start organizing your work by creating your first project!</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 mx-auto transition-all"
                >
                  <Plus size={20} />
                  Create First Project
                </button>
              </div>
            </div>
          )}
          
          {!loading && !error && projects.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {projects.map((project: Project) => {
                const statusColors: Record<string, string> = {
                  'active': 'bg-green-900 text-green-400 border-green-700',
                  'completed': 'bg-blue-900 text-blue-400 border-blue-700',
                  'on-hold': 'bg-orange-900 text-orange-400 border-orange-700',
                  'planning': 'bg-yellow-900 text-yellow-400 border-yellow-700'
                };
                
                // Calculate progress (date-based if possible)
                let progress = 0;
                if (project.startDate && project.endDate) {
                  const start = new Date(project.startDate).getTime();
                  const end = new Date(project.endDate).getTime();
                  const now = Date.now();
                  if (end > start) {
                    progress = Math.round(((now - start) / (end - start)) * 100);
                    progress = Math.max(0, Math.min(progress, 100));
                  }
                } else {
                  // Fallback: status-based
                  progress = project.status === 'completed' ? 100 : 
                             project.status === 'active' ? 65 : 
                             project.status === 'planning' ? 25 : 15;
                }
                
                return (
                  <div key={project._id} className="border border-gray-600 rounded-xl p-6 hover:shadow-lg hover:bg-gray-700 transition-all duration-200">
                    <div className="flex items-start justify-between mb-4">
                      {/* Project Info */}
                      <div className="flex items-center gap-4">
                        <div className="bg-purple-900 p-3 rounded-xl">
                          <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-semibold text-white text-lg">{project.name}</h3>
                          <p className="text-gray-400 text-sm">
                            Client: <span className="text-gray-300">{project.client?.name || 'Unknown Client'}</span>
                          </p>
                      </div>
                      </div>

                      {/* Status Badge */}
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[project.status] || 'bg-gray-700 text-gray-300 border-gray-600'}`}>
                        {project.status?.charAt(0).toUpperCase() + project.status?.slice(1) || 'Unknown'}
                      </span>
                    </div>

                    {/* Description */}
                    {project.description && (
                      <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                        {project.description}
                      </p>
                    )}

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-400">Progress</span>
                        <span className="text-xs text-gray-300">{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-600 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Project Details */}
                    <div className="space-y-2 mb-4">
                      {project.startDate && (
                        <div className="flex items-center gap-2 text-gray-400 text-sm">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-gray-300">Started: {new Date(project.startDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      {project.endDate && (
                        <div className="flex items-center gap-2 text-gray-400 text-sm">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-gray-300">Deadline: {new Date(project.endDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-4 border-t border-gray-600">
                      <button
                        className="flex-1 bg-blue-900 hover:bg-blue-800 text-blue-400 py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                        onClick={() => project && project.client && project.client._id ? handleViewProject(project) : alert('Project or client information is missing.')}
                      >
                        View Details
                      </button>
                      <button
                        className="bg-gray-700 hover:bg-gray-600 text-gray-300 py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                        onClick={() => project && project.client && project.client._id ? handleEditProject(project) : alert('Project or client information is missing.')}
                      >
                        Edit
                        </button>
                      <button
                        className="bg-green-900 hover:bg-green-800 text-green-400 py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                        onClick={() => project && project.client && project.client._id ? handleCreateInvoice(project) : alert('Project or client information is missing.')}
                      >
                        Invoice
                        </button>
                      </div>
                  </div>
                );
              })}
          </div>
          )}
        </div>
      </div>

      {/* Add Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-gray-900 rounded-xl p-8 w-full max-w-2xl shadow-lg relative mx-4 my-8 border border-gray-700">
            <button 
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl leading-none" 
              onClick={() => setShowCreateModal(false)}
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-6 text-white">Create New Project</h2>
            
            <div className="space-y-6 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                    placeholder="Enter project name"
                  />
                </div>

              <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Client
                  </label>
                  <select
                    value={newProject.clientId}
                    onChange={(e) => setNewProject({ ...newProject, clientId: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                  >
                    <option value="">Select a client</option>
                    {clients.map((client) => (
                      <option key={client._id} value={client._id}>
                        {client.companyName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                  placeholder="Enter project description"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Category *
                </label>
                <select
                  value={newProject.category}
                  onChange={(e) => setNewProject({ ...newProject, category: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                >
                  <option value="Web Design">Web Design</option>
                  <option value="Web Development">Web Development</option>
                  <option value="Mobile App">Mobile App</option>
                  <option value="Branding">Branding</option>
                  <option value="Logo Design">Logo Design</option>
                  <option value="Marketing">Marketing</option>
                  <option value="SEO">SEO</option>
                  <option value="Content Creation">Content Creation</option>
                  <option value="Consulting">Consulting</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    value={newProject.status}
                    onChange={(e) => setNewProject({ ...newProject, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                  >
                    <option value="planning">Planning</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="on-hold">On Hold</option>
                  </select>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={newProject.startDate}
                  onChange={(e) => setNewProject({ ...newProject, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                />
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={newProject.endDate}
                  onChange={(e) => setNewProject({ ...newProject, endDate: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Budget
                </label>
                <input
                  type="number"
                  value={newProject.budget}
                  onChange={(e) => setNewProject({ ...newProject, budget: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-700">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-300 border border-gray-600 rounded-md hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleAddProject}
                disabled={!newProject.name || !newProject.startDate}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-gray-900 rounded-xl p-8 w-full max-w-2xl shadow-lg relative mx-4 my-8 border border-gray-700">
            <button 
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl leading-none" 
              onClick={() => setShowEditModal(false)}
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-6 text-white">Edit Project</h2>
            
            <div className="space-y-6 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                    placeholder="Enter project name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Client
                  </label>
                  <select
                    value={newProject.clientId}
                    onChange={(e) => setNewProject({ ...newProject, clientId: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                  >
                    <option value="">Select a client</option>
                    {clients.map((client) => (
                      <option key={client._id} value={client._id}>
                        {client.companyName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                  placeholder="Enter project description"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Category *
                </label>
                <select
                  value={newProject.category}
                  onChange={(e) => setNewProject({ ...newProject, category: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                >
                  <option value="Web Design">Web Design</option>
                  <option value="Web Development">Web Development</option>
                  <option value="Mobile App">Mobile App</option>
                  <option value="Branding">Branding</option>
                  <option value="Logo Design">Logo Design</option>
                  <option value="Marketing">Marketing</option>
                  <option value="SEO">SEO</option>
                  <option value="Content Creation">Content Creation</option>
                  <option value="Consulting">Consulting</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    value={newProject.status}
                    onChange={(e) => setNewProject({ ...newProject, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                  >
                    <option value="planning">Planning</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="on-hold">On Hold</option>
                  </select>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={newProject.startDate}
                    onChange={(e) => setNewProject({ ...newProject, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={newProject.endDate}
                    onChange={(e) => setNewProject({ ...newProject, endDate: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Budget
                </label>
                <input
                  type="number"
                  value={newProject.budget}
                  onChange={(e) => setNewProject({ ...newProject, budget: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-700">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-300 border border-gray-600 rounded-md hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateProject}
                disabled={!newProject.name || !newProject.startDate}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Update Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Project Modal */}
      {showViewModal && selectedProject && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-gray-900 rounded-xl p-8 w-full max-w-3xl shadow-lg relative mx-4 my-8 border border-gray-700">
            <button 
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl leading-none" 
              onClick={() => setShowViewModal(false)}
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-6 text-white">{selectedProject.name}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Client</label>
                  <p className="text-white text-lg">{selectedProject.client?.name || 'Unknown Client'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Category</label>
                  <p className="text-white text-lg">{selectedProject.category || 'Not specified'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Status</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedProject.status)}`}>
                    {selectedProject.status}
                  </span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Budget</label>
                  <p className="text-white text-lg">{formatCurrency(selectedProject.budget)}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Start Date</label>
                  <p className="text-white">{formatDate(selectedProject.startDate)}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">End Date</label>
                  <p className="text-white">{selectedProject.endDate ? formatDate(selectedProject.endDate) : 'Not specified'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Created</label>
                  <p className="text-white">{formatDate(selectedProject.createdAt)}</p>
                </div>
              </div>
            </div>
            
            {selectedProject.description && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
                <p className="text-gray-300 bg-gray-800 p-4 rounded-lg">{selectedProject.description}</p>
              </div>
            )}
            
            <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-700">
              <button
                onClick={() => {
                  setShowViewModal(false)
                  selectedProject && selectedProject.client && selectedProject.client._id ? handleEditProject(selectedProject) : alert('Project or client information is missing.')
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                <Edit className="h-4 w-4 inline mr-2" />
                Edit Project
              </button>
              <button
                onClick={() => selectedProject && selectedProject.client && selectedProject.client._id ? handleCreateInvoice(selectedProject) : alert('Project or client information is missing.')}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                <FileText className="h-4 w-4 inline mr-2" />
                Create Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProjectsPage 