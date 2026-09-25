'use client'

import { useEffect, useState } from 'react'

const assetBase = '/media/'

type Property = {
  name: string
  type: 'Casa' | 'Fundo' | 'Parcela'
  detail: string
  use: string
  images: string[]
}

const properties: Property[] = [
  {
    name: 'Casa Playa Amarilla',
    type: 'Casa',
    detail: '— m²',
    use: '—',
    images: [
      `${assetBase}casa-playa-amarilla-3.jpg`,
      `${assetBase}casa-playa-amarilla-1.jpg`,
      `${assetBase}casa-playa-amarilla-2.jpg`,
    ],
  },
  {
    name: 'Fundo La Tiza',
    type: 'Fundo',
    detail: '— há',
    use: 'Agrícola',
    images: [
      `${assetBase}fundo-la-tiza-1.jpg`,
      `${assetBase}fundo-la-tiza-1.jpg`,
      `${assetBase}fundo-la-tiza-2.jpg`,
    ],
  },
  {
    name: 'Parcela Los Boldos',
    type: 'Parcela',
    detail: '— há',
    use: 'Agrícola / ecuestre',
    images: [
      `${assetBase}los-boldos-1.jpg`,
      `${assetBase}los-boldos-1.jpg`,
      `${assetBase}los-boldos-2.jpg`,
    ],
  },
]

const filters = ['Todas', 'Casas', 'Fundos', 'Parcelas'] as const

function Arrow() {
  return <span aria-hidden="true">→</span>
}

function PropertyCard({ property, onOpen }: { property: Property; onOpen: (property: Property, imageIndex: number) => void }) {
  const [imageIndex, setImageIndex] = useState(0)
  const nextImage = () => setImageIndex((index) => (index + 1) % property.images.length)
  const previousImage = () => setImageIndex((index) => (index - 1 + property.images.length) % property.images.length)

  return (
    <article className="property-card">
      <div className="property-image-wrap">
        <div className="property-type">{property.type}</div>
        <div className="image-count"><span>▧</span> {property.images.length}</div>
        <img key={property.images[imageIndex]} className="property-image" src={property.images[imageIndex]} alt={property.name} />
        <div className="gallery-controls">
          <button onClick={previousImage} aria-label={`Imagen anterior de ${property.name}`}>←</button>
          <button onClick={nextImage} aria-label={`Imagen siguiente de ${property.name}`}>→</button>
        </div>
        <div className="image-dots">
          {property.images.map((_, index) => <span key={index} className={index === imageIndex ? 'active' : ''} />)}
        </div>
      </div>
      <div className="property-content">
        <div className="property-heading">
          <div>
            <h3>{property.name}</h3>
            <p className="location"><span>⌖</span> Por confirmar — comuna / sector</p>
          </div>
          <strong>Precio a consultar</strong>
        </div>
        <div className="property-meta">
          <span><b>⌂</b> {property.type}</span>
          <span><b>▱</b> {property.detail}</span>
          <span><b>⌁</b> {property.use}</span>
        </div>
        <button className="card-link" onClick={() => onOpen(property, imageIndex)}>Ver ficha completa <Arrow /></button>
      </div>
    </article>
  )
}

