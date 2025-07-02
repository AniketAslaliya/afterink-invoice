import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Calendar, DollarSign, User } from 'lucide-react'
import { apiGet, apiPost } from '../api'

interface Project {
  _id: string
  name: string
  description?: string
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
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [clients, setClients] = useState<any[]>([])
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    client: '',
    category: 'Other',
    startDate: '',
    endDate: '',
    budget: '',
    status: 'planning' as const
  })

  useEffect(() => {
    fetchProjects()
    fetchClients()
  }, [])

  const fetchProjects = async () => {
    try {
      console.log('Fetching projects from API...')
      const res = await apiGet('/projects')
      console.log('Projects API Response:', res)
      
      // Handle different response structures
      let projectsArray = [];
      if (res && res.data && res.data.projects) {
        projectsArray = res.data.projects;
      } else if (res && Array.isArray(res.projects)) {
        projectsArray = res.projects;
      } else if (res && Array.isArray(res)) {
        projectsArray = res;
      } else {
        console.warn('Unexpected projects response structure:', res);
        projectsArray = []; // Default to empty array
      }
      
      setProjects(projectsArray)
    } catch (error: any) {
      console.error('Fetch projects error:', error)
      // For projects, we'll just set empty array and let the "no projects found" message show
      setProjects([])
    } finally {
      setLoading(false)
    }
  }

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
      const projectData = {
        name: newProject.name,
        description: newProject.description,
        clientId: newProject.client,
        startDate: newProject.startDate,
        endDate: newProject.endDate || undefined,
        budget: newProject.budget ? parseFloat(newProject.budget) : 0,
        status: newProject.status,
        category: newProject.category
      }
      
      console.log('Sending project data:', projectData)
      const res = await apiPost('/projects', projectData)
      console.log('Project API Response:', res)
      
      let projectObject;
      if (res && res.data && res.data.project) {
        projectObject = res.data.project;
      } else if (res && res.project) {
        projectObject = res.project;
      } else if (res && res._id) {
        projectObject = res;
      } else {
        console.error('Unexpected project response structure:', res);
        throw new Error('Unexpected API response structure. Check console for details.');
      }
      
      setProjects([projectObject, ...projects])
      setShowAddModal(false)
      setNewProject({
        name: '',
        description: '',
        client: '',
        category: 'Other',
        startDate: '',
        endDate: '',
        budget: '',
        status: 'planning'
      })
      
      console.log('Project created successfully!')
    } catch (error: any) {
      console.error('Error creating project:', error)
      alert('Error creating project: ' + (error.message || 'Unknown error'))
    }
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
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-secondary-950">Projects</h1>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary flex items-center space-x-2"
          data-testid="add-project-btn"
        >
          <Plus className="h-4 w-4" />
          <span>New Project</span>
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-12">
            <div className="text-lg mb-2">🚀 No projects found</div>
            <p className="text-sm text-secondary-700 mb-4">
              {localStorage.getItem('token') ? 
                'Create your first project to get started!' : 
                'Please log in to view and manage projects.'
              }
            </p>
            {localStorage.getItem('token') && (
              <button 
                onClick={() => setShowAddModal(true)}
                className="btn btn-primary"
                data-testid="add-project-btn"
              >
                Create First Project
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-secondary-200">
                  <th className="text-left py-3 px-4 font-medium text-secondary-900">Project</th>
                  <th className="text-left py-3 px-4 font-medium text-secondary-900">Client</th>
                  <th className="text-left py-3 px-4 font-medium text-secondary-900">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-secondary-900">Start Date</th>
                  <th className="text-left py-3 px-4 font-medium text-secondary-900">End Date</th>
                  <th className="text-left py-3 px-4 font-medium text-secondary-900">Budget</th>
                  <th className="text-left py-3 px-4 font-medium text-secondary-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project._id} className="border-b border-secondary-100 hover:bg-secondary-50">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium text-secondary-900">{project.name}</div>
                        {project.description && (
                          <div className="text-sm text-secondary-600">{project.description}</div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <User className="h-4 w-4 text-secondary-400 mr-2" />
                        <span className="text-secondary-900">{project.client?.name || 'No Client'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}>
                        {project.status.charAt(0).toUpperCase() + project.status.slice(1).replace('-', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center text-secondary-600">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(project.startDate)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center text-secondary-600">
                        <Calendar className="h-4 w-4 mr-1" />
                        {project.endDate ? formatDate(project.endDate) : 'Ongoing'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center text-secondary-600">
                        <DollarSign className="h-4 w-4 mr-1" />
                        {formatCurrency(project.budget)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <button className="text-secondary-600 hover:text-primary-600">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="text-secondary-600 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Project Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md border border-gray-700">
            <h2 className="text-lg font-semibold mb-4 text-white">Add New Project</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  placeholder="Enter project name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  placeholder="Enter project description"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Client
                </label>
                <select
                  value={newProject.client}
                  onChange={(e) => setNewProject({ ...newProject, client: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                >
                  <option value="">Select a client</option>
                  {clients.map((client) => (
                    <option key={client._id} value={client._id}>
                      {client.companyName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Category
                </label>
                <select
                  value={newProject.category}
                  onChange={(e) => setNewProject({ ...newProject, category: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
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
                  Start Date *
                </label>
                <input
                  type="date"
                  value={newProject.startDate}
                  onChange={(e) => setNewProject({ ...newProject, startDate: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
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
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Budget
                </label>
                <input
                  type="number"
                  value={newProject.budget}
                  onChange={(e) => setNewProject({ ...newProject, budget: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={newProject.status}
                  onChange={(e) => setNewProject({ ...newProject, status: e.target.value as any })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                >
                  <option value="planning">Planning</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="on-hold">On Hold</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-300 border border-gray-600 rounded-md hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleAddProject}
                disabled={!newProject.name || !newProject.startDate}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProjectsPage 