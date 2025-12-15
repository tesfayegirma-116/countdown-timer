use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager, Runtime,
};

pub fn create_system_tray<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
    let show = MenuItem::with_id(app, "show", "Show Timer", true, None::<&str>)?;
    let hide = MenuItem::with_id(app, "hide", "Hide Timer", true, None::<&str>)?;
    let separator1 = PredefinedMenuItem::separator(app)?;
    let start_timer = MenuItem::with_id(app, "start_timer", "Start Timer", true, None::<&str>)?;
    let pause_timer = MenuItem::with_id(app, "pause_timer", "Pause Timer", true, None::<&str>)?;
    let reset_timer = MenuItem::with_id(app, "reset_timer", "Reset Timer", true, None::<&str>)?;
    let separator2 = PredefinedMenuItem::separator(app)?;
    let focus_mode = MenuItem::with_id(app, "focus_mode", "Focus Mode", true, None::<&str>)?;
    let always_on_top =
        MenuItem::with_id(app, "always_on_top", "Always on Top", true, None::<&str>)?;
    let separator3 = PredefinedMenuItem::separator(app)?;
    let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;

    let menu = Menu::with_items(
        app,
        &[
            &show,
            &hide,
            &separator1,
            &start_timer,
            &pause_timer,
            &reset_timer,
            &separator2,
            &focus_mode,
            &always_on_top,
            &separator3,
            &quit,
        ],
    )?;

    let mut builder = TrayIconBuilder::with_id("main")
        .menu(&menu)
        .tooltip("Zetseat Church Timer")
        .on_menu_event(move |app, event| {
            let window = match app.get_webview_window("main") {
                Some(w) => w,
                None => return,
            };

            match event.id.as_ref() {
                "show" => {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
                "hide" => {
                    let _ = window.hide();
                }
                "start_timer" => {
                    let _ = window.emit("tray-start-timer", ());
                }
                "pause_timer" => {
                    let _ = window.emit("tray-pause-timer", ());
                }
                "reset_timer" => {
                    let _ = window.emit("tray-reset-timer", ());
                }
                "focus_mode" => {
                    let _ = window.emit("tray-toggle-focus", ());
                }
                "always_on_top" => {
                    if let Ok(current_state) = window.is_always_on_top() {
                        let _ = window.set_always_on_top(!current_state);
                    }
                }
                "quit" => {
                    app.exit(0);
                }
                _ => {}
            }
        })
        .on_tray_icon_event(|tray, event| {
            let app = tray.app_handle();
            if let TrayIconEvent::Click { .. } = event {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
            if let TrayIconEvent::DoubleClick { .. } = event {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
        });

    if let Some(icon) = app.default_window_icon() {
        builder = builder.icon(icon.clone());
    }

    builder.build(app)?;

    Ok(())
}

#[tauri::command]
pub fn update_tray_tooltip(app: AppHandle, tooltip: String) -> Result<(), String> {
    if let Some(tray) = app.tray_by_id("main") {
        tray.set_tooltip(Some(tooltip)).map_err(|e| e.to_string())
    } else {
        Ok(())
    }
}

#[tauri::command]
pub fn update_tray_title(app: AppHandle, title: String) -> Result<(), String> {
    if let Some(tray) = app.tray_by_id("main") {
        tray.set_title(Some(title)).map_err(|e| e.to_string())
    } else {
        Ok(())
    }
}
