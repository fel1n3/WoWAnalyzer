import { TALENTS_PRIEST } from 'common/TALENTS';
import { CastEvent } from 'parser/core/Events';
import { Options } from 'parser/core/Module';
import RampAnalysis from 'analysis/retail/priest/discipline/modules/guide/RampAnalysis';

class RaptureAnalysis extends RampAnalysis {
  static dependencies = {
    ...RampAnalysis.dependencies,
  };

  private _radianceCount: number = 0;
  private _finishedRamping: boolean = false;

  constructor(options: Options) {
    super(TALENTS_PRIEST.RAPTURE_TALENT, options);
  }

  //on rapture cast (start of ramp)
  onCooldownCast(event: CastEvent): void {
    this.currentRamp ??= {
      event: event,
      timeline: {
        start: event.timestamp,
        rampEvents: [],
        damageEvents: [],
      },
    };
    this._radianceCount = 0;
    this._finishedRamping = false;
  }

  onCast(event: CastEvent): void {
    if (!this.currentRamp) {
      return;
    }

    this.constructRamp(event);

    if (this._finishedRamping) {
      if (event.timestamp < this.currentRamp.timeline.rampEvents.at(-1)!.timestamp + 10000) {
        this.currentRamp.timeline.damageEvents.push(event);
      } else {
        this.onRampEnd(event);
      }
    }
  }

  private constructRamp(event: CastEvent) {
    //everything after rapture >> find point before 2x radiance >> rampevents
    if (event.ability.guid === TALENTS_PRIEST.POWER_WORD_RADIANCE_TALENT.id) {
      if (this._radianceCount < 1) {
        this._radianceCount += 1;
        return;
      }
      console.log(event);
      const rampHistory = this.getRamp;
      rampHistory.push(event);

      this.currentRamp!.timeline.rampEvents = rampHistory;
      this._finishedRamping = true;
    }
  }
}

export default RaptureAnalysis;
