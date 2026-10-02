import type { Metadata } from 'next'
import { requireUser } from '../../../lib/auth'
import { getDatabase } from '../../../lib/database'
import { createTag, deleteTag, renameTag } from '../actions'
import { logout } from '../login/actions'
import styles from '../admin.module.css'

export const metadata: Metadata = { title: 'Etiquetas | Quirke Inmobiliaria' }
export const dynamic = 'force-dynamic'

type TagRow = { id: number; name: string; project_count: number }
type SearchParams = Promise<{ saved?: string; error?: string }>

const statusMessages: Record<string, string> = {
  created: 'Etiqueta creada.',
  updated: 'Etiqueta actualizada.',
  deleted: 'Etiqueta eliminada de las propiedades asociadas.',
}

const errorMessages: Record<string, string> = {
  empty: 'Escribe un nombre para la etiqueta.',
  duplicate: 'Ya existe una etiqueta con ese nombre.',
  invalid: 'No se encontró la etiqueta solicitada.',
}

export default async function TagsPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser()
  const [result, query] = await Promise.all([
    getDatabase().query<TagRow>(
      `SELECT tag.id, tag.name, COUNT(project_tag.project_id)::int AS project_count
       FROM app.tags AS tag
       LEFT JOIN app.project_tags AS project_tag ON project_tag.tag_id = tag.id
       GROUP BY tag.id
       ORDER BY LOWER(tag.name), tag.id`,
    ),
    searchParams,
  ])

  return (
    <main className={styles.dashboard}>
      <header className={styles.dashboardHeader}>
        <a className={styles.dashboardBrand} href="/" aria-label="Quirke Inmobiliaria">
          <img src="/media/logo.png" alt="" />
          <span><b>Quirke</b><small>INMOBILIARIA</small></span>
        </a>
        <nav className={styles.dashboardNav} aria-label="Administración">
          <a href="/admin">Propiedades</a>
          <a className={styles.navActive} href="/admin/tags">Etiquetas</a>
        </nav>
        <div className={styles.headerUser}>
          <span>{user.name}</span>
          <form action={logout}><button className={styles.logoutButton} type="submit">Salir</button></form>
        </div>
      </header>

      <section className={styles.managementMain}>
        <p className={styles.eyebrow}>QUIRKE · CONTENIDO</p>
        <div className={styles.tagsTitleRow}>
          <div><h1>Etiquetas</h1><p className={styles.managementIntro}>Organiza las características que distinguen cada propiedad.</p></div>
          <span className={user.role === 'admin' ? styles.adminBadge : styles.publisherBadge}>{user.role === 'admin' ? 'Administrador' : 'Publicador'}</span>
        </div>

        {query.error && <p className={styles.noticeError} role="alert">{errorMessages[query.error] ?? 'No se pudo completar el cambio.'}</p>}
        {query.saved && <p className={styles.noticeSuccess} role="status">{statusMessages[query.saved] ?? 'Cambios guardados.'}</p>}

        <form className={styles.createTagForm} action={createTag}>
          <label htmlFor="new-tag">Nueva etiqueta</label>
          <div className={styles.inlineForm}>
            <input id="new-tag" name="name" placeholder="Ej. Vista al mar" maxLength={60} required />
            <button className={styles.actionButton} type="submit">Crear etiqueta</button>
          </div>
        </form>

        <section className={styles.tagListSection} aria-label="Etiquetas existentes">
          <div className={styles.tagListHeading}><h2>Etiquetas actuales</h2><span className={styles.itemCount}>{result.rows.length} etiquetas</span></div>
          {result.rows.length === 0 ? <p className={styles.emptyState}>Todavía no hay etiquetas.</p> : (
            <div className={styles.tagList}>
              {result.rows.map((tag) => (
                <div className={styles.tagRow} key={tag.id}>
                  <form className={styles.renameTagForm} action={renameTag}>
                    <input type="hidden" name="id" value={tag.id} />
                    <label className={styles.visuallyHidden} htmlFor={`tag-${tag.id}`}>Nombre de {tag.name}</label>
                    <input id={`tag-${tag.id}`} name="name" defaultValue={tag.name} maxLength={60} required />
                    <span className={styles.tagUsage}>{tag.project_count} propiedades</span>
                    <button className={styles.textAction} type="submit">Guardar</button>
                  </form>
                  <form action={deleteTag}>
                    <input type="hidden" name="id" value={tag.id} />
                    <button className={styles.deleteAction} type="submit" aria-label={`Eliminar etiqueta ${tag.name}`}>Eliminar</button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  )
}