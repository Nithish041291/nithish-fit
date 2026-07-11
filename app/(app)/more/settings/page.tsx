"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useData, useDataContext } from "@/lib/data/context";
import { useProviderData } from "@/lib/data/hooks";
import { ProfileForm } from "@/components/settings/profile-form";
import { EquipmentList } from "@/components/settings/equipment-list";
import { NutritionTargetPanel } from "@/components/settings/nutrition-target-panel";
import { clearDemoData } from "@/lib/data/seedDemo";
import { Trash2 } from "lucide-react";

export default function SettingsPage() {
  const provider = useData();
  const { mode } = useDataContext();

  const profileState = useProviderData((p) => p.getProfile());
  const preferencesState = useProviderData((p) => p.getPreferences());
  const equipmentState = useProviderData((p) => p.listEquipment());
  const userEquipmentState = useProviderData((p) => p.listUserEquipment());
  const targetState = useProviderData((p) => p.getActiveNutritionTarget());

  const loading = profileState.loading || preferencesState.loading || equipmentState.loading || userEquipmentState.loading || targetState.loading;
  if (loading || !profileState.data || !preferencesState.data) {
    return <Skeleton className="h-96 w-full" />;
  }

  const profile = profileState.data;

  async function saveProfile(patch: Partial<typeof profile>) {
    await provider.updateProfile(patch);
    profileState.refetch();
  }

  async function resetDemo() {
    await clearDemoData();
    window.location.reload();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm profile={profile} onSave={saveProfile} />
        </CardContent>
      </Card>

      <EquipmentList
        equipment={equipmentState.data ?? []}
        userEquipment={userEquipmentState.data ?? []}
        onChange={() => userEquipmentState.refetch()}
      />

      <NutritionTargetPanel
        profile={profile}
        preferences={preferencesState.data}
        activeTarget={targetState.data}
        onSaved={() => {
          targetState.refetch();
          preferencesState.refetch();
        }}
      />

      <Card>
        <CardHeader>
          <CardTitle>Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Mode: <strong>{mode === "demo" ? "Local demo (browser storage only)" : "Supabase (synced)"}</strong>
          </p>
          {mode === "demo" && (
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button variant="destructive" className="gap-1.5">
                    <Trash2 className="size-4" /> Remove sample data
                  </Button>
                }
              />
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove all sample data?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This clears every seeded demo record (workouts, food logs, body weight, meal plan) from this browser and reloads the app. This
                    cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={resetDemo}>Remove</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
