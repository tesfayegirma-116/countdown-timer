use rusqlite::{params, Connection, Result as SqliteResult};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;

#[derive(Debug, Serialize, Deserialize)]
pub struct TimerSession {
    pub id: Option<i64>,
    pub session_name: String,
    pub target_duration: i64,
    pub actual_duration: i64,
    pub extra_time: i64,
    pub completed_at: Option<String>,
    pub created_at: Option<String>,
    pub session_date: Option<String>,
    pub session_year: Option<i64>,
}

pub struct Database {
    conn: Mutex<Connection>,
}

impl Database {
    pub fn new(db_path: PathBuf) -> SqliteResult<Self> {
        // Ensure parent directory exists
        if let Some(parent) = db_path.parent() {
            fs::create_dir_all(parent).ok();
        }

        let conn = Connection::open(db_path)?;
        
        // Enable WAL mode for better performance
        conn.pragma_update(None, "journal_mode", "WAL")?;
        conn.pragma_update(None, "synchronous", "NORMAL")?;

        // Create table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS timer_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_name TEXT NOT NULL,
                target_duration INTEGER NOT NULL,
                actual_duration INTEGER NOT NULL,
                extra_time INTEGER NOT NULL DEFAULT 0,
                completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                session_date TEXT DEFAULT (date('now')),
                session_year INTEGER DEFAULT (strftime('%Y', 'now'))
            )",
            [],
        )?;

        Ok(Database {
            conn: Mutex::new(conn),
        })
    }

    pub fn save_session(&self, session: &TimerSession) -> SqliteResult<TimerSession> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO timer_sessions (session_name, target_duration, actual_duration, extra_time)
             VALUES (?1, ?2, ?3, ?4)",
            params![
                session.session_name,
                session.target_duration,
                session.actual_duration,
                session.extra_time
            ],
        )?;

        let id = conn.last_insert_rowid();
        let mut stmt = conn.prepare(
            "SELECT id, session_name, target_duration, actual_duration, extra_time,
                    completed_at, created_at, session_date, session_year
             FROM timer_sessions WHERE id = ?1"
        )?;

        let session = stmt.query_row(params![id], |row| {
            Ok(TimerSession {
                id: Some(row.get(0)?),
                session_name: row.get(1)?,
                target_duration: row.get(2)?,
                actual_duration: row.get(3)?,
                extra_time: row.get(4)?,
                completed_at: Some(row.get(5)?),
                created_at: Some(row.get(6)?),
                session_date: Some(row.get(7)?),
                session_year: Some(row.get(8)?),
            })
        })?;

        Ok(session)
    }

    pub fn get_sessions(&self, limit: i64) -> SqliteResult<Vec<TimerSession>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, session_name, target_duration, actual_duration, extra_time,
                    completed_at, created_at, session_date, session_year
             FROM timer_sessions
             ORDER BY completed_at DESC
             LIMIT ?1"
        )?;

        let sessions = stmt.query_map(params![limit], |row| {
            Ok(TimerSession {
                id: Some(row.get(0)?),
                session_name: row.get(1)?,
                target_duration: row.get(2)?,
                actual_duration: row.get(3)?,
                extra_time: row.get(4)?,
                completed_at: Some(row.get(5)?),
                created_at: Some(row.get(6)?),
                session_date: Some(row.get(7)?),
                session_year: Some(row.get(8)?),
            })
        })?;

        sessions.collect()
    }

    pub fn delete_session(&self, id: i64) -> SqliteResult<bool> {
        let conn = self.conn.lock().unwrap();
        let changes = conn.execute("DELETE FROM timer_sessions WHERE id = ?1", params![id])?;
        Ok(changes > 0)
    }

    pub fn clear_all_sessions(&self) -> SqliteResult<usize> {
        let conn = self.conn.lock().unwrap();
        let changes = conn.execute("DELETE FROM timer_sessions", [])?;
        Ok(changes)
    }
}

// Tauri commands
#[tauri::command]
pub fn save_timer_session(
    session: TimerSession,
    state: tauri::State<Database>,
) -> Result<TimerSession, String> {
    state.save_session(&session).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_timer_sessions(
    limit: i64,
    state: tauri::State<Database>,
) -> Result<Vec<TimerSession>, String> {
    state.get_sessions(limit).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_timer_session(
    id: i64,
    state: tauri::State<Database>,
) -> Result<bool, String> {
    state.delete_session(id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn clear_all_timer_sessions(
    state: tauri::State<Database>,
) -> Result<usize, String> {
    state.clear_all_sessions().map_err(|e| e.to_string())
}
