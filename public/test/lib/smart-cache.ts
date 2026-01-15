/**
 * Systeme de cache intelligent avec invalidation par evenement
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
  tags: string[]
}

export class SmartCache<T = any> {
  private cache = new Map<string, CacheEntry<T>>()
  private listeners = new Map<string, Set<() => void>>()
  private maxEntries: number

  constructor(maxEntries = 200) {
    this.maxEntries = maxEntries
  }

  /**
   * Ajouter une valeur au cache
   */
  set(key: string, data: T, ttlMs = 60000, tags: string[] = []): void {
    // Implementer une simple LRU si trop d'entrees
    if (this.cache.size >= this.maxEntries) {
      const oldestKey = Array.from(this.cache.entries()).sort(([, a], [, b]) => a.timestamp - b.timestamp)[0]?.[0]

      if (oldestKey) {
        this.cache.delete(oldestKey)
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
      tags,
    })
  }

  /**
   * Recuperer une valeur du cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key)

    if (!entry) return null

    // Verifier l'expiration
    const age = Date.now() - entry.timestamp
    if (age > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  /**
   * Invalider par tag
   */
  invalidateByTag(tag: string): void {
    const keysToDelete: string[] = []

    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.includes(tag)) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach((key) => {
      this.cache.delete(key)
      this.notifyListeners(tag)
    })
  }

  /**
   * S'abonner aux changements de cache
   */
  subscribe(tag: string, callback: () => void): () => void {
    if (!this.listeners.has(tag)) {
      this.listeners.set(tag, new Set())
    }

    this.listeners.get(tag)!.add(callback)

    // Retourner une fonction pour se desabonner
    return () => {
      this.listeners.get(tag)?.delete(callback)
    }
  }

  /**
   * Notifier les listeners
   */
  private notifyListeners(tag: string): void {
    this.listeners.get(tag)?.forEach((callback) => {
      callback()
    })
  }

  /**
   * Nettoyer le cache
   */
  clear(): void {
    this.cache.clear()
    this.listeners.clear()
  }

  /**
   * Obtenir les stats du cache
   */
  getStats() {
    return {
      size: this.cache.size,
      maxEntries: this.maxEntries,
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        age: Date.now() - entry.timestamp,
        ttl: entry.ttl,
        tags: entry.tags,
      })),
    }
  }
}

export const yieldCacheManager = new SmartCache<any>(200)
