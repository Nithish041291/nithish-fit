"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { generateId } from "@/lib/calc/id";
import { useDataContext } from "@/lib/data/context";
import { todayIsoDate } from "@/lib/data/hooks";
import type { BodyMeasurement } from "@/lib/types";
import { toast } from "sonner";

export function LogWeightDialog({ defaultWeightKg, onSaved }: { defaultWeightKg: number; onSaved: () => void }) {
  const { provider, user } = useDataContext();
  const [open, setOpen] = useState(false);
  const [weight, setWeight] = useState(defaultWeightKg);
  const [waist, setWaist] = useState<string>("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!user) return;
    setSaving(true);
    try {
      const entry: BodyMeasurement = {
        id: generateId(),
        userId: user.id,
        date: todayIsoDate(),
        weightKg: weight,
        waistCm: waist ? Number(waist) : null,
        note: note || undefined,
        photoMeta: null,
        createdAt: new Date().toISOString(),
      };
      await provider.saveBodyMeasurement(entry);
      onSaved();
      setOpen(false);
      setNote("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save weight entry");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="gap-1.5"><Plus className="size-4" /> Log weight</Button>} />
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Log today&apos;s weight</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="log-weight-kg">Weight (kg)</Label>
            <Input id="log-weight-kg" type="number" inputMode="decimal" step="0.1" value={weight} onChange={(e) => setWeight(Number(e.target.value))} className="h-11" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="log-weight-waist">Waist (cm) — optional</Label>
            <Input id="log-weight-waist" type="number" inputMode="decimal" step="0.1" value={waist} onChange={(e) => setWaist(e.target.value)} className="h-11" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="log-weight-note">Note — optional</Label>
            <Textarea id="log-weight-note" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={save} disabled={saving}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
