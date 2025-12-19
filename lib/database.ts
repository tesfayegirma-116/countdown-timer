import fs from "fs"
import path from "path"

const dbPath = path.join(process.cwd(), "timer_sessions.json")

export interface TimerSession {
  id: number
  session_name: string
  target_duration: number
  actual_duration: number
  extra_time: number
  completed_at: string
  created_at: string
  session_date: string
  session_year: number
}

interface DatabaseData {
  sessions: TimerSession[]
  nextId: number
}

function readDatabase(): DatabaseData {
  if (!fs.existsSync(dbPath)) {
    return { sessions: [], nextId: 1 }
  }
  const content = fs.readFileSync(dbPath, "utf-8")
  return JSON.parse(content) as DatabaseData
}

function writeDatabase(data: DatabaseData): void {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2))
}

export async function saveTimerSession(
  session: Omit<TimerSession, "id" | "completed_at" | "created_at" | "session_date" | "session_year">,
): Promise<TimerSession> {
  const data = readDatabase()
  const now = new Date()

  const newSession: TimerSession = {
    id: data.nextId,
    session_name: session.session_name,
    target_duration: session.target_duration,
    actual_duration: session.actual_duration,
    extra_time: session.extra_time,
    completed_at: now.toISOString(),
    created_at: now.toISOString(),
    session_date: now.toISOString().split("T")[0],
    session_year: now.getFullYear(),
  }

  data.sessions.push(newSession)
  data.nextId++
  writeDatabase(data)

  return newSession
}

export async function getTimerSessions(limit = 50): Promise<TimerSession[]> {
  const data = readDatabase()
  return data.sessions
    .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())
    .slice(0, limit)
}

export async function getTimerSessionsByDate(date: string): Promise<TimerSession[]> {
  const data = readDatabase()
  return data.sessions
    .filter((s) => s.session_date === date)
    .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())
}

export async function deleteTimerSession(id: number): Promise<boolean> {
  const data = readDatabase()
  const index = data.sessions.findIndex((s) => s.id === id)

  if (index === -1) return false

  data.sessions.splice(index, 1)
  writeDatabase(data)
  return true
}

export async function clearAllTimerSessions(): Promise<number> {
  const data = readDatabase()
  const count = data.sessions.length

  data.sessions = []
  writeDatabase(data)
  return count
}
