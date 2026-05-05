import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "../utils";

export const Tabs = TabsPrimitive.Root;

export function TabsList({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn("inline-flex h-9 items-center rounded-md bg-slate-100 p-1", className)}
      {...props}
    />
  );
}

export function TabsTrigger({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "inline-flex h-7 items-center justify-center rounded px-3 text-sm font-medium text-slate-600 data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow-sm",
        className
      )}
      {...props}
    />
  );
}

export const TabsContent = TabsPrimitive.Content;
