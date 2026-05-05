use std::io::{Read, Write};
use std::time::Duration;

use serialport::SerialPort;
use zmk_studio_api::{Behavior, HidUsage, Keycode, StudioClient};

use crate::dto::{DeviceInfoDto, KeyBindingDto, KeyboardLayoutDto, LayerDto};
use crate::error::{CommandError, CommandResult};

const BAUD_RATE: u32 = 12_500;
const RPC_TIMEOUT: Duration = Duration::from_millis(1_000);

type ApiClient = StudioClient<SerialPortTransport>;

pub struct ZmkClient {
    device_id: String,
    client: ApiClient,
    info: Option<DeviceInfoDto>,
    layers: Option<Vec<LayerDto>>,
}

impl ZmkClient {
    pub fn connect(device_id: &str) -> CommandResult<Self> {
        let transport = SerialPortTransport::open(device_id)?;
        let mut client = Self {
            device_id: device_id.to_string(),
            client: StudioClient::new(transport),
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

        let _ = self.client.get_device_info().map_err(map_client_error)?;
        let key_count = self.key_count().unwrap_or(60);
        let info = DeviceInfoDto {
            id: self.device_id.clone(),
            name: "ZMK Keyboard".to_string(),
            manufacturer: None,
            firmware_version: None,
            key_count,
        };
        self.info = Some(info.clone());
        Ok(info)
    }

    pub fn get_layers(&mut self) -> CommandResult<Vec<LayerDto>> {
        if let Some(layers) = &self.layers {
            return Ok(layers.clone());
        }

        let keymap = self.client.get_keymap().map_err(map_client_error)?;
        let layers = keymap
            .layers
            .iter()
            .enumerate()
            .map(|(index, layer)| LayerDto {
                id: u8::try_from(layer.id).unwrap_or(index as u8),
                name: format!("Layer {}", layer.id),
            })
            .collect::<Vec<_>>();

        let layers = if layers.is_empty() {
            vec![LayerDto {
                id: 0,
                name: "Layer 0".to_string(),
            }]
        } else {
            layers
        };

        self.layers = Some(layers.clone());
        Ok(layers)
    }

    pub fn get_keyboard_layout(&mut self) -> CommandResult<Option<KeyboardLayoutDto>> {
        Ok(None)
    }

    pub fn get_key_binding(&mut self, layer_id: u8, position: u16) -> CommandResult<KeyBindingDto> {
        let behavior = self
            .client
            .get_key_at(u32::from(layer_id), i32::from(position))
            .map_err(map_client_error)?;
        Ok(behavior_to_dto(behavior))
    }

    pub fn set_key_binding(
        &mut self,
        layer_id: u8,
        position: u16,
        binding: KeyBindingDto,
    ) -> CommandResult<KeyBindingDto> {
        let behavior = dto_to_behavior(&binding)?;
        self.client
            .set_key_at(u32::from(layer_id), i32::from(position), behavior)
            .map_err(map_client_error)?;
        self.client.save_changes().map_err(map_client_error)?;
        self.get_key_binding(layer_id, position)
    }

    fn key_count(&mut self) -> Option<u16> {
        let keymap = self.client.get_keymap().ok()?;
        keymap
            .layers
            .first()
            .and_then(|layer| u16::try_from(layer.bindings.len()).ok())
    }
}

struct SerialPortTransport {
    inner: Box<dyn SerialPort>,
}

impl SerialPortTransport {
    fn open(path: &str) -> CommandResult<Self> {
        let port = serialport::new(path, BAUD_RATE)
            .timeout(RPC_TIMEOUT)
            .open()?;
        Ok(Self { inner: port })
    }
}

impl Read for SerialPortTransport {
    fn read(&mut self, buf: &mut [u8]) -> std::io::Result<usize> {
        self.inner.read(buf)
    }
}

impl Write for SerialPortTransport {
    fn write(&mut self, buf: &[u8]) -> std::io::Result<usize> {
        self.inner.write(buf)
    }

    fn flush(&mut self) -> std::io::Result<()> {
        self.inner.flush()
    }
}

fn behavior_to_dto(behavior: Behavior) -> KeyBindingDto {
    match behavior {
        Behavior::KeyPress(usage) => KeyBindingDto::key_press(usage.to_string()),
        Behavior::Transparent => KeyBindingDto {
            kind: "transparent".to_string(),
            code: None,
            behavior: None,
            params: None,
        },
        Behavior::None => KeyBindingDto::none(),
        other => KeyBindingDto {
            kind: "unsupported".to_string(),
            code: None,
            behavior: Some(format!("{other:?}")),
            params: Some(Vec::new()),
        },
    }
}

fn dto_to_behavior(binding: &KeyBindingDto) -> CommandResult<Behavior> {
    match binding.kind.as_str() {
        "keyPress" => {
            let code = binding
                .code
                .as_deref()
                .ok_or_else(|| CommandError::new("deviceError", "Missing key press code."))?;
            let keycode = Keycode::from_name(code).ok_or_else(|| {
                CommandError::new("unsupported", format!("Unknown keycode: {code}"))
            })?;
            Ok(Behavior::KeyPress(HidUsage::from_encoded(
                keycode.to_hid_usage(),
            )))
        }
        _ => Err(CommandError::new(
            "unsupported",
            "MVP only supports key press bindings.",
        )),
    }
}

fn map_client_error(error: impl std::fmt::Display) -> CommandError {
    let message = error.to_string();
    let code = if message.to_ascii_lowercase().contains("timeout") {
        "timeout"
    } else {
        "deviceError"
    };
    CommandError::new(code, message)
}
