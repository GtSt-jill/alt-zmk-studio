use tauri::State;

use crate::dto::{DeviceInfoDto, KeyBindingDto, KeyboardLayoutDto, LayerDto, SerialDeviceDto};
use crate::error::{CommandError, CommandResult};
use crate::serial;
use crate::zmk_client::ZmkClient;
use crate::AppState;

#[tauri::command]
pub fn list_serial_devices() -> CommandResult<Vec<SerialDeviceDto>> {
    serial::list_serial_devices()
}

#[tauri::command(rename_all = "camelCase")]
pub fn connect_serial(
    device_id: String,
    state: State<'_, AppState>,
) -> CommandResult<DeviceInfoDto> {
    let client = ZmkClient::connect(&device_id)?;
    let mut guard = state
        .client
        .lock()
        .map_err(|_| CommandError::new("unknown", "Device state lock was poisoned."))?;
    let mut client = client;
    let info = client.get_device_info()?;
    *guard = Some(client);
    Ok(info)
}

#[tauri::command]
pub fn disconnect_device(state: State<'_, AppState>) -> CommandResult<()> {
    let mut guard = state
        .client
        .lock()
        .map_err(|_| CommandError::new("unknown", "Device state lock was poisoned."))?;
    *guard = None;
    Ok(())
}

#[tauri::command]
pub fn get_device_info(state: State<'_, AppState>) -> CommandResult<DeviceInfoDto> {
    with_client(state, |client| client.get_device_info())
}

#[tauri::command]
pub fn get_layers(state: State<'_, AppState>) -> CommandResult<Vec<LayerDto>> {
    with_client(state, |client| client.get_layers())
}

#[tauri::command]
pub fn get_keyboard_layout(state: State<'_, AppState>) -> CommandResult<Option<KeyboardLayoutDto>> {
    with_client(state, |client| client.get_keyboard_layout())
}

#[tauri::command(rename_all = "camelCase")]
pub fn get_key_binding(
    layer_id: u8,
    position: u16,
    state: State<'_, AppState>,
) -> CommandResult<KeyBindingDto> {
    with_client(state, |client| client.get_key_binding(layer_id, position))
}

#[tauri::command(rename_all = "camelCase")]
pub fn set_key_binding(
    layer_id: u8,
    position: u16,
    binding: KeyBindingDto,
    state: State<'_, AppState>,
) -> CommandResult<KeyBindingDto> {
    with_client(state, |client| {
        client.set_key_binding(layer_id, position, binding)
    })
}

fn with_client<T>(
    state: State<'_, AppState>,
    run: impl FnOnce(&mut ZmkClient) -> CommandResult<T>,
) -> CommandResult<T> {
    let mut guard = state
        .client
        .lock()
        .map_err(|_| CommandError::new("unknown", "Device state lock was poisoned."))?;
    let client = guard
        .as_mut()
        .ok_or_else(|| CommandError::new("notConnected", "No device is connected."))?;
    run(client)
}
