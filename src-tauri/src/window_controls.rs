use tauri::Window;

#[tauri::command]
pub fn minimize_window(window: Window) -> Result<(), String> {
    window.minimize().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn maximize_window(window: Window) -> Result<(), String> {
    window.maximize().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn close_window(window: Window) -> Result<(), String> {
    window.close().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn toggle_always_on_top(window: Window) -> Result<bool, String> {
    // Get current state and toggle it
    let current_state = window.is_always_on_top().map_err(|e| e.to_string())?;
    let new_state = !current_state;
    window.set_always_on_top(new_state).map_err(|e| e.to_string())?;
    Ok(new_state)
}

#[allow(dead_code)]
#[tauri::command]
pub fn set_window_size(window: Window, width: f64, height: f64) -> Result<(), String> {
    window.set_size(tauri::Size::Physical(tauri::PhysicalSize { width: width as u32, height: height as u32 }))
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn center_window(window: Window) -> Result<(), String> {
    window.center().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn hide_window(window: Window) -> Result<(), String> {
    window.hide().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn show_window(window: Window) -> Result<(), String> {
    window.show().map_err(|e| e.to_string())?;
    window.set_focus().map_err(|e| e.to_string())
}
