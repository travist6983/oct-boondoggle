// Homepage journey: data record → printed, folded, sealed envelope → text + email fork →
// stamped → delivered to the right mailbox.
import { startMotion, journeyOf } from './runtime.js';
import { heroStage, industriesStage, productionStage, valuesStage, employeeStage, dataStage } from './stages.js';

export function init() {
  startMotion(buildJourney);
}

function buildJourney(ctx, { scrollToY }) {
  const { mobile, vw, containerRight, rail } = ctx;
  const lane = mobile ? rail : vw / 2;
  const right = mobile ? rail : containerRight - 28;
  const photoX = mobile ? rail : containerRight - 120;

  const stages = [
    heroStage(ctx, right),
    industriesStage(ctx, right, lane),
    productionStage(ctx, lane, lane, scrollToY),
    valuesStage(ctx, lane, lane),
    employeeStage(ctx, lane, photoX),
    dataStage(ctx, photoX),
  ];
  const data = stages[stages.length - 1];
  return journeyOf(stages, Math.max(1, data.deliveredY));
}
