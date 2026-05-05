# Alt ZMK Studio

Desktop-first ZMK keymap configurator MVP. This phase targets Tauri v2 + USB serial only. Web Serial, BLE, `.keymap` export, GitHub integration, advanced behaviors, and physical layout authoring are intentionally left for later phases behind interfaces.

## Requirements

- Node.js 22+
- Yarn 4+ (`corepack enable` is recommended)
- Rust stable with Cargo
- Tauri v2 system dependencies for your OS

On AlmaLinux/Fedora/RHEL-like systems, install the native Tauri dependencies before
running the desktop app:

```bash
sudo dnf install dbus-devel pkgconf-pkg-config gtk3-devel webkit2gtk4.1-devel openssl-devel librsvg2-devel libappindicator-gtk3-devel
```

## Setup

```bash
yarn install
yarn tauri dev
```

The root `yarn tauri dev` command runs the desktop app in `apps/desktop`.

## Development

```bash
yarn dev
yarn typecheck
yarn test
yarn build
```

## Architecture

- `packages/core`: keymap domain model, formatters, DTO mapping.
- `packages/transport`: mockable `ZmkDeviceTransport` interface.
- `packages/tauri-transport`: Tauri invoke bridge implementing the transport interface.
- `packages/ui`: shared base UI components.
- `apps/desktop`: React app, connection state, device/layer/key editing UI.
- `apps/desktop/src-tauri`: USB serial commands and ZMK Studio RPC abstraction boundary.

React components do not call Tauri directly. They use a service/store backed by the transport interface. ZMK Studio RPC details stay in Rust under `zmk_client.rs`; future replacement with `zmk-studio-api` should be isolated there.

## Known MVP Constraints

- USB serial only.
- BLE is an interface/TODO only.
- No `.keymap` file editing.
- No combo, macro, tap dance, conditional layer editing.
- No custom behavior definitions.
- No physical layout definition editing. A placeholder grid is used when layout metadata is unavailable.
- The Rust RPC client includes a bounded abstraction and conservative placeholder framing. Real-device protocol tuning may be needed depending on the final `zmk-studio-api` integration.
