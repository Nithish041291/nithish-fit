import { BottomNav } from "@/components/bottom-nav";
import { DemoModeBanner } from "@/components/demo-mode-banner";
import { AuthGate } from "@/components/auth-gate";
import { ExerciseRotationCheck } from "@/components/workout/exercise-rotation-check";

export default function AppShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <div className="flex flex-col flex-1 min-h-full">
        <DemoModeBanner />
        <ExerciseRotationCheck />
        <main className="flex-1 w-full max-w-2xl mx-auto px-4 pt-4 pb-24">{children}</main>
        <BottomNav />
      </div>
    </AuthGate>
  );
}