function PropertyModal({ property, initialImageIndex, onClose }: { property: Property; initialImageIndex: number; onClose: () => void }) {
  const [imageIndex, setImageIndex] = useState(initialImageIndex)
  const nextImage = () => setImageIndex((index) => (index + 1) % property.images.length)
  const previousImage = () => setImageIndex((index) => (index - 1 + property.images.length) % property.images.length)

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', closeOnEscape)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', closeOnEscape)
      document.body.style.overflow = previousOverflow
    }
  }, [onClose])

  return <div className="property-modal" role="dialog" aria-modal="true" aria-labelledby={`${property.name}-title`} onClick={onClose}>
    <div className="property-modal-card" onClick={(event) => event.stopPropagation()}>
      <button className="modal-close" onClick={onClose} aria-label={`Cerrar ficha de ${property.name}`}>×</button>
      <div className="modal-gallery">
        <img key={property.images[imageIndex]} src={property.images[imageIndex]} alt={property.name} />
        <button className="modal-arrow modal-arrow-left" onClick={previousImage} aria-label="Imagen anterior">←</button>
        <button className="modal-arrow modal-arrow-right" onClick={nextImage} aria-label="Imagen siguiente">→</button>
        <div className="modal-dots">{property.images.map((_, index) => <button key={index} className={index === imageIndex ? 'active' : ''} onClick={() => setImageIndex(index)} aria-label={`Ver imagen ${index + 1}`} />)}</div>
      </div>
      <div className="modal-copy">
        <p className="section-kicker">{property.type}</p>
        <h2 id={`${property.name}-title`}>{property.name}</h2>
        <p className="modal-location">⌖ Por confirmar — comuna / sector</p>
        <strong className="modal-price">Precio a consultar</strong>
        <div className="modal-meta"><span><b>⌂</b> {property.type}</span><span><b>▱</b> {property.detail}</span><span><b>⌁</b> {property.use}</span></div>
        <p className="modal-description">Una propiedad seleccionada por Quirke Inmobiliaria. Solicita más información, coordina una visita y conoce todos los detalles de esta oportunidad.</p>
        <a className="gold-button modal-contact" href="https://wa.me/56900000000">Consultar por WhatsApp <Arrow /></a>
      </div>
    </div>
  </div>
}

