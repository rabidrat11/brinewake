/**
 * Typed event bus.
 *
 * The simulation never reaches into the UI, and the UI never reaches into the
 * simulation. They talk through this. Handlers are stored in arrays and
 * iterated over a copy only when a removal happens mid-dispatch, so the common
 * path allocates nothing.
 */

import type { ItemStack } from '../items/itemTypes';

export interface DiscoveryPayload {
  kind: 'species' | 'item' | 'wreck' | 'location' | 'mystery' | 'flora' | 'geology';
  id: string;
  name: string;
  subtitle?: string;
  /** True the first time this thing is seen, ever. */
  first: boolean;
}

export interface ToastPayload {
  text: string;
  icon?: string;
  tone?: 'neutral' | 'good' | 'warn' | 'bad' | 'discovery';
  duration?: number;
}

export interface GameEvents {
  'sim:tick': { dt: number; elapsed: number };
  'sub:depth': { depth: number };
  'sub:damage': { amount: number; cause: string };
  'sub:destroyed': { cause: string };
  'sub:rescued': { lostCargo: number; fee: number };
  'sub:docked': undefined;
  'sub:undocked': undefined;
  'sub:collide': { speed: number; x: number; y: number; z: number };
  'sub:loadout-changed': undefined;
  'sub:module-installed': { moduleId: string };

  'catch:success': { speciesId: string; sizeCm: number; quality: number; method: string };
  'catch:escaped': { speciesId: string; reason: string };
  'catch:started': { speciesId: string; method: string };
  'scan:complete': { targetKind: string; targetId: string; value: number };
  'photo:taken': { speciesId: string; score: number };

  'item:collected': { stack: ItemStack; x: number; y: number; z: number };
  'item:sold': { itemId: string; count: number; value: number };
  'cargo:full': undefined;

  'discovery': DiscoveryPayload;
  'toast': ToastPayload;
  'log': { text: string; channel?: string };

  'quest:offered': { questId: string };
  'quest:accepted': { questId: string };
  'quest:progress': { questId: string; objectiveIndex: number };
  'quest:completed': { questId: string };
  'quest:failed': { questId: string };

  'research:unlocked': { nodeId: string };
  'research:progress': { nodeId: string; progress: number };
  'craft:completed': { recipeId: string };
  'museum:donated': { itemId: string; exhibitId: string };
  'museum:tier-up': { tier: number };
  'aquarium:stocked': { speciesId: string; tankId: string };

  'region:entered': { regionId: string };
  'region:left': { regionId: string };
  'landmark:discovered': { landmarkId: string };
  'depth:record': { depth: number };

  'money:changed': { delta: number; total: number; reason: string };
  'time:phase': { phase: string };
  'weather:changed': { weather: string };

  'ui:open': { screen: string };
  'ui:close': { screen: string };
  'ui:refresh': undefined;
  'ui:dialogue': { npcId: string; nodeId?: string };
  'ui:cinematic': { name: string };

  'save:written': { slot: number };
  'save:loaded': { slot: number };
  'game:started': undefined;
  'game:ended': { ending: string };
}

type Handler<T> = (payload: T) => void;

export class EventBus<E> {
  private handlers = new Map<keyof E, Handler<never>[]>();
  private dispatching = 0;

  on<K extends keyof E>(event: K, handler: Handler<E[K]>): () => void {
    let list = this.handlers.get(event);
    if (!list) {
      list = [];
      this.handlers.set(event, list);
    } else if (this.dispatching > 0) {
      // Copy-on-write so a subscription made during dispatch does not mutate
      // the array currently being iterated.
      list = list.slice();
      this.handlers.set(event, list);
    }
    list.push(handler as Handler<never>);
    return () => this.off(event, handler);
  }

  once<K extends keyof E>(event: K, handler: Handler<E[K]>): () => void {
    const off = this.on(event, ((p: E[K]) => {
      off();
      handler(p);
    }) as Handler<E[K]>);
    return off;
  }

  off<K extends keyof E>(event: K, handler: Handler<E[K]>): void {
    const list = this.handlers.get(event);
    if (!list) return;
    const i = list.indexOf(handler as Handler<never>);
    if (i < 0) return;
    if (this.dispatching > 0) {
      const copy = list.slice();
      copy.splice(i, 1);
      this.handlers.set(event, copy);
    } else {
      list.splice(i, 1);
    }
  }

  emit<K extends keyof E>(event: K, ...args: E[K] extends undefined ? [] : [E[K]]): void {
    const list = this.handlers.get(event);
    if (!list || list.length === 0) return;
    const payload = args[0] as never;
    this.dispatching++;
    try {
      for (let i = 0; i < list.length; i++) {
        try {
          list[i](payload);
        } catch (err) {
          console.error(`[events] handler for "${String(event)}" threw`, err);
        }
      }
    } finally {
      this.dispatching--;
    }
  }

  clear(): void {
    this.handlers.clear();
  }
}

/** The single game-wide bus. */
export const bus = new EventBus<GameEvents>();

/** Shorthand used all over the codebase for player-facing notifications. */
export function toast(text: string, tone: ToastPayload['tone'] = 'neutral', icon?: string): void {
  bus.emit('toast', { text, tone, icon });
}
