import { useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@alt-zmk-studio/ui";
import { DeviceSelector } from "./components/DeviceSelector";
import { KeyboardCanvas } from "./components/KeyboardCanvas";
import { KeyPicker } from "./components/KeyPicker";
import { LayerTabs } from "./components/LayerTabs";
import { useDeviceStore } from "./stores/deviceStore";

export function App() {
  const status = useDeviceStore((state) => state.status);
  const error = useDeviceStore((state) => state.error);
  const deviceInfo = useDeviceStore((state) => state.deviceInfo);
  const refreshDevices = useDeviceStore((state) => state.refreshDevices);
  const clearError = useDeviceStore((state) => state.clearError);

  useEffect(() => {
    void refreshDevices();
  }, [refreshDevices]);

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <header className="border-b border-slate-200 px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">Alt ZMK Studio</h1>
            <p className="text-sm text-slate-500">
              USB serial MVP for ZMK Studio compatible keyboards
            </p>
          </div>
          <DeviceSelector />
        </div>
      </header>

      <section className="px-6 py-4">
        {error ? (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={clearError}>
              Dismiss
            </Button>
          </div>
        ) : null}

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">
              {deviceInfo ? deviceInfo.name : "No keyboard connected"}
            </h2>
            <p className="text-sm text-slate-500">
              {deviceInfo
                ? `${deviceInfo.keyCount} keys${deviceInfo.firmwareVersion ? ` · ${deviceInfo.firmwareVersion}` : ""}`
                : status === "loading"
                  ? "Loading"
                  : "Select a USB serial device to begin"}
            </p>
          </div>
          <LayerTabs />
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <KeyboardCanvas />
          <KeyPicker />
        </div>
      </section>
    </main>
  );
}
