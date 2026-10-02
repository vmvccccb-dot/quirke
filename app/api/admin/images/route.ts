import { randomUUID } from 'node:crypto'
import { mkdir, unlink, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { getCurrentUser } from '../../../../lib/auth'

export const runtime = 'nodejs'

const maxFiles = 8
const maxFileSize = 6 * 1024 * 1024
const maxRequestSize = 32 * 1024 * 1024

function imageExtension(buffer: Buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpg'
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'png'
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'webp'
  if (buffer.length >= 12 && buffer.toString('ascii', 4, 8) === 'ftyp' && /^(avif|avis)$/.test(buffer.toString('ascii', 8, 12))) return 'avif'
  return null
}

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return Response.json({ error: 'Inicia sesión para subir imágenes.' }, { status: 401 })

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return Response.json({ error: 'No se pudo leer la carga de imágenes.' }, { status: 400 })
  }

  const entries = formData.getAll('images')
  const files = entries.filter((entry): entry is File => typeof entry !== 'string')
  if (files.length !== entries.length || files.length === 0 || files.length > maxFiles) {
    return Response.json({ error: `Selecciona entre 1 y ${maxFiles} imágenes.` }, { status: 400 })
  }

  const totalSize = files.reduce((total, file) => total + file.size, 0)
  if (totalSize > maxRequestSize || files.some((file) => file.size === 0 || file.size > maxFileSize)) {
    return Response.json({ error: 'Cada imagen debe pesar hasta 6 MB y la selección no puede superar 32 MB.' }, { status: 400 })
  }

  const validatedFiles: Array<{ buffer: Buffer; extension: string }> = []
  for (const file of files) {
    const buffer = Buffer.from(await file.arrayBuffer())
    const extension = imageExtension(buffer)
    if (!extension || file.type !== `image/${extension === 'jpg' ? 'jpeg' : extension}`) {
      return Response.json({ error: 'Usa imágenes JPG, PNG, WebP o AVIF válidas.' }, { status: 400 })
    }
    validatedFiles.push({ buffer, extension })
  }

  const uploadDirectory = join(process.cwd(), 'public', 'media', 'uploads')
  const savedPaths: string[] = []
  try {
    await mkdir(uploadDirectory, { recursive: true })
    for (const file of validatedFiles) {
      const filename = `${randomUUID()}.${file.extension}`
      await writeFile(join(uploadDirectory, filename), file.buffer, { flag: 'wx' })
      savedPaths.push(`/media/uploads/${filename}`)
    }
  } catch {
    await Promise.all(savedPaths.map((path) => unlink(join(uploadDirectory, path.split('/').at(-1)!)).catch(() => undefined)))
    return Response.json({ error: 'No se pudieron guardar las imágenes en el servidor.' }, { status: 500 })
  }

  return Response.json({ paths: savedPaths }, { status: 201 })
}