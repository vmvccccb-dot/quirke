'use client'

import { useActionState } from 'react'
import { login, type LoginState } from './actions'
import styles from '../admin.module.css'

export default function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, undefined)

  return (
    <form className={styles.loginForm} action={action}>
      <label htmlFor="email">Correo electrónico</label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="username"
        placeholder="nombre@quirke.cl"
        required
      />

      <label htmlFor="password">Contraseña</label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        placeholder="Tu contraseña"
        required
      />

      {state?.message && <p className={styles.formMessage} role="alert">{state.message}</p>}

      <button className={styles.submitButton} type="submit" disabled={pending}>
        {pending ? 'Verificando…' : 'Ingresar al panel'}
        <span aria-hidden="true">→</span>
      </button>
    </form>
  )
}