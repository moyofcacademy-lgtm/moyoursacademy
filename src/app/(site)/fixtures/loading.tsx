import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl px-[var(--gutter)] py-12" role="status" aria-label="Loading fixtures">
      <Skeleton className="h-12 w-56" />
      <div className="mt-8 flex flex-col gap-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    </div>
  );
}
