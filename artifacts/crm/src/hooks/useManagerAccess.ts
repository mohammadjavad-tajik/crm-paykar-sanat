import { useLock } from "@/contexts/LockContext";
import { useGetSettings } from "@workspace/api-client-react";

export function useManagerAccess(): boolean {
  const { isLocked } = useLock();
  const { data: settings } = useGetSettings();

  if (!settings) return false;

  if (!settings.pin_hash) return true;

  return !isLocked;
}
