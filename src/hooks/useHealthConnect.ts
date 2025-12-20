import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';

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

// Dynamic import for the health connect plugin
let HealthConnect: any = null;

const loadHealthConnectPlugin = async () => {
  if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
    try {
      const module = await import('capacitor-health-connect');
      HealthConnect = module.HealthConnect;
      return true;
    } catch (error) {
      console.error('Failed to load Health Connect plugin:', error);
      return false;
    }
  }
  return false;
};

export const useHealthConnect = (): UseHealthConnectReturn => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [healthData, setHealthData] = useState<HealthData>({
    steps: 0,
    caloriesBurned: 0,
    lastSynced: null
  });

  // Check if Health Connect is available
  useEffect(() => {
    const checkAvailability = async () => {
      const loaded = await loadHealthConnectPlugin();
      if (loaded && HealthConnect) {
        try {
          const result = await HealthConnect.checkAvailability();
          setIsAvailable(result.availability === 'Available');
          
          // Check if we already have permissions
          if (result.availability === 'Available') {
            const permissions = await HealthConnect.checkHealthPermissions({
              read: ['Steps', 'TotalCaloriesBurned'],
              write: []
            });
            setIsConnected(permissions.grantedPermissions?.length > 0);
          }
        } catch (error) {
          console.log('Health Connect not available:', error);
          setIsAvailable(false);
        }
      }
    };
    
    checkAvailability();
  }, []);

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    if (!HealthConnect) {
      console.log('Health Connect plugin not loaded');
      return false;
    }

    setIsLoading(true);
    try {
      // Open Health Connect app/settings if not installed
      const availability = await HealthConnect.checkAvailability();
      if (availability.availability === 'NotInstalled') {
        await HealthConnect.openHealthConnectSetting();
        return false;
      }

      // Request permissions for steps and calories
      const result = await HealthConnect.requestHealthPermissions({
        read: ['Steps', 'TotalCaloriesBurned'],
        write: []
      });

      const granted = result.grantedPermissions?.length > 0;
      setIsConnected(granted);
      
      if (granted) {
        // Sync data after getting permissions
        await syncHealthData();
      }
      
      return granted;
    } catch (error) {
      console.error('Error requesting Health Connect permissions:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveHealthDataToDb = useCallback(async (steps: number, caloriesBurned: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];

      // Upsert the health data for today
      const { error } = await supabase
        .from('daily_nutrition_logs')
        .upsert({
          user_id: user.id,
          log_date: today,
          steps,
          calories_burned: caloriesBurned
        }, {
          onConflict: 'user_id,log_date'
        });

      if (error) {
        console.error('Error saving health data:', error);
      }
    } catch (error) {
      console.error('Error saving health data to DB:', error);
    }
  }, []);

  const loadHealthDataFromDb = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('daily_nutrition_logs')
        .select('steps, calories_burned')
        .eq('user_id', user.id)
        .eq('log_date', today)
        .maybeSingle();

      if (error) {
        console.error('Error loading health data:', error);
        return;
      }

      if (data) {
        setHealthData(prev => ({
          ...prev,
          steps: data.steps || 0,
          caloriesBurned: data.calories_burned || 0
        }));
      }
    } catch (error) {
      console.error('Error loading health data from DB:', error);
    }
  }, []);

  // Load persisted data on mount
  useEffect(() => {
    loadHealthDataFromDb();
  }, [loadHealthDataFromDb]);

  const syncHealthData = useCallback(async () => {
    if (!HealthConnect || !isConnected) {
      return;
    }

    setIsLoading(true);
    try {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      // Read steps for today
      const stepsResult = await HealthConnect.readRecords({
        type: 'Steps',
        timeRangeFilter: {
          type: 'between',
          startTime: startOfDay.toISOString(),
          endTime: now.toISOString()
        }
      });

      // Read calories burned for today
      const caloriesResult = await HealthConnect.readRecords({
        type: 'TotalCaloriesBurned',
        timeRangeFilter: {
          type: 'between',
          startTime: startOfDay.toISOString(),
          endTime: now.toISOString()
        }
      });

      // Calculate total steps
      let totalSteps = 0;
      if (stepsResult.records) {
        totalSteps = stepsResult.records.reduce((sum: number, record: any) => {
          return sum + (record.count || 0);
        }, 0);
      }

      // Calculate total calories burned
      let totalCalories = 0;
      if (caloriesResult.records) {
        totalCalories = caloriesResult.records.reduce((sum: number, record: any) => {
          return sum + (record.energy?.inKilocalories || 0);
        }, 0);
      }

      const roundedSteps = Math.round(totalSteps);
      const roundedCalories = Math.round(totalCalories);

      setHealthData({
        steps: roundedSteps,
        caloriesBurned: roundedCalories,
        lastSynced: new Date()
      });

      // Save to database
      await saveHealthDataToDb(roundedSteps, roundedCalories);
    } catch (error) {
      console.error('Error syncing health data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, saveHealthDataToDb]);

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