export default function Home() {
  const [filter, setFilter] = useState<(typeof filters)[number]>('Todas')
  const [menuOpen, setMenuOpen] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState<{ property: Property; imageIndex: number } | null>(null)
  const visibleProperties = filter === 'Todas' ? properties : properties.filter((property) => `${property.type}s` === filter)
  const closeProperty = () => setSelectedProperty(null)

  useEffect(() => {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed')
          revealObserver.unobserve(entry.target)
        }
      })
    }, { threshold: 0.12 })
    document.querySelectorAll('[data-reveal]').forEach((element) => revealObserver.observe(element))
    return () => revealObserver.disconnect()
  }, [])

  return (
    <main>
      <div className="artifact-bar">
        <span className="artifact-title">Quirke Inmobiliaria <small>⌄</small></span>
        <span className="artifact-note">El contenido es generado por usuarios y no está verificado.</span>
        <div className="artifact-actions"><button aria-label="Compartir">♧</button><button>Iniciar sesión</button></div>
      </div>
      <header className="site-header" id="top">
        <a className="brand" href="#top" aria-label="Quirke Inmobiliaria, inicio"><img className="brand-logo" src={`${assetBase}logo.png`} alt="" /><span><b>Quirke</b><em>INMOBILIARIA</em></span></a>
        <div className="header-actions"><a className="header-cta" href="#propiedades">Ver propiedades</a><button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Abrir menú"><i /><i /><i /></button></div>
        {menuOpen && <nav className="mobile-nav"><a href="#propiedades" onClick={() => setMenuOpen(false)}>Propiedades</a><a href="#filosofia" onClick={() => setMenuOpen(false)}>Nuestra filosofía</a><a href="#contacto" onClick={() => setMenuOpen(false)}>Contacto</a></nav>}
      </header>

      <section className="hero">
        <video className="hero-video" autoPlay muted loop playsInline poster={`${assetBase}fundo-la-tiza-1.jpg`}><source src={`${assetBase}fundo-la-tiza.mp4`} type="video/mp4" /></video>
        <div className="hero-overlay" />
        <div className="hero-content">
          <p className="eyebrow"><span /> Casas · Fundos · Terrenos</p>
          <h1>Propiedades con carácter,<br /><em>inversión con visión.</em></h1>
          <p className="hero-copy">Seleccionamos y presentamos cada propiedad con el mismo cuidado con el que tú eliges dónde construir tu próximo capítulo. Explora nuestra cartera curada de casas, fundos y terrenos.</p>
          <div className="hero-buttons"><a className="gold-button" href="#propiedades">Explorar propiedades <Arrow /></a><a className="outline-button" href="#contacto">Hablar con un asesor</a></div>
          <div className="stats"><div><strong>3</strong><span>Propiedades activas</span></div><div><strong>100%</strong><span>Curaduría personal</span></div><div><strong>24h</strong><span>Respuesta directa</span></div></div>
        </div>
      </section>

      <section className="properties section-shell" id="propiedades" data-reveal>
        <div className="section-heading"><div><p className="section-kicker">Selección actual</p><h2>Propiedades <em>destacadas</em></h2></div><p>Una muestra de lo que tenemos disponible ahora mismo. Cada ficha incluye fotografías, video y las características completas del inmueble.</p></div>
        <div className="filters">{filters.map((item) => <button key={item} className={filter === item ? 'selected' : ''} onClick={() => setFilter(item)}>{item}</button>)}</div>
        <div className="property-grid">{visibleProperties.map((property) => <PropertyCard key={property.name} property={property} onOpen={(selected, imageIndex) => setSelectedProperty({ property: selected, imageIndex })} />)}</div>
      </section>

      <section className="philosophy" id="filosofia" data-reveal><div className="philosophy-copy"><p className="section-kicker">Nuestra filosofía</p><h2>Cada propiedad cuenta una historia. Nosotros la contamos <em>bien.</em></h2><p>En Quirke Inmobiliaria seleccionamos personalmente cada casa, fundo y terreno que representamos. Creemos que comprar o vender una propiedad no es solo una transacción: es una decisión de vida, y merece la misma dedicación en cada fotografía, cada visita y cada conversación.</p><div className="values"><div><span>✦</span><h4>Curaduría personal</h4><p>Visitamos y documentamos cada inmueble antes de publicarlo.</p></div><div><span>◌</span><h4>Acompañamiento real</h4><p>Un mismo asesor te guía desde el primer contacto hasta el cierre.</p></div><div><span>↗</span><h4>Respuesta ágil</h4><p>Contacto directo por WhatsApp, sin intermediarios ni esperas.</p></div><div><span>⌁</span><h4>Visión de inversión</h4><p>Analizamos plusvalía y potencial, no solo la ficha técnica.</p></div></div></div><div className="philosophy-image"><img src={`${assetBase}casa-playa-amarilla-3.jpg`} alt="Propiedad representada por Quirke Inmobiliaria" /><span>Cada ficha es revisada y fotografiada personalmente antes de su publicación.</span></div></section>

      <section className="contact" id="contacto"><div><p className="section-kicker">Conversemos</p><h2>¿Buscas comprar,<br /><em>vender o invertir?</em></h2><p>Escríbenos y te ayudamos a encontrar la propiedad correcta, o a preparar la tuya para su próxima etapa.</p><div className="contact-buttons"><a className="gold-button" href="https://wa.me/56900000000">WhatsApp directo <Arrow /></a><a className="contact-email" href="mailto:contacto@quirkeinmobiliaria.cl">Escribir un email</a></div></div><div className="contact-details"><a href="https://wa.me/56974843852"><span>◉</span><b>WhatsApp</b><small>+56 9 7484 3852</small></a><a href="mailto:contacto@quirkeinmobiliaria.cl"><span>✉</span><b>Email</b><small>contacto@quirkeinmobiliaria.cl</small></a><a href="#top"><span>⌖</span><b>Zona</b><small>Región de Valparaíso, Chile</small></a></div></section>

      <footer><a className="brand footer-brand" href="#top"><img className="brand-logo" src={`${assetBase}logo.png`} alt="" /><span><b>Quirke</b><em>INMOBILIARIA</em></span></a><span>© 2026 Quirke Inmobiliaria — Inversión con visión.</span><span>Sitio elaborado a medida.</span></footer>
      {selectedProperty && <PropertyModal property={selectedProperty.property} initialImageIndex={selectedProperty.imageIndex} onClose={closeProperty} />}
    </main>
  )
}
