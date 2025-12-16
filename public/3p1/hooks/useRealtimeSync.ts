import { useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';

/**
 * Custom hook for Supabase Realtime subscriptions
 * Provides live sync across all connected users
 * 
 * Usage:
 *   useRealtimeSync('tickers', (payload) => {
 *     if (payload.eventType === 'INSERT') addTicker(payload.new);
 *     if (payload.eventType === 'UPDATE') updateTicker(payload.new);
 *     if (payload.eventType === 'DELETE') removeTicker(payload.old.id);
 *   });
 */
export function useRealtimeSync(
  tableName: string,
  onDataChange: (payload: {
    eventType: 'INSERT' | 'UPDATE' | 'DELETE';
    new: any;
    old: any;
  }) => void,
  options?: {
    schema?: string;
    filter?: string;
    enabled?: boolean;
  }
) {
  const handleChange = useCallback(onDataChange, []);
  
  useEffect(() => {
    if (options?.enabled === false) return;
    if (!supabase) {
      console.warn('Supabase not initialized, skipping realtime subscription');
      return;
    }

    const channelName = `realtime-${tableName}-${Date.now()}`;
    console.log(`📡 Subscribing to ${tableName} changes...`);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: options?.schema || 'public',
          table: tableName,
          filter: options?.filter,
        },
        (payload: any) => {
          console.log(`📡 [${tableName}] ${payload.eventType}:`, payload);
          handleChange({
            eventType: payload.eventType,
            new: payload.new,
            old: payload.old,
          });
        }
      )
      .subscribe((status) => {
        console.log(`📡 [${tableName}] Subscription status:`, status);
      });

    return () => {
      console.log(`🔌 Unsubscribing from ${tableName}`);
      supabase.removeChannel(channel);
    };
  }, [tableName, handleChange, options?.schema, options?.filter, options?.enabled]);
}

/**
 * Hook to subscribe to multiple tables at once
 */
export function useMultiTableSync(
  tables: Array<{
    table: string;
    onInsert?: (data: any) => void;
    onUpdate?: (data: any) => void;
    onDelete?: (data: any) => void;
  }>
) {
  useEffect(() => {
    if (!supabase) return;

    const channels = tables.map(({ table, onInsert, onUpdate, onDelete }) => {
      const channel = supabase
        .channel(`multi-sync-${table}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table },
          (payload: any) => {
            if (payload.eventType === 'INSERT' && onInsert) onInsert(payload.new);
            if (payload.eventType === 'UPDATE' && onUpdate) onUpdate(payload.new);
            if (payload.eventType === 'DELETE' && onDelete) onDelete(payload.old);
          }
        )
        .subscribe();
      
      return channel;
    });

    return () => {
      channels.forEach((ch) => supabase.removeChannel(ch));
    };
  }, [tables]);
}

export default useRealtimeSync;
