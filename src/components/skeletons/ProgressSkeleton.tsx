import { Skeleton } from "@/components/ui/skeleton";

const ProgressSkeleton = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col safe-area-top safe-area-bottom animate-in fade-in duration-300">
      <div className="flex-1 px-6 py-6 pb-24 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-7 w-24 rounded" />
          <Skeleton className="h-6 w-28 rounded-full" />
        </div>

        {/* Period Tabs */}
        <div className="flex gap-2 mb-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-20 rounded-full" />
          ))}
        </div>

        {/* Calories Chart */}
        <div className="bg-card rounded-2xl p-4 shadow-soft mb-6">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-5 w-32 rounded" />
            <Skeleton className="h-4 w-24 rounded" />
          </div>
          <Skeleton className="h-48 w-full rounded" />
        </div>

        {/* Macros Chart */}
        <div className="bg-card rounded-2xl p-4 shadow-soft mb-6">
          <Skeleton className="h-5 w-36 rounded mb-4" />
          <Skeleton className="h-48 w-full rounded" />
          <div className="flex justify-center gap-6 mt-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-1">
                <Skeleton className="w-3 h-3 rounded-full" />
                <Skeleton className="h-3 w-12 rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Macro Distribution */}
        <div className="bg-card rounded-2xl p-4 shadow-soft mb-6">
          <Skeleton className="h-5 w-40 rounded mb-4" />
          <div className="flex items-center">
            <Skeleton className="w-32 h-32 rounded-full" />
            <div className="flex-1 space-y-3 ml-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-4 h-4 rounded" />
                    <Skeleton className="h-4 w-16 rounded" />
                  </div>
                  <Skeleton className="h-4 w-12 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-area-bottom">
        <div className="flex justify-around py-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <Skeleton className="h-6 w-6 rounded" />
              <Skeleton className="h-2 w-8 rounded" />
            </div>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default ProgressSkeleton;
