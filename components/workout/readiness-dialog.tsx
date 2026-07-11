"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { ReadinessInput } from "@/lib/calc/readiness";

export interface ReadinessDialogProps {
  open: boolean;
  onSubmit: (input: ReadinessInput) => void;
  onSkip: () => void;
}

export function ReadinessDialog({ open, onSubmit, onSkip }: ReadinessDialogProps) {
  const [sleepHours, setSleepHours] = useState(7);
  const [energyLevel, setEnergyLevel] = useState(3);
  const [muscleSoreness, setMuscleSoreness] = useState(2);
  const [wristPain, setWristPain] = useState(0);
  const [stressLevel, setStressLevel] = useState(2);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onSkip()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>How are you feeling today?</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Sleep last night (hours)</Label>
            <Input type="number" inputMode="decimal" step="0.5" value={sleepHours} onChange={(e) => setSleepHours(Number(e.target.value))} className="h-11" />
          </div>
          <SliderField label="Energy" value={energyLevel} onChange={setEnergyLevel} min={1} max={5} />
          <SliderField label="Muscle soreness" value={muscleSoreness} onChange={setMuscleSoreness} min={1} max={5} />
          <SliderField label="Wrist / forearm pain" value={wristPain} onChange={setWristPain} min={0} max={10} highlightHigh />
          <SliderField label="Stress" value={stressLevel} onChange={setStressLevel} min={1} max={5} />
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={onSkip}>
            Skip
          </Button>
          <Button onClick={() => onSubmit({ sleepHours, energyLevel, muscleSoreness, wristPain, stressLevel })}>Continue</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SliderField({
  label,
  value,
  onChange,
  min,
  max,
  highlightHigh,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  highlightHigh?: boolean;
}) {
  const isHigh = highlightHigh && value >= 4;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <Label>{label}</Label>
        <span className={isHigh ? "text-destructive font-medium" : "text-muted-foreground"}>{value}</span>
      </div>
      <Slider value={[value]} min={min} max={max} step={1} onValueChange={(v) => onChange(Array.isArray(v) ? v[0] : v)} />
    </div>
  );
}
