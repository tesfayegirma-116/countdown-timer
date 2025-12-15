use tauri::menu::MenuEvent;
use tauri::{
    menu::{AboutMetadata, CheckMenuItem, Menu, MenuItem, PredefinedMenuItem, Submenu},
    AppHandle, Emitter, Manager, Runtime, WebviewWindow,
};

pub fn create_app_menu<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<Menu<R>> {
    let app_menu = Submenu::with_items(
        app,
        "Zetseat Church Timer",
        true,
        &[
            &PredefinedMenuItem::about(
                app,
                Some("About Zetseat Church Timer"),
                Some(AboutMetadata {
                    version: Some(env!("CARGO_PKG_VERSION").into()),
                    authors: Some(vec!["Zetseat Church".to_string()]),
                    comments: Some("A focus timer for church services and meetings".into()),
                    copyright: Some("© 2024 Zetseat Church".into()),
                    license: Some("MIT".into()),
                    website: Some("https://zetseat.church".into()),
                    website_label: Some("Visit our website".into()),
                    ..Default::default()
                }),
            )?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(
                app,
                "preferences",
                "Preferences...",
                true,
                Some("CmdOrCtrl+,"),
            )?,
            &PredefinedMenuItem::separator(app)?,
            &PredefinedMenuItem::services(app, None)?,
            &PredefinedMenuItem::separator(app)?,
            &PredefinedMenuItem::hide(app, None)?,
            &PredefinedMenuItem::hide_others(app, None)?,
            &PredefinedMenuItem::show_all(app, None)?,
            &PredefinedMenuItem::separator(app)?,
            &PredefinedMenuItem::quit(app, None)?,
        ],
    )?;

    let file_menu = Submenu::with_items(
        app,
        "File",
        true,
        &[
            &MenuItem::with_id(app, "new_session", "New Session", true, Some("CmdOrCtrl+N"))?,
            &MenuItem::with_id(
                app,
                "save_session",
                "Save Session",
                true,
                Some("CmdOrCtrl+S"),
            )?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(
                app,
                "export_history",
                "Export History...",
                true,
                None::<&str>,
            )?,
            &MenuItem::with_id(
                app,
                "import_history",
                "Import History...",
                true,
                None::<&str>,
            )?,
            &PredefinedMenuItem::separator(app)?,
            &PredefinedMenuItem::close_window(app, None)?,
        ],
    )?;

    let timer_menu = Submenu::with_items(
        app,
        "Timer",
        true,
        &[
            &MenuItem::with_id(app, "start_pause", "Start/Pause", true, Some("Space"))?,
            &MenuItem::with_id(app, "reset", "Reset", true, Some("CmdOrCtrl+R"))?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(app, "set_5min", "Set 5 Minutes", true, Some("CmdOrCtrl+1"))?,
            &MenuItem::with_id(
                app,
                "set_15min",
                "Set 15 Minutes",
                true,
                Some("CmdOrCtrl+2"),
            )?,
            &MenuItem::with_id(
                app,
                "set_25min",
                "Set 25 Minutes",
                true,
                Some("CmdOrCtrl+3"),
            )?,
            &MenuItem::with_id(
                app,
                "set_45min",
                "Set 45 Minutes",
                true,
                Some("CmdOrCtrl+4"),
            )?,
            &MenuItem::with_id(
                app,
                "set_60min",
                "Set 60 Minutes",
                true,
                Some("CmdOrCtrl+5"),
            )?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(
                app,
                "custom_time",
                "Custom Time...",
                true,
                Some("CmdOrCtrl+T"),
            )?,
        ],
    )?;

    let view_menu = Submenu::with_items(
        app,
        "View",
        true,
        &[
            &MenuItem::with_id(app, "fullscreen", "Enter Fullscreen", true, Some("F"))?,
            &CheckMenuItem::with_id(
                app,
                "always_on_top",
                "Always on Top",
                true,
                false,
                None::<&str>,
            )?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(
                app,
                "show_history",
                "Show History",
                true,
                Some("CmdOrCtrl+H"),
            )?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(app, "minimize", "Minimize", true, Some("CmdOrCtrl+M"))?,
            &MenuItem::with_id(app, "zoom", "Zoom", true, None::<&str>)?,
        ],
    )?;

    let window_menu = Submenu::with_items(
        app,
        "Window",
        true,
        &[
            &PredefinedMenuItem::minimize(app, None)?,
            &MenuItem::with_id(app, "zoom", "Zoom", true, None::<&str>)?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(app, "center", "Center Window", true, None::<&str>)?,
            &PredefinedMenuItem::separator(app)?,
            &PredefinedMenuItem::close_window(app, None)?,
        ],
    )?;

    let help_menu = Submenu::with_items(
        app,
        "Help",
        true,
        &[
            &MenuItem::with_id(
                app,
                "keyboard_shortcuts",
                "Keyboard Shortcuts",
                true,
                None::<&str>,
            )?,
            &MenuItem::with_id(app, "user_guide", "User Guide", true, None::<&str>)?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(app, "report_issue", "Report Issue", true, None::<&str>)?,
            &MenuItem::with_id(
                app,
                "check_updates",
                "Check for Updates...",
                true,
                None::<&str>,
            )?,
        ],
    )?;

    Menu::with_items(
        app,
        &[
            &app_menu,
            &file_menu,
            &timer_menu,
            &view_menu,
            &window_menu,
            &help_menu,
        ],
    )
}

