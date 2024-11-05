import { TALENTS_PRIEST } from 'common/TALENTS';
import { CastEvent } from 'parser/core/Events';
import { Options } from 'parser/core/Module';
import RampAnalysis from 'analysis/retail/priest/discipline/modules/guide/RampAnalysis';
import { ReactNode } from 'react';
import { SpellLink } from 'interface';
import SPELLS from 'common/SPELLS';

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
  override onCooldownCast(event: CastEvent): void {
    this.currentRamp ??= {
      event: event,
      atonements: 0,
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
      const lastRampEvent = this.currentRamp.timeline.rampEvents.at(-1)!.timestamp;

      if (event.timestamp < lastRampEvent + 10000) {
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
      this.currentRamp!.atonements = this.atonementModule.numAtonementsActive;
      const rampHistory = this.getRamp(event.timestamp - this.currentRamp!.event.timestamp);
      rampHistory.push(event);

      this.currentRamp!.timeline.rampEvents = rampHistory;
      this._finishedRamping = true;
    }
  }

  override description(): ReactNode {
    return (
      <>
        Start the <SpellLink spell={TALENTS_PRIEST.RAPTURE_TALENT} /> ramp by using the free{' '}
        <SpellLink icon={false} spell={SPELLS.POWER_WORD_SHIELD} /> casts, then build up{' '}
        <strong>7-9</strong> atonements with <SpellLink spell={TALENTS_PRIEST.RENEW_TALENT} /> or{' '}
        <SpellLink spell={SPELLS.FLASH_HEAL} />, and finish with two{' '}
        <SpellLink spell={TALENTS_PRIEST.POWER_WORD_RADIANCE_TALENT} /> casts.
      </>
    );
  }
}

export default RaptureAnalysis;
