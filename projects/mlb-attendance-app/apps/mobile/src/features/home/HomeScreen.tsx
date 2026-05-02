import { useMemo } from "react";
import { ScrollView, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { calculatePersonalStats } from "@mlb-attendance/domain";
import { EmptyState } from "../../components/common/EmptyState";
import { HeroCard } from "../../components/common/HeroCard";
import { InsightCard } from "../../components/common/InsightCard";
import { MetricCard } from "../../components/common/MetricCard";
import { Screen } from "../../components/common/Screen";
import { PlaceholderPanel } from "../../components/common/PlaceholderPanel";
import { PrimaryButton } from "../../components/common/PrimaryButton";
import { SectionCard } from "../../components/common/SectionCard";
import { StatusPill } from "../../components/common/StatusPill";
import { useAppData } from "../../providers/AppDataProvider";
import { useResponsiveLayout } from "../../styles/responsive";
import { colors, radii, shadows, spacing } from "../../styles/tokens";
import { formatGameLabel } from "../../lib/formatters";

const SCORE_RULES = {
  game: 10,
  stadium: 40,
  homeRun: 3,
  extraInnings: 15,
  walkOff: 20,
  uniqueTeam: 5
} as const;

function getNextMilestone(totalGamesAttended: number) {
  const milestones = [1, 5, 10, 20, 30, 50];
  const nextTarget = milestones.find((milestone) => milestone > totalGamesAttended);

  if (!nextTarget) {
    return null;
  }

  return {
    target: nextTarget,
    remaining: nextTarget - totalGamesAttended
  };
}

const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const easternDayFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  timeZone: "America/New_York"
});
const levelThresholds = [
  { title: "Rookie Scorer", points: 0 },
  { title: "Bleacher Regular", points: 100 },
  { title: "Series Tracker", points: 250 },
  { title: "Road Tripper", points: 450 },
  { title: "Stadium Hunter", points: 700 },
  { title: "Homer Historian", points: 1000 },
  { title: "Pennant Chaser", points: 1400 },
  { title: "Ledger Legend", points: 1900 }
];

