// This module provides a unified interface for database operations
// that works both in browser (Next.js dev) and Tauri desktop app

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

// Check if we're running in Tauri
export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window
}

export async function saveTimerSession(
  session: Omit<TimerSession, "id" | "completed_at" | "created_at" | "session_date" | "session_year">
): Promise<TimerSession> {
  if (isTauri()) {
    // Import dynamically to avoid issues in non-Tauri environment
    const { invoke } = await import('@tauri-apps/api/core')
    return await invoke('save_timer_session', { session })
  } else {
    // Fallback for web version - use localStorage
    const id = Date.now()
    const fullSession: TimerSession = {
      id,
      ...session,
      completed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      session_date: new Date().toISOString().split('T')[0],
      session_year: new Date().getFullYear()
    }

    const sessions = JSON.parse(localStorage.getItem('timer_sessions') || '[]')
    sessions.push(fullSession)
    localStorage.setItem('timer_sessions', JSON.stringify(sessions))

    return fullSession
  }
}

export async function getTimerSessions(limit = 50): Promise<TimerSession[]> {
  if (isTauri()) {
    const { invoke } = await import('@tauri-apps/api/core')
    return await invoke('get_timer_sessions', { limit })
  } else {
    // Fallback for web version - use localStorage
    const sessions = JSON.parse(localStorage.getItem('timer_sessions') || '[]')
    return sessions.slice(0, limit).sort((a: TimerSession, b: TimerSession) =>
      new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
    )
  }
}

export async function deleteTimerSession(id: number): Promise<boolean> {
  if (isTauri()) {
    const { invoke } = await import('@tauri-apps/api/core')
    return await invoke('delete_timer_session', { id })
  } else {
    // Fallback for web version - use localStorage
    const sessions = JSON.parse(localStorage.getItem('timer_sessions') || '[]')
    const filteredSessions = sessions.filter((s: TimerSession) => s.id !== id)
    localStorage.setItem('timer_sessions', JSON.stringify(filteredSessions))
    return sessions.length !== filteredSessions.length
  }
}

export async function clearAllTimerSessions(): Promise<number> {
  if (isTauri()) {
    const { invoke } = await import('@tauri-apps/api/core')
    return await invoke('clear_all_timer_sessions')
  } else {
    // Fallback for web version - use localStorage
    const sessions = JSON.parse(localStorage.getItem('timer_sessions') || '[]')
    const count = sessions.length
    localStorage.setItem('timer_sessions', '[]')
    return count
  }
}
