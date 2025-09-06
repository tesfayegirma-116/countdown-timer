import Database from "better-sqlite3"
import path from "path"

// Initialize SQLite database with WAL mode for better performance
const dbPath = path.join(process.cwd(), "timer_sessions.db")
const db = new Database(dbPath)

// Enable WAL mode for better concurrent access
db.pragma("journal_mode = WAL")
db.pragma("synchronous = NORMAL")
db.pragma("cache_size = 1000000")
db.pragma("temp_store = memory")

// Create timer_sessions table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS timer_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_name TEXT NOT NULL,
    target_duration INTEGER NOT NULL,
    actual_duration INTEGER NOT NULL,
    extra_time INTEGER NOT NULL DEFAULT 0,
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    session_date TEXT DEFAULT (date('now')),
    session_year INTEGER DEFAULT (strftime('%Y', 'now'))
  )
`)

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

export function saveTimerSession(
  session: Omit<TimerSession, "id" | "completed_at" | "created_at" | "session_date" | "session_year">,
): TimerSession {
  const stmt = db.prepare(`
    INSERT INTO timer_sessions (session_name, target_duration, actual_duration, extra_time)
    VALUES (?, ?, ?, ?)
  `)

  const result = stmt.run(session.session_name, session.target_duration, session.actual_duration, session.extra_time)

  // Get the inserted record
  const getStmt = db.prepare("SELECT * FROM timer_sessions WHERE id = ?")
  return getStmt.get(result.lastInsertRowid) as TimerSession
}

export function getTimerSessions(limit = 50): TimerSession[] {
  const stmt = db.prepare(`
    SELECT * FROM timer_sessions 
    ORDER BY completed_at DESC 
    LIMIT ?
  `)
  return stmt.all(limit) as TimerSession[]
}

export function getTimerSessionsByDate(date: string): TimerSession[] {
  const stmt = db.prepare(`
    SELECT * FROM timer_sessions 
    WHERE session_date = ?
    ORDER BY completed_at DESC
  `)
  return stmt.all(date) as TimerSession[]
}

export function deleteTimerSession(id: number): boolean {
  const stmt = db.prepare("DELETE FROM timer_sessions WHERE id = ?")
  const result = stmt.run(id)
  return result.changes > 0
}

// Graceful shutdown - only add listeners if not already present
const closeHandler = () => db.close()
const exitHandler = (signal: number) => () => process.exit(128 + signal)

if (!process.listenerCount("exit")) {
  process.on("exit", closeHandler)
}
if (!process.listenerCount("SIGHUP")) {
  process.on("SIGHUP", exitHandler(1))
}
if (!process.listenerCount("SIGINT")) {
  process.on("SIGINT", exitHandler(2))
}
if (!process.listenerCount("SIGTERM")) {
  process.on("SIGTERM", exitHandler(15))
}
