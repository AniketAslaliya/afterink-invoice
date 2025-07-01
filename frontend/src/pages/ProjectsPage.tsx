import React from 'react'
import { Plus } from 'lucide-react'

const ProjectsPage: React.FC = () => {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-secondary-950">Projects</h1>
        <button className="btn btn-primary flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>New Project</span>
        </button>
      </div>

      <div className="card">
        <div className="card-body text-center py-12">
          <p className="text-secondary-800 mb-4">Project management coming soon...</p>
          <p className="text-sm text-secondary-700">This page will display and manage all your projects.</p>
        </div>
      </div>
    </div>
  )
}

export default ProjectsPage 