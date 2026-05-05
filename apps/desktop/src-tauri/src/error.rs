use serde::Serialize;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CommandError {
    pub code: &'static str,
    pub message: String,
}

impl CommandError {
    pub fn new(code: &'static str, message: impl Into<String>) -> Self {
        Self {
            code,
            message: message.into(),
        }
    }
}

pub type CommandResult<T> = Result<T, CommandError>;

impl From<serialport::Error> for CommandError {
    fn from(error: serialport::Error) -> Self {
        let code = match error.kind() {
            serialport::ErrorKind::NoDevice => "deviceError",
            serialport::ErrorKind::InvalidInput => "deviceError",
            serialport::ErrorKind::Unknown => "unknown",
            serialport::ErrorKind::Io(std::io::ErrorKind::PermissionDenied) => "permissionDenied",
            serialport::ErrorKind::Io(std::io::ErrorKind::TimedOut) => "timeout",
            serialport::ErrorKind::Io(_) => "deviceError",
        };
        Self::new(code, error.to_string())
    }
}

impl From<std::io::Error> for CommandError {
    fn from(error: std::io::Error) -> Self {
        let code = match error.kind() {
            std::io::ErrorKind::PermissionDenied => "permissionDenied",
            std::io::ErrorKind::TimedOut => "timeout",
            std::io::ErrorKind::NotFound => "deviceError",
            _ => "deviceError",
        };
        Self::new(code, error.to_string())
    }
}
