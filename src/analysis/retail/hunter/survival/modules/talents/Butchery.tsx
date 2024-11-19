import { defineMessage } from '@lingui/macro';
import TALENTS from 'common/TALENTS/hunter';
import SPELLS from 'common/SPELLS';
import { SpellLink } from 'interface';
import Analyzer, { Options, SELECTED_PLAYER } from 'parser/core/Analyzer';
import Events, { DamageEvent } from 'parser/core/Events';
import { ThresholdStyle, When } from 'parser/core/ParseResults';
import SpellUsable from 'parser/shared/modules/SpellUsable';
import AverageTargetsHit from 'parser/ui/AverageTargetsHit';
import BoringSpellValueText from 'parser/ui/BoringSpellValueText';
import ItemDamageDone from 'parser/ui/ItemDamageDone';
import Statistic from 'parser/ui/Statistic';
import STATISTIC_ORDER from 'parser/ui/STATISTIC_ORDER';
import STATISTIC_CATEGORY from 'parser/ui/STATISTIC_CATEGORY';

/**
 * Attack all nearby enemies in a flurry of strikes, inflicting Physical damage to each. Deals reduced damage beyond 5 targets.
 *
 * Example log:
 * https://www.warcraftlogs.com/reports/GcyfdwP1XTJrR3h7#fight=15&source=8&type=damage-done&ability=212436
 */

class Butchery extends Analyzer {
  static dependencies = {
    spellUsable: SpellUsable,
  };

  protected spellUsable!: SpellUsable;

  private targetsHit: number = 0;
  private casts: number = 0;
  private damage: number = 0;
  private mercilessDamage: number = 0;

  constructor(options: Options) {
    super(options);

    this.active = this.selectedCombatant.hasTalent(TALENTS.BUTCHERY_TALENT);
    if (!this.active) {
      return;
    }

    this.addEventListener(
      Events.damage.by(SELECTED_PLAYER).spell(TALENTS.BUTCHERY_TALENT),
      this.onDamage,
    );
    this.addEventListener(
      Events.cast.by(SELECTED_PLAYER).spell(TALENTS.BUTCHERY_TALENT),
      this.onCast,
    );
    this.addEventListener(
      Events.damage.by(SELECTED_PLAYER).spell(SPELLS.MERCILESS_BLOW_DAMAGE),
      this.onMercilessDamage,
    );
  }
  // This should be adjusted to monitor if we hit the target at all rather than calculating an average target hit due to the MERB change.
  get avgTargetsHitThreshold() {
    return {
      actual: Number((this.targetsHit / this.casts).toFixed(1)),
      isLessThan: {
        minor: 1,
        average: 1,
        major: 1,
      },
      style: ThresholdStyle.DECIMAL,
    };
  }

  onCast() {
    this.casts += 1;
  }

  onDamage(event: DamageEvent) {
    this.targetsHit += 1;
    this.damage += event.amount + (event.absorbed || 0);
  }

  onMercilessDamage(event: DamageEvent) {
    this.mercilessDamage += event.amount + (event.absorbed || 0);
  }

  suggestions(when: When) {
    when(this.avgTargetsHitThreshold).addSuggestion(
      (suggest, actual, recommended) =>
        suggest(
          <>
            You should aim to hit the target with <SpellLink spell={TALENTS.BUTCHERY_TALENT} />.
            Butchery does not require you to be in range to cast and so it can miss.
          </>,
        )
          .icon(TALENTS.BUTCHERY_TALENT.icon)
          .actual(
            defineMessage({
              id: 'hunter.survival.suggestions.butcheryCarve.averageTargets',
              message: `${actual} average targets hit per cast`,
            }),
          )
          .recommended('Not missing the target is recommended'), //`>=${recommended} is recommended`),
    );
  }

  statistic() {
    return (
      <Statistic
        position={STATISTIC_ORDER.CORE(3)}
        category={STATISTIC_CATEGORY.TALENTS}
        size="flexible"
      >
        <BoringSpellValueText spell={TALENTS.BUTCHERY_TALENT}>
          <ItemDamageDone amount={this.damage} />
          <br />
          <AverageTargetsHit casts={this.casts} hits={this.targetsHit} />
        </BoringSpellValueText>

        <BoringSpellValueText spell={TALENTS.MERCILESS_BLOW_TALENT}>
          <ItemDamageDone amount={this.mercilessDamage} />
        </BoringSpellValueText>
      </Statistic>
    );
  }
}

export default Butchery;
