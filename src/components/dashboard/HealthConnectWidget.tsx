import { Check, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useHealthConnect } from '@/hooks/useHealthConnect';
import { HealthConnectLogo } from '@/components/icons/HealthConnectLogo';

interface HealthConnectWidgetProps {
  onSynced?: (steps: number, caloriesBurned: number) => void;
}

export default function HealthConnectWidget({ onSynced }: HealthConnectWidgetProps) {
  const {
    isAvailable,
    isConnected,
    isLoading,
    healthData,
    requestPermissions,
    syncHealthData,
  } = useHealthConnect();

  if (!isAvailable) {
    return (
      <div className="rounded-xl pb-8">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            <HealthConnectLogo className="w-4 h-4 grayscale opacity-50" />
          </div>
          <div className="text-xs leading-tight ">
            <p className="font-medium">Health not available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      className={`rounded-xl p-3 mt-auto text-left transition-all ${isConnected ? 'bg-secondary/60 hover:bg-secondary' : 'bg-muted/50 hover:bg-muted'
        }`}
      onClick={async () => {
        if (isConnected) {
          await syncHealthData();
          toast.success('Health data synced');
          onSynced?.(healthData.steps, healthData.caloriesBurned);
          return;
        }

        const granted = await requestPermissions();
        if (granted) {
          toast.success('Connected to Health');
        } else {
          toast.error('Connection failed. Install Health Connect.');
        }
      }}
    >
      <div className="flex items-center gap-2">
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${isConnected ? 'bg-white shadow-sm ring-1 ring-border/50' : 'bg-muted shadow-sm'
            }`}
        >
          {isLoading ? (
            <RefreshCw className="w-4 h-4 text-primary animate-spin" />
          ) : isConnected ? (
            <HealthConnectLogo className="w-4 h-4" />
          ) : (
            <HealthConnectLogo className="w-4 h-4 grayscale opacity-50" />
          )}
        </div>
        <div className="text-xs leading-tight">
          <p className="font-medium">{isConnected ? 'Tap to sync' : 'Connect Health'}</p>
          <p className="text-muted-foreground">
            {isConnected
              ? healthData.lastSynced
                ? `Updated ${new Date(healthData.lastSynced).toLocaleTimeString()}`
                : 'Connected'
              : 'Sync steps & calories'}
          </p>
        </div>
      </div>
    </button>
  );
}
