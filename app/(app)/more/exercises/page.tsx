"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";
import { useProviderData } from "@/lib/data/hooks";
import { titleCase } from "@/lib/format";
import type { MovementPattern, MuscleGroup, WristLoadCategory } from "@/lib/types";

export default function ExerciseDirectoryPage() {
  const exercisesState = useProviderData((p) => p.listExercises());
  const [search, setSearch] = useState("");
  const [muscle, setMuscle] = useState<string>("all");
  const [pattern, setPattern] = useState<string>("all");
  const [wristLoad, setWristLoad] = useState<string>("all");
  const [type, setType] = useState<string>("all"); // compound/isolation
  const [laterality, setLaterality] = useState<string>("all"); // unilateral/bilateral
  const [safeOnly, setSafeOnly] = useState(true);

  const exercises = useMemo(() => exercisesState.data ?? [], [exercisesState.data]);

  const muscleOptions = useMemo(() => Array.from(new Set(exercises.flatMap((e) => e.primaryMuscles))).sort(), [exercises]);
  const patternOptions = useMemo(() => Array.from(new Set(exercises.map((e) => e.movementPattern))).sort(), [exercises]);

  const filtered = exercises.filter((e) => {
    if (safeOnly && !e.isSelectableByDefault) return false;
    if (muscle !== "all" && !e.primaryMuscles.includes(muscle as MuscleGroup) && !e.secondaryMuscles.includes(muscle as MuscleGroup)) return false;
    if (pattern !== "all" && e.movementPattern !== (pattern as MovementPattern)) return false;
    if (wristLoad !== "all" && e.wristLoadCategory !== (wristLoad as WristLoadCategory)) return false;
    if (type === "compound" && !e.isCompound) return false;
    if (type === "isolation" && e.isCompound) return false;
    if (laterality === "unilateral" && !e.isUnilateral) return false;
    if (laterality === "bilateral" && e.isUnilateral) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      if (!e.name.toLowerCase().includes(q) && !e.primaryMuscles.some((m) => m.includes(q))) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Exercise directory</h1>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input placeholder="Search exercises..." className="pl-9 h-11" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Select value={muscle} onValueChange={(v) => setMuscle(v ?? "all")}>
          <SelectTrigger className="h-10">
            <SelectValue placeholder="Muscle group" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All muscles</SelectItem>
            {muscleOptions.map((m) => (
              <SelectItem key={m} value={m}>
                {titleCase(m)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={pattern} onValueChange={(v) => setPattern(v ?? "all")}>
          <SelectTrigger className="h-10">
            <SelectValue placeholder="Movement pattern" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All patterns</SelectItem>
            {patternOptions.map((p) => (
              <SelectItem key={p} value={p}>
                {titleCase(p)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={wristLoad} onValueChange={(v) => setWristLoad(v ?? "all")}>
          <SelectTrigger className="h-10">
            <SelectValue placeholder="Wrist load" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any wrist load</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="moderate">Moderate</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>
        <Select value={type} onValueChange={(v) => setType(v ?? "all")}>
          <SelectTrigger className="h-10">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Compound & isolation</SelectItem>
            <SelectItem value="compound">Compound</SelectItem>
            <SelectItem value="isolation">Isolation</SelectItem>
          </SelectContent>
        </Select>
        <Select value={laterality} onValueChange={(v) => setLaterality(v ?? "all")}>
          <SelectTrigger className="h-10 col-span-2">
            <SelectValue placeholder="Laterality" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Unilateral & bilateral</SelectItem>
            <SelectItem value="unilateral">Unilateral</SelectItem>
            <SelectItem value="bilateral">Bilateral</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Switch id="safe-only" checked={safeOnly} onCheckedChange={setSafeOnly} />
        <Label htmlFor="safe-only" className="text-sm">
          Only show safe-for-restriction / available-equipment exercises
        </Label>
      </div>

      {exercisesState.loading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">{filtered.length} exercises</p>
          {filtered.map((e) => (
            <Link key={e.slug} href={`/more/exercises/${e.slug}`}>
              <Card>
                <CardContent className="py-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{e.name}</p>
                    {!e.isSelectableByDefault && (
                      <Badge variant="outline" className="text-[10px]">
                        Not in default plan
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {e.primaryMuscles.map(titleCase).join(", ")} · {titleCase(e.movementPattern)} · {titleCase(e.wristLoadCategory)} wrist load
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
          {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No exercises match these filters.</p>}
        </div>
      )}
    </div>
  );
}
