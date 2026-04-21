import { useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import type { PlayerBattingSummary, PlayerPitchingSummary } from "@mlb-attendance/domain";
import { PlaceholderPanel } from "../../components/common/PlaceholderPanel";
import { Screen } from "../../components/common/Screen";
import { SectionCard } from "../../components/common/SectionCard";
import { formatBaseballInnings } from "../../lib/formatters";
import { useAppData } from "../../providers/AppDataProvider";
import { colors, spacing } from "../../styles/tokens";

type BatterSortKey =
  | "gamesSeen"
  | "atBatsSeen"
  | "hitsSeen"
  | "battingAverageSeen"
  | "homeRunsSeen"
  | "rbisSeen"
  | "walksSeen"
  | "strikeoutsSeenAtPlate";
type PitcherSortKey =
  | "appearances"
  | "strikeoutsSeen"
  | "inningsSeen"
  | "hitsAllowedSeen"
  | "runsAllowedSeen"
  | "eraSeen";
type SortDirection = "desc" | "asc";

type FilterOption<T extends string | number> = {
  label: string;
  value: T;
};

function formatWinPct(wins: number, losses: number) {
  const total = wins + losses;
  if (!total) {
    return ".000";
  }

  return `${(wins / total).toFixed(3).replace(/^0/, "")}`;
}

function formatAverage(value: number) {
  return value.toFixed(3).replace(/^0\./, ".");
}

function formatEra(value: number) {
  return value.toFixed(2);
}

function sortNumeric<T>(
  rows: T[],
  key: keyof T & string,
  direction: SortDirection,
  fallback: keyof T & string,
  nameKey: keyof T & string
) {
  const factor = direction === "desc" ? 1 : -1;
  return [...rows].sort((left, right) => {
    const primary = ((right[key] as number) - (left[key] as number)) * factor;
    if (primary !== 0) {
      return primary;
    }

    const secondary = ((right[fallback] as number) - (left[fallback] as number)) * factor;
    if (secondary !== 0) {
      return secondary;
    }

    return String(left[nameKey]).localeCompare(String(right[nameKey]));
  });
}

function toggleSort<T extends string>(
  activeKey: T,
  nextKey: T,
  direction: SortDirection,
  setKey: (key: T) => void,
  setDirection: (value: SortDirection) => void
) {
  if (activeKey === nextKey) {
    setDirection(direction === "desc" ? "asc" : "desc");
    return;
  }

  setKey(nextKey);
  setDirection("desc");
}

function HeaderCell(props: {
  label: string;
  width?: number;
  align?: "left" | "right";
  active?: boolean;
  direction?: SortDirection;
  onPress?: () => void;
}) {
  const { label, width = 52, align = "right", active = false, direction = "desc", onPress } = props;

  if (!onPress) {
    return (
      <View style={[styles.headerCell, { width }, align === "left" ? styles.nameCol : null]}>
        <Text style={[styles.headerText, { textAlign: align }]}>{label}</Text>
      </View>
    );
  }

  return (
    <Pressable onPress={onPress} style={[styles.headerCell, { width }, align === "left" ? styles.nameCol : null]}>
      <Text style={[styles.headerText, active ? styles.headerTextActive : null, { textAlign: align }]}>
        {label} {active ? (direction === "desc" ? "↓" : "↑") : ""}
      </Text>
    </Pressable>
  );
}

function SelectFilter<T extends string | number>(props: {
  label: string;
  options: Array<FilterOption<T>>;
  value: T;
  onChange: (value: T) => void;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const { label, options, value, onChange, isOpen, onToggle } = props;
  const activeOption = options.find((option) => option.value === value) ?? options[0];

  return (
    <View style={styles.filterGroup}>
      <Text style={styles.filterLabel}>{label}</Text>
      <Pressable onPress={onToggle} style={styles.selectTrigger}>
        <Text style={styles.selectTriggerText}>{activeOption?.label ?? "Select"}</Text>
        <Text style={styles.selectCaret}>{isOpen ? "▲" : "▼"}</Text>
      </Pressable>
      {isOpen ? (
        <View style={styles.selectMenu}>
          {options.map((option) => (
            <Pressable
              key={`${label}-${option.value}`}
              onPress={() => onChange(option.value)}
              style={[styles.selectOption, option.value === value ? styles.selectOptionActive : null]}
            >
              <Text style={[styles.selectOptionText, option.value === value ? styles.selectOptionTextActive : null]}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function BatterRow({ player }: { player: PlayerBattingSummary }) {
  return (
    <View style={styles.tableRow}>
      <View style={styles.nameCol}>
        <Text style={styles.nameText}>{player.playerName}</Text>
        <Text style={styles.subText}>{[player.teams.join(", "), player.positions.join(", ")].filter(Boolean).join(" • ")}</Text>
      </View>
      <Text style={styles.cellText}>{player.gamesSeen}</Text>
      <Text style={styles.cellText}>{player.atBatsSeen}</Text>
      <Text style={styles.cellText}>{player.hitsSeen}</Text>
      <Text style={styles.cellText}>{formatAverage(player.battingAverageSeen)}</Text>
      <Text style={styles.cellText}>{player.homeRunsSeen}</Text>
      <Text style={styles.cellText}>{player.rbisSeen}</Text>
      <Text style={styles.cellText}>{player.walksSeen}</Text>
      <Text style={styles.cellText}>{player.strikeoutsSeenAtPlate}</Text>
    </View>
  );
}

function PitcherRow({ pitcher }: { pitcher: PlayerPitchingSummary }) {
  return (
    <View style={styles.tableRow}>
      <View style={styles.nameCol}>
        <Text style={styles.nameText}>{pitcher.pitcherName}</Text>
        <Text style={styles.subText}>{[pitcher.teams.join(", "), pitcher.roles.join(", ")].filter(Boolean).join(" • ")}</Text>
      </View>
      <Text style={styles.cellText}>{pitcher.appearances}</Text>
      <Text style={styles.cellText}>{pitcher.strikeoutsSeen}</Text>
      <Text style={styles.cellText}>{formatBaseballInnings(pitcher.inningsSeen)}</Text>
      <Text style={styles.cellText}>{pitcher.hitsAllowedSeen}</Text>
      <Text style={styles.cellText}>{pitcher.runsAllowedSeen}</Text>
      <Text style={styles.cellText}>{formatEra(pitcher.eraSeen)}</Text>
    </View>
  );
}

export function StatsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { stats } = useAppData();
  const isWide = width >= 1080;
  const [batterSortKey, setBatterSortKey] = useState<BatterSortKey>("homeRunsSeen");
  const [batterSortDirection, setBatterSortDirection] = useState<SortDirection>("desc");
  const [pitcherSortKey, setPitcherSortKey] = useState<PitcherSortKey>("strikeoutsSeen");
  const [pitcherSortDirection, setPitcherSortDirection] = useState<SortDirection>("desc");
  const [minBatterGames, setMinBatterGames] = useState(0);
  const [minBatterAtBats, setMinBatterAtBats] = useState(0);
  const [minPitcherAppearances, setMinPitcherAppearances] = useState(0);
  const [minPitcherInnings, setMinPitcherInnings] = useState(0);
  const [batterTeamFilter, setBatterTeamFilter] = useState("all");
  const [batterPositionFilter, setBatterPositionFilter] = useState("all");
  const [pitcherTeamFilter, setPitcherTeamFilter] = useState("all");
  const [pitcherRoleFilter, setPitcherRoleFilter] = useState("all");
  const [openFilter, setOpenFilter] = useState<string | null>(null);

  const batterGameOptions = useMemo<Array<FilterOption<number>>>(() => {
    const values = [0, ...new Set(stats.playerBattingSummaries.map((player) => player.gamesSeen).sort((left, right) => left - right))];
    return values.map((value) => ({
      value,
      label: value === 0 ? "All games" : `${value}+ games`
    }));
  }, [stats.playerBattingSummaries]);

  const batterAbOptions = useMemo<Array<FilterOption<number>>>(() => {
    const values = [0, ...new Set(stats.playerBattingSummaries.map((player) => player.atBatsSeen).sort((left, right) => left - right))];
    return values.map((value) => ({
      value,
      label: value === 0 ? "All at-bats" : `${value}+ AB`
    }));
  }, [stats.playerBattingSummaries]);

  const pitcherAppearanceOptions = useMemo<Array<FilterOption<number>>>(() => {
    const values = [0, ...new Set(stats.playerPitchingSummaries.map((pitcher) => pitcher.appearances).sort((left, right) => left - right))];
    return values.map((value) => ({
      value,
      label: value === 0 ? "All appearances" : `${value}+ appearances`
    }));
  }, [stats.playerPitchingSummaries]);

  const pitcherInningOptions = useMemo<Array<FilterOption<number>>>(() => {
    const values = [0, ...new Set(stats.playerPitchingSummaries.map((pitcher) => pitcher.inningsSeen).sort((left, right) => left - right))];
    return values.map((value) => ({
      value,
      label: value === 0 ? "All innings" : `${formatBaseballInnings(value)}+ IP`
    }));
  }, [stats.playerPitchingSummaries]);

  const batterTeamOptions = useMemo<Array<FilterOption<string>>>(() => {
    const teams = [...new Set(stats.playerBattingSummaries.flatMap((player) => player.teams))].sort((left, right) => left.localeCompare(right));
    return [{ label: "All teams", value: "all" }, ...teams.map((team) => ({ label: team, value: team }))];
  }, [stats.playerBattingSummaries]);

  const batterPositionOptions = useMemo<Array<FilterOption<string>>>(() => {
    const positions = [...new Set(stats.playerBattingSummaries.flatMap((player) => player.positions))].sort((left, right) => left.localeCompare(right));
    return [{ label: "All positions", value: "all" }, ...positions.map((position) => ({ label: position, value: position }))];
  }, [stats.playerBattingSummaries]);

  const pitcherTeamOptions = useMemo<Array<FilterOption<string>>>(() => {
    const teams = [...new Set(stats.playerPitchingSummaries.flatMap((pitcher) => pitcher.teams))].sort((left, right) => left.localeCompare(right));
    return [{ label: "All teams", value: "all" }, ...teams.map((team) => ({ label: team, value: team }))];
  }, [stats.playerPitchingSummaries]);

  const pitcherRoleOptions = useMemo<Array<FilterOption<string>>>(() => {
    const roles = [...new Set(stats.playerPitchingSummaries.flatMap((pitcher) => pitcher.roles))].sort((left, right) => left.localeCompare(right));
    return [{ label: "All roles", value: "all" }, ...roles.map((role) => ({ label: role, value: role }))];
  }, [stats.playerPitchingSummaries]);

  const filteredBatters = useMemo(() => {
    return stats.playerBattingSummaries.filter(
      (player) =>
        player.gamesSeen >= minBatterGames &&
        player.atBatsSeen >= minBatterAtBats &&
        (batterTeamFilter === "all" || player.teams.includes(batterTeamFilter)) &&
        (batterPositionFilter === "all" || player.positions.includes(batterPositionFilter))
    );
  }, [batterPositionFilter, batterTeamFilter, minBatterAtBats, minBatterGames, stats.playerBattingSummaries]);

  const filteredPitchers = useMemo(() => {
    return stats.playerPitchingSummaries.filter(
      (pitcher) =>
        pitcher.appearances >= minPitcherAppearances &&
        pitcher.inningsSeen >= minPitcherInnings &&
        (pitcherTeamFilter === "all" || pitcher.teams.includes(pitcherTeamFilter)) &&
        (pitcherRoleFilter === "all" || pitcher.roles.includes(pitcherRoleFilter))
    );
  }, [minPitcherAppearances, minPitcherInnings, pitcherRoleFilter, pitcherTeamFilter, stats.playerPitchingSummaries]);

  const sortedBatters = useMemo(() => {
    return sortNumeric(filteredBatters, batterSortKey, batterSortDirection, "hitsSeen", "playerName");
  }, [batterSortDirection, batterSortKey, filteredBatters]);

  const sortedPitchers = useMemo(() => {
    return sortNumeric(filteredPitchers, pitcherSortKey, pitcherSortDirection, "strikeoutsSeen", "pitcherName");
  }, [filteredPitchers, pitcherSortDirection, pitcherSortKey]);

  const favoriteTeamLabel = stats.favoriteTeamSplit?.teamName ?? "Favorite Team";
  const hasAnyStats = stats.totalGamesAttended > 0;
  const hasFilteredBatters = sortedBatters.length > 0;
  const hasFilteredPitchers = sortedPitchers.length > 0;

  return (
    <Screen
      title="Deep Stats"
      subtitle="Every hitter, pitcher, and team you’ve seen, with header sorting, minimum filters, and rate stats for faster scanning."
    >
      <View style={styles.topBar}>
        <View style={styles.topStat}>
          <Text style={styles.topStatLabel}>{favoriteTeamLabel} Record</Text>
          <Text style={styles.topStatValue}>
            {stats.favoriteTeamSplit?.wins ?? stats.wins}-{stats.favoriteTeamSplit?.losses ?? stats.losses}
          </Text>
        </View>
        <View style={styles.topStat}>
          <Text style={styles.topStatLabel}>Hits Seen</Text>
          <Text style={styles.topStatValue}>{stats.totalHitsSeen}</Text>
        </View>
        <View style={styles.topStat}>
          <Text style={styles.topStatLabel}>Filtered Hitters</Text>
          <Text style={styles.topStatValue}>{sortedBatters.length}</Text>
        </View>
        <View style={styles.topStat}>
          <Text style={styles.topStatLabel}>Filtered Pitchers</Text>
          <Text style={styles.topStatValue}>{sortedPitchers.length}</Text>
        </View>
      </View>
      <View style={[styles.layout, isWide ? styles.layoutWide : null]}>
        <View style={styles.mainColumn}>
          <SectionCard title="Hitters Seen">
            {hasAnyStats ? (
              <>
                <View style={styles.filtersBlock}>
                  <SelectFilter
                    label="Min games"
                    options={batterGameOptions}
                    value={minBatterGames}
                    onChange={(value) => {
                      setMinBatterGames(value);
                      setOpenFilter(null);
                    }}
                    isOpen={openFilter === "batter-games"}
                    onToggle={() => setOpenFilter((current) => current === "batter-games" ? null : "batter-games")}
                  />
                  <SelectFilter
                    label="Min AB"
                    options={batterAbOptions}
                    value={minBatterAtBats}
                    onChange={(value) => {
                      setMinBatterAtBats(value);
                      setOpenFilter(null);
                    }}
                    isOpen={openFilter === "batter-abs"}
                    onToggle={() => setOpenFilter((current) => current === "batter-abs" ? null : "batter-abs")}
                  />
                  <SelectFilter
                    label="Team"
                    options={batterTeamOptions}
                    value={batterTeamFilter}
                    onChange={(value) => {
                      setBatterTeamFilter(value);
                      setOpenFilter(null);
                    }}
                    isOpen={openFilter === "batter-team"}
                    onToggle={() => setOpenFilter((current) => current === "batter-team" ? null : "batter-team")}
                  />
                  <SelectFilter
                    label="Position"
                    options={batterPositionOptions}
                    value={batterPositionFilter}
                    onChange={(value) => {
                      setBatterPositionFilter(value);
                      setOpenFilter(null);
                    }}
                    isOpen={openFilter === "batter-position"}
                    onToggle={() => setOpenFilter((current) => current === "batter-position" ? null : "batter-position")}
                  />
                </View>
                {hasFilteredBatters ? (
                  <>
                    <View style={styles.tableHeader}>
                      <HeaderCell label="Player" align="left" />
                      <HeaderCell
                        label="G"
                        active={batterSortKey === "gamesSeen"}
                        direction={batterSortDirection}
                        onPress={() => toggleSort(batterSortKey, "gamesSeen", batterSortDirection, setBatterSortKey, setBatterSortDirection)}
                      />
                      <HeaderCell
                        label="AB"
                        active={batterSortKey === "atBatsSeen"}
                        direction={batterSortDirection}
                        onPress={() => toggleSort(batterSortKey, "atBatsSeen", batterSortDirection, setBatterSortKey, setBatterSortDirection)}
                      />
                      <HeaderCell
                        label="H"
                        active={batterSortKey === "hitsSeen"}
                        direction={batterSortDirection}
                        onPress={() => toggleSort(batterSortKey, "hitsSeen", batterSortDirection, setBatterSortKey, setBatterSortDirection)}
                      />
                      <HeaderCell
                        label="AVG"
                        active={batterSortKey === "battingAverageSeen"}
                        direction={batterSortDirection}
                        onPress={() => toggleSort(batterSortKey, "battingAverageSeen", batterSortDirection, setBatterSortKey, setBatterSortDirection)}
                      />
                      <HeaderCell
                        label="HR"
                        active={batterSortKey === "homeRunsSeen"}
                        direction={batterSortDirection}
                        onPress={() => toggleSort(batterSortKey, "homeRunsSeen", batterSortDirection, setBatterSortKey, setBatterSortDirection)}
                      />
                      <HeaderCell
                        label="RBI"
                        active={batterSortKey === "rbisSeen"}
                        direction={batterSortDirection}
                        onPress={() => toggleSort(batterSortKey, "rbisSeen", batterSortDirection, setBatterSortKey, setBatterSortDirection)}
                      />
                      <HeaderCell
                        label="BB"
                        active={batterSortKey === "walksSeen"}
                        direction={batterSortDirection}
                        onPress={() => toggleSort(batterSortKey, "walksSeen", batterSortDirection, setBatterSortKey, setBatterSortDirection)}
                      />
                      <HeaderCell
                        label="K"
                        active={batterSortKey === "strikeoutsSeenAtPlate"}
                        direction={batterSortDirection}
                        onPress={() =>
                          toggleSort(
                            batterSortKey,
                            "strikeoutsSeenAtPlate",
                            batterSortDirection,
                            setBatterSortKey,
                            setBatterSortDirection
                          )
                        }
                      />
                    </View>
                    {sortedBatters.map((player) => (
                      <BatterRow key={player.playerName} player={player} />
                    ))}
                  </>
                ) : (
                  <PlaceholderPanel
                    title="No hitters match these filters"
                    body="Your current games, at-bats, team, and position filters narrowed the hitter table down to zero rows. Relax one or more filters to bring players back."
                    actionLabel="Show All Hitters"
                    onAction={() => {
                      setMinBatterGames(0);
                      setMinBatterAtBats(0);
                      setBatterTeamFilter("all");
                      setBatterPositionFilter("all");
                    }}
                  />
                )}
              </>
            ) : (
              <PlaceholderPanel
                title="No hitter data yet"
                body="Player batting summaries appear after you log games with attached box-score data."
                actionLabel="Log First Game"
                onAction={() => router.push("/(tabs)/log-game")}
              />
            )}
          </SectionCard>

          <SectionCard title="Pitchers Seen">
            {hasAnyStats ? (
              <>
                <View style={styles.filtersBlock}>
                  <SelectFilter
                    label="Min apps"
                    options={pitcherAppearanceOptions}
                    value={minPitcherAppearances}
                    onChange={(value) => {
                      setMinPitcherAppearances(value);
                      setOpenFilter(null);
                    }}
                    isOpen={openFilter === "pitcher-apps"}
                    onToggle={() => setOpenFilter((current) => current === "pitcher-apps" ? null : "pitcher-apps")}
                  />
                  <SelectFilter
                    label="Min IP"
                    options={pitcherInningOptions}
                    value={minPitcherInnings}
                    onChange={(value) => {
                      setMinPitcherInnings(value);
                      setOpenFilter(null);
                    }}
                    isOpen={openFilter === "pitcher-ip"}
                    onToggle={() => setOpenFilter((current) => current === "pitcher-ip" ? null : "pitcher-ip")}
                  />
                  <SelectFilter
                    label="Team"
                    options={pitcherTeamOptions}
                    value={pitcherTeamFilter}
                    onChange={(value) => {
                      setPitcherTeamFilter(value);
                      setOpenFilter(null);
                    }}
                    isOpen={openFilter === "pitcher-team"}
                    onToggle={() => setOpenFilter((current) => current === "pitcher-team" ? null : "pitcher-team")}
                  />
                  <SelectFilter
                    label="Role"
                    options={pitcherRoleOptions}
                    value={pitcherRoleFilter}
                    onChange={(value) => {
                      setPitcherRoleFilter(value);
                      setOpenFilter(null);
                    }}
                    isOpen={openFilter === "pitcher-role"}
                    onToggle={() => setOpenFilter((current) => current === "pitcher-role" ? null : "pitcher-role")}
                  />
                </View>
                {hasFilteredPitchers ? (
                  <>
                    <View style={styles.tableHeader}>
                      <HeaderCell label="Pitcher" align="left" />
                      <HeaderCell
                        label="Apps"
                        active={pitcherSortKey === "appearances"}
                        direction={pitcherSortDirection}
                        onPress={() =>
                          toggleSort(pitcherSortKey, "appearances", pitcherSortDirection, setPitcherSortKey, setPitcherSortDirection)
                        }
                      />
                      <HeaderCell
                        label="K"
                        active={pitcherSortKey === "strikeoutsSeen"}
                        direction={pitcherSortDirection}
                        onPress={() =>
                          toggleSort(
                            pitcherSortKey,
                            "strikeoutsSeen",
                            pitcherSortDirection,
                            setPitcherSortKey,
                            setPitcherSortDirection
                          )
                        }
                      />
                      <HeaderCell
                        label="IP"
                        active={pitcherSortKey === "inningsSeen"}
                        direction={pitcherSortDirection}
                        onPress={() =>
                          toggleSort(pitcherSortKey, "inningsSeen", pitcherSortDirection, setPitcherSortKey, setPitcherSortDirection)
                        }
                      />
                      <HeaderCell
                        label="H"
                        active={pitcherSortKey === "hitsAllowedSeen"}
                        direction={pitcherSortDirection}
                        onPress={() =>
                          toggleSort(
                            pitcherSortKey,
                            "hitsAllowedSeen",
                            pitcherSortDirection,
                            setPitcherSortKey,
                            setPitcherSortDirection
                          )
                        }
                      />
                      <HeaderCell
                        label="R"
                        active={pitcherSortKey === "runsAllowedSeen"}
                        direction={pitcherSortDirection}
                        onPress={() =>
                          toggleSort(
                            pitcherSortKey,
                            "runsAllowedSeen",
                            pitcherSortDirection,
                            setPitcherSortKey,
                            setPitcherSortDirection
                          )
                        }
                      />
                      <HeaderCell
                        label="ERA"
                        active={pitcherSortKey === "eraSeen"}
                        direction={pitcherSortDirection}
                        onPress={() => toggleSort(pitcherSortKey, "eraSeen", pitcherSortDirection, setPitcherSortKey, setPitcherSortDirection)}
                      />
                    </View>
                    {sortedPitchers.map((pitcher) => (
                      <PitcherRow key={pitcher.pitcherName} pitcher={pitcher} />
                    ))}
                  </>
                ) : (
                  <PlaceholderPanel
                    title="No pitchers match these filters"
                    body="The current appearances, innings, team, and role filters narrowed the pitching table down to zero rows. Reset them to see the full list."
                    actionLabel="Show All Pitchers"
                    onAction={() => {
                      setMinPitcherAppearances(0);
                      setMinPitcherInnings(0);
                      setPitcherTeamFilter("all");
                      setPitcherRoleFilter("all");
                    }}
                  />
                )}
              </>
            ) : (
              <PlaceholderPanel
                title="No pitcher data yet"
                body="Pitcher summaries start once you’ve saved games with attached pitching appearances."
                actionLabel="Log First Game"
                onAction={() => router.push("/(tabs)/log-game")}
              />
            )}
          </SectionCard>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  topStat: {
    flexGrow: 1,
    minWidth: 130,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 2
  },
  topStatLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: colors.slate500,
    fontWeight: "700"
  },
  topStatValue: {
    fontSize: 24,
    color: colors.navy,
    fontWeight: "800"
  },
  layout: {
    gap: spacing.md
  },
  layoutWide: {
    flexDirection: "row",
    alignItems: "flex-start"
  },
  mainColumn: {
    flex: 1,
    gap: spacing.md
  },
  filtersBlock: {
    gap: spacing.sm
  },
  filterGroup: {
    gap: spacing.xs,
    minWidth: 180
  },
  filterLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: colors.slate500,
    fontWeight: "700"
  },
  selectTrigger: {
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.slate200,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm
  },
  selectTriggerText: {
    flex: 1,
    fontSize: 13,
    color: colors.slate900,
    fontWeight: "600"
  },
  selectCaret: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.slate700
  },
  selectMenu: {
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: colors.white
  },
  selectOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.slate100
  },
  selectOptionActive: {
    backgroundColor: colors.slate050
  },
  selectOptionText: {
    fontSize: 13,
    color: colors.slate700
  },
  selectOptionTextActive: {
    color: colors.navy,
    fontWeight: "700"
  },
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate200
  },
  headerCell: {
    justifyContent: "center"
  },
  headerText: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: colors.slate500,
    fontWeight: "700"
  },
  headerTextActive: {
    color: colors.navy
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate100
  },
  nameCol: {
    flex: 1
  },
  nameText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.slate900
  },
  subText: {
    fontSize: 11,
    color: colors.slate500
  },
  cellText: {
    width: 52,
    textAlign: "right",
    fontSize: 13,
    fontWeight: "700",
    color: colors.navy
  }
});
