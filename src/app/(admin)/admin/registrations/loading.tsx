import { TableSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl">
      <TableSkeleton rows={8} />
    </div>
  );
}
