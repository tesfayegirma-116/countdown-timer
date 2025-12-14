use tauri::{AppHandle, Manager};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateInfo {
    pub version: String,
    pub date: String,
    pub body: String,
    pub available: bool,
}

#[tauri::command]
pub async fn check_for_updates(app: AppHandle) -> Result<UpdateInfo, String> {
    match tauri_plugin_updater::check_update(&app).await {
        Ok(Some(update)) => {
            Ok(UpdateInfo {
                version: update.version,
                date: update.date.unwrap_or_default(),
                body: update.body.unwrap_or_default(),
                available: true,
            })
        }
        Ok(None) => {
            Ok(UpdateInfo {
                version: app.package_info().version.to_string(),
                date: String::new(),
                body: "You are running the latest version.".to_string(),
                available: false,
            })
        }
        Err(e) => Err(format!("Failed to check for updates: {}", e)),
    }
}

#[tauri::command]
pub async fn install_update(app: AppHandle) -> Result<(), String> {
    match tauri_plugin_updater::check_update(&app).await {
        Ok(Some(update)) => {
            update.download_and_install(&app).await.map_err(|e| e.to_string())?;
            Ok(())
        }
        Ok(None) => Err("No update available".to_string()),
        Err(e) => Err(format!("Failed to install update: {}", e)),
    }
}

#[tauri::command]
pub fn get_app_version(app: AppHandle) -> String {
    app.package_info().version.to_string()
}

pub async fn check_for_updates_on_startup(app: &AppHandle) {
    // Check for updates silently on startup
    match tauri_plugin_updater::check_update(app).await {
        Ok(Some(update)) => {
            // Emit event to frontend about available update
            if let Some(window) = app.get_window("main") {
                let update_info = UpdateInfo {
                    version: update.version.clone(),
                    date: update.date.unwrap_or_default(),
                    body: update.body.unwrap_or_default(),
                    available: true,
                };
                let _ = window.emit("update-available", update_info);
            }
        }
        Ok(None) => {
            // No update available
        }
        Err(e) => {
            log::warn!("Failed to check for updates on startup: {}", e);
        }
    }
}
