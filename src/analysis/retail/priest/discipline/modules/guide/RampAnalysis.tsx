import SPELLS from 'common/SPELLS';
import { TALENTS_PRIEST } from 'common/TALENTS';
import { SELECTED_PLAYER } from 'parser/core/Analyzer';
import Events, {
  BeginCastEvent,
  BeginChannelEvent,
  CastEvent,
  EndChannelEvent,
  Event,
  EventType,
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
import { Highlight } from 'interface/Highlight';
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
import { BadColor, OkColor } from 'interface/guide';
import { SpellLink, TooltipElement } from 'interface';

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
  rampEvents: TimelineEvent[];
  damageEvents: CastEvent[];
}

type TimelineEvent =
  | CastEvent
  | BeginCastEvent
  | GlobalCooldownEvent
  | BeginChannelEvent
  | EndChannelEvent;

interface RampCooldownTimeline extends CooldownTrigger<CastEvent> {
  atonements: number;
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

  onCooldownCast(event: CastEvent) {
    const rampHistory = this.getRamp();
    rampHistory.push(event);

    while (
      rampHistory.length > 0 &&
      !PERMITTED_RAMP_STARTERS.includes(rampHistory[0].ability.guid)
    ) {
      rampHistory.shift();
    }

    this.currentRamp ??= {
      event: event,
      atonements: this.atonementModule.numAtonementsActive,
      timeline: {
        start: rampHistory[0].timestamp,
        rampEvents: rampHistory,
        damageEvents: [],
      },
    };
  }

  onRampEnd(event: CastEvent | FightEndEvent) {
    if (this.currentRamp) {
      this.currentRamp.timeline.end = event.timestamp;
      this.recordCooldown(this.currentRamp);
      this.currentRamp = null;
    }
  }

  private timelineFilter(event: Event<EventType>, maxTime: number): boolean {
    const relevantEventTypes = [
      EventType.Cast,
      EventType.GlobalCooldown,
      EventType.BeginCast,
      EventType.BeginChannel,
      EventType.EndChannel,
    ];

    const isRelevantType = relevantEventTypes.includes(event.type);
    const isByPlayer = this.owner.byPlayer(event);
    const isWithinTime = Boolean(
      event.timestamp && event.timestamp >= this.owner.currentTimestamp - maxTime,
    );

    return isRelevantType && isByPlayer && isWithinTime;
  }

  getRamp(maxTime = 17000): TimelineEvent[] {
    let rampHistory = this.owner.eventHistory.filter((event) =>
      this.timelineFilter(event, maxTime),
    );

    if (30 < rampHistory.length) {
      rampHistory = rampHistory.slice(-30);
    }

    return rampHistory as TimelineEvent[];
  }

  abstract onCast(event: CastEvent): void;

  explainPerformance(cast: RampCooldownTimeline): SpellUse {
    const checklistItems: ChecklistUsageInfo[] = [this.explainSchismPerformance(cast)];

    //const badCastTooltip = (ability: Ability) =>
    //  `Casting a spell like ${ability.name} is not recommended while ramping. Make sure to mostly focus on applying ${TALENTS_PRIEST.ATONEMENT_TALENT.name} when ramping.`;

    console.log(cast);

    const timeline = (
      <div
        style={{
          overflowX: 'auto',
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
    /*const shadowPet = combinedEvents.find(
      (event) => event.ability.guid === TALENTS_PRIEST.VOIDWRAITH_TALENT.id,
    );*/
    return {
      check: 'schism-casts',
      timestamp: cast.event.timestamp,
      performance: mindBlast ? QualitativePerformance.Perfect : QualitativePerformance.Fail,
      summary: <> FART TODO: </>,
      details: <div>you cast ajdkgja ramp TODO. </div>,
    };
  }

  description(): ReactNode {
    return (
      <>
        Apply <strong>7-8</strong> atonements then press <SpellLink spell={this.cooldown} />.
      </>
    );
  }

  get guideCastBreakdown() {
    return (
      <>
        <CooldownUsage
          analyzer={this}
          title={this.cooldown.name}
          hidePotentialMissedCasts
          castBreakdownSmallText={
            <>
              - These boxes represent each ramp, colored by how good the usage was. Missed casts are
              also shown in{' '}
              <TooltipElement content="Used for casts that may have been skipped in order to save for crucial moments.">
                <Highlight color={OkColor} textColor="black">
                  yellow
                </Highlight>
              </TooltipElement>{' '}
              or{' '}
              <TooltipElement content="Used for casts that could have been used without impacting your other usage.">
                <Highlight color={BadColor} textColor="white">
                  red
                </Highlight>
              </TooltipElement>
              .
            </>
          }
        />
      </>
    );
  }
}

export default RampAnalysis;
