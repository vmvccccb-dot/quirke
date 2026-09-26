import type { Metadata } from 'next'
import Link from 'next/link'
import LoginForm from './login-form'
import styles from '../admin.module.css'

export const metadata: Metadata = {
  title: 'Acceso administrativo | Quirke Inmobiliaria',
  robots: { index: false, follow: false },
}

export default function AdminLoginPage() {
  return (
    <main className={styles.loginScreen}>
      <section className={styles.loginVisual} aria-label="Quirke Inmobiliaria">
        <Link className={styles.loginBrand} href="/">
          <img src="/media/logo.png" alt="" />
          <span><b>Quirke</b><small>INMOBILIARIA</small></span>
        </Link>
        <div className={styles.visualCopy}>
          <p>Acceso privado</p>
          <h1>La gestión de cada propiedad, en buenas manos.</h1>
          <span>PORTAL DE ADMINISTRACIÓN</span>
        </div>
      </section>

      <section className={styles.loginContent}>
        <div className={styles.loginBox}>
          <p className={styles.eyebrow}>QUIRKE · ADMINISTRACIÓN</p>
          <h2>Bienvenido</h2>
          <p className={styles.loginIntro}>Ingresa con tu cuenta para continuar.</p>
          <LoginForm />
          <Link className={styles.backLink} href="/">← Volver al sitio</Link>
        </div>
        <span className={styles.loginFooter}>© 2026 Quirke Inmobiliaria</span>
      </section>
    </main>
  )
}