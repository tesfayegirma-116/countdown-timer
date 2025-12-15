use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_updater::UpdaterExt;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UpdateInfo {
    pub version: String,
    pub date: String,
    pub body: String,
    pub available: bool,
}

#[tauri::command]
pub async fn check_for_updates(app: AppHandle) -> Result<UpdateInfo, String> {
    // Assuming app.updater() returns Result<Updater> (no Option) based on "found enum Option" error when I tried matching Some(updater)
    // Wait, if I matched Some(updater) and it said "expected struct Updater found enum Option", that means app.updater() returned `Updater` directly?
    // No, if I match `Some(x)`, the scrutinee must be `Option`.
    // If scrutinee is `Updater`, then matching `Some(_)` is wrong.
    // So `app.updater()?` returns `Updater` directly.

    let updater = app.updater().map_err(|e| e.to_string())?;

    match updater.check().await {
        Ok(Some(update)) => Ok(UpdateInfo {
            version: update.version,
            date: update.date.map(|d| d.to_string()).unwrap_or_default(),
            body: update.body.unwrap_or_default(),
            available: true,
        }),
        Ok(None) => Ok(UpdateInfo {
            version: app.package_info().version.to_string(),
            date: String::new(),
            body: "You are running the latest version.".to_string(),
            available: false,
        }),
        Err(e) => Err(format!("Failed to check for updates: {}", e)),
    }
}

#[tauri::command]
pub async fn install_update(app: AppHandle) -> Result<(), String> {
    let updater = app.updater().map_err(|e| e.to_string())?;

    match updater.check().await {
        Ok(Some(update)) => {
            let mut downloaded = 0;
            let mut content_length = 0;

            update
                .download_and_install(
                    |chunk_length, content_len| {
                        downloaded += chunk_length;
                        if let Some(len) = content_len {
                            content_length = len;
                        }
                        println!("Downloaded {}/{}", downloaded, content_length);
                    },
                    || {
                        println!("Download finished");
                    },
                )
                .await
                .map_err(|e| e.to_string())?;

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
    if let Ok(updater) = app.updater() {
        match updater.check().await {
            Ok(Some(update)) => {
                // Emit event to frontend about available update
                if let Some(window) = app.get_webview_window("main") {
                    let update_info = UpdateInfo {
                        version: update.version.clone(),
                        date: update.date.map(|d| d.to_string()).unwrap_or_default(),
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
}
