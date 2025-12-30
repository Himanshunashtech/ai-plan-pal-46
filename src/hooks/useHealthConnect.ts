import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import despia from 'despia-native';

// Types for Health Connect data
interface HealthData {
  steps: number;
  caloriesBurned: number;
  lastSynced: Date | null;
}

interface UseHealthConnectReturn {
  isAvailable: boolean;
  isConnected: boolean;
  isLoading: boolean;
  healthData: HealthData;
  requestPermissions: () => Promise<boolean>;
  syncHealthData: () => Promise<void>;
  disconnect: () => void;
}

export const useHealthConnect = (): UseHealthConnectReturn => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [healthData, setHealthData] = useState<HealthData>({
    steps: 0,
    caloriesBurned: 0,
    lastSynced: null
  });

  // Check Availability
  useEffect(() => {
    const check = async () => {
      // In Despia, checking availability might be a scheme call or just checking if we receive data
      // For now, assuming available if in Despia environment
      try {
        // Optional: Probe scheme
        setIsAvailable(true);
      } catch {
        setIsAvailable(false);
      }
    };
    check();
  }, []);

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Call Despia scheme for health connect permissions
      // Scheme pattern assumption: healthconnect://request?permissions=steps,calories
      await despia('healthconnect://request', ['steps', 'calories']);
      setIsConnected(true);
      return true;
    } catch (error) {
      console.error('Error requesting Health Connect permissions:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const syncHealthData = useCallback(async () => {
    if (!isConnected) return;

    setIsLoading(true);
    try {
      // Fetch via Despia
      // Expecting result as array or object in the 'response'
      // Usage: await despia(scheme, args)
      // If despia returns promise with data:
      const result: any = await despia('healthconnect://read', [JSON.stringify({
        types: ['steps', 'calories'],
        start: new Date(new Date().setHours(0, 0, 0, 0)).toISOString(),
        end: new Date().toISOString()
      })]);

      // Parse result (Mock shape assumption)
      const steps = result?.steps || 0;
      const calories = result?.calories || 0;

      const roundedSteps = Math.round(steps);
      const roundedCalories = Math.round(calories);

      setHealthData({
        steps: roundedSteps,
        caloriesBurned: roundedCalories,
        lastSynced: new Date()
      });

      // Save to database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const today = new Date().toISOString().split('T')[0];
        await supabase
          .from('daily_nutrition_logs')
          .upsert({
            user_id: user.id,
            log_date: today,
            steps: roundedSteps,
            calories_burned: roundedCalories
          }, {
            onConflict: 'user_id,log_date'
          });
      }

    } catch (error) {
      console.error('Error syncing health data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isConnected]);

  const disconnect = useCallback(() => {
    setIsConnected(false);
    setHealthData({
      steps: 0,
      caloriesBurned: 0,
      lastSynced: null
    });
  }, []);

  return {
    isAvailable,
    isConnected,
    isLoading,
    healthData,
    requestPermissions,
    syncHealthData,
    disconnect
  };
};

export default useHealthConnect;