function getWeekStart(input: string) {
  const parsed = new Date(`${input}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  const day = parsed.getUTCDay();
  const diffToMonday = (day + 6) % 7;
  parsed.setUTCDate(parsed.getUTCDate() - diffToMonday);
  parsed.setUTCHours(0, 0, 0, 0);
  return parsed;
}

function getAttendanceWeekStreak(logs: Array<{ attendedOn: string }>) {
  const uniqueWeeks = [...new Set(logs.map((log) => getWeekStart(log.attendedOn)?.toISOString().slice(0, 10)).filter(Boolean))].sort();
  if (!uniqueWeeks.length) {
    return {
      currentWeeks: 0,
      bestWeeks: 0
    };
  }

  let bestWeeks = 1;
  let runningWeeks = 1;

  for (let index = 1; index < uniqueWeeks.length; index += 1) {
    const previous = new Date(`${uniqueWeeks[index - 1]}T00:00:00Z`);
    const current = new Date(`${uniqueWeeks[index]}T00:00:00Z`);
    const diffDays = Math.round((current.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 7) {
      runningWeeks += 1;
      bestWeeks = Math.max(bestWeeks, runningWeeks);
    } else {
      runningWeeks = 1;
    }
  }

  let currentWeeks = 1;
  for (let index = uniqueWeeks.length - 1; index > 0; index -= 1) {
    const previous = new Date(`${uniqueWeeks[index - 1]}T00:00:00Z`);
    const current = new Date(`${uniqueWeeks[index]}T00:00:00Z`);
    const diffDays = Math.round((current.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 7) {
      currentWeeks += 1;
      continue;
    }

    break;
  }

  return {
    currentWeeks,
    bestWeeks
  };
}

function getStreakBonus(bestWeeks: number) {
  if (bestWeeks >= 10) {
    return 60;
  }
  if (bestWeeks >= 6) {
    return 30;
  }
  if (bestWeeks >= 3) {
    return 15;
  }

  return 0;
}

function getNextAction(params: {
  hasLogs: boolean;
  favoriteTeamId?: string;
  persistenceStatus: "idle" | "loading" | "saving" | "saved" | "error";
}) {
  const { hasLogs, favoriteTeamId, persistenceStatus } = params;

  if (persistenceStatus === "error") {
    return {
      label: "Retry Storage",
      route: null as string | null,
      summary: "Storage needs attention before the ledger feels safe."
    };
  }

  if (!hasLogs) {
    return {
      label: "Log First Game",
      route: "/(tabs)/log-game",
      summary: "Your first save unlocks stats, progress, and a real home dashboard."
    };
  }

  if (!favoriteTeamId) {
    return {
      label: "Set Favorite Team",
      route: "/(tabs)/profile",
      summary: "Favorite-team splits and cleaner comparisons unlock once this is set."
    };
  }

  return {
    label: "Backfill Another Game",
    route: "/(tabs)/log-game",
    summary: "The fastest way to deepen the ledger now is to add another attended game."
  };
}

function getTopInsights(stats: ReturnType<typeof calculatePersonalStats>, favoriteTeamName?: string) {
  return [
    {
      label: "Current pace",
      value: `${stats.totalGamesAttended} games and ${stats.uniqueStadiumsVisited} stadiums`,
      detail: favoriteTeamName
        ? `${favoriteTeamName} shows up in ${stats.favoriteTeamSplit?.gamesAttended ?? 0} of them.`
        : "Set a favorite team to unlock cleaner record splits."
    },
    {
      label: "Best hitter seen",
      value: stats.playerBattingSummaries[0]
        ? `${stats.playerBattingSummaries[0].playerName}`
        : "Still building",
      detail: stats.playerBattingSummaries[0]
        ? `${stats.playerBattingSummaries[0].homeRunsSeen} HR seen • ${stats.playerBattingSummaries[0].hitsSeen} hits`
        : "Player insights turn on as your logged games deepen."
    },
    {
      label: "Pitching trail",
      value: stats.playerPitchingSummaries[0]
        ? `${stats.playerPitchingSummaries[0].pitcherName}`
        : "Still building",
      detail: stats.playerPitchingSummaries[0]
        ? `${stats.playerPitchingSummaries[0].strikeoutsSeen} K seen • ${stats.uniquePitchersSeen} unique pitchers`
        : "Pitcher summaries appear as soon as box-score data is attached."
    }
  ];
}

function buildLevelProgress(params: {
  stats: ReturnType<typeof calculatePersonalStats>;
  attendedGames: Array<{ innings?: number; walkOff?: boolean }>;
  attendanceLogs: Array<{ attendedOn: string }>;
}) {
  const { stats, attendedGames, attendanceLogs } = params;
  const extraInningsGames = attendedGames.filter((game) => (game.innings ?? 0) > 9).length;
  const walkOffGames = attendedGames.filter((game) => Boolean(game.walkOff)).length;
  const uniqueTeamsSeen = stats.teamSeenSummaries.length;
  const streaks = getAttendanceWeekStreak(attendanceLogs);
  const streakBonus = getStreakBonus(streaks.bestWeeks);
  const counts = {
    games: stats.totalGamesAttended,
    stadiums: stats.uniqueStadiumsVisited,
    homeRuns: stats.witnessedHomeRuns,
    extraInnings: extraInningsGames,
    walkOffs: walkOffGames,
    uniqueTeams: uniqueTeamsSeen,
    bestStreakWeeks: streaks.bestWeeks
  };
  const pointBreakdown = {
    games: counts.games * SCORE_RULES.game,
    stadiums: counts.stadiums * SCORE_RULES.stadium,
    homeRuns: counts.homeRuns * SCORE_RULES.homeRun,
    extraInnings: counts.extraInnings * SCORE_RULES.extraInnings,
    walkOffs: counts.walkOffs * SCORE_RULES.walkOff,
    uniqueTeams: counts.uniqueTeams * SCORE_RULES.uniqueTeam,
    streakBonus
  };
  const points = Object.values(pointBreakdown).reduce((total, value) => total + value, 0);
  const currentLevel = [...levelThresholds].reverse().find((level) => points >= level.points) ?? levelThresholds[0];
  const nextLevel = levelThresholds.find((level) => level.points > points) ?? null;
  const floor = currentLevel.points;
  const ceiling = nextLevel?.points ?? floor + 300;
  const progress = ceiling === floor ? 1 : Math.min(1, Math.max(0, (points - floor) / (ceiling - floor)));

  return {
    points,
    currentLevel,
    nextLevel,
    progress,
    counts,
    pointBreakdown,
    streaks
  };
}

function buildAttendancePattern(games: Array<{ startDateTime?: string }>) {
  const patternBuckets = [
    { key: "day", label: "1-4 PM", sortValue: 13 },
    { key: "late", label: "4-7 PM", sortValue: 16 },
    { key: "night", label: "7-10 PM", sortValue: 19 }
  ] as const;
  type PatternBucketKey = (typeof patternBuckets)[number]["key"];
  const patternMap = new Map(
    patternBuckets.map((bucket) => [
      bucket.key,
      {
        label: bucket.label,
        sortValue: bucket.sortValue,
        counts: dayLabels.map(() => 0)
      }
    ])
  );

  games.forEach((game) => {
    if (!game.startDateTime) {
      return;
    }

    const parsed = new Date(game.startDateTime);
    if (Number.isNaN(parsed.getTime())) {
      return;
    }

    const dayLabel = easternDayFormatter.format(parsed);
    const dayIndex = dayLabels.indexOf(dayLabel);
    const easternHour = Number(
      new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        hour12: false,
        timeZone: "America/New_York"
      }).format(parsed)
    );

    if (dayIndex >= 0) {
      let bucketKey: PatternBucketKey = "night";

      if (easternHour < 16) {
        bucketKey = "day";
      } else if (easternHour < 19) {
        bucketKey = "late";
      }

      const existing = patternMap.get(bucketKey);
      if (existing) {
        existing.counts[dayIndex] += 1;
      }
    }
  });

  return [...patternMap.values()]
    .filter((bucket) => bucket.counts.some((count) => count > 0))
    .sort((left, right) => left.sortValue - right.sortValue);
}

function getPatternColor(count: number, maxCount: number) {
  if (!count || !maxCount) {
    return colors.slate050;
  }

  const ratio = count / maxCount;
  if (ratio >= 0.75) {
    return colors.navy;
  }
  if (ratio >= 0.4) {
    return colors.sky;
  }
  return colors.slate200;
}

function buildGameNotes(game: { walkOff?: boolean; innings?: number; featuredPlayerHomeRun?: string | null }) {
  const notes = [];

  if (game.walkOff) {
    notes.push("Walk-off");
  }
  if (game.innings && game.innings > 9) {
    notes.push(`${game.innings} innings`);
  }
  if (game.featuredPlayerHomeRun) {
    notes.push(`${game.featuredPlayerHomeRun} HR`);
  }

  return notes;
}

export function HomeScreen() {
  const router = useRouter();
  const responsive = useResponsiveLayout();
  const {
    attendanceLogs,
    friends,
    pendingFollowRequests,
    games,
    teams,
    venues,
    stats,
    profile,
    persistenceStatus,
    persistenceError,
    isHydrated,
    retryHydration,
    unfollowUser
  } = useAppData();
  const isWide = responsive.isWideDesktop;
  const shouldStackHeroRail = responsive.isNarrow;
  const teamsById = useMemo(() => new Map(teams.map((team) => [team.id, team])), [teams]);
  const venuesById = useMemo(() => new Map(venues.map((venue) => [venue.id, venue])), [venues]);
  const gamesById = useMemo(() => new Map(games.map((game) => [game.id, game])), [games]);
  const latestLog = attendanceLogs[0];
  const latestGame = latestLog ? gamesById.get(latestLog.gameId) : undefined;
  const latestGameLabel = latestGame ? formatGameLabel(latestGame, teamsById, venuesById) : undefined;
  const favoriteTeam = teams.find((team) => team.id === profile.favoriteTeamId);
  const hasLogs = attendanceLogs.length > 0;
  const nextMilestone = getNextMilestone(stats.totalGamesAttended);
  const nextAction = getNextAction({
    hasLogs,
    favoriteTeamId: profile.favoriteTeamId,
    persistenceStatus
  });
  const attendedGames = useMemo(
    () => attendanceLogs.map((log) => gamesById.get(log.gameId)).filter((game): game is NonNullable<typeof game> => Boolean(game)),
    [attendanceLogs, gamesById]
  );
  const levelProgress = useMemo(
    () =>
      buildLevelProgress({
        stats,
        attendedGames,
        attendanceLogs
      }),
    [attendanceLogs, attendedGames, stats]
  );
  const attendancePattern = useMemo(() => buildAttendancePattern(attendedGames), [attendedGames]);
  const maxPatternCount = Math.max(0, ...attendancePattern.flatMap((bucket) => bucket.counts));
  const hasTimedGames = attendedGames.some((game) => Boolean(game.startDateTime));
  const topTeams = useMemo(
    () => [...stats.teamSeenSummaries].sort((left, right) => right.gamesSeen - left.gamesSeen).slice(0, 6),
    [stats.teamSeenSummaries]
  );
  const followingPreview = friends.slice(0, 3);
  const topInsights = useMemo(() => getTopInsights(stats, favoriteTeam?.name), [favoriteTeam?.name, stats]);
  const favoriteRecord = stats.favoriteTeamSplit
    ? `${stats.favoriteTeamSplit.wins}-${stats.favoriteTeamSplit.losses}`
    : `${stats.wins}-${stats.losses}`;
  const heroStatusLabel =
    persistenceStatus === "error"
      ? "Sync needs attention"
      : persistenceStatus === "saving"
        ? "Saving changes"
        : persistenceStatus === "saved"
          ? "Ledger saved"
          : "Ready for the next game";
  const heroStatusTone =
    persistenceStatus === "error"
      ? "danger"
      : persistenceStatus === "saving"
        ? "warning"
        : "success";

  return (
    <Screen title="Home" subtitle="Your MLB ledger, latest memories, and the next best move.">
      <HeroCard>
        {isHydrated ? (
          <View style={styles.heroStack}>
            <View style={[styles.heroTopRow, !shouldStackHeroRail ? styles.heroTopRowWide : null]}>
              <View style={styles.heroLead}>
                <StatusPill label="Your MLB Ledger" tone="dark" />
                <Text style={styles.heroName}>{profile.displayName}</Text>
                <Text style={[styles.heroTitle, responsive.isCompact ? styles.heroTitleCompact : null]}>
                  {hasLogs ? levelProgress.currentLevel.title : "Build your fan record"}
                </Text>
                <Text style={styles.heroBody}>
                  {hasLogs
                    ? `${stats.totalGamesAttended} games, ${stats.uniqueStadiumsVisited} stadiums, and ${stats.witnessedHomeRuns} home runs seen in person.`
                    : "Start with one attended game and this turns into your personal baseball command center."}
                </Text>
                <View style={styles.heroActions}>
                  {nextAction.route ? (
                    <PrimaryButton label="Log a Game" onPress={() => router.push("/(tabs)/log-game")} />
                  ) : (
                    <PrimaryButton label="Retry Storage" onPress={retryHydration} />
                  )}
                  <PrimaryButton label="View History" variant="secondary" onPress={() => router.push("/(tabs)/history")} />
                </View>
              </View>

              <View style={styles.heroRail}>
                <View style={styles.heroRailCard}>
                  <Text style={styles.heroRailLabel}>Current level</Text>
                  <Text style={styles.heroRailValue}>{hasLogs ? `${levelProgress.points} pts` : "0 pts"}</Text>
                  <Text style={styles.heroRailMeta}>
                    {levelProgress.nextLevel
                      ? `${levelProgress.nextLevel.points - levelProgress.points} to ${levelProgress.nextLevel.title}`
                      : "Top level reached"}
                  </Text>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${levelProgress.progress * 100}%` }]} />
                  </View>
                </View>
                <View style={styles.heroRailCard}>
                  <Text style={styles.heroRailLabel}>Next best action</Text>
                  <Text style={styles.heroRailBody}>{nextAction.summary}</Text>
                  <StatusPill label={heroStatusLabel} tone={heroStatusTone} />
                </View>
              </View>
            </View>

            <View style={[styles.metricGrid, responsive.isCompact ? styles.metricGridCompact : null]}>
              <MetricCard label="Games" value={String(stats.totalGamesAttended)} inverse />
              <MetricCard
                label={favoriteTeam?.name ? `${favoriteTeam.abbreviation} Record` : "Record"}
                value={favoriteRecord}
                meta={favoriteTeam ? "Favorite-team split" : "All logged games"}
                inverse
              />
              <MetricCard label="Stadiums" value={String(stats.uniqueStadiumsVisited)} inverse />
            </View>

            {persistenceError ? <Text style={styles.heroError}>{persistenceError}</Text> : null}
          </View>
        ) : (
          <Text style={styles.heroLoading}>Loading your ledger...</Text>
        )}
      </HeroCard>

      {!hasLogs ? (
        <EmptyState
          eyebrow="First game"
          title="Log your first MLB game"
          body="The first save unlocks your home dashboard, personal stats, and the game-by-game memory trail that makes the product feel like your own baseball ledger."
          action={<PrimaryButton label="Log First Game" onPress={() => router.push("/(tabs)/log-game")} />}
        />
      ) : null}

      <View style={[styles.grid, isWide ? styles.gridWide : null]}>
        <View style={styles.mainColumn}>
          <SectionCard title="Top personal insights" subtitle="The fastest read on your baseball identity right now.">
            {hasLogs ? (
              <View style={styles.summaryCardGrid}>
                {topInsights.map((insight) => (
                  <InsightCard key={insight.label} eyebrow={insight.label} title={insight.value} body={insight.detail} />
                ))}
              </View>
            ) : (
              <PlaceholderPanel
                title="Your first game starts the story"
                body="Once one attended game is in the ledger, this section becomes the fastest read on your baseball record."
                actionLabel="Log First Game"
                onAction={() => router.push("/(tabs)/log-game")}
              />
            )}
          </SectionCard>

          <SectionCard title="Latest logged game" subtitle="Your newest memory and its box-score context.">
            {latestGame && latestGameLabel ? (
              <View style={styles.featuredGameCard}>
                <View style={styles.featuredGameCopy}>
                  <Text style={styles.primaryText}>{latestGameLabel.title}</Text>
                  <Text style={styles.secondaryText}>{latestGameLabel.subtitle}</Text>
                  <Text style={styles.scoreText}>Final {latestGameLabel.score}</Text>
                </View>
                <View style={styles.tagRow}>
                  {buildGameNotes(latestGame).map((note) => (
                    <StatusPill key={note} label={note} tone="info" />
                  ))}
                </View>
                {latestLog.memorableMoment ? <Text style={styles.noteText}>{latestLog.memorableMoment}</Text> : null}
                <Text style={styles.secondaryText}>
                  {stats.playerBattingSummaries[0]
                    ? `Top hitter seen so far: ${stats.playerBattingSummaries[0].playerName}.`
                    : "Player summaries are still building as more games gain complete box-score coverage."}
                </Text>
                <View style={styles.inlineActions}>
                  <PrimaryButton label="Open Game Page" onPress={() => router.push((`/logged-game/${latestLog.id}`) as never)} />
                  <PrimaryButton label="View Stats" variant="secondary" onPress={() => router.push("/(tabs)/stats")} />
                </View>
              </View>
            ) : (
              <PlaceholderPanel
                title="Your first game belongs here"
                body="Search for the matchup you attended, save it once, and this becomes the latest chapter in your baseball ledger."
                actionLabel="Pick First Game"
                onAction={() => router.push("/(tabs)/log-game")}
              />
            )}
          </SectionCard>

          <SectionCard title="Progress and milestones" subtitle="Where your ledger is headed next.">
            <View style={styles.progressGrid}>
              <InsightCard
                eyebrow="Milestone"
                title={
                  nextMilestone
                    ? `${nextMilestone.remaining} more ${nextMilestone.remaining === 1 ? "game" : "games"}`
                    : "Milestone ladder cleared"
                }
                body={
                  nextMilestone
                    ? `You are closing in on ${nextMilestone.target} logged games.`
                    : "Keep stacking games and stadiums while the next beta levels take shape."
                }
              />
              <InsightCard
                eyebrow="Level scoring"
                title={`${levelProgress.counts.games} games • ${levelProgress.counts.stadiums} stadiums`}
                body={`HR seen ${levelProgress.counts.homeRuns} • Walk-offs ${levelProgress.counts.walkOffs} • Extra innings ${levelProgress.counts.extraInnings} • Best streak ${levelProgress.counts.bestStreakWeeks} weeks`}
              />
            </View>
          </SectionCard>

          <SectionCard title="When you go" subtitle="Your game-window heat map in Eastern Time.">
            {hasTimedGames ? (
              <ScrollView horizontal={responsive.isCompact} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.patternScrollContent}>
                <View style={[styles.patternWrap, responsive.isCompact ? styles.patternWrapCompact : null]}>
                <View style={styles.patternHeader}>
                  <Text style={[styles.patternHeaderText, styles.patternLabelCol]}>Time</Text>
                  {dayLabels.map((day) => (
                    <Text key={day} style={styles.patternHeaderText}>{day}</Text>
                  ))}
                </View>
                {attendancePattern.map((bucket) => (
                  <View key={bucket.label} style={styles.patternRow}>
                    <Text style={[styles.patternRowLabel, styles.patternLabelCol]}>{bucket.label}</Text>
                    {bucket.counts.map((count, index) => {
                      const backgroundColor = getPatternColor(count, maxPatternCount);
                      return (
                        <View key={`${bucket.label}_${dayLabels[index]}`} style={[styles.patternCell, { backgroundColor }]}>
                          <Text style={[styles.patternCellText, backgroundColor === colors.navy ? styles.patternCellTextInverse : null]}>
                            {count || ""}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                ))}
                </View>
              </ScrollView>
            ) : (
              <PlaceholderPanel
                title="No first-pitch pattern yet"
                body="This view turns on as the logged-game set fills in start times."
              />
            )}
          </SectionCard>
        </View>

        <View style={styles.sideColumn}>
          <SectionCard title="Top teams seen" subtitle="The clubs most attached to your ledger.">
            {topTeams.length ? (
              <View style={styles.teamSummaryStack}>
                {topTeams.map((team) => (
                  <View key={team.teamId} style={[styles.teamSummaryCard, responsive.isCompact ? styles.teamSummaryCardCompact : null]}>
                    <View style={[styles.teamSummaryHeader, responsive.isCompact ? styles.teamSummaryHeaderCompact : null]}>
                      <Text style={styles.teamSummaryName}>{team.teamName}</Text>
                      <StatusPill label={`${team.gamesSeen} games`} tone="default" />
                    </View>
                    <Text style={styles.teamSummaryMeta}>
                      {team.winsSeen}-{team.lossesSeen} attended record • {team.runsSeen} runs seen • {team.hitsSeen} hits seen
                    </Text>
                  </View>
                ))}
                <PrimaryButton label="Open Full Stats" variant="secondary" onPress={() => router.push("/(tabs)/stats")} />
              </View>
            ) : (
              <PlaceholderPanel
                title="No team splits yet"
                body="Once you log games, this becomes the visual club summary of your baseball trail."
              />
            )}
          </SectionCard>

          <SectionCard title="Following" subtitle="Secondary for now until the shared profile graph deepens.">
            {followingPreview.length ? (
              <View style={styles.socialStack}>
                {followingPreview.map((friend) => {
                  const favoriteFollowedTeam = teams.find((team) => team.id === friend.favoriteTeamId);

                  return (
                    <View key={friend.id} style={styles.friendRow}>
                      <Pressable style={styles.friendCopy} onPress={() => router.push((`/friends/${friend.id}`) as never)}>
                        <Text style={styles.friendName}>{friend.displayName}</Text>
                        <Text style={styles.secondaryText}>
                          {friend.username ? `@${friend.username}` : "App fan"} • {favoriteFollowedTeam?.name ?? "No favorite team"}
                        </Text>
                        <Text style={styles.secondaryText}>
                          {friend.sharedGamesLogged ?? 0} games shared • {friend.sharedStadiumsVisited ?? 0} stadiums shared
                        </Text>
                      </Pressable>
                      <View style={styles.inlineActions}>
                        <PrimaryButton label="View" variant="secondary" onPress={() => router.push((`/friends/${friend.id}`) as never)} />
                        <PrimaryButton label="Unfollow" variant="ghost" onPress={() => void unfollowUser(friend.id)} />
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.secondaryText}>No accepted follows yet. Profile is the place to find people and manage requests.</Text>
            )}
          </SectionCard>

          <SectionCard title="Requests" subtitle="What is waiting for action right now.">
            {pendingFollowRequests.length ? (
              pendingFollowRequests.map((request) => (
                <View key={request.id} style={styles.friendRow}>
                  <View style={styles.friendCopy}>
                    <Text style={styles.friendName}>{request.profile.displayName}</Text>
                    <Text style={styles.secondaryText}>
                      {request.direction === "incoming" ? "Wants to follow you" : "Request already sent"}
                    </Text>
                  </View>
                  <PrimaryButton label="Profile" variant="secondary" onPress={() => router.push((`/friends/${request.profile.id}`) as never)} />
                </View>
              ))
            ) : (
              <Text style={styles.secondaryText}>No requests are waiting right now.</Text>
            )}
          </SectionCard>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: spacing.lg
  },
  gridWide: {
    flexDirection: "row",
    alignItems: "flex-start"
  },
  mainColumn: {
    flex: 1.15,
    gap: spacing.lg
  },
  sideColumn: {
    flex: 0.85,
    gap: spacing.lg
  },
  heroStack: {
    gap: spacing.lg
  },
  heroTopRow: {
    gap: spacing.lg
  },
  heroTopRowWide: {
    flexDirection: "row",
    alignItems: "stretch"
  },
  heroLead: {
    flex: 1.25,
    gap: spacing.sm
  },
  heroName: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.warning
  },
  heroTitle: {
    fontSize: 36,
    lineHeight: 40,
    fontWeight: "900",
    color: colors.textInverse
  },
  heroTitleCompact: {
    fontSize: 28,
    lineHeight: 32
  },
  heroBody: {
    fontSize: 16,
    lineHeight: 24,
    color: "rgba(255,253,248,0.82)",
    maxWidth: 680
  },
  heroActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  heroRail: {
    flex: 0.8,
    gap: spacing.md
  },
  heroRailCard: {
    backgroundColor: "rgba(255,253,248,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,253,248,0.1)",
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.sm
  },
  heroRailLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    color: "rgba(255,253,248,0.62)",
    fontWeight: "800"
  },
  heroRailValue: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "900",
    color: colors.textInverse
  },
  heroRailMeta: {
    fontSize: 14,
    lineHeight: 20,
    color: "rgba(255,253,248,0.7)"
  },
  heroRailBody: {
    fontSize: 14,
    lineHeight: 20,
    color: "rgba(255,253,248,0.7)"
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  metricGridCompact: {
    gap: spacing.sm
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,253,248,0.16)",
    overflow: "hidden"
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: colors.warning
  },
  heroLoading: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.textInverse
  },
  heroError: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.warning
  },
  summaryCardGrid: {
    gap: spacing.md
  },
  featuredGameCard: {
    gap: spacing.md
  },
  featuredGameCopy: {
    gap: spacing.xs
  },
  primaryText: {
    fontSize: 20,
    lineHeight: 25,
    color: colors.text,
    fontWeight: "900"
  },
  secondaryText: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.textMuted
  },
  scoreText: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "800",
    color: colors.primary
  },
  noteText: {
    fontSize: 15,
    lineHeight: 23,
    color: colors.text,
    fontStyle: "italic"
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs
  },
  inlineActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  progressGrid: {
    gap: spacing.md
  },
  teamSummaryStack: {
    gap: spacing.md
  },
  teamSummaryCard: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.xs,
    ...shadows.subtle
  },
  teamSummaryCardCompact: {
    padding: spacing.md
  },
  teamSummaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm
  },
  teamSummaryHeaderCompact: {
    alignItems: "flex-start"
  },
  teamSummaryName: {
    flex: 1,
    fontSize: 17,
    fontWeight: "900",
    color: colors.text
  },
  teamSummaryMeta: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textMuted
  },
  socialStack: {
    gap: spacing.md
  },
  friendRow: {
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSoft
  },
  friendCopy: {
    gap: spacing.xs
  },
  friendName: {
    fontSize: 15,
    fontWeight: "900",
    color: colors.text
  },
  patternWrap: {
    gap: spacing.sm
  },
  patternWrapCompact: {
    minWidth: 440
  },
  patternScrollContent: {
    flexGrow: 1
  },
  patternHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs
  },
  patternHeaderText: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: colors.textSoft,
    fontWeight: "800"
  },
  patternLabelCol: {
    flex: 1.4,
    textAlign: "left"
  },
  patternRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs
  },
  patternRowLabel: {
    flex: 1,
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: "800"
  },
  patternCell: {
    flex: 1,
    minHeight: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  patternCellText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: "800"
  },
  patternCellTextInverse: {
    color: colors.textInverse
  }
});
