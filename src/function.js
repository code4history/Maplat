import { normalizeArg as normalizeArg_ } from "@maplat/core/lib/functions";

export function normalizeArg(options) {
  const table = {
    state_url: "stateUrl",
    restore_session: "restoreSession",
    enable_share: "enableShare",
    mobile_if: "mobileIF",
    pwa_manifest: "pwaManifest",
    pwa_worker: "pwaWorker",
    pwa_scope: "pwaScope"
  };
  options = normalizeArg_(options);

  return Object.keys(table).reduce((opt, key) => {
    if (opt[key]) {
      opt[table[key]] = opt[key];
      delete opt[key];
    }
    return opt;
  }, options);
}
