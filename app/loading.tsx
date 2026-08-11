import { ItemRowSkeleton } from "@/components/ItemRow";

/** Skeleton rows at the real row height. No spinners anywhere in this app. */
export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <div className="flex items-center justify-between gap-4">
        <span className="text-lede font-medium">What you own</span>
        <span className="block h-[41px] w-[132px] rounded-card bg-card shadow-card" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="h-[122px] rounded-card bg-card shadow-card" />
        <div className="h-[122px] rounded-card bg-card shadow-card" />
      </div>

      <div className="h-[41px] rounded-card bg-card shadow-card" />

      <ul className="space-y-2">
        <ItemRowSkeleton />
        <ItemRowSkeleton />
        <ItemRowSkeleton />
      </ul>

      <span className="sr-only">Loading</span>
    </div>
  );
}
