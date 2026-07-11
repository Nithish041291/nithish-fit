"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { userProfileSchema, type UserProfile, type Weekday } from "@/lib/types";
import { toast } from "sonner";

const WEEKDAYS: Weekday[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const editableProfileSchema = userProfileSchema
  .omit({ id: true, createdAt: true, updatedAt: true, trainingDays: true, restDays: true })
  .extend({ country: z.string() });
type EditableProfile = z.infer<typeof editableProfileSchema>;

export function ProfileForm({ profile, onSave }: { profile: UserProfile; onSave: (patch: Partial<UserProfile>) => Promise<void> }) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EditableProfile>({
    resolver: zodResolver(editableProfileSchema),
    defaultValues: editableProfileSchema.parse(profile),
  });

  const trainingDays = new Set(profile.trainingDays);

  async function onSubmit(values: EditableProfile) {
    await onSave(values);
    toast.success("Profile updated");
  }

  function toggleDay(day: Weekday) {
    const days = new Set(profile.trainingDays);
    if (days.has(day)) days.delete(day);
    else days.add(day);
    const rest = WEEKDAYS.filter((d) => !days.has(d));
    onSave({ trainingDays: Array.from(days) as Weekday[], restDays: rest });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Name" error={errors.name?.message}>
          <Input {...register("name")} className="h-10" />
        </Field>
        <Field label="Sex" error={errors.sex?.message}>
          <Select value={watch("sex")} onValueChange={(v) => v && setValue("sex", v as EditableProfile["sex"])}>
            <SelectTrigger className="h-10 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Age" error={errors.age?.message}>
          <Input type="number" {...register("age", { valueAsNumber: true })} className="h-10" />
        </Field>
        <Field label="Height (cm)" error={errors.heightCm?.message}>
          <Input type="number" step="0.1" {...register("heightCm", { valueAsNumber: true })} className="h-10" />
        </Field>
        <Field label="Current weight (kg)" error={errors.currentWeightKg?.message}>
          <Input type="number" step="0.1" {...register("currentWeightKg", { valueAsNumber: true })} className="h-10" />
        </Field>
        <Field label="Target weight (kg)" error={errors.targetWeightKg?.message}>
          <Input type="number" step="0.1" {...register("targetWeightKg", { valueAsNumber: true })} className="h-10" />
        </Field>
        <Field label="Creatine (g/day)" error={errors.creatineGramsPerDay?.message}>
          <Input type="number" step="0.5" {...register("creatineGramsPerDay", { valueAsNumber: true })} className="h-10" />
        </Field>
        <Field label="Whey (scoops/training day)" error={errors.wheyScoopsPerTrainingDay?.message}>
          <Input type="number" step="0.5" {...register("wheyScoopsPerTrainingDay", { valueAsNumber: true })} className="h-10" />
        </Field>
        <Field label="Workout duration min (min)" error={errors.preferredWorkoutDurationMinMinutes?.message}>
          <Input type="number" {...register("preferredWorkoutDurationMinMinutes", { valueAsNumber: true })} className="h-10" />
        </Field>
        <Field label="Workout duration max (min)" error={errors.preferredWorkoutDurationMaxMinutes?.message}>
          <Input type="number" {...register("preferredWorkoutDurationMaxMinutes", { valueAsNumber: true })} className="h-10" />
        </Field>
      </div>

      <Field label="Gym type">
        <Input {...register("gymType")} className="h-10" />
      </Field>

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Training days</Label>
        <div className="flex flex-wrap gap-1.5">
          {WEEKDAYS.map((day) => (
            <Button key={day} type="button" size="sm" variant={trainingDays.has(day) ? "default" : "outline"} onClick={() => toggleDay(day)} className="capitalize">
              {day.slice(0, 3)}
            </Button>
          ))}
        </div>
      </div>

      <Button type="submit" className="w-full h-11" disabled={isSubmitting}>
        Save profile
      </Button>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
