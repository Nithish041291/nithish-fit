"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useData, useDataContext } from "@/lib/data/context";
import { todayIsoDate } from "@/lib/data/hooks";
import { toCsv, downloadTextFile } from "@/lib/export/csv";
import { restoreJsonBackup } from "@/lib/export/restore";
import { toast } from "sonner";

export default function ExportPage() {
  const provider = useData();
  const { mode } = useDataContext();
  const [from, setFrom] = useState("2020-01-01");
  const [to, setTo] = useState(todayIsoDate());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [restoring, setRestoring] = useState(false);

  async function exportWorkouts() {
    const sessions = await provider.listSessions({ from, to });
    const rows: Record<string, unknown>[] = [];
    for (const session of sessions) {
      const performances = await provider.listPerformances(session.id);
      for (const perf of performances) {
        const sets = await provider.listSets(perf.id);
        for (const set of sets) {
          rows.push({
            date: session.date,
            session: session.label,
            status: session.status,
            exercise: perf.exerciseSlug,
            setNumber: set.setNumber,
            weightKg: set.actualWeightKg,
            reps: set.actualReps,
            rir: set.rir,
            painScore: set.painScore,
            completed: set.completed,
          });
        }
      }
    }
    downloadTextFile(`nithish-fit-workouts-${from}-to-${to}.csv`, toCsv(rows), "text/csv");
  }

  async function exportFoodLog() {
    const logs = await provider.listFoodLogs({ from, to });
    downloadTextFile(
      `nithish-fit-food-log-${from}-to-${to}.csv`,
      toCsv(logs.map((l) => ({ date: l.date, mealSlot: l.mealSlot, rawText: l.rawText, quantityGrams: l.quantityGrams, calories: l.calories, proteinG: l.proteinG, carbsG: l.carbsG, fatG: l.fatG, fibreG: l.fibreG }))),
      "text/csv"
    );
  }

  async function exportBodyWeight() {
    const measurements = await provider.listBodyMeasurements({ from, to });
    downloadTextFile(
      `nithish-fit-body-weight-${from}-to-${to}.csv`,
      toCsv(measurements.map((m) => ({ date: m.date, weightKg: m.weightKg, waistCm: m.waistCm, note: m.note ?? "" }))),
      "text/csv"
    );
  }

  async function exportJsonBackup() {
    const data = await provider.exportAll();
    downloadTextFile(`nithish-fit-backup-${todayIsoDate()}.json`, JSON.stringify(data, null, 2), "application/json");
  }

  async function handleRestoreFile(file: File) {
    setRestoring(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const result = await restoreJsonBackup(parsed);
      toast.success(`Restored ${result.restoredStores.length} collections`);
      if (result.skippedKeys.length > 0) {
        toast(`Skipped unrecognised keys: ${result.skippedKeys.join(", ")}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Restore failed — check the file is a valid Nithish Fit backup.");
    } finally {
      setRestoring(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/more/settings" className="text-muted-foreground">
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-2xl font-semibold flex-1">Export & backup</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Date range</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">From</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-10" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">To</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-10" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>CSV export</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          <Button variant="outline" className="justify-start gap-2" onClick={exportWorkouts}>
            <Download className="size-4" /> Workout history CSV
          </Button>
          <Button variant="outline" className="justify-start gap-2" onClick={exportFoodLog}>
            <Download className="size-4" /> Food log CSV
          </Button>
          <Button variant="outline" className="justify-start gap-2" onClick={exportBodyWeight}>
            <Download className="size-4" /> Body weight CSV
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Full backup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button className="w-full justify-start gap-2" onClick={exportJsonBackup}>
            <Download className="size-4" /> Download full JSON backup
          </Button>
          {mode === "demo" && (
            <>
              <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files?.[0] && handleRestoreFile(e.target.files[0])} />
              <Button variant="outline" className="w-full justify-start gap-2" disabled={restoring} onClick={() => fileInputRef.current?.click()}>
                <Upload className="size-4" /> Restore from JSON backup
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        {mode === "demo"
          ? "All data lives only in this browser's local storage (IndexedDB) — nothing is uploaded anywhere."
          : "Data is synced to your Supabase project, scoped to your account by row-level security."}
      </p>
    </div>
  );
}
