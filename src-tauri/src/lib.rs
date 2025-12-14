mod database;
mod window_controls;
mod system_tray;
mod notifications;
mod app_menu;
mod updater;

use database::{Database, save_timer_session, get_timer_sessions, delete_timer_session, clear_all_timer_sessions};
use window_controls::{minimize_window, maximize_window, close_window, toggle_always_on_top, hide_window, show_window, center_window};
use notifications::{send_notification, request_notification_permission, check_notification_permission};
use system_tray::{create_system_tray, handle_system_tray_event, update_tray_tooltip};
use app_menu::{create_app_menu, handle_menu_event};
use updater::{check_for_updates, install_update, get_app_version, check_for_updates_on_startup};
use std::path::PathBuf;
use tauri::{Manager, SystemTray};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  let tray = create_system_tray();
  let menu = create_app_menu();
  
  tauri::Builder::default()
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_notification::init())
    .plugin(tauri_plugin_global_shortcut::Builder::new().build())
    .plugin(tauri_plugin_updater::Builder::new().build())
    .menu(menu)
    .on_menu_event(handle_menu_event)
    .system_tray(tray)
    .on_system_tray_event(handle_system_tray_event)
    .setup(|app| {
      // Get app data directory and initialize database
      let app_dir = app.path().app_data_dir()
        .expect("Failed to get app data directory");
      let db_path = app_dir.join("zetseat-church-timer").join("timer_sessions.db");
      
      let database = Database::new(db_path)
        .expect("Failed to initialize database");
      
      app.manage(database);

      // Register global shortcuts
      let app_handle = app.handle();
      app.global_shortcut().register("CmdOrCtrl+Shift+T", move || {
        if let Some(window) = app_handle.get_window("main") {
          let _ = window.show();
          let _ = window.set_focus();
        }
      })?;

      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      // Check for updates on startup (async)
      let app_handle = app.handle();
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
      check_for_updates,
      install_update,
      get_app_version
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
