import { Skeleton } from "@/components/ui/skeleton";

interface FormPageSkeletonProps {
  fieldCount?: number;
  showAvatar?: boolean;
}

const FormPageSkeleton = ({ fieldCount = 6, showAvatar = false }: FormPageSkeletonProps) => {
  return (
    <div className="min-h-screen bg-background safe-area-top safe-area-bottom animate-in fade-in duration-300">
      <div className="px-6 py-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-7 w-32 rounded" />
        </div>

        {/* Avatar Section (optional) */}
        {showAvatar && (
          <div className="flex flex-col items-center mb-8">
            <Skeleton className="w-28 h-28 rounded-full" />
            <Skeleton className="h-4 w-24 rounded mt-3" />
          </div>
        )}

        {/* Form Fields */}
        <div className="space-y-5">
          {[...Array(fieldCount)].map((_, i) => (
            <div key={i}>
              <Skeleton className="h-4 w-24 rounded mb-1.5" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          ))}
        </div>

        {/* Save Button */}
        <Skeleton className="h-14 w-full rounded-lg mt-8" />
      </div>
    </div>
  );
};

export default FormPageSkeleton;
