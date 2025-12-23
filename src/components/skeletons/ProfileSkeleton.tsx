import { Skeleton } from "@/components/ui/skeleton";

const ProfileSkeleton = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col safe-area-top safe-area-bottom animate-in fade-in duration-300">
      <div className="flex-1 px-6 py-6 pb-24 overflow-auto">
        {/* Title */}
        <Skeleton className="h-7 w-24 rounded mb-6" />

        {/* Profile Card */}
        <div className="bg-card rounded-2xl p-4 shadow-soft mb-6 flex items-center gap-4">
          <Skeleton className="w-16 h-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-24 rounded" />
            <Skeleton className="h-4 w-32 rounded" />
          </div>
        </div>

        {/* Menu Items */}
        <div className="bg-card rounded-2xl shadow-soft overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className={`flex items-center justify-between p-4 ${
                i !== 7 ? 'border-b border-border' : ''
              }`}
            >
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-5 w-5 rounded" />
            </div>
          ))}
        </div>

        {/* Sign Out Button */}
        <Skeleton className="h-12 w-full rounded-lg mt-6" />

        {/* Delete Account */}
        <Skeleton className="h-10 w-full rounded-lg mt-4" />
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

export default ProfileSkeleton;
