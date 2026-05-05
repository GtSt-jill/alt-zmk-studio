use serialport::{SerialPortInfo, SerialPortType};

use crate::dto::SerialDeviceDto;
use crate::error::CommandResult;

pub fn list_serial_devices() -> CommandResult<Vec<SerialDeviceDto>> {
    let ports = serialport::available_ports()?;
    Ok(ports.into_iter().map(to_dto).collect())
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
