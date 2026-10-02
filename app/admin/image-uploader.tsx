'use client'

import { useEffect, useState, type ChangeEvent } from 'react'
import styles from './admin.module.css'

const maxImages = 8
const maxUploadSize = 4 * 1024 * 1024

export default function ImageUploader({ projectId, initialValue, clearDraftToken }: { projectId: number | string; initialValue: string[]; clearDraftToken?: string }) {
  const [images, setImages] = useState(initialValue.join('\n'))
  const [message, setMessage] = useState('')
  const [uploading, setUploading] = useState(false)
  const [draftReady, setDraftReady] = useState(false)
  const initialImages = initialValue.join('\n')
  const draftKey = `quirke:project-images:${projectId}`
  const clearMarkerKey = `${draftKey}:saved`
  const paths = images.split('\n').map((path) => path.trim()).filter(Boolean)

  useEffect(() => {
    const previousClearToken = window.sessionStorage.getItem(clearMarkerKey)
    if (clearDraftToken && previousClearToken !== clearDraftToken) {
      window.sessionStorage.removeItem(draftKey)
      setImages(initialImages)
      window.sessionStorage.setItem(clearMarkerKey, clearDraftToken)
    } else {
      const savedDraft = window.sessionStorage.getItem(draftKey)
      if (savedDraft !== null) setImages(savedDraft)
    }
    setDraftReady(true)
  }, [clearDraftToken, clearMarkerKey, draftKey, initialImages])

  useEffect(() => {
    if (!draftReady) return
    if (clearDraftToken && window.sessionStorage.getItem(clearMarkerKey) === clearDraftToken && images === initialImages) {
      window.sessionStorage.removeItem(draftKey)
      return
    }
    if (images.trim()) window.sessionStorage.setItem(draftKey, images)
    else window.sessionStorage.removeItem(draftKey)
  }, [clearDraftToken, clearMarkerKey, draftKey, draftReady, images, initialImages])

  async function uploadImages(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget
    const files = Array.from(input.files ?? [])
    if (!files.length) return
    if (paths.length + files.length > maxImages) {
      setMessage(`Esta ficha admite hasta ${maxImages} imágenes.`)
      input.value = ''
      return
    }
    if (files.some((file) => file.size > maxUploadSize) || files.reduce((total, file) => total + file.size, 0) > maxUploadSize) {
      setMessage('La selección completa no puede superar 4 MB por carga.')
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
      setMessage(`${result.paths.length} imagen${result.paths.length === 1 ? '' : 'es'} subida${result.paths.length === 1 ? '' : 's'} y guardada${result.paths.length === 1 ? '' : 's'} temporalmente.`)
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
          <span>JPG, PNG, WebP o AVIF · máximo 4 MB por carga</span>
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
      <span className={styles.imageCount}>La selección se conserva en esta pestaña hasta guardar el proyecto.</span>
      {message && <p className={styles.imageUploadMessage} role="status">{message}</p>}
    </div>
  )
}