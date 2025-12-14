use tauri::{AppHandle, Manager};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct NotificationPayload {
    pub title: String,
    pub body: String,
    pub icon: Option<String>,
    pub sound: Option<String>,
}

#[tauri::command]
pub async fn send_notification(
    app: AppHandle,
    payload: NotificationPayload,
) -> Result<(), String> {
    let notification = tauri_plugin_notification::NotificationBuilder::new()
        .title(&payload.title)
        .body(&payload.body);

    let notification = if let Some(icon) = &payload.icon {
        notification.icon(icon)
    } else {
        notification
    };

    let notification = if let Some(sound) = &payload.sound {
        notification.sound(sound)
    } else {
        notification
    };

    notification
        .show(&app)
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn request_notification_permission(app: AppHandle) -> Result<bool, String> {
    match tauri_plugin_notification::request_permission(&app).await {
        Ok(permission) => Ok(permission == tauri_plugin_notification::Permission::Granted),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub async fn check_notification_permission(app: AppHandle) -> Result<bool, String> {
    match tauri_plugin_notification::check_permissions(&app).await {
        Ok(permission) => Ok(permission == tauri_plugin_notification::Permission::Granted),
        Err(e) => Err(e.to_string()),
    }
}

// Helper function to send timer-specific notifications
pub async fn send_timer_notification(
    app: &AppHandle,
    notification_type: TimerNotificationType,
    session_name: &str,
    duration: Option<&str>,
) -> Result<(), String> {
    let (title, body, sound) = match notification_type {
        TimerNotificationType::Started => (
            "Timer Started".to_string(),
            format!("Focus session '{}' has begun", session_name),
            Some("default".to_string()),
        ),
        TimerNotificationType::Completed => (
            "Timer Completed".to_string(),
            format!("Focus session '{}' completed successfully!", session_name),
            Some("default".to_string()),
        ),
        TimerNotificationType::Warning => (
            "Final Minutes".to_string(),
            format!("Focus session '{}' - 5 minutes remaining", session_name),
            Some("default".to_string()),
        ),
        TimerNotificationType::Overtime => (
            "Overtime".to_string(),
            format!("Focus session '{}' has entered overtime", session_name),
            Some("default".to_string()),
        ),
        TimerNotificationType::Paused => (
            "Timer Paused".to_string(),
            format!("Focus session '{}' paused", session_name),
            None,
        ),
        TimerNotificationType::Reset => (
            "Timer Reset".to_string(),
            format!("Focus session '{}' has been reset", session_name),
            None,
        ),
    };

    let payload = NotificationPayload {
        title,
        body,
        icon: Some("icons/icon.png".to_string()),
        sound,
    };

    send_notification(app.clone(), payload).await
}

#[derive(Debug)]
pub enum TimerNotificationType {
    Started,
    Completed,
    Warning,
    Overtime,
    Paused,
    Reset,
}
