'use client'

import { deleteProject } from './actions'
import styles from './admin.module.css'

export default function DeleteProjectButton({ title }: { title: string }) {
  return (
    <button
      className={styles.deleteProjectButton}
      type="submit"
      formAction={deleteProject}
      onClick={(event) => {
        if (!window.confirm(`¿Eliminar el proyecto "${title}"? Esta acción no se puede deshacer.`)) {
          event.preventDefault()
        }
      }}
    >
      Eliminar proyecto
    </button>
  )
}