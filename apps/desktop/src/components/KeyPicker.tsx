import { commonKeyPressCodes, formatKeyBinding } from "@alt-zmk-studio/core";
import { Button } from "@alt-zmk-studio/ui";
import { useDeviceStore } from "../stores/deviceStore";

export function KeyPicker() {
  const activeLayerId = useDeviceStore((state) => state.activeLayerId);
  const selectedPosition = useDeviceStore((state) => state.selectedPosition);
  const layer = useDeviceStore((state) =>
    state.activeLayerId === null ? null : state.loadedLayers[state.activeLayerId]
  );
  const setSelectedKeyPress = useDeviceStore((state) => state.setSelectedKeyPress);

  if (activeLayerId === null || selectedPosition === null || !layer) {
    return (
      <aside className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-500">
        Select one key to edit its key press binding.
      </aside>
    );
  }

  const currentBinding = layer.keys.find((key) => key.position === selectedPosition)?.binding ?? {
    kind: "none" as const
  };

  return (
    <aside className="rounded-md border border-slate-200 bg-white p-4">
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-slate-950">Key #{selectedPosition}</h2>
        <p className="mt-1 text-sm text-slate-500">Current: {formatKeyBinding(currentBinding)}</p>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {commonKeyPressCodes.map((code) => (
          <Button
            key={code}
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => void setSelectedKeyPress(code)}
            className="h-8"
          >
            {formatKeyBinding({ kind: "keyPress", code })}
          </Button>
        ))}
      </div>
    </aside>
  );
}
