import { TALENTS_PRIEST } from 'common/TALENTS';
import { SELECTED_PLAYER } from 'parser/core/Analyzer';
import CASTS_THAT_ARENT_CASTS from 'parser/core/CASTS_THAT_ARENT_CASTS';
import Events, { CastEvent } from 'parser/core/Events';
import { Options } from 'parser/core/Module';
import './EvangelismAnalysis.scss';

import RampAnalysis from 'analysis/retail/priest/discipline/modules/guide/RampAnalysis';

class EvangelismAnalysis extends RampAnalysis {
  static dependencies = {
    ...RampAnalysis.dependencies,
  };

  constructor(options: Options) {
    super(TALENTS_PRIEST.EVANGELISM_TALENT, options);
  }

  // groups all the casts just before you cast evangelism
  buildSequence(event: CastEvent) {
    if (event.ability.guid !== TALENTS_PRIEST.EVANGELISM_TALENT.id) {
      return;
    }
    const rampHistory = this.eventHistory
      .last(30, 17000, Events.cast.by(SELECTED_PLAYER))
      .filter(
        (cast) =>
          !CASTS_THAT_ARENT_CASTS.includes(cast.ability.guid) &&
          this.globalCooldown.isOnGlobalCooldown(cast.ability.guid),
      );
    rampHistory.push(event);

    this.ramps.push({ timestamp: event.timestamp, rampHistory: rampHistory, damageRotation: [] });

    this.cutSequence(rampHistory);
  }

  // gets your spells cast 10s after pressing evangelism.
  fillDpsRotation(event: CastEvent) {
    if (this.ramps.length < 1) {
      return;
    }
    if (event.timestamp < this.currentRamp.timestamp + 10000) {
      this.currentRamp.damageRotation.push(event);
    }
  }
}

export default EvangelismAnalysis;
