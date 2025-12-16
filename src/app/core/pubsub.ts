
/**
 * Callback invoked by a publish/subscribe channel when an event is emitted.
 *
 * @typeParam T - The type of the optional payload passed to the subscriber.
 * @param payload - Optional data associated with the event; may be undefined if the publisher supplied no payload.
 * @returns void
 *
 * @remarks
 * Subscriber callbacks are typically invoked by the publisher when an event occurs. Implementations should
 * avoid throwing unhandled errors from subscribers and should minimize long-running synchronous work.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PubSubCallback<T = any> = (payload?: T) => void;

/**
 * A publish-subscribe (PubSub) event system for managing topic-based message distribution.
 * 
 * @class PubSub
 * @example
 * ```typescript
 * const pubsub = new PubSub();
 * 
 * // Subscribe to a topic
 * const unsubscribe = pubsub.subscribe('user:login', (payload) => {
 *   console.log('User logged in:', payload);
 * });
 * 
 * // Publish to a topic
 * pubsub.publish('user:login', { userId: 123, username: 'john' });
 * 
 * // Unsubscribe
 * unsubscribe();
 * ```
 */
export class PubSub {
  private topics = new Map<string, Set<PubSubCallback>>();

  subscribe<T>(topic: string, cb: PubSubCallback<T>): () => void {
    if (!this.topics.has(topic)) this.topics.set(topic, new Set());
  
    const subs = this.topics.get(topic)!;
    subs.add(cb);
    console.log('PubSub.subscribe')

    return () => {
      console.log('PubSub.unsubscribe');
      subs.delete(cb);
    }
  }

  publish<T>(topic: string, payload?: T) {
    console.log('PubSub.publish ' + topic);
    this.topics.get(topic)?.forEach(cb => cb(payload));
  }
}

export const pubSub = new PubSub();

