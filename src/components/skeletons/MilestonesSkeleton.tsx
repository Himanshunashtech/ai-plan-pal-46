import { Skeleton } from "@/components/ui/skeleton";

const MilestonesSkeleton = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col safe-area-top safe-area-bottom animate-in fade-in duration-300">
      {/* Header */}
      <header className="sticky top-0 bg-background/80 backdrop-blur-lg border-b border-border z-10">
        <div className="flex items-center justify-between px-4 py-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-6 w-24 rounded" />
          <Skeleton className="h-10 w-10 rounded-lg" />
        </div>
      </header>

      <div className="flex-1 px-4 py-6 overflow-auto pb-24">
        {/* Tab switcher */}
        <div className="flex gap-4 mb-6">
          <Skeleton className="flex-1 h-24 rounded-2xl" />
          <Skeleton className="flex-1 h-24 rounded-2xl" />
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </div>

        {/* Badges grid */}
        <div className="space-y-8">
          {[...Array(3)].map((_, section) => (
            <div key={section} className="grid grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex flex-col items-center">
                  <Skeleton className="w-20 h-20 rounded-2xl" />
                  <Skeleton className="h-3 w-16 rounded mt-2" />
                  <Skeleton className="h-2 w-12 rounded mt-1" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MilestonesSkeleton;
