// ---------------------------------------------------------------------------
// LWWRegister — a single Last-Write-Wins register CRDT.
//
// Conflicts are resolved deterministically: the write with the higher
// timestamp always wins. If two writes share the exact same timestamp
// (possible with clock skew across tabs/clients), the write from the site
// whose id sorts later lexicographically wins, guaranteeing every replica
// converges on the same value regardless of merge order.
// ---------------------------------------------------------------------------

export class LWWRegister<T> {
  value: T;
  timestamp: number;
  siteId: string;

  constructor(value: T, siteId: string, timestamp: number = Date.now()) {
    this.value = value;
    this.siteId = siteId;
    this.timestamp = timestamp;
  }

  /** Perform a brand-new local write — always takes effect immediately. */
  set(value: T, siteId: string, timestamp: number = Date.now()): void {
    this.value = value;
    this.siteId = siteId;
    this.timestamp = timestamp;
  }

  /** Merge in another register's state, keeping whichever write "wins". */
  merge(other: LWWRegister<T>): void {
    if (
      other.timestamp > this.timestamp ||
      (other.timestamp === this.timestamp && other.siteId > this.siteId)
    ) {
      this.value = other.value;
      this.timestamp = other.timestamp;
      this.siteId = other.siteId;
    }
  }

  clone(): LWWRegister<T> {
    return new LWWRegister(this.value, this.siteId, this.timestamp);
  }
}

// ---------------------------------------------------------------------------
// LWWMap — a map of keys to LWWRegister<T>, mergeable as a whole.
// ---------------------------------------------------------------------------

export class LWWMap<T> {
  private registers = new Map<string, LWWRegister<T>>();

  set(key: string, value: T, siteId: string, timestamp: number = Date.now()): void {
    const existing = this.registers.get(key);
    if (existing) {
      existing.set(value, siteId, timestamp);
    } else {
      this.registers.set(key, new LWWRegister(value, siteId, timestamp));
    }
  }

  get(key: string): T | undefined {
    return this.registers.get(key)?.value;
  }

  has(key: string): boolean {
    return this.registers.has(key);
  }

  delete(key: string): void {
    this.registers.delete(key);
  }

  /** Merge another map into this one. Returns the list of keys whose resolved value changed. */
  merge(other: LWWMap<T>): string[] {
    const changedKeys: string[] = [];

    for (const [key, incoming] of other.entries()) {
      const current = this.registers.get(key);
      if (!current) {
        this.registers.set(key, incoming.clone());
        changedKeys.push(key);
        continue;
      }

      const prevValue = current.value;
      const prevTimestamp = current.timestamp;
      const prevSiteId = current.siteId;
      current.merge(incoming);

      if (current.timestamp !== prevTimestamp || current.siteId !== prevSiteId || current.value !== prevValue) {
        changedKeys.push(key);
      }
    }

    return changedKeys;
  }

  entries(): Array<[string, LWWRegister<T>]> {
    return Array.from(this.registers.entries());
  }

  keys(): string[] {
    return Array.from(this.registers.keys());
  }

  get size(): number {
    return this.registers.size;
  }
}
