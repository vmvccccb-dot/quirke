import { redirect } from 'next/navigation'
import { requireUser } from '../../lib/auth'
import { getDatabase } from '../../lib/database'
import { logout } from './login/actions'
import { saveProject, saveWhatsApp } from './actions'
import styles from './admin.module.css'

export const dynamic = 'force-dynamic'

type ProjectRow = {
  id: number
  title: string
  type: string
  description: string | null
  location: string | null
  price: string | null
  status: string
  image_urls: string[]
  tag_ids: number[]
}

type TagRow = { id: number; name: string }
type SearchParams = Promise<{ saved?: string; error?: string }>

const errorMessages: Record<string, string> = {
  'invalid-project': 'Revisa el título, tipo y estado de la propiedad.',
  'invalid-price': 'El precio debe ser un número positivo con hasta dos decimales.',
  'invalid-images': 'Usa hasta 8 rutas /media/ o direcciones HTTPS para las imágenes.',
  'save-project': 'No se pudo guardar la propiedad. Revisa e intenta otra vez.',
  'invalid-whatsapp': 'Ingresa un teléfono internacional válido, solo con dígitos y prefijo de país.',
}

export default async function AdminPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser()
  if (user.role !== 'admin') redirect('/admin/tags')

  const [projectsResult, tagsResult, settingsResult, query] = await Promise.all([
    getDatabase().query<ProjectRow>(
      `SELECT project.id, project.title, project.type, project.description,
              project.location, project.price::text, project.status, project.image_urls,
              COALESCE(ARRAY_AGG(project_tag.tag_id) FILTER (WHERE project_tag.tag_id IS NOT NULL), '{}') AS tag_ids
       FROM app.projects AS project
       LEFT JOIN app.project_tags AS project_tag ON project_tag.project_id = project.id
       GROUP BY project.id
       ORDER BY project.created_at DESC, project.id`,
    ),
    getDatabase().query<TagRow>('SELECT id, name FROM app.tags ORDER BY LOWER(name), id'),
    getDatabase().query<{ value: string }>(
      "SELECT value FROM app.site_settings WHERE key = 'whatsapp_number'",
    ),
    searchParams,
  ])

  const whatsappNumber = settingsResult.rows[0]?.value ?? ''
  const successMessage = query.saved === 'project'
    ? 'Propiedad guardada.'
    : query.saved === 'whatsapp'
      ? 'Número de WhatsApp actualizado.'
      : null

  return (
    <main className={styles.dashboard}>
      <header className={styles.dashboardHeader}>
        <a className={styles.dashboardBrand} href="/" aria-label="Quirke Inmobiliaria">
          <img src="/media/logo.png" alt="" />
          <span><b>Quirke</b><small>INMOBILIARIA</small></span>
        </a>
        <nav className={styles.dashboardNav} aria-label="Administración">
          <a className={styles.navActive} href="/admin">Propiedades y sitio</a>
          <a href="/admin/tags">Etiquetas</a>
        </nav>
        <div className={styles.headerUser}>
          <span>{user.name}</span>
          <form action={logout}><button className={styles.logoutButton} type="submit">Salir</button></form>
        </div>
      </header>

      <section className={styles.managementMain}>
        <p className={styles.eyebrow}>QUIRKE · ADMINISTRACIÓN</p>
        <h1>Contenido del sitio</h1>
        <p className={styles.managementIntro}>Actualiza la información que ven las personas en la web pública.</p>

        {query.error && <p className={styles.noticeError} role="alert">{errorMessages[query.error] ?? 'No se pudo completar el cambio.'}</p>}
        {successMessage && <p className={styles.noticeSuccess} role="status">{successMessage}</p>}

        <section className={styles.settingsSection} aria-labelledby="whatsapp-heading">
          <div className={styles.sectionTitleRow}>
            <div><p className={styles.eyebrow}>CONTACTO PÚBLICO</p><h2 id="whatsapp-heading">WhatsApp</h2></div>
            <span className={styles.sectionNumber}>01</span>
          </div>
          <form className={styles.whatsappForm} action={saveWhatsApp}>
            <label htmlFor="whatsapp-number">Número con prefijo internacional</label>
            <div className={styles.inlineForm}>
              <input id="whatsapp-number" name="whatsapp_number" type="tel" defaultValue={whatsappNumber} placeholder="56912345678" required />
              <button className={styles.actionButton} type="submit">Guardar número</button>
            </div>
          </form>
        </section>

        <section className={styles.projectsSection} aria-labelledby="projects-heading">
          <div className={styles.sectionTitleRow}>
            <div><p className={styles.eyebrow}>FICHAS PUBLICADAS</p><h2 id="projects-heading">Propiedades</h2></div>
            <span className={styles.itemCount}>{projectsResult.rows.length} fichas</span>
          </div>

          {projectsResult.rows.length === 0 ? (
            <p className={styles.emptyState}>Todavía no hay propiedades cargadas. Ejecuta la carga inicial indicada en la guía de configuración.</p>
          ) : (
            <div className={styles.projectList}>
              {projectsResult.rows.map((project) => (
                <form className={styles.projectEditor} action={saveProject} key={project.id}>
                  <input type="hidden" name="id" value={project.id} />
                  <div className={styles.projectEditorHeading}>
                    <div><span className={styles.projectId}>FICHA {String(project.id).padStart(2, '0')}</span><h3>{project.title}</h3></div>
                    <label className={styles.statusControl}>
                      <span>Visibilidad</span>
                      <select name="status" defaultValue={project.status}>
                        <option value="active">Visible</option>
                        <option value="draft">Borrador</option>
                      </select>
                    </label>
                  </div>

                  <div className={styles.projectFields}>
                    <label>Título<input name="title" defaultValue={project.title} maxLength={200} required /></label>
                    <label>Tipo<input name="type" defaultValue={project.type} maxLength={50} required /></label>
                    <label>Ubicación<input name="location" defaultValue={project.location ?? ''} maxLength={200} /></label>
                    <label>Precio (opcional)<input name="price" type="number" min="0" step="0.01" defaultValue={project.price ?? ''} /></label>
                    <label className={styles.fullField}>Descripción<textarea name="description" defaultValue={project.description ?? ''} rows={4} maxLength={5000} /></label>
                    <label className={styles.fullField}>Imágenes, una ruta o URL por línea<textarea name="image_urls" defaultValue={project.image_urls.join('\n')} rows={3} /></label>
                  </div>

                  <fieldset className={styles.tagChoices}>
                    <legend>Etiquetas de esta propiedad</legend>
                    {tagsResult.rows.length === 0 ? <span className={styles.mutedText}>Aún no hay etiquetas.</span> : tagsResult.rows.map((tag) => (
                      <label className={styles.checkTag} key={tag.id}>
                        <input type="checkbox" name="tag_ids" value={tag.id} defaultChecked={project.tag_ids.includes(tag.id)} />
                        <span>{tag.name}</span>
                      </label>
                    ))}
                  </fieldset>

                  <div className={styles.projectSaveRow}><span>Los cambios se reflejan en la web pública.</span><button className={styles.actionButton} type="submit">Guardar ficha</button></div>
                </form>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  )
}