import { useCallback, useEffect, useState } from "react";
import { VAPID_PUBLIC_KEY, currentPushSubscription, pushSupported, subscribePush } from "./notify";
import type { PushState } from "./store";

/** Tracks whether this device gets push notifications, and turns them on/off. */
export function usePush(register: (sub: PushSubscriptionJSON) => Promise<void>, unregister: (endpoint: string) => Promise<void>) {
  const [state, setState] = useState<PushState>("off");

  const refresh = useCallback(async () => {
    if (!pushSupported()) return setState("unsupported");
    if (!VAPID_PUBLIC_KEY) return setState("unconfigured");
    if (Notification.permission === "denied") return setState("denied");
    const sub = await currentPushSubscription().catch(() => null);
    setState(sub ? "on" : "off");
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const enable = useCallback(async () => {
    const { sub, error } = await subscribePush();
    if (error || !sub) {
      await refresh();
      return error || "Couldn't turn on notifications.";
    }
    try {
      await register(sub);
    } catch (e) {
      return (e as Error).message;
    }
    setState("on");
    return null;
  }, [register, refresh]);

  const disable = useCallback(async () => {
    const sub = await currentPushSubscription().catch(() => null);
    if (sub) {
      await unregister(sub.endpoint).catch(() => {});
      await sub.unsubscribe().catch(() => {});
    }
    setState("off");
  }, [unregister]);

  return { state, enable, disable, refresh };
}
