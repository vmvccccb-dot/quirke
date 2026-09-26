import { NextResponse } from 'next/server'
import { getDatabase } from '../../../lib/database'

export const dynamic = 'force-dynamic'

type PublicProject = {
  id: number
  title: string
  type: string
  description: string | null
  location: string | null
  price: string | null
  image_urls: string[]
  tags: string[]
}

export async function GET() {
  try {
    const [projects, settings] = await Promise.all([
      getDatabase().query<PublicProject>(
        `SELECT project.id, project.title, project.type, project.description,
                project.location, project.price::text, project.image_urls,
                COALESCE(ARRAY_AGG(tag.name ORDER BY LOWER(tag.name)) FILTER (WHERE tag.id IS NOT NULL), '{}') AS tags
         FROM app.projects AS project
         LEFT JOIN app.project_tags AS project_tag ON project_tag.project_id = project.id
         LEFT JOIN app.tags AS tag ON tag.id = project_tag.tag_id
         WHERE project.status = 'active'
         GROUP BY project.id
         ORDER BY project.created_at DESC, project.id`,
      ),
      getDatabase().query<{ value: string }>(
        "SELECT value FROM app.site_settings WHERE key = 'whatsapp_number'",
      ),
    ])

    return NextResponse.json({
      projects: projects.rows,
      whatsappNumber: settings.rows[0]?.value ?? '56974843852',
    }, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    console.error('No se pudo cargar el contenido público.', error)
    return NextResponse.json({ error: 'Contenido temporalmente no disponible.' }, { status: 503 })
  }
}