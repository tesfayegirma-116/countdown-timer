use tauri::{
    AppHandle, CustomMenuItem, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu, 
    SystemTrayMenuItem, SystemTraySubmenu, Window
};

pub fn create_system_tray() -> SystemTray {
    let show = CustomMenuItem::new("show".to_string(), "Show Timer");
    let hide = CustomMenuItem::new("hide".to_string(), "Hide Timer");
    let separator1 = SystemTrayMenuItem::Separator;
    let start_timer = CustomMenuItem::new("start_timer".to_string(), "Start Timer");
    let pause_timer = CustomMenuItem::new("pause_timer".to_string(), "Pause Timer");
    let reset_timer = CustomMenuItem::new("reset_timer".to_string(), "Reset Timer");
    let separator2 = SystemTrayMenuItem::Separator;
    let focus_mode = CustomMenuItem::new("focus_mode".to_string(), "Focus Mode");
    let always_on_top = CustomMenuItem::new("always_on_top".to_string(), "Always on Top");
    let separator3 = SystemTrayMenuItem::Separator;
    let quit = CustomMenuItem::new("quit".to_string(), "Quit");

    let tray_menu = SystemTrayMenu::new()
        .add_item(show)
        .add_item(hide)
        .add_native_item(separator1)
        .add_item(start_timer)
        .add_item(pause_timer)
        .add_item(reset_timer)
        .add_native_item(separator2)
        .add_item(focus_mode)
        .add_item(always_on_top)
        .add_native_item(separator3)
        .add_item(quit);

    SystemTray::new().with_menu(tray_menu).with_tooltip("Zetseat Church Timer")
}

pub fn handle_system_tray_event(app: &AppHandle, event: SystemTrayEvent) {
    match event {
        SystemTrayEvent::LeftClick {
            position: _,
            size: _,
            ..
        } => {
            if let Some(window) = app.get_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }
        SystemTrayEvent::RightClick {
            position: _,
            size: _,
            ..
        } => {
            // Right click shows the context menu automatically
        }
        SystemTrayEvent::DoubleClick {
            position: _,
            size: _,
            ..
        } => {
            if let Some(window) = app.get_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }
        SystemTrayEvent::MenuItemClick { id, .. } => {
            match id.as_str() {
                "show" => {
                    if let Some(window) = app.get_window("main") {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
                "hide" => {
                    if let Some(window) = app.get_window("main") {
                        let _ = window.hide();
                    }
                }
                "start_timer" => {
                    // Emit event to frontend to start timer
                    if let Some(window) = app.get_window("main") {
                        let _ = window.emit("tray-start-timer", ());
                    }
                }
                "pause_timer" => {
                    // Emit event to frontend to pause timer
                    if let Some(window) = app.get_window("main") {
                        let _ = window.emit("tray-pause-timer", ());
                    }
                }
                "reset_timer" => {
                    // Emit event to frontend to reset timer
                    if let Some(window) = app.get_window("main") {
                        let _ = window.emit("tray-reset-timer", ());
                    }
                }
                "focus_mode" => {
                    // Toggle fullscreen/focus mode
                    if let Some(window) = app.get_window("main") {
                        let _ = window.emit("tray-toggle-focus", ());
                    }
                }
                "always_on_top" => {
                    // Toggle always on top
                    if let Some(window) = app.get_window("main") {
                        if let Ok(current_state) = window.is_always_on_top() {
                            let _ = window.set_always_on_top(!current_state);
                        }
                    }
                }
                "quit" => {
                    app.exit(0);
                }
                _ => {}
            }
        }
        _ => {}
    }
}

#[tauri::command]
pub fn update_tray_tooltip(app: AppHandle, tooltip: String) -> Result<(), String> {
    app.tray_handle().set_tooltip(&tooltip).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_tray_title(app: AppHandle, title: String) -> Result<(), String> {
    app.tray_handle().set_title(&title).map_err(|e| e.to_string())
}
