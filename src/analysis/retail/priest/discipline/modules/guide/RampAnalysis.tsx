import SPELLS from 'common/SPELLS';
import { TALENTS_PRIEST } from 'common/TALENTS';
import { SELECTED_PLAYER } from 'parser/core/Analyzer';
import Events, {
  BeginCastEvent,
  BeginChannelEvent,
  CastEvent,
  EndChannelEvent,
  FightEndEvent,
  GlobalCooldownEvent,
} from 'parser/core/Events';
import { Options } from 'parser/core/Module';
import EventHistory from 'parser/shared/modules/EventHistory';
import StatTracker from 'parser/shared/modules/StatTracker';
import GlobalCooldown from '../core/GlobalCooldown';
import Atonement from '../spells/Atonement';
import Evangelism from '../spells/Evangelism';
import Haste from 'parser/shared/modules/Haste';
import { SpellLink } from 'interface';

import './EvangelismAnalysis.scss';
import { ReactNode } from 'react';
import { Talent } from 'common/TALENTS/types';
import MajorCooldown, { CooldownTrigger } from 'parser/core/MajorCooldowns/MajorCooldown';
import { ChecklistUsageInfo, SpellUse } from 'parser/core/SpellUsage/core';
import EmbeddedTimelineContainer, {
  SpellTimeline,
} from 'interface/report/Results/Timeline/EmbeddedTimeline';
import Casts from 'interface/report/Results/Timeline/Casts';
import { QualitativePerformance } from 'parser/ui/QualitativePerformance';
import CooldownUsage from 'parser/core/MajorCooldowns/CooldownUsage';
import CASTS_THAT_ARENT_CASTS from 'parser/core/CASTS_THAT_ARENT_CASTS';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ALLOWED_PRE_RAMP = [
  TALENTS_PRIEST.POWER_WORD_RADIANCE_TALENT.id,
  SPELLS.POWER_WORD_SHIELD.id,
  TALENTS_PRIEST.RENEW_TALENT.id,
  SPELLS.FLASH_HEAL.id,
  TALENTS_PRIEST.RAPTURE_TALENT.id,
  TALENTS_PRIEST.SHADOWFIEND_TALENT.id,
  TALENTS_PRIEST.EVANGELISM_TALENT.id,
  SPELLS.SHADOW_WORD_PAIN.id,
  TALENTS_PRIEST.PURGE_THE_WICKED_TALENT.id,
];

export const PERMITTED_RAMP_STARTERS = [
  SPELLS.SHADOW_WORD_PAIN.id,
  TALENTS_PRIEST.PURGE_THE_WICKED_TALENT.id,
  TALENTS_PRIEST.RENEW_TALENT.id,
  SPELLS.FLASH_HEAL.id,
  TALENTS_PRIEST.RAPTURE_TALENT.id,
  SPELLS.POWER_WORD_SHIELD.id,
];

interface RampTimeline {
  start: number;
  end?: number | null;
  rampEvents: (
    | CastEvent
    | BeginCastEvent
    | GlobalCooldownEvent
    | BeginChannelEvent
    | EndChannelEvent
  )[];
  damageEvents: CastEvent[];
}

interface RampCooldownTimeline extends CooldownTrigger<CastEvent> {
  timeline: RampTimeline;
}

abstract class RampAnalysis extends MajorCooldown<RampCooldownTimeline> {
  static dependencies = {
    ...MajorCooldown.dependencies,
    atonementModule: Atonement,
    eventHistory: EventHistory,
    globalCooldown: GlobalCooldown,
    statTracker: StatTracker,
    evangelism: Evangelism,
    haste: Haste,
  };

  protected eventHistory!: EventHistory;
  protected atonementModule!: Atonement;
  protected globalCooldown!: GlobalCooldown;
  protected statTracker!: StatTracker;
  protected evangelism!: Evangelism;
  protected haste!: Haste;

  cooldown: Talent;

  protected currentRamp: RampCooldownTimeline | null = null;

  protected constructor(cooldown: Talent, options: Options) {
    super({ spell: cooldown }, options);
    this.cooldown = cooldown;

    this.addEventListener(Events.cast.by(SELECTED_PLAYER).spell(cooldown), this.onCooldownCast);
    this.addEventListener(Events.cast.by(SELECTED_PLAYER), this.onCast);
    this.addEventListener(Events.fightend, this.onRampEnd);
  }

  onRampEnd(event: CastEvent | FightEndEvent) {
    if (this.currentRamp) {
      this.currentRamp.timeline.end = event.timestamp;
      this.recordCooldown(this.currentRamp);
      this.currentRamp = null;
    }
  }

  get getRamp() {
    const filters = [
      Events.GlobalCooldown.by(SELECTED_PLAYER),
      Events.cast.by(SELECTED_PLAYER),
      Events.begincast.by(SELECTED_PLAYER),
      Events.BeginChannel.by(SELECTED_PLAYER),
      Events.EndChannel.by(SELECTED_PLAYER),
    ];
    const rampHistory = filters
      .flatMap((filter) => this.eventHistory.last(30, 17000, filter))
      .filter((cast) => !CASTS_THAT_ARENT_CASTS.includes(cast.ability.guid))
      .sort((a, b) => a.timestamp - b.timestamp);
    return rampHistory;
  }

  abstract onCooldownCast(event: CastEvent): void;
  abstract onCast(event: CastEvent): void;

  description(): ReactNode {
    return (
      <>
        <p>
          <strong>
            <SpellLink spell={this.cooldown} />
          </strong>{' '}
        </p>
        is saur good TODO.
      </>
    );
  }

  explainPerformance(cast: RampCooldownTimeline): SpellUse {
    const checklistItems: ChecklistUsageInfo[] = [this.explainSchismPerformance(cast)];

    /*cast.timeline.rampEvents.forEach(cast => {
      if( cast.type === EventType.Cast) highlightInefficientCast(cast, "fart");
    });*/

    console.log(cast);

    const timeline = (
      <div
        style={{
          overflowX: 'scroll',
        }}
      >
        <EmbeddedTimelineContainer
          secondWidth={60}
          secondsShown={(cast.timeline.rampEvents.at(-1)!.timestamp - cast.timeline.start) / 1000}
        >
          <SpellTimeline>
            <Casts start={cast.timeline.start} secondWidth={60} events={cast.timeline.rampEvents} />
          </SpellTimeline>
        </EmbeddedTimelineContainer>
      </div>
    );

    return {
      event: cast.event,
      checklistItems: checklistItems,
      performance: QualitativePerformance.Good,
      performanceExplanation: 'fart',
      extraDetails: timeline,
    };
  }

  private explainSchismPerformance(cast: RampCooldownTimeline) {
    const combinedEvents = [...cast.timeline.damageEvents, ...cast.timeline.rampEvents];
    const mindBlast = combinedEvents.find((event) => event.ability.guid === SPELLS.MIND_BLAST.id);
    const shadowPet = combinedEvents.find(
      (event) => event.ability.guid === TALENTS_PRIEST.VOIDWRAITH_TALENT.id,
    );
    console.log(shadowPet);
    return {
      check: 'schism-casts',
      timestamp: cast.event.timestamp,
      performance: mindBlast ? QualitativePerformance.Perfect : QualitativePerformance.Fail,
      summary: <> FART TODO: </>,
      details: <div>you cast ajdkgja ramp TODO. </div>,
    };
  }

  get guideCastBreakdown() {
    return (
      <>
        <CooldownUsage analyzer={this} hidePotentialMissedCasts title={this.cooldown.name} />
      </>
    );
  }
}

export default RampAnalysis;
