type EventMap = Record<string, unknown>;
type EventHandler<T> = (payload: T) => void;

export class EventBus<TEvents extends EventMap> {
  private listeners = new Map<keyof TEvents, Set<EventHandler<any>>>();

  on<TKey extends keyof TEvents>(type: TKey, handler: EventHandler<TEvents[TKey]>): () => void {
    const group = this.listeners.get(type) ?? new Set<EventHandler<TEvents[TKey]>>();
    group.add(handler);
    this.listeners.set(type, group as Set<EventHandler<any>>);

    return () => {
      group.delete(handler);
      if (group.size === 0) {
        this.listeners.delete(type);
      }
    };
  }

  emit<TKey extends keyof TEvents>(type: TKey, payload: TEvents[TKey]): void {
    const group = this.listeners.get(type);
    if (!group) {
      return;
    }

    for (const handler of group) {
      handler(payload);
    }
  }
}