pub fn handle_menu_event<R: Runtime>(app: &AppHandle<R>, event: MenuEvent) {
    let window: WebviewWindow<R> = match app.get_webview_window("main") {
        Some(w) => w,
        None => return,
    };

    match event.id().as_ref() {
        // File Menu
        "new_session" => {
            let _ = window.emit("menu-new-session", ());
        }
        "save_session" => {
            let _ = window.emit("menu-save-session", ());
        }
        "export_history" => {
            let _ = window.emit("menu-export-history", ());
        }
        "import_history" => {
            let _ = window.emit("menu-import-history", ());
        }

        // Timer Menu
        "start_pause" => {
            let _ = window.emit("menu-start-pause", ());
        }
        "reset" => {
            let _ = window.emit("menu-reset", ());
        }
        "set_5min" => {
            let _ = window.emit("menu-set-time", 5);
        }
        "set_15min" => {
            let _ = window.emit("menu-set-time", 15);
        }
        "set_25min" => {
            let _ = window.emit("menu-set-time", 25);
        }
        "set_45min" => {
            let _ = window.emit("menu-set-time", 45);
        }
        "set_60min" => {
            let _ = window.emit("menu-set-time", 60);
        }
        "custom_time" => {
            let _ = window.emit("menu-custom-time", ());
        }

        // View Menu
        "fullscreen" => {
            let _ = window.emit("menu-fullscreen", ());
        }
        "always_on_top" => {
            if let Ok(current_state) = window.is_always_on_top() {
                let _ = window.set_always_on_top(!current_state);
            }
        }
        "show_history" => {
            let _ = window.emit("menu-show-history", ());
        }
        "minimize" => {
            let _ = window.minimize();
        }
        "zoom" => {
            let _ = window.maximize();
        }

        // Window Menu
        "center" => {
            let _ = window.center();
        }

        // Help Menu
        "keyboard_shortcuts" => {
            let _ = window.emit("menu-keyboard-shortcuts", ());
        }
        "user_guide" => {
            // TODO: Add tauri-plugin-shell to Cargo.toml and uncomment below to enable opening URLs
            // use tauri_plugin_shell::ShellExt;
            // let _ = tauri::Url::parse("https://zetseat.church/timer-help").ok().map(|url| {
            //    let _ = app.shell().open(url.to_string(), None);
            // });
        }
        "report_issue" => {
            // TODO: Add tauri-plugin-shell to Cargo.toml and uncomment below to enable opening URLs
            // use tauri_plugin_shell::ShellExt;
            // let _ = tauri::Url::parse("https://github.com/zetseat-church/timer/issues").ok().map(|url| {
            //    let _ = app.shell().open(url.to_string(), None);
            // });
        }
        "check_updates" => {
            let _ = window.emit("menu-check-updates", ());
        }

        // Preferences
        "preferences" => {
            let _ = window.emit("menu-preferences", ());
        }

        _ => {}
    }
}
