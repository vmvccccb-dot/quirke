import { createProject } from './actions'
import ImageUploader from './image-uploader'
import styles from './admin.module.css'

type TagRow = { id: number; name: string }

export default function CreateProjectForm({ tags, clearImageDraftToken }: { tags: TagRow[]; clearImageDraftToken?: string }) {
  return (
    <form className={styles.projectEditor} action={createProject}>
      <div className={styles.projectEditorHeading}>
        <div><span className={styles.projectId}>NUEVA FICHA</span><h3>Crear proyecto</h3></div>
        <label className={styles.statusControl}>
          <span>Visibilidad</span>
          <select name="status" defaultValue="active">
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
          </select>
        </label>
      </div>

      <div className={styles.projectFields}>
        <label>Título<input name="title" maxLength={200} required /></label>
        <label>Tipo<input name="type" maxLength={50} required /></label>
        <label>Ubicación<input name="location" maxLength={200} /></label>
        <label>Precio (opcional)<input name="price" type="number" min="0" step="0.01" /></label>
        <label className={styles.fullField}>Descripción<textarea name="description" rows={4} maxLength={5000} /></label>
        <div className={`${styles.fullField} ${styles.projectImages}`}>
          <ImageUploader projectId="new" initialValue={[]} clearDraftToken={clearImageDraftToken} />
        </div>
      </div>

      <fieldset className={styles.tagChoices}>
        <legend>Etiquetas de esta propiedad</legend>
        {tags.length === 0 ? <span className={styles.mutedText}>Aún no hay etiquetas.</span> : tags.map((tag) => (
          <label className={styles.checkTag} key={tag.id}>
            <input type="checkbox" name="tag_ids" value={tag.id} />
            <span>{tag.name}</span>
          </label>
        ))}
      </fieldset>

      <div className={styles.projectSaveRow}>
        <span>Los proyectos activos se muestran en el sitio público.</span>
        <button className={styles.actionButton} type="submit">Crear proyecto</button>
      </div>
    </form>
  )
}