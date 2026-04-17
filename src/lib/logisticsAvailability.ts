export type LogisticsAvailabilityState = {
  items: Record<string, boolean>;
  images: Record<string, boolean>;
};

const STORAGE_KEY = "sistaevents.logisticsAvailability.v1";
export const LOGISTICS_AVAILABILITY_EVENT = "logistics-availability-changed";

const getDefaultState = (): LogisticsAvailabilityState => ({
  items: {},
  images: {},
});

const canUseStorage = () => typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const emitChange = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(LOGISTICS_AVAILABILITY_EVENT));
  }
};

export const getLogisticsAvailability = (): LogisticsAvailabilityState => {
  if (!canUseStorage()) return getDefaultState();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultState();

    const parsed = JSON.parse(raw) as Partial<LogisticsAvailabilityState>;
    return {
      items: parsed.items ?? {},
      images: parsed.images ?? {},
    };
  } catch {
    return getDefaultState();
  }
};

const saveLogisticsAvailability = (state: LogisticsAvailabilityState) => {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  emitChange();
};

export const setLogisticsItemAvailability = (key: string, available: boolean) => {
  const state = getLogisticsAvailability();
  state.items[key] = available;
  saveLogisticsAvailability(state);
};

export const setLogisticsImageAvailability = (itemKey: string, imageIndex: number, available: boolean) => {
  const state = getLogisticsAvailability();
  state.images[`${itemKey}:${imageIndex}`] = available;
  saveLogisticsAvailability(state);
};

export const resetLogisticsAvailability = () => {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(STORAGE_KEY);
  emitChange();
};