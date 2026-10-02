'use client'

import { useState, type ChangeEvent } from 'react'
import styles from './admin.module.css'

const maxImages = 8

export default function ImageUploader({ projectId, initialValue }: { projectId: number | string; initialValue: string[] }) {
  const [images, setImages] = useState(initialValue.join('\n'))
  const [message, setMessage] = useState('')
  const [uploading, setUploading] = useState(false)
  const paths = images.split('\n').map((path) => path.trim()).filter(Boolean)

  async function uploadImages(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget
    const files = Array.from(input.files ?? [])
    if (!files.length) return
    if (paths.length + files.length > maxImages) {
      setMessage(`Esta ficha admite hasta ${maxImages} imágenes.`)
      input.value = ''
      return
    }

    setUploading(true)
    setMessage('')
    const formData = new FormData()
    for (const file of files) formData.append('images', file)

    try {
      const response = await fetch('/api/admin/images', { method: 'POST', body: formData })
      const result = await response.json() as { paths?: string[]; error?: string }
      if (!response.ok || !result.paths) {
        setMessage(result.error ?? 'No se pudieron subir las imágenes.')
        return
      }
      setImages((current) => [...current.split('\n').map((path) => path.trim()).filter(Boolean), ...result.paths!].join('\n'))
      setMessage(`${result.paths.length} imagen${result.paths.length === 1 ? '' : 'es'} subida${result.paths.length === 1 ? '' : 's'}.`)
    } catch {
      setMessage('No se pudo conectar para subir las imágenes.')
    } finally {
      setUploading(false)
      input.value = ''
    }
  }

  function removeImage(imageToRemove: string) {
    setImages((current) => current.split('\n').map((path) => path.trim()).filter((path) => path && path !== imageToRemove).join('\n'))
    setMessage('')
  }

  return (
    <div className={styles.imageUploader}>
      <div className={styles.imageUploadRow}>
        <div>
          <strong>Imágenes de la propiedad</strong>
          <span>JPG, PNG, WebP o AVIF · máximo 6 MB cada una</span>
        </div>
        <label className={styles.actionButton} htmlFor={`images-${projectId}`}>
          {uploading ? 'Subiendo…' : 'Subir...'}
        </label>
        <input
          className={styles.visuallyHidden}
          id={`images-${projectId}`}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          disabled={uploading}
          onChange={uploadImages}
        />
      </div>
      <textarea
        name="image_urls"
        aria-label="Rutas o direcciones de las imágenes"
        value={images}
        onChange={(event) => setImages(event.target.value)}
        rows={Math.max(3, Math.min(6, paths.length + 1))}
        placeholder="Las rutas de las imágenes aparecerán aquí. También puedes pegar direcciones HTTPS."
      />
      {paths.length > 0 && (
        <div className={styles.imagePreviewList} aria-label="Imágenes de esta propiedad">
          {paths.map((path, index) => (
            <figure className={styles.imagePreview} key={`${path}-${index}`}>
              <img src={path} alt={`Imagen ${index + 1} de la propiedad`} />
              <button type="button" onClick={() => removeImage(path)} aria-label={`Quitar imagen ${index + 1}`}>Quitar</button>
            </figure>
          ))}
        </div>
      )}
      <span className={styles.imageCount}>{paths.length} de {maxImages} imágenes</span>
      {message && <p className={styles.imageUploadMessage} role="status">{message}</p>}
    </div>
  )
}