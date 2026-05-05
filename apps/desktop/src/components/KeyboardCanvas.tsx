import { formatKeyBinding } from "@alt-zmk-studio/core";
import { useDeviceStore } from "../stores/deviceStore";

export function KeyboardCanvas() {
  const layout = useDeviceStore((state) => state.layout);
  const activeLayerId = useDeviceStore((state) => state.activeLayerId);
  const layer = useDeviceStore((state) =>
    state.activeLayerId === null ? null : state.loadedLayers[state.activeLayerId]
  );
  const selectedPosition = useDeviceStore((state) => state.selectedPosition);
  const selectKey = useDeviceStore((state) => state.selectKey);

  if (!layout || activeLayerId === null || !layer) {
    return (
      <div className="flex min-h-72 items-center justify-center rounded-md border border-dashed border-slate-300 text-sm text-slate-500">
        Connect a keyboard to load key bindings.
      </div>
    );
  }

  const columns = Math.max(...layout.keys.map((key) => key.x + key.width), 1);
  const rows = Math.max(...layout.keys.map((key) => key.y + key.height), 1);
  const bindings = new Map(layer.keys.map((key) => [key.position, key.binding]));

  return (
    <div className="overflow-auto rounded-md border border-slate-200 bg-slate-50 p-4">
      <div
        className="grid min-w-[720px] gap-2"
        style={{
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${rows}, 3.25rem)`
        }}
      >
        {layout.keys.map((key) => {
          const binding = bindings.get(key.position) ?? { kind: "none" as const };
          const isSelected = key.position === selectedPosition;
          return (
            <button
              key={key.position}
              type="button"
              onClick={() => selectKey(key.position)}
              className={[
                "flex h-full min-w-0 flex-col items-center justify-center rounded-md border bg-white px-2 text-center text-sm shadow-sm transition",
                isSelected
                  ? "border-slate-950 ring-2 ring-slate-950"
                  : "border-slate-200 hover:border-slate-400"
              ].join(" ")}
              style={{
                gridColumn: `${key.x + 1} / span ${key.width}`,
                gridRow: `${key.y + 1} / span ${key.height}`
              }}
            >
              <span className="max-w-full truncate font-medium">{formatKeyBinding(binding)}</span>
              <span className="mt-1 text-[10px] text-slate-500">#{key.position}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
