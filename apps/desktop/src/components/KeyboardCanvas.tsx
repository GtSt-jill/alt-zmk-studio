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

  const minX = Math.min(...layout.keys.map((key) => key.x), 0);
  const minY = Math.min(...layout.keys.map((key) => key.y), 0);
  const maxX = Math.max(...layout.keys.map((key) => key.x + key.width), 1);
  const maxY = Math.max(...layout.keys.map((key) => key.y + key.height), 1);
  const unit = 56;
  const gap = 8;
  const canvasWidth = Math.max((maxX - minX) * unit + gap * 2, 720);
  const canvasHeight = Math.max((maxY - minY) * unit + gap * 2, 240);
  const bindings = new Map(layer.keys.map((key) => [key.position, key.binding]));

  return (
    <div className="overflow-auto rounded-md border border-slate-200 bg-slate-50 p-4">
      <div
        className="relative"
        style={{
          width: `${canvasWidth}px`,
          height: `${canvasHeight}px`
        }}
      >
        {layout.keys.map((key) => {
          const binding = bindings.get(key.position) ?? { kind: "none" as const };
          const isSelected = key.position === selectedPosition;
          const left = (key.x - minX) * unit + gap;
          const top = (key.y - minY) * unit + gap;
          const width = key.width * unit - 4;
          const height = key.height * unit - 4;
          const transformOriginX = (key.rotationX - key.x) * unit;
          const transformOriginY = (key.rotationY - key.y) * unit;
          return (
            <button
              key={key.position}
              type="button"
              onClick={() => selectKey(key.position)}
              className={[
                "absolute flex min-w-0 flex-col items-center justify-center rounded-md border bg-white px-2 text-center text-sm shadow-sm transition",
                isSelected
                  ? "border-slate-950 ring-2 ring-slate-950"
                  : "border-slate-200 hover:border-slate-400"
              ].join(" ")}
              style={{
                left: `${left}px`,
                top: `${top}px`,
                width: `${width}px`,
                height: `${height}px`,
                transform: key.rotation ? `rotate(${key.rotation}deg)` : undefined,
                transformOrigin: `${transformOriginX}px ${transformOriginY}px`
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
