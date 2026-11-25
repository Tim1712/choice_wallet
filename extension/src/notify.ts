// Who hears "something changed": only the tabs of connected sites (and a site just
// disconnected, so it drops the account it showed). A site that isn't connected hears
// nothing, so it can't watch the user lock, unlock, switch accounts or connect elsewhere.

export type NotifyIo = {
  /** The connected origins (the grants' keys). */
  connected(): Promise<string[]>;
  /** Every tab's ID. */
  tabs(): Promise<number[]>;
  /** The origin of a tab's top frame, as the relay there reports it; null when no relay
   *  answers (a page the wallet doesn't run on). */
  originOf(tab: number): Promise<string | null>;
  /** Send "changed" to a tab's relay, for `origin`: the relay passes it on only if its page
   *  is still there, since the tab may have moved to another site since it answered. */
  tell(tab: number, origin: string): void;
};

export async function notifyConnected(io: NotifyIo, also?: string | readonly string[]): Promise<void> {
  const to = new Set(await io.connected());
  for (const o of typeof also === "string" ? [also] : (also ?? [])) to.add(o);
  if (to.size === 0) return;
  await Promise.all(
    (await io.tabs()).map(async (tab) => {
      const origin = await io.originOf(tab).catch(() => null);
      if (origin !== null && to.has(origin)) io.tell(tab, origin);
    }),
  );
}
