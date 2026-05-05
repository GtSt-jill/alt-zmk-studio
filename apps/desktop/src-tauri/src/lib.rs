mod commands;
mod dto;
mod error;
mod serial;
mod zmk_client;

use std::sync::Mutex;

use commands::{
    connect_serial, disconnect_device, get_device_info, get_key_binding, get_keyboard_layout,
    get_layers, list_serial_devices, set_key_binding,
};
use zmk_client::ZmkClient;

pub struct AppState {
    client: Mutex<Option<ZmkClient>>,
}

pub fn run() {
    tauri::Builder::default()
        .manage(AppState {
            client: Mutex::new(None),
        })
        .invoke_handler(tauri::generate_handler![
            list_serial_devices,
            connect_serial,
            disconnect_device,
            get_device_info,
            get_layers,
            get_keyboard_layout,
            get_key_binding,
            set_key_binding
        ])
        .run(tauri::generate_context!())
        .expect("failed to run tauri application");
}
