// Pit Desk desktop shell.
// The whole app is the same React/TypeScript code as the website (../src);
// this file just opens it in a native window. No native commands are exposed.

// Hide the extra console window on Windows release builds.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running Pit Desk");
}
