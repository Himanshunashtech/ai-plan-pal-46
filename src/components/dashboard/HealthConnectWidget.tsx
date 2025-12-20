import { Check, Link2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useHealthConnect } from '@/hooks/useHealthConnect';

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
      <div className="rounded-xl p-3 mt-auto bg-muted/50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            <Link2 className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="text-xs leading-tight">
            <p className="font-medium">Health not available</p>
            <p className="text-muted-foreground">Android Health Connect only</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      className={`rounded-xl p-3 mt-auto text-left transition-all ${
        isConnected ? 'bg-secondary/60 hover:bg-secondary' : 'bg-muted/50 hover:bg-muted'
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
          className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
            isConnected ? 'bg-primary' : 'bg-muted'
          }`}
        >
          {isLoading ? (
            <RefreshCw className="w-4 h-4 text-primary-foreground animate-spin" />
          ) : isConnected ? (
            <Check className="w-4 h-4 text-primary-foreground" />
          ) : (
            <Link2 className="w-4 h-4 text-muted-foreground" />
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
