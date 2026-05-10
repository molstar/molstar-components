import { createContext, useContext } from 'react';

export type NotifyFn = (n: { type: 'success' | 'error'; message: string }) => void;
export const NotificationContext = createContext<NotifyFn | null>(null);
export function useNotify(): NotifyFn {
  const fn = useContext(NotificationContext);
  return fn ?? ((n) => console.log(`[UIBuilder] ${n.type}: ${n.message}`));
}
