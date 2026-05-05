use std::collections::BTreeMap;
#[cfg(target_os = "linux")]
use std::path::Path;
use std::path::PathBuf;

use serialport::{SerialPortInfo, SerialPortType};

use crate::dto::SerialDeviceDto;
use crate::error::CommandResult;

pub fn list_serial_devices() -> CommandResult<Vec<SerialDeviceDto>> {
    let mut devices = BTreeMap::<String, SerialDeviceDto>::new();

    if let Ok(ports) = serialport::available_ports() {
        for device in ports.into_iter().map(to_dto) {
            devices.insert(device.path.clone(), device);
        }
    }

    for path in linux_serial_fallback_paths() {
        let path = path.to_string_lossy().to_string();
        devices
            .entry(path.clone())
            .or_insert_with(|| SerialDeviceDto {
                id: path.clone(),
                path: path.clone(),
                display_name: fallback_display_name(&path),
                manufacturer: None,
                product: None,
                vendor_id: None,
                product_id: None,
            });
    }

    for path in windows_serial_fallback_paths() {
        devices
            .entry(path.clone())
            .or_insert_with(|| SerialDeviceDto {
                id: path.clone(),
                path: path.clone(),
                display_name: format!("Serial port - {path}"),
                manufacturer: None,
                product: None,
                vendor_id: None,
                product_id: None,
            });
    }

    Ok(devices.into_values().collect())
}

fn to_dto(info: SerialPortInfo) -> SerialDeviceDto {
    let (manufacturer, product, vendor_id, product_id) = match info.port_type {
        SerialPortType::UsbPort(usb) => {
            (usb.manufacturer, usb.product, Some(usb.vid), Some(usb.pid))
        }
        _ => (None, None, None, None),
    };
    let display_name = match (&manufacturer, &product) {
        (Some(manufacturer), Some(product)) => {
            format!("{product} ({manufacturer}) - {}", info.port_name)
        }
        (_, Some(product)) => format!("{product} - {}", info.port_name),
        _ => info.port_name.clone(),
    };
    SerialDeviceDto {
        id: info.port_name.clone(),
        path: info.port_name,
        display_name,
        manufacturer,
        product,
        vendor_id,
        product_id,
    }
}

fn linux_serial_fallback_paths() -> Vec<PathBuf> {
    #[cfg(target_os = "linux")]
    {
        let mut paths = BTreeMap::<String, PathBuf>::new();

        for by_id_path in read_dir_paths(Path::new("/dev/serial/by-id")) {
            let canonical = std::fs::canonicalize(&by_id_path).unwrap_or(by_id_path);
            paths.insert(canonical.to_string_lossy().to_string(), canonical);
        }

        for prefix in ["/dev/ttyACM", "/dev/ttyUSB"] {
            for index in 0..256 {
                let path = PathBuf::from(format!("{prefix}{index}"));
                if path.exists() {
                    paths.insert(path.to_string_lossy().to_string(), path);
                }
            }
        }

        paths.into_values().collect()
    }
    #[cfg(not(target_os = "linux"))]
    {
        Vec::new()
    }
}

#[cfg(target_os = "linux")]
fn read_dir_paths(path: &Path) -> Vec<PathBuf> {
    std::fs::read_dir(path)
        .ok()
        .into_iter()
        .flat_map(|entries| entries.filter_map(Result::ok))
        .map(|entry| entry.path())
        .collect()
}

fn fallback_display_name(path: &str) -> String {
    if path.starts_with("/dev/ttyACM") {
        format!("USB CDC ACM serial - {path}")
    } else if path.starts_with("/dev/ttyUSB") {
        format!("USB serial - {path}")
    } else {
        path.to_string()
    }
}

fn windows_serial_fallback_paths() -> Vec<String> {
    #[cfg(target_os = "windows")]
    {
        windows_serialcomm_registry_ports()
    }
    #[cfg(not(target_os = "windows"))]
    {
        Vec::new()
    }
}

#[cfg(target_os = "windows")]
fn windows_serialcomm_registry_ports() -> Vec<String> {
    use windows_sys::Win32::Foundation::{ERROR_NO_MORE_ITEMS, ERROR_SUCCESS};
    use windows_sys::Win32::System::Registry::{
        RegCloseKey, RegEnumValueW, RegOpenKeyExW, HKEY, HKEY_LOCAL_MACHINE, KEY_READ,
    };

    let subkey = wide_null(r"HARDWARE\DEVICEMAP\SERIALCOMM");
    let mut key: HKEY = std::ptr::null_mut();
    let open_result =
        unsafe { RegOpenKeyExW(HKEY_LOCAL_MACHINE, subkey.as_ptr(), 0, KEY_READ, &mut key) };
    if open_result != ERROR_SUCCESS {
        return Vec::new();
    }

    let mut ports = Vec::new();
    let mut index = 0;
    loop {
        let mut value_name = vec![0u16; 256];
        let mut value_name_len = value_name.len() as u32;
        let mut data = vec![0u16; 256];
        let mut data_len = (data.len() * std::mem::size_of::<u16>()) as u32;
        let result = unsafe {
            RegEnumValueW(
                key,
                index,
                value_name.as_mut_ptr(),
                &mut value_name_len,
                std::ptr::null_mut(),
                std::ptr::null_mut(),
                data.as_mut_ptr().cast::<u8>(),
                &mut data_len,
            )
        };

        if result == ERROR_NO_MORE_ITEMS {
            break;
        }
        if result == ERROR_SUCCESS {
            let u16_len =
                usize::try_from(data_len).unwrap_or_default() / std::mem::size_of::<u16>();
            let end = data
                .iter()
                .take(u16_len)
                .position(|value| *value == 0)
                .unwrap_or(u16_len);
            let port = String::from_utf16_lossy(&data[..end]);
            if port.to_ascii_uppercase().starts_with("COM") {
                ports.push(port);
            }
        }
        index += 1;
    }

    unsafe {
        RegCloseKey(key);
    }
    ports
}

#[cfg(target_os = "windows")]
fn wide_null(value: &str) -> Vec<u16> {
    value.encode_utf16().chain(std::iter::once(0)).collect()
}
