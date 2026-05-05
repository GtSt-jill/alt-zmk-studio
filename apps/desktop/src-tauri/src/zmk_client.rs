use std::io::{BufRead, BufReader, Write};
use std::time::Duration;

use serde_json::{json, Value};
use serialport::SerialPort;

use crate::dto::{DeviceInfoDto, KeyBindingDto, KeyboardLayoutDto, LayerDto};
use crate::error::{CommandError, CommandResult};

const BAUD_RATE: u32 = 115_200;
const RPC_TIMEOUT: Duration = Duration::from_millis(1500);

pub struct ZmkClient {
    device_id: String,
    port: Box<dyn SerialPort>,
    info: Option<DeviceInfoDto>,
    layers: Option<Vec<LayerDto>>,
}

impl ZmkClient {
    pub fn connect(device_id: &str) -> CommandResult<Self> {
        let port = serialport::new(device_id, BAUD_RATE)
            .timeout(RPC_TIMEOUT)
            .open()?;
        let mut client = Self {
            device_id: device_id.to_string(),
            port,
            info: None,
            layers: None,
        };

        let info = client.get_device_info()?;
        client.info = Some(info);
        Ok(client)
    }

    pub fn get_device_info(&mut self) -> CommandResult<DeviceInfoDto> {
        if let Some(info) = &self.info {
            return Ok(info.clone());
        }

        let response = self.request("get_device_info", json!({}))?;
        let info = DeviceInfoDto {
            id: self.device_id.clone(),
            name: response
                .get("name")
                .and_then(Value::as_str)
                .unwrap_or("ZMK Keyboard")
                .to_string(),
            manufacturer: response
                .get("manufacturer")
                .and_then(Value::as_str)
                .map(ToString::to_string),
            firmware_version: response
                .get("firmwareVersion")
                .and_then(Value::as_str)
                .map(ToString::to_string),
            key_count: response
                .get("keyCount")
                .and_then(Value::as_u64)
                .and_then(|value| u16::try_from(value).ok())
                .unwrap_or(60),
        };
        self.info = Some(info.clone());
        Ok(info)
    }

    pub fn get_layers(&mut self) -> CommandResult<Vec<LayerDto>> {
        if let Some(layers) = &self.layers {
            return Ok(layers.clone());
        }

        let response = self.request("get_layers", json!({}))?;
        let layers = response
            .get("layers")
            .and_then(Value::as_array)
            .map(|items| {
                items
                    .iter()
                    .enumerate()
                    .map(|(index, item)| LayerDto {
                        id: item
                            .get("id")
                            .and_then(Value::as_u64)
                            .and_then(|value| u8::try_from(value).ok())
                            .unwrap_or(index as u8),
                        name: item
                            .get("name")
                            .and_then(Value::as_str)
                            .map(ToString::to_string)
                            .unwrap_or_else(|| format!("Layer {index}")),
                    })
                    .collect::<Vec<_>>()
            })
            .filter(|layers| !layers.is_empty())
            .unwrap_or_else(|| {
                vec![LayerDto {
                    id: 0,
                    name: "Layer 0".to_string(),
                }]
            });
        self.layers = Some(layers.clone());
        Ok(layers)
    }

    pub fn get_keyboard_layout(&mut self) -> CommandResult<Option<KeyboardLayoutDto>> {
        match self.request("get_keyboard_layout", json!({})) {
            Ok(response) => Ok(serde_json::from_value(response).ok()),
            Err(error) if error.code == "unsupported" => Ok(None),
            Err(error) => Err(error),
        }
    }

    pub fn get_key_binding(&mut self, layer_id: u8, position: u16) -> CommandResult<KeyBindingDto> {
        let response = self.request(
            "get_key_binding",
            json!({
                "layerId": layer_id,
                "position": position
            }),
        )?;
        Ok(parse_binding(response))
    }

    pub fn set_key_binding(
        &mut self,
        layer_id: u8,
        position: u16,
        binding: KeyBindingDto,
    ) -> CommandResult<KeyBindingDto> {
        if binding.kind != "keyPress" {
            return Err(CommandError::new(
                "unsupported",
                "MVP only supports key press bindings.",
            ));
        }
        let response = self.request(
            "set_key_binding",
            json!({
                "layerId": layer_id,
                "position": position,
                "binding": binding
            }),
        )?;
        Ok(parse_binding(response))
    }

    fn request(&mut self, method: &str, params: Value) -> CommandResult<Value> {
        // Abstraction boundary for zmk-studio-api:
        // Replace this JSON-lines transport with the crate-backed RPC client once the
        // crate API is finalized for this app. Commands above should not change.
        let request = json!({
            "jsonrpc": "2.0",
            "id": 1,
            "method": method,
            "params": params
        });
        let line = serde_json::to_string(&request)
            .map_err(|error| CommandError::new("unknown", error.to_string()))?;
        self.port.write_all(line.as_bytes())?;
        self.port.write_all(b"\n")?;
        self.port.flush()?;

        let cloned = self.port.try_clone()?;
        let mut reader = BufReader::new(cloned);
        let mut response = String::new();
        reader.read_line(&mut response)?;
        if response.trim().is_empty() {
            return Err(CommandError::new(
                "timeout",
                "RPC timeout waiting for device response.",
            ));
        }

        let value: Value = serde_json::from_str(&response)
            .map_err(|error| CommandError::new("deviceError", error.to_string()))?;
        if let Some(error) = value.get("error") {
            let code = error
                .get("code")
                .and_then(Value::as_str)
                .unwrap_or("deviceError");
            let message = error
                .get("message")
                .and_then(Value::as_str)
                .unwrap_or("Device RPC failed.");
            return Err(CommandError::new(map_error_code(code), message));
        }
        Ok(value.get("result").cloned().unwrap_or(value))
    }
}

fn parse_binding(value: Value) -> KeyBindingDto {
    if let Ok(binding) = serde_json::from_value::<KeyBindingDto>(value.clone()) {
        return binding;
    }
    if let Some(code) = value.get("code").and_then(Value::as_str) {
        return KeyBindingDto::key_press(code);
    }
    KeyBindingDto::none()
}

fn map_error_code(code: &str) -> &'static str {
    match code {
        "timeout" => "timeout",
        "permissionDenied" => "permissionDenied",
        "unsupported" => "unsupported",
        "notConnected" => "notConnected",
        _ => "deviceError",
    }
}
