mod app_menu;
mod database;
mod notifications;
mod system_tray;
mod updater;
mod window_controls;

use app_menu::{create_app_menu, handle_menu_event};
use database::{
    clear_all_timer_sessions, delete_timer_session, get_timer_sessions, save_timer_session,
    Database,
};
use notifications::{
    check_notification_permission, request_notification_permission, send_notification,
};
use system_tray::{create_system_tray, update_tray_title, update_tray_tooltip};
use tauri::Manager;
use tauri_plugin_global_shortcut::GlobalShortcutExt;
use updater::{check_for_updates, check_for_updates_on_startup, get_app_version, install_update};
use window_controls::{
    center_window, close_window, hide_window, maximize_window, minimize_window, show_window,
    toggle_always_on_top,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_log::Builder::default()
                .targets([
                    tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::Stdout),
                    tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::LogDir { file_name: Some("app.log".into()) }),
                    tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::Webview),
                ])
                .level(log::LevelFilter::Info)
                .build(),
        )
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_shortcut(tauri_plugin_global_shortcut::Shortcut::new(
                    Some(
                        tauri_plugin_global_shortcut::Modifiers::META
                            | tauri_plugin_global_shortcut::Modifiers::SHIFT,
                    ),
                    tauri_plugin_global_shortcut::Code::KeyT,
                ))
                .unwrap_or_else(|_| tauri_plugin_global_shortcut::Builder::new())
                .with_handler(|app, _shortcut, _event| {
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                })
                .build(),
        )
        // .plugin(tauri_plugin_updater::Builder::new().build())
        .on_menu_event(|app, event| handle_menu_event(app, event))
        .setup(|app| {
            let handle = app.handle();

            // Initialize system tray
            create_system_tray(handle)?;

            // Initialize app menu
            let menu = create_app_menu(handle)?;
            app.set_menu(menu)?;

            // Get app data directory and initialize database
            let app_dir = app
                .path()
                .app_data_dir()
                .expect("Failed to get app data directory");
            let db_path = app_dir
                .join("zetseat-church-timer")
                .join("timer_sessions.db");

            log::info!("Initializing database at: {:?}", db_path);

            match Database::new(db_path.clone()) {
                Ok(database) => {
                    app.manage(database);
                    log::info!("Database initialized successfully");
                }
                Err(e) => {
                    log::error!("Failed to initialize database: {}", e);
                     panic!("Failed to initialize database: {}", e);
                }
            }

            // Check for updates on startup (async)
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                check_for_updates_on_startup(&app_handle).await;
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            save_timer_session,
            get_timer_sessions,
            delete_timer_session,
            clear_all_timer_sessions,
            minimize_window,
            maximize_window,
            close_window,
            toggle_always_on_top,
            hide_window,
            show_window,
            center_window,
            send_notification,
            request_notification_permission,
            check_notification_permission,
            update_tray_tooltip,
            update_tray_title,
            check_for_updates,
            install_update,
            get_app_version
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
