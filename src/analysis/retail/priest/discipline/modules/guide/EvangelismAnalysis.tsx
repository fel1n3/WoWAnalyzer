import { TALENTS_PRIEST } from 'common/TALENTS';

import { CastEvent } from 'parser/core/Events';
import { Options } from 'parser/core/Module';
import './EvangelismAnalysis.scss';

import RampAnalysis, {
  PERMITTED_RAMP_STARTERS,
} from 'analysis/retail/priest/discipline/modules/guide/RampAnalysis';
class EvangelismAnalysis extends RampAnalysis {
  static dependencies = {
    ...RampAnalysis.dependencies,
  };

  constructor(options: Options) {
    super(TALENTS_PRIEST.EVANGELISM_TALENT, options);
  }

  onCooldownCast(event: CastEvent) {
    const rampHistory = this.getRamp;
    rampHistory.push(event);

    while (
      rampHistory.length > 0 &&
      !PERMITTED_RAMP_STARTERS.includes(rampHistory[0].ability.guid)
    ) {
      rampHistory.shift();
    }

    this.currentRamp ??= {
      event: event,
      timeline: {
        start: rampHistory[0].timestamp,
        rampEvents: rampHistory,
        damageEvents: [],
      },
    };
  }

  onCast(event: CastEvent) {
    if (!this.currentRamp) {
      return;
    }
    //include all events 10s after evangelism as "damage" events
    if (event.timestamp < this.currentRamp.event.timestamp + 10000) {
      this.currentRamp.timeline.damageEvents.push(event);
    } else {
      this.onRampEnd(event);
    }
  }
}

export default EvangelismAnalysis;
