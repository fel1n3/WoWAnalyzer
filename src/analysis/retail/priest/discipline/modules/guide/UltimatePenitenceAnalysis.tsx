import { TALENTS_PRIEST } from 'common/TALENTS';
import { CastEvent } from 'parser/core/Events';
import { Options } from 'parser/core/Module';
import './EvangelismAnalysis.scss';
import RampAnalysis from 'analysis/retail/priest/discipline/modules/guide/RampAnalysis';
import { ReactNode } from 'react';
import { SpellLink } from 'interface';
import SPELLS from 'common/SPELLS';

class UltimatePenitenceAnalysis extends RampAnalysis {
  static dependencies = {
    ...RampAnalysis.dependencies,
  };

  constructor(options: Options) {
    super(TALENTS_PRIEST.ULTIMATE_PENITENCE_TALENT, options);
  }

  override onCooldownCast(event: CastEvent) {
    super.onCooldownCast(event);
    //event linker find related event uppies begincast & push
    this.onRampEnd(event);
  }

  onCast(event: CastEvent) {}

  override description(): ReactNode {
    return (
      <>
        Start the <SpellLink spell={TALENTS_PRIEST.ULTIMATE_PENITENCE_TALENT} /> ramp by applying{' '}
        <strong> 5 </strong> atonements with <SpellLink spell={SPELLS.POWER_WORD_SHIELD} />,{' '}
        <SpellLink spell={TALENTS_PRIEST.RENEW_TALENT} /> or <SpellLink spell={SPELLS.FLASH_HEAL} />
        , then cast <SpellLink spell={TALENTS_PRIEST.POWER_WORD_RADIANCE_TALENT} />.
      </>
    );
  }
}

export default UltimatePenitenceAnalysis;
