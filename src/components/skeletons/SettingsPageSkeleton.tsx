import { Skeleton } from "@/components/ui/skeleton";

interface SettingsPageSkeletonProps {
  itemCount?: number;
}

const SettingsPageSkeleton = ({ itemCount = 5 }: SettingsPageSkeletonProps) => {
  return (
    <div className="min-h-screen bg-background flex flex-col safe-area-top safe-area-bottom animate-in fade-in duration-300">
      {/* Header */}
      <header className="sticky top-0 bg-background/80 backdrop-blur-lg border-b border-border z-10">
        <div className="flex items-center gap-3 px-4 py-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-6 w-40 rounded" />
        </div>
      </header>

      <div className="flex-1 px-4 py-6 overflow-auto">
        {/* Settings Items */}
        <div className="space-y-4">
          {[...Array(itemCount)].map((_, i) => (
            <div key={i} className="bg-card rounded-2xl p-4 shadow-soft">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32 rounded" />
                  <Skeleton className="h-3 w-48 rounded" />
                </div>
                <Skeleton className="h-6 w-12 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SettingsPageSkeleton;
