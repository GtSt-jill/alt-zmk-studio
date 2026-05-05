import { Cable, RefreshCcw, Unplug } from "lucide-react";
import { Button, Select } from "@alt-zmk-studio/ui";
import { useDeviceStore } from "../stores/deviceStore";

export function DeviceSelector() {
  const devices = useDeviceStore((state) => state.devices);
  const selectedDeviceId = useDeviceStore((state) => state.selectedDeviceId);
  const status = useDeviceStore((state) => state.status);
  const deviceInfo = useDeviceStore((state) => state.deviceInfo);
  const refreshDevices = useDeviceStore((state) => state.refreshDevices);
  const selectDevice = useDeviceStore((state) => state.selectDevice);
  const connect = useDeviceStore((state) => state.connect);
  const disconnect = useDeviceStore((state) => state.disconnect);
  const isBusy = status === "loading";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        aria-label="Serial device"
        value={selectedDeviceId}
        onChange={(event) => selectDevice(event.target.value)}
        disabled={isBusy || Boolean(deviceInfo)}
        className="min-w-72"
      >
        <option value="">Select USB serial device</option>
        {devices.map((device) => (
          <option key={device.id} value={device.id}>
            {device.displayName}
          </option>
        ))}
      </Select>
      <Button variant="secondary" onClick={() => void refreshDevices()} disabled={isBusy}>
        <RefreshCcw className="h-4 w-4" />
        Refresh
      </Button>
      {deviceInfo ? (
        <Button variant="secondary" onClick={() => void disconnect()} disabled={isBusy}>
          <Unplug className="h-4 w-4" />
          Disconnect
        </Button>
      ) : (
        <Button onClick={() => void connect()} disabled={isBusy || !selectedDeviceId}>
          <Cable className="h-4 w-4" />
          Connect
        </Button>
      )}
    </div>
  );
}
