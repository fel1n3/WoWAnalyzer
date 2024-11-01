import { TALENTS_PRIEST } from 'common/TALENTS';
import { CastEvent } from 'parser/core/Events';
import { Options } from 'parser/core/Module';
import RampAnalysis from 'analysis/retail/priest/discipline/modules/guide/RampAnalysis';

class RaptureAnalysis extends RampAnalysis {
  static dependencies = {
    ...RampAnalysis.dependencies,
  };

  finishedRamping = false;
  radianceCounter = 0;

  constructor(options: Options) {
    super(TALENTS_PRIEST.RAPTURE_TALENT, options);
  }

  // groups all the casts just before you cast evangelism
  onCooldownCast(event: CastEvent) {
    this.ramps.push({ timestamp: event.timestamp, rampHistory: [], damageRotation: [] });
    this.finishedRamping = false;
    this.radianceCounter = 0;
  }

  // Need to build to the end of the ramp - be it the end of the rapture buff + two radiance casts, or if the buff is ended early by 2 radiances.
  // If the sequence is too short, the damage rotation at the end will be cut by cleanupRamp().

  buildSequence(event: CastEvent) {
    if (this.ramps.length < 1) {
      return;
    }
    if (!this.globalCooldown.isOnGlobalCooldown(event.ability.guid)) {
      return;
    }

    if (
      event.ability.guid === TALENTS_PRIEST.POWER_WORD_RADIANCE_TALENT.id &&
      !this.finishedRamping
    ) {
      this.currentRamp.rampHistory.push(event);
      this.radianceCounter += 1;
      return;
    }

    if (this.radianceCounter > 1) {
      this.finishedRamping = true;
      this.cleanupRamp();
      return;
    }

    if (this.currentRamp.timestamp + 12000 > event.timestamp) {
      this.currentRamp.rampHistory.push(event);
    } else {
      this.finishedRamping = true;
      this.cleanupRamp();
    }
  }

  // gets your spells cast 10s after pressing evangelism.
  fillDpsRotation(event: CastEvent) {
    if (this.ramps.length < 1 || !this.finishedRamping) {
      return;
    }

    const lastRampCast = this.currentRamp.rampHistory[this.currentRamp.rampHistory.length - 1];
    if (event.timestamp < lastRampCast.timestamp + 10000) {
      this.currentRamp.damageRotation.push(event);
    }
  }

  // edits the ramp history array to only include the applicators(or bad damage casts if there are damage casts in between)
  cleanupRamp() {
    let radCasted = false;
    this.currentRamp.rampHistory.forEach((rampCast, ix) => {
      if (rampCast.ability.guid === TALENTS_PRIEST.POWER_WORD_RADIANCE_TALENT.id) {
        radCasted = true;
        return;
      }
      if (radCasted && rampCast.ability.guid !== TALENTS_PRIEST.POWER_WORD_RADIANCE_TALENT.id) {
        this.currentRamp.rampHistory.splice(ix);
      }
    });

    this.cutSequence(this.currentRamp.rampHistory);
  }
}

export default RaptureAnalysis;
