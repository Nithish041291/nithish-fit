"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { generateId } from "@/lib/calc/id";
import { useData } from "@/lib/data/context";
import type { FoodItem } from "@/lib/types";

export function CustomFoodDialog({ initialName, onCreated }: { initialName: string; onCreated: (food: FoodItem) => void }) {
  const provider = useData();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initialName);
  const [calories, setCalories] = useState(0);
  const [protein, setProtein] = useState(0);
  const [carbs, setCarbs] = useState(0);
  const [fat, setFat] = useState(0);
  const [fibre, setFibre] = useState(0);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const food: FoodItem = {
        id: generateId(),
        slug: `custom-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString(36)}`,
        name,
        category: "custom",
        cuisineTag: "custom",
        rawCookedState: "not_applicable",
        preparationMethod: undefined,
        caloriesPer100g: calories,
        proteinPer100g: protein,
        carbsPer100g: carbs,
        fatPer100g: fat,
        fibrePer100g: fibre,
        source: "User-provided",
        measurementBasis: "per 100g, user-provided",
        reliability: "user_provided",
        lastUpdated: new Date().toISOString().slice(0, 10),
        isCustom: true,
        ownerUserId: null,
      };
      await provider.saveFoodItem(food);
      onCreated(food);
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            Create custom food
          </Button>
        }
      />
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>New custom food</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="h-11" />
          </div>
          <p className="text-xs text-muted-foreground">Enter nutrients per 100g. You can adjust the logged quantity after saving.</p>
          <div className="grid grid-cols-2 gap-3">
            <NumField label="Calories (kcal)" value={calories} onChange={setCalories} />
            <NumField label="Protein (g)" value={protein} onChange={setProtein} />
            <NumField label="Carbs (g)" value={carbs} onChange={setCarbs} />
            <NumField label="Fat (g)" value={fat} onChange={setFat} />
            <NumField label="Fibre (g)" value={fibre} onChange={setFibre} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={save} disabled={saving || !name.trim()}>
            Save food
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NumField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Input type="number" inputMode="decimal" className="h-10" value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}
