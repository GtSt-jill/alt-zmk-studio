import { Tabs, TabsList, TabsTrigger } from "@alt-zmk-studio/ui";
import { useDeviceStore } from "../stores/deviceStore";

export function LayerTabs() {
  const layers = useDeviceStore((state) => state.layers);
  const activeLayerId = useDeviceStore((state) => state.activeLayerId);
  const setActiveLayer = useDeviceStore((state) => state.setActiveLayer);

  if (layers.length === 0 || activeLayerId === null) {
    return null;
  }

  return (
    <Tabs value={String(activeLayerId)} onValueChange={(value) => void setActiveLayer(Number(value))}>
      <TabsList>
        {layers.map((layer) => (
          <TabsTrigger key={layer.id} value={String(layer.id)}>
            {layer.name}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
