'use server'

import { redirect } from 'next/navigation'
import { authenticateUser, createSession, deleteSession } from '../../../lib/auth'

export type LoginState = { message: string } | undefined

export async function login(_: LoginState, formData: FormData): Promise<LoginState> {
  const email = formData.get('email')
  const password = formData.get('password')

  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
    return { message: 'Ingresa tu correo y contraseña.' }
  }

  try {
    const user = await authenticateUser(email, password)
    if (!user) return { message: 'Correo o contraseña incorrectos.' }

    await createSession(user)
  } catch (error) {
    console.error('No se pudo completar el inicio de sesión.', error)
    return { message: 'No pudimos validar el acceso. Intenta nuevamente más tarde.' }
  }

  redirect('/admin')
}

export async function logout() {
  await deleteSession()
  redirect('/admin/login')
}