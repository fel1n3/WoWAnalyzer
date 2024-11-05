import { TALENTS_PRIEST } from 'common/TALENTS';
import { CastEvent } from 'parser/core/Events';
import { Options } from 'parser/core/Module';
import './EvangelismAnalysis.scss';
import RampAnalysis from 'analysis/retail/priest/discipline/modules/guide/RampAnalysis';
import { ReactNode } from 'react';
import { SpellLink } from 'interface';
import SPELLS from 'common/SPELLS';

class EvangelismAnalysis extends RampAnalysis {
  static dependencies = {
    ...RampAnalysis.dependencies,
  };

  constructor(options: Options) {
    super(TALENTS_PRIEST.EVANGELISM_TALENT, options);
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

  override description(): ReactNode {
    return (
      <>
        Start the <SpellLink spell={TALENTS_PRIEST.EVANGELISM_TALENT} /> ramp by applying{' '}
        <strong> 7-9 </strong> atonements with <SpellLink spell={SPELLS.POWER_WORD_SHIELD} />,{' '}
        <SpellLink spell={TALENTS_PRIEST.RENEW_TALENT} /> or <SpellLink spell={SPELLS.FLASH_HEAL} />
        , then cast <SpellLink spell={TALENTS_PRIEST.POWER_WORD_RADIANCE_TALENT} /> twice.
      </>
    );
  }
}

export default EvangelismAnalysis;
