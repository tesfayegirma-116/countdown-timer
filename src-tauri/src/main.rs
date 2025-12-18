// Prevents additional console window on Windows in release, DO NOT REMOVE!!
// TEMPORARY DEBUGGING: Commented out to show console on Windows
// #![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
  app_lib::run();
}
