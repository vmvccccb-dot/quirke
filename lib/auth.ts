import { compare } from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getDatabase } from './database'

export type UserRole = 'admin' | 'publisher'

export type AuthenticatedUser = {
  id: number
  name: string
  email: string
  role: UserRole
}

const sessionCookie = 'quirke_session'
const sessionDurationSeconds = 60 * 60 * 8

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET
  if (!secret || new TextEncoder().encode(secret).length < 32) {
    throw new Error('SESSION_SECRET debe tener al menos 32 caracteres.')
  }
  return new TextEncoder().encode(secret)
}

export async function authenticateUser(email: string, password: string) {
  const result = await getDatabase().query<{
    id: number
    name: string
    email: string
    role: UserRole
    password_hash: string
  }>(
    `SELECT id, name, email, role, password_hash
     FROM app.users
     WHERE LOWER(email) = $1 AND is_active = TRUE
     LIMIT 1`,
    [email.trim().toLowerCase()],
  )

  const user = result.rows[0]
  if (!user || !(await compare(password, user.password_hash))) return null

  return { id: user.id, name: user.name, email: user.email, role: user.role }
}

export async function createSession(user: AuthenticatedUser) {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime(`${sessionDurationSeconds}s`)
    .sign(getSessionSecret())

  const cookieStore = await cookies()
  cookieStore.set(sessionCookie, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: sessionDurationSeconds,
  })
}

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete(sessionCookie)
}

async function getSessionUserId() {
  const token = (await cookies()).get(sessionCookie)?.value
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, getSessionSecret(), {
      algorithms: ['HS256'],
    })
    if (!payload.sub || !/^\d+$/.test(payload.sub)) return null
    return Number(payload.sub)
  } catch {
    return null
  }
}

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const id = await getSessionUserId()
  if (!id) return null

  const result = await getDatabase().query<AuthenticatedUser>(
    `SELECT id, name, email, role
     FROM app.users
     WHERE id = $1 AND is_active = TRUE`,
    [id],
  )
  return result.rows[0] ?? null
}

export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) redirect('/admin/login')
  return user
}

export async function requireRole(role: UserRole) {
  const user = await requireUser()
  if (user.role !== role) redirect('/admin')
  return user
}