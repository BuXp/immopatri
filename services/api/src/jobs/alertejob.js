import { Collections, logger } from '@immopatri/common';
import { scanAlertes } from '../managers/alertemanager.js';

// Daily compliance scan (DAT Sprint 3, schedule '0 8 * * *').
//
// node-cron is an optional dependency: this job is NOT imported at service
// startup so the API never crashes if the package is absent. To activate the
// daily cron, run `yarn workspace @immopatri/api add node-cron` and call
// startAlerteJob() from src/index.js onStartUp.
export async function runAlerteScanForAllRealms(now = new Date()) {
  const realms = await Collections.Realm.find({}).lean();
  let total = 0;
  for (const realm of realms) {
    const summary = await scanAlertes(realm, now);
    total += summary.detected;
  }
  logger.info(`[alertejob] scan complete — ${total} alerts across ${realms.length} realms`);
  return total;
}

export async function startAlerteJob() {
  let cron;
  try {
    // node-cron is an optional dependency activated on demand.
    // eslint-disable-next-line import/no-unresolved
    cron = (await import('node-cron')).default;
  } catch {
    logger.warn(
      '[alertejob] node-cron not installed — daily compliance scan disabled'
    );
    return null;
  }
  return cron.schedule('0 8 * * *', () => {
    runAlerteScanForAllRealms().catch((err) =>
      logger.error(`[alertejob] ${err?.message || err}`)
    );
  });
}
