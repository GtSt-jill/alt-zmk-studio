use std::io::{Read, Write};
use std::time::Duration;

use serialport::SerialPort;
use zmk_studio_api::{Behavior, HidUsage, Keycode, StudioClient};

use crate::dto::{DeviceInfoDto, KeyBindingDto, KeyboardLayoutDto, KeyboardLayoutKeyDto, LayerDto};
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
        let Ok(layouts) = self.client.get_physical_layouts() else {
            return Ok(None);
        };
        let Some(layout) = layouts
            .layouts
            .get(usize::try_from(layouts.active_layout_index).unwrap_or_default())
            .or_else(|| layouts.layouts.first())
        else {
            return Ok(None);
        };

        let keys = layout
            .keys
            .iter()
            .enumerate()
            .map(|(position, key)| KeyboardLayoutKeyDto {
                position: u16::try_from(position).unwrap_or(u16::MAX),
                x: physical_unit(key.x),
                y: physical_unit(key.y),
                width: physical_size(key.width),
                height: physical_size(key.height),
                rotation: physical_rotation(key.r),
                rotation_x: physical_unit(key.rx),
                rotation_y: physical_unit(key.ry),
            })
            .collect::<Vec<_>>();

        if keys.is_empty() {
            Ok(None)
        } else {
            Ok(Some(KeyboardLayoutDto { keys }))
        }
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
        Behavior::KeyToggle(usage) => binding_with_code("keyToggle", usage.to_string()),
        Behavior::StickyKey(usage) => binding_with_code("stickyKey", usage.to_string()),
        Behavior::MomentaryLayer { layer_id } => binding_with_layer("momentaryLayer", layer_id),
        Behavior::ToggleLayer { layer_id } => binding_with_layer("toggleLayer", layer_id),
        Behavior::ToLayer { layer_id } => binding_with_layer("toLayer", layer_id),
        Behavior::StickyLayer { layer_id } => binding_with_layer("stickyLayer", layer_id),
        Behavior::LayerTap { layer_id, tap } => KeyBindingDto {
            kind: "layerTap".to_string(),
            code: None,
            layer_id: Some(layer_id),
            hold: None,
            tap: Some(tap.to_string()),
            behavior: None,
            params: None,
        },
        Behavior::ModTap { hold, tap } => KeyBindingDto {
            kind: "modTap".to_string(),
            code: None,
            layer_id: None,
            hold: Some(hold.to_string()),
            tap: Some(tap.to_string()),
            behavior: None,
            params: None,
        },
        Behavior::Transparent => KeyBindingDto {
            kind: "transparent".to_string(),
            code: None,
            layer_id: None,
            hold: None,
            tap: None,
            behavior: None,
            params: None,
        },
        Behavior::None => KeyBindingDto::none(),
        other => KeyBindingDto {
            kind: "unsupported".to_string(),
            code: None,
            layer_id: None,
            hold: None,
            tap: None,
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
            Ok(Behavior::KeyPress(hid_usage_from_code(code)?))
        }
        "keyToggle" => {
            let code = required_code(binding)?;
            Ok(Behavior::KeyToggle(hid_usage_from_code(code)?))
        }
        "stickyKey" => {
            let code = required_code(binding)?;
            Ok(Behavior::StickyKey(hid_usage_from_code(code)?))
        }
        "momentaryLayer" => Ok(Behavior::MomentaryLayer {
            layer_id: required_layer(binding)?,
        }),
        "toggleLayer" => Ok(Behavior::ToggleLayer {
            layer_id: required_layer(binding)?,
        }),
        "toLayer" => Ok(Behavior::ToLayer {
            layer_id: required_layer(binding)?,
        }),
        "stickyLayer" => Ok(Behavior::StickyLayer {
            layer_id: required_layer(binding)?,
        }),
        "layerTap" => {
            let tap = binding
                .tap
                .as_deref()
                .ok_or_else(|| CommandError::new("deviceError", "Missing layer-tap tap code."))?;
            Ok(Behavior::LayerTap {
                layer_id: required_layer(binding)?,
                tap: hid_usage_from_code(tap)?,
            })
        }
        "modTap" => {
            let hold = binding
                .hold
                .as_deref()
                .ok_or_else(|| CommandError::new("deviceError", "Missing mod-tap hold code."))?;
            let tap = binding
                .tap
                .as_deref()
                .ok_or_else(|| CommandError::new("deviceError", "Missing mod-tap tap code."))?;
            Ok(Behavior::ModTap {
                hold: hid_usage_from_code(hold)?,
                tap: hid_usage_from_code(tap)?,
            })
        }
        "transparent" => Ok(Behavior::Transparent),
        "none" => Ok(Behavior::None),
        _ => Err(CommandError::new(
            "unsupported",
            format!("Unsupported binding kind: {}", binding.kind),
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

fn physical_unit(value: i32) -> f32 {
    value as f32 / 100.0
}

fn physical_size(value: i32) -> f32 {
    let normalized = physical_unit(value);
    if normalized <= 0.0 {
        1.0
    } else {
        normalized
    }
}

fn physical_rotation(value: i32) -> f32 {
    value as f32 / 100.0
}

fn binding_with_code(kind: &str, code: String) -> KeyBindingDto {
    KeyBindingDto {
        kind: kind.to_string(),
        code: Some(code),
        layer_id: None,
        hold: None,
        tap: None,
        behavior: None,
        params: None,
    }
}

fn binding_with_layer(kind: &str, layer_id: u32) -> KeyBindingDto {
    KeyBindingDto {
        kind: kind.to_string(),
        code: None,
        layer_id: Some(layer_id),
        hold: None,
        tap: None,
        behavior: None,
        params: None,
    }
}

fn required_code(binding: &KeyBindingDto) -> CommandResult<&str> {
    binding
        .code
        .as_deref()
        .ok_or_else(|| CommandError::new("deviceError", "Missing keycode."))
}

fn required_layer(binding: &KeyBindingDto) -> CommandResult<u32> {
    binding
        .layer_id
        .ok_or_else(|| CommandError::new("deviceError", "Missing layer id."))
}

fn hid_usage_from_code(code: &str) -> CommandResult<HidUsage> {
    let keycode = Keycode::from_name(code)
        .ok_or_else(|| CommandError::new("unsupported", format!("Unknown keycode: {code}")))?;
    Ok(HidUsage::from_encoded(keycode.to_hid_usage()))
}
