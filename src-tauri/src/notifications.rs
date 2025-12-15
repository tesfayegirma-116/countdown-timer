use tauri::AppHandle;
use tauri_plugin_notification::NotificationExt;

#[derive(Debug, serde::Serialize, serde::Deserialize)]
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
    let mut notification = app.notification().builder()
        .title(&payload.title)
        .body(&payload.body);

    if let Some(icon) = &payload.icon {
        notification = notification.icon(icon.clone());
    }

    if let Some(sound) = &payload.sound {
        notification = notification.sound(sound.clone());
    }

    notification
        .show()
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn request_notification_permission(app: AppHandle) -> Result<bool, String> {
    match app.notification().request_permission() {
        Ok(permission) => Ok(permission == tauri_plugin_notification::PermissionState::Granted),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub async fn check_notification_permission(app: AppHandle) -> Result<bool, String> {
    match app.notification().permission_state() {
        Ok(permission) => Ok(permission == tauri_plugin_notification::PermissionState::Granted),
        Err(e) => Err(e.to_string()),
    }
}

// Helper function to send timer-specific notifications
#[allow(dead_code)]
pub async fn send_timer_notification(
    app: &AppHandle,
    notification_type: TimerNotificationType,
    session_name: &str,
    _duration: Option<&str>,
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

#[allow(dead_code)]
#[derive(Debug)]
pub enum TimerNotificationType {
    Started,
    Completed,
    Warning,
    Overtime,
    Paused,
    Reset,
}
