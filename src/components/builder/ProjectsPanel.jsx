import { useEffect, useState } from 'react'
import Card from '../common/Card'
import Button from '../common/Button'
import ConfirmDialog from '../common/ConfirmDialog'
import ProjectEditorModal from './ProjectEditorModal'
import { createEmptyProject } from '../../data/formSchema'
import { listProjects, saveProject, deleteProject } from '../../utils/projectStore'

/**
 * Global Settings' "create a project, upload its images, get its own
 * branding" panel. Applying a project to a form happens elsewhere
 * (BuilderScreen.jsx's branding panel, via BrandEditor.jsx's "Your
 * Projects" presets) — this screen only manages the saved set.
 */
export default function ProjectsPanel({ detectedBrands }) {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null) // null = closed, {} = new, a project = edit
  const [pendingDelete, setPendingDelete] = useState(null)

  async function refresh() {
    try {
      setProjects(await listProjects())
      setError('')
    } catch (err) {
      setError(`Couldn't load projects: ${err.message}`)
    }
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false))
  }, [])

  async function handleSave(project) {
    await saveProject(project.id ? project : { ...createEmptyProject(), ...project })
    await refresh()
  }

  async function handleDeleteConfirmed() {
    const project = pendingDelete
    setPendingDelete(null)
    try {
      await deleteProject(project.id)
      await refresh()
    } catch (err) {
      setError(`Couldn't delete "${project.name}": ${err.message}`)
    }
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Projects</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            A saved, reusable brand — upload its logo/background once, then apply it to any form from the Builder.
          </p>
        </div>
        <Button size="sm" onClick={() => setEditing({})}>
          + New Project
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading projects…</p>
      ) : projects.length === 0 ? (
        <Card className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">No projects yet.</Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {projects.map((project) => (
            <Card key={project.id} className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                {project.brand?.logoLight && (
                  <img src={project.brand.logoLight} alt="" className="h-8 w-8 shrink-0 rounded object-contain" />
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{project.name}</p>
                  {project.brand?.colors?.[500] && (
                    <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                      <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: project.brand.colors[500] }} />
                      Custom branding
                    </span>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button size="sm" variant="secondary" onClick={() => setEditing(project)}>
                  Edit
                </Button>
                <Button size="sm" variant="danger" onClick={() => setPendingDelete(project)}>
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {editing && (
        <ProjectEditorModal
          project={editing.id ? editing : null}
          detectedBrands={detectedBrands}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete project?"
        message={`"${pendingDelete?.name}" will be removed from your saved projects. Forms already using its branding keep their current look — this doesn't change any form, it just removes the preset.`}
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}
