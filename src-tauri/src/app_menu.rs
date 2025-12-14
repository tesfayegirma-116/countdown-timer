use tauri::{
    AboutMetadata, AppHandle, CustomMenuItem, Manager, Menu, MenuItem, Submenu, WindowMenuEvent, Wry
};

pub fn create_app_menu() -> Menu {
    let app_menu = Submenu::new(
        "Zetseat Church Timer",
        Menu::new()
            .add_native_item(MenuItem::About(
                "Zetseat Church Timer".to_string(),
                AboutMetadata::new()
                    .version(env!("CARGO_PKG_VERSION"))
                    .authors(vec!["Zetseat Church".to_string()])
                    .comments("A focus timer for church services and meetings")
                    .copyright("© 2024 Zetseat Church")
                    .license("MIT")
                    .website("https://zetseat.church")
                    .website_label("Visit our website"),
            ))
            .add_native_item(MenuItem::Separator)
            .add_item(CustomMenuItem::new("preferences", "Preferences...").accelerator("CmdOrCtrl+,"))
            .add_native_item(MenuItem::Separator)
            .add_native_item(MenuItem::Services)
            .add_native_item(MenuItem::Separator)
            .add_native_item(MenuItem::Hide)
            .add_native_item(MenuItem::HideOthers)
            .add_native_item(MenuItem::ShowAll)
            .add_native_item(MenuItem::Separator)
            .add_native_item(MenuItem::Quit),
    );

    let file_menu = Submenu::new(
        "File",
        Menu::new()
            .add_item(CustomMenuItem::new("new_session", "New Session").accelerator("CmdOrCtrl+N"))
            .add_item(CustomMenuItem::new("save_session", "Save Session").accelerator("CmdOrCtrl+S"))
            .add_native_item(MenuItem::Separator)
            .add_item(CustomMenuItem::new("export_history", "Export History..."))
            .add_item(CustomMenuItem::new("import_history", "Import History..."))
            .add_native_item(MenuItem::Separator)
            .add_native_item(MenuItem::CloseWindow),
    );

    let timer_menu = Submenu::new(
        "Timer",
        Menu::new()
            .add_item(CustomMenuItem::new("start_pause", "Start/Pause").accelerator("Space"))
            .add_item(CustomMenuItem::new("reset", "Reset").accelerator("CmdOrCtrl+R"))
            .add_native_item(MenuItem::Separator)
            .add_item(CustomMenuItem::new("set_5min", "Set 5 Minutes").accelerator("CmdOrCtrl+1"))
            .add_item(CustomMenuItem::new("set_15min", "Set 15 Minutes").accelerator("CmdOrCtrl+2"))
            .add_item(CustomMenuItem::new("set_25min", "Set 25 Minutes").accelerator("CmdOrCtrl+3"))
            .add_item(CustomMenuItem::new("set_45min", "Set 45 Minutes").accelerator("CmdOrCtrl+4"))
            .add_item(CustomMenuItem::new("set_60min", "Set 60 Minutes").accelerator("CmdOrCtrl+5"))
            .add_native_item(MenuItem::Separator)
            .add_item(CustomMenuItem::new("custom_time", "Custom Time...").accelerator("CmdOrCtrl+T")),
    );

    let view_menu = Submenu::new(
        "View",
        Menu::new()
            .add_item(CustomMenuItem::new("fullscreen", "Enter Fullscreen").accelerator("F"))
            .add_item(CustomMenuItem::new("always_on_top", "Always on Top"))
            .add_native_item(MenuItem::Separator)
            .add_item(CustomMenuItem::new("show_history", "Show History").accelerator("CmdOrCtrl+H"))
            .add_native_item(MenuItem::Separator)
            .add_item(CustomMenuItem::new("minimize", "Minimize").accelerator("CmdOrCtrl+M"))
            .add_item(CustomMenuItem::new("zoom", "Zoom")),
    );

    let window_menu = Submenu::new(
        "Window",
        Menu::new()
            .add_native_item(MenuItem::Minimize)
            .add_item(CustomMenuItem::new("zoom", "Zoom"))
            .add_native_item(MenuItem::Separator)
            .add_item(CustomMenuItem::new("center", "Center Window"))
            .add_native_item(MenuItem::Separator)
            .add_native_item(MenuItem::CloseWindow),
    );

    let help_menu = Submenu::new(
        "Help",
        Menu::new()
            .add_item(CustomMenuItem::new("keyboard_shortcuts", "Keyboard Shortcuts"))
            .add_item(CustomMenuItem::new("user_guide", "User Guide"))
            .add_native_item(MenuItem::Separator)
            .add_item(CustomMenuItem::new("report_issue", "Report Issue"))
            .add_item(CustomMenuItem::new("check_updates", "Check for Updates...")),
    );

    Menu::new()
        .add_submenu(app_menu)
        .add_submenu(file_menu)
        .add_submenu(timer_menu)
        .add_submenu(view_menu)
        .add_submenu(window_menu)
        .add_submenu(help_menu)
}

pub fn handle_menu_event(event: WindowMenuEvent<Wry>) {
    let app_handle = event.window().app_handle();
    let window = event.window();

    match event.menu_item_id() {
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
            let _ = tauri::api::shell::open(&app_handle.shell_scope(), "https://zetseat.church/timer-help", None);
        }
        "report_issue" => {
            let _ = tauri::api::shell::open(&app_handle.shell_scope(), "https://github.com/zetseat-church/timer/issues", None);
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
