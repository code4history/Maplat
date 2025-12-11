import { normalizeArg as normalizeArg_ } from "@maplat/core/dist/functions";

export function normalizeArg(options: Record<string, any>): Record<string, any> {
  const table: Record<string, string> = {
    state_url: "stateUrl",
    restore_session: "restoreSession",
    enable_share: "enableShare",
    mobile_if: "mobileIF",
    pwa_manifest: "pwaManifest",
    pwa_worker: "pwaWorker",
    pwa_scope: "pwaScope",
    presentation_mode: "presentationMode"
  };
  options = normalizeArg_(options);

  return Object.keys(table).reduce((opt: Record<string, any>, key: string) => {
    if (opt[key] !== undefined) {
      throw new Error(`Invalid Maplat option key: ${key}. Use "${table[key]}" instead.`);
      //opt[table[key]] = opt[key];
      //delete opt[key];
    }
    return opt;
  }, options);
}

export function getUniqueId(prefix: any = 'id_') {
  return prefix + Math.random().toString(36).substr(2, 9);
}
