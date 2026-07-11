"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, ChevronRight } from "lucide-react";
import { useProviderData } from "@/lib/data/hooks";

export default function RecipesListPage() {
  const recipesState = useProviderData((p) => p.listRecipes());

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Recipes</h1>
        <Link href="/more/recipes/new">
          <Button size="sm" className="gap-1.5">
            <Plus className="size-4" /> New
          </Button>
        </Link>
      </div>
      <p className="text-sm text-muted-foreground">
        Build your own recipes (e.g. home chicken curry, egg bhurji) with real ingredient quantities and oil, so calories reflect how you actually
        cook.
      </p>

      {recipesState.loading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <div className="space-y-2">
          {(recipesState.data ?? []).map((r) => (
            <Link key={r.id} href={`/more/recipes/${r.id}`}>
              <Card>
                <CardContent className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{r.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.servings} servings · {r.totalCookedWeightGrams}g total
                    </p>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))}
          {(recipesState.data ?? []).length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No recipes yet.</p>}
        </div>
      )}
    </div>
  );
}
