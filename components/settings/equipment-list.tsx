"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useData } from "@/lib/data/context";
import type { Equipment, UserEquipment } from "@/lib/types";

export function EquipmentList({ equipment, userEquipment, onChange }: { equipment: Equipment[]; userEquipment: UserEquipment[]; onChange: () => void }) {
  const provider = useData();
  const enabledByEquipment = new Map(userEquipment.map((ue) => [ue.equipmentId, ue.enabled]));

  async function toggle(equipmentId: string, enabled: boolean) {
    await provider.setUserEquipmentEnabled(equipmentId, enabled);
    onChange();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Equipment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2.5">
        <p className="text-xs text-muted-foreground">The workout generator never prescribes an exercise that needs disabled equipment.</p>
        {equipment.map((eq) => {
          const enabled = enabledByEquipment.get(eq.id) ?? false;
          return (
            <div key={eq.id} className="flex items-center justify-between py-1">
              <div>
                <Label htmlFor={`eq-${eq.id}`} className="font-normal">
                  {eq.name}
                </Label>
                {eq.notes && <p className="text-[11px] text-muted-foreground">{eq.notes}</p>}
              </div>
              <Switch id={`eq-${eq.id}`} checked={enabled} onCheckedChange={(v) => toggle(eq.id, v)} />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
