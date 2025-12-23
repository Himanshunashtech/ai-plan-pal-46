import { Skeleton } from "@/components/ui/skeleton";

const OnboardingSkeleton = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col animate-in fade-in duration-300">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-2 w-32 rounded-full" />
        <Skeleton className="h-6 w-12 rounded" />
      </div>

      {/* Main content */}
      <div className="flex-1 px-6 py-8 flex flex-col">
        {/* Title area */}
        <div className="space-y-3 mb-8">
          <Skeleton className="h-8 w-3/4 rounded" />
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-2/3 rounded" />
        </div>

        {/* Options/Cards area */}
        <div className="space-y-4 flex-1">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      </div>

      {/* Bottom button */}
      <div className="p-6 pb-8">
        <Skeleton className="h-14 w-full rounded-xl" />
      </div>
    </div>
  );
};

export default OnboardingSkeleton;
