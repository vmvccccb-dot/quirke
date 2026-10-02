'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireRole, requireUser } from '../../lib/auth'
import { getDatabase } from '../../lib/database'

function field(formData: FormData, name: string, maxLength: number) {
  const value = formData.get(name)
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

function refreshContent() {
  revalidatePath('/')
  revalidatePath('/admin')
  revalidatePath('/admin/tags')
  revalidatePath('/api/public-content')
}

export async function saveProject(formData: FormData) {
  await requireRole('admin')

  const id = Number(field(formData, 'id', 12))
  const title = field(formData, 'title', 200)
  const type = field(formData, 'type', 50)
  const description = field(formData, 'description', 5000)
  const location = field(formData, 'location', 200)
  const rawPrice = field(formData, 'price', 30)
  const status = field(formData, 'status', 30)
  const imageUrls = field(formData, 'image_urls', 2000)
    .split('\n')
    .map((image) => image.trim())
    .filter(Boolean)
  const tagIds = [...new Set(formData.getAll('tag_ids')
    .filter((value): value is string => typeof value === 'string')
    .map(Number)
    .filter((value) => Number.isSafeInteger(value) && value > 0))]

  if (!Number.isSafeInteger(id) || id < 1 || !title || !type || !['active', 'inactive'].includes(status)) {
    redirect('/admin?error=invalid-project')
  }
  if (rawPrice && (!/^\d+(\.\d{1,2})?$/.test(rawPrice) || Number(rawPrice) < 0)) {
    redirect('/admin?error=invalid-price')
  }
  if (imageUrls.length > 8 || imageUrls.some((image) => !image.startsWith('/media/') && !/^https:\/\//i.test(image))) {
    redirect('/admin?error=invalid-images')
  }

  const database = getDatabase()
  const client = await database.connect()
  try {
    await client.query('BEGIN')
    const updated = await client.query(
      `UPDATE app.projects
       SET title = $2, type = $3, description = $4, location = $5,
           price = $6, status = $7, image_urls = $8
       WHERE id = $1`,
      [id, title, type, description || null, location || null, rawPrice || null, status, imageUrls],
    )
    if (updated.rowCount !== 1) throw new Error('Proyecto no encontrado.')

    const tags = await client.query<{ count: string }>(
      'SELECT COUNT(*)::text AS count FROM app.tags WHERE id = ANY($1::int[])',
      [tagIds],
    )
    if (Number(tags.rows[0]?.count ?? 0) !== tagIds.length) throw new Error('Etiqueta no válida.')

    await client.query('DELETE FROM app.project_tags WHERE project_id = $1', [id])
    if (tagIds.length) {
      await client.query(
        `INSERT INTO app.project_tags (project_id, tag_id)
         SELECT $1, tag_id FROM UNNEST($2::int[]) AS tag_id`,
        [id, tagIds],
      )
    }
    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('No se pudo guardar el proyecto.', error)
    redirect('/admin?error=save-project')
  } finally {
    client.release()
  }

  refreshContent()
  redirect('/admin?saved=project')
}

export async function createProject(formData: FormData) {
  const user = await requireUser()
  const title = field(formData, 'title', 200)
  const type = field(formData, 'type', 50)
  const description = field(formData, 'description', 5000)
  const location = field(formData, 'location', 200)
  const rawPrice = field(formData, 'price', 30)
  const status = field(formData, 'status', 30)
  const imageUrls = field(formData, 'image_urls', 2000)
    .split('\n')
    .map((image) => image.trim())
    .filter(Boolean)
  const tagIds = [...new Set(formData.getAll('tag_ids')
    .filter((value): value is string => typeof value === 'string')
    .map(Number)
    .filter((value) => Number.isSafeInteger(value) && value > 0))]

  if (!title || !type || !['active', 'inactive'].includes(status)) {
    redirect('/admin?error=invalid-project')
  }
  if (rawPrice && (!/^\d+(\.\d{1,2})?$/.test(rawPrice) || Number(rawPrice) < 0)) {
    redirect('/admin?error=invalid-price')
  }
  if (imageUrls.length > 8 || imageUrls.some((image) => !image.startsWith('/media/') && !/^https:\/\//i.test(image))) {
    redirect('/admin?error=invalid-images')
  }

  const client = await getDatabase().connect()
  try {
    await client.query('BEGIN')
    const created = await client.query<{ id: number }>(
      `INSERT INTO app.projects (title, type, description, location, price, status, image_urls, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [title, type, description || null, location || null, rawPrice || null, status, imageUrls, user.id],
    )
    const projectId = created.rows[0].id
    const tags = await client.query<{ count: string }>(
      'SELECT COUNT(*)::text AS count FROM app.tags WHERE id = ANY($1::int[])',
      [tagIds],
    )
    if (Number(tags.rows[0]?.count ?? 0) !== tagIds.length) throw new Error('Etiqueta no válida.')

    if (tagIds.length) {
      await client.query(
        `INSERT INTO app.project_tags (project_id, tag_id)
         SELECT $1, tag_id FROM UNNEST($2::int[]) AS tag_id`,
        [projectId, tagIds],
      )
    }
    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('No se pudo crear el proyecto.', error)
    redirect('/admin?error=create-project')
  } finally {
    client.release()
  }

  refreshContent()
  redirect('/admin?saved=created')
}

export async function saveWhatsApp(formData: FormData) {
  await requireRole('admin')
  const number = field(formData, 'whatsapp_number', 30).replace(/[\s()+.-]/g, '')
  if (!/^\d{8,15}$/.test(number)) redirect('/admin?error=invalid-whatsapp')

  await getDatabase().query(
    `INSERT INTO app.site_settings (key, value)
     VALUES ('whatsapp_number', $1)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
    [number],
  )
  refreshContent()
  redirect('/admin?saved=whatsapp')
}

function validateTagName(formData: FormData) {
  const name = field(formData, 'name', 60)
  if (!name) redirect('/admin/tags?error=empty')
  return name
}

export async function createTag(formData: FormData) {
  const user = await requireUser()
  const name = validateTagName(formData)
  try {
    await getDatabase().query(
      'INSERT INTO app.tags (name, created_by) VALUES ($1, $2)',
      [name, user.id],
    )
  } catch (error) {
    if ((error as { code?: string }).code === '23505') redirect('/admin/tags?error=duplicate')
    throw error
  }
  refreshContent()
  redirect('/admin/tags?saved=created')
}

export async function renameTag(formData: FormData) {
  await requireUser()
  const id = Number(field(formData, 'id', 12))
  const name = validateTagName(formData)
  if (!Number.isSafeInteger(id) || id < 1) redirect('/admin/tags?error=invalid')

  try {
    await getDatabase().query('UPDATE app.tags SET name = $2 WHERE id = $1', [id, name])
  } catch (error) {
    if ((error as { code?: string }).code === '23505') redirect('/admin/tags?error=duplicate')
    throw error
  }
  refreshContent()
  redirect('/admin/tags?saved=updated')
}

export async function deleteTag(formData: FormData) {
  await requireUser()
  const id = Number(field(formData, 'id', 12))
  if (!Number.isSafeInteger(id) || id < 1) redirect('/admin/tags?error=invalid')
  await getDatabase().query('DELETE FROM app.tags WHERE id = $1', [id])
  refreshContent()
  redirect('/admin/tags?saved=deleted')
}