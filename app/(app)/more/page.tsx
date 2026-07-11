"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight, Dumbbell, TrendingUp, ChefHat, CalendarRange, Settings, Download, Info } from "lucide-react";
import { useDataContext } from "@/lib/data/context";

const LINKS = [
  { href: "/more/exercises", label: "Exercise directory", icon: Dumbbell, description: "Browse and filter all exercises" },
  { href: "/more/progression", label: "Progression", icon: TrendingUp, description: "Strength trends and recommendations" },
  { href: "/more/recipes", label: "Recipes", icon: ChefHat, description: "Build and reuse home recipes" },
  { href: "/more/meal-plan", label: "Meal plan", icon: CalendarRange, description: "7-day Indian non-veg meal plan" },
  { href: "/more/settings", label: "Settings", icon: Settings, description: "Profile, equipment, nutrition targets" },
  { href: "/more/export", label: "Export & backup", icon: Download, description: "Download your data as CSV/JSON" },
];

export default function MorePage() {
  const { user, mode, signOut } = useDataContext();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">More</h1>
      {user && (
        <Card>
          <CardContent className="py-3 flex items-center justify-between">
            <div>
              <p className="font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground">{mode === "demo" ? "Local demo mode" : user.email}</p>
            </div>
            {mode === "supabase" && (
              <button className="text-sm text-muted-foreground underline" onClick={signOut}>
                Sign out
              </button>
            )}
          </CardContent>
        </Card>
      )}
      <div className="space-y-2">
        {LINKS.map(({ href, label, icon: Icon, description }) => (
          <Link key={href} href={href}>
            <Card>
              <CardContent className="py-3 flex items-center gap-3">
                <Icon className="size-5 text-muted-foreground shrink-0" />
                <div className="flex-1">
                  <p className="font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
                <ChevronRight className="size-4 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      <Card>
        <CardContent className="py-3 flex items-start gap-3 text-xs text-muted-foreground">
          <Info className="size-4 shrink-0 mt-0.5" />
          <p>
            Nithish Fit provides general fitness and nutrition planning support. It does not replace advice from a qualified doctor, physiotherapist,
            trainer or dietitian. Always consult a professional for medical concerns.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
