import { TALENTS_PRIEST } from 'common/TALENTS';
import { Section, GuideProps } from 'interface/guide';
import type CombatLogParser from './CombatLogParser';

export const GUIDE_CORE_EXPLANATION_PERCENT = 30;

export default function Guide({
  modules,
  events,
  info,
}: GuideProps<typeof CombatLogParser>): JSX.Element {
  return (
    <>
      <Section title="Short Cooldowns">
        {info.combatant.hasTalent(TALENTS_PRIEST.POWER_WORD_RADIANCE_TALENT) &&
          modules.powerWordRadiance.guideSubsection}
        {info.combatant.hasTalent(TALENTS_PRIEST.PURGE_THE_WICKED_TALENT) &&
          modules.purgeTheWicked.guideSubsection}
        {info.combatant.hasTalent(TALENTS_PRIEST.BINDING_HEALS_TALENT) &&
          modules.selfAtonementAnalyzer.guideSubsection}
      </Section>
      <Section title="Ramps">
        yapyapyap <br />
        {modules.evangelismAnalysis.guideCastBreakdown}
        {modules.raptureAnalysis.guideCastBreakdown}
        {info.combatant.hasTalent(TALENTS_PRIEST.ULTIMATE_PENITENCE_TALENT) &&
          modules.ultimatePenitenceAnalyis.guideCastBreakdown}
      </Section>
    </>
  );
}
