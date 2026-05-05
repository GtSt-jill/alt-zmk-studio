import { useMemo, useState, type ReactNode } from "react";
import {
  commonKeyPressCodes,
  commonModifierCodes,
  formatKeyBinding,
  type KeyBinding
} from "@alt-zmk-studio/core";
import { Button, Select } from "@alt-zmk-studio/ui";
import { useDeviceStore } from "../stores/deviceStore";

type PickerMode = "key" | "layer" | "holdTap" | "utility";
type LayerAction = "momentaryLayer" | "toggleLayer" | "toLayer" | "stickyLayer";

const modeLabels: Array<{ mode: PickerMode; label: string }> = [
  { mode: "key", label: "Key" },
  { mode: "layer", label: "Layer" },
  { mode: "holdTap", label: "Hold-tap" },
  { mode: "utility", label: "Utility" }
];

const layerActionLabels: Record<LayerAction, string> = {
  momentaryLayer: "Momentary",
  toggleLayer: "Toggle",
  toLayer: "To layer",
  stickyLayer: "Sticky"
};

export function KeyPicker() {
  const [mode, setMode] = useState<PickerMode>("key");
  const [keyCode, setKeyCode] = useState<string>("A");
  const [layerAction, setLayerAction] = useState<LayerAction>("momentaryLayer");
  const [targetLayerId, setTargetLayerId] = useState<number>(1);
  const [tapCode, setTapCode] = useState<string>("A");
  const [holdCode, setHoldCode] = useState<string>("LSHFT");
  const [holdTapKind, setHoldTapKind] = useState<"modTap" | "layerTap">("modTap");

  const activeLayerId = useDeviceStore((state) => state.activeLayerId);
  const selectedPosition = useDeviceStore((state) => state.selectedPosition);
  const layers = useDeviceStore((state) => state.layers);
  const layer = useDeviceStore((state) =>
    state.activeLayerId === null ? null : state.loadedLayers[state.activeLayerId]
  );
  const setSelectedBinding = useDeviceStore((state) => state.setSelectedBinding);

  const layerOptions = useMemo(
    () => (layers.length > 0 ? layers : [{ id: 0, name: "Layer 0" }]),
    [layers]
  );

  if (activeLayerId === null || selectedPosition === null || !layer) {
    return (
      <aside className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-500">
        Select one key to edit its binding.
      </aside>
    );
  }

  const currentBinding = layer.keys.find((key) => key.position === selectedPosition)?.binding ?? {
    kind: "none" as const
  };

  function save(binding: KeyBinding) {
    void setSelectedBinding(binding);
  }

  return (
    <aside className="rounded-md border border-slate-200 bg-white p-4">
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-slate-950">Key #{selectedPosition}</h2>
        <p className="mt-1 text-sm text-slate-500">Current: {formatKeyBinding(currentBinding)}</p>
      </div>

      <div className="mb-4 grid grid-cols-4 rounded-md bg-slate-100 p-1">
        {modeLabels.map((item) => (
          <button
            key={item.mode}
            type="button"
            onClick={() => setMode(item.mode)}
            className={[
              "h-8 rounded text-xs font-medium transition",
              mode === item.mode ? "bg-white text-slate-950 shadow-sm" : "text-slate-600"
            ].join(" ")}
          >
            {item.label}
          </button>
        ))}
      </div>

      {mode === "key" ? (
        <div className="space-y-3">
          <Field label="Keycode">
            <KeySelect value={keyCode} onChange={setKeyCode} />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" onClick={() => save({ kind: "keyPress", code: keyCode })}>
              Set key press
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => save({ kind: "keyToggle", code: keyCode })}
            >
              Set toggle
            </Button>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => save({ kind: "stickyKey", code: keyCode })}
            className="w-full"
          >
            Set sticky key
          </Button>
        </div>
      ) : null}

      {mode === "layer" ? (
        <div className="space-y-3">
          <Field label="Action">
            <Select
              value={layerAction}
              onChange={(event) => setLayerAction(event.target.value as LayerAction)}
              className="w-full"
            >
              {Object.entries(layerActionLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Target layer">
            <LayerSelect value={targetLayerId} layers={layerOptions} onChange={setTargetLayerId} />
          </Field>
          <Button
            type="button"
            onClick={() => save({ kind: layerAction, layerId: targetLayerId })}
            className="w-full"
          >
            Set layer binding
          </Button>
        </div>
      ) : null}

      {mode === "holdTap" ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 rounded-md bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setHoldTapKind("modTap")}
              className={holdTapKind === "modTap" ? activeSegmentClass : segmentClass}
            >
              Mod-tap
            </button>
            <button
              type="button"
              onClick={() => setHoldTapKind("layerTap")}
              className={holdTapKind === "layerTap" ? activeSegmentClass : segmentClass}
            >
              Layer-tap
            </button>
          </div>
          {holdTapKind === "modTap" ? (
            <>
              <Field label="Hold modifier">
                <KeySelect value={holdCode} onChange={setHoldCode} modifiersOnly />
              </Field>
              <Field label="Tap key">
                <KeySelect value={tapCode} onChange={setTapCode} />
              </Field>
              <Button
                type="button"
                onClick={() => save({ kind: "modTap", hold: holdCode, tap: tapCode })}
                className="w-full"
              >
                Set mod-tap
              </Button>
            </>
          ) : (
            <>
              <Field label="Hold layer">
                <LayerSelect value={targetLayerId} layers={layerOptions} onChange={setTargetLayerId} />
              </Field>
              <Field label="Tap key">
                <KeySelect value={tapCode} onChange={setTapCode} />
              </Field>
              <Button
                type="button"
                onClick={() => save({ kind: "layerTap", layerId: targetLayerId, tap: tapCode })}
                className="w-full"
              >
                Set layer-tap
              </Button>
            </>
          )}
        </div>
      ) : null}

      {mode === "utility" ? (
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant="secondary" onClick={() => save({ kind: "transparent" })}>
            Transparent
          </Button>
          <Button type="button" variant="secondary" onClick={() => save({ kind: "none" })}>
            None
          </Button>
        </div>
      ) : null}
    </aside>
  );
}

const segmentClass = "h-8 rounded text-xs font-medium text-slate-600 transition";
const activeSegmentClass = "h-8 rounded bg-white text-xs font-medium text-slate-950 shadow-sm";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">{label}</span>
      {children}
    </label>
  );
}

function KeySelect({
  value,
  onChange,
  modifiersOnly = false
}: {
  value: string;
  onChange: (value: string) => void;
  modifiersOnly?: boolean;
}) {
  const values = modifiersOnly ? commonModifierCodes : commonKeyPressCodes;
  return (
    <Select value={value} onChange={(event) => onChange(event.target.value)} className="w-full">
      {values.map((code) => (
        <option key={code} value={code}>
          {formatKeyBinding({ kind: "keyPress", code })}
        </option>
      ))}
    </Select>
  );
}

function LayerSelect({
  value,
  layers,
  onChange
}: {
  value: number;
  layers: ReadonlyArray<{ id: number; name: string }>;
  onChange: (value: number) => void;
}) {
  return (
    <Select
      value={String(value)}
      onChange={(event) => onChange(Number(event.target.value))}
      className="w-full"
    >
      {layers.map((layer) => (
        <option key={layer.id} value={layer.id}>
          {layer.name}
        </option>
      ))}
    </Select>
  );
}
