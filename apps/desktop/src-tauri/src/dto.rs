use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SerialDeviceDto {
    pub id: String,
    pub path: String,
    pub display_name: String,
    pub manufacturer: Option<String>,
    pub product: Option<String>,
    pub vendor_id: Option<u16>,
    pub product_id: Option<u16>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeviceInfoDto {
    pub id: String,
    pub name: String,
    pub manufacturer: Option<String>,
    pub firmware_version: Option<String>,
    pub key_count: u16,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LayerDto {
    pub id: u8,
    pub name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct KeyboardLayoutDto {
    pub keys: Vec<KeyboardLayoutKeyDto>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct KeyboardLayoutKeyDto {
    pub position: u16,
    pub x: f32,
    pub y: f32,
    pub width: f32,
    pub height: f32,
    pub rotation: f32,
    pub rotation_x: f32,
    pub rotation_y: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct KeyBindingDto {
    pub kind: String,
    pub code: Option<String>,
    pub layer_id: Option<u32>,
    pub hold: Option<String>,
    pub tap: Option<String>,
    pub behavior: Option<String>,
    pub params: Option<Vec<String>>,
}

impl KeyBindingDto {
    pub fn key_press(code: impl Into<String>) -> Self {
        Self {
            kind: "keyPress".to_string(),
            code: Some(code.into()),
            layer_id: None,
            hold: None,
            tap: None,
            behavior: None,
            params: None,
        }
    }

    pub fn none() -> Self {
        Self {
            kind: "none".to_string(),
            code: None,
            layer_id: None,
            hold: None,
            tap: None,
            behavior: None,
            params: None,
        }
    }
}
