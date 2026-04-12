import {
  expectedStandings,
  ownerWinningPaths,
  ownerWinOdds,
  standings,
  teamRows,
  trueMaxStandings,
  unresolvedGames
} from "../../src/scoring.js";

export function summarizeState(state) {
  const current = standings(state.teams, state.games, state.currentScoring, state.owners);
  const max = trueMaxStandings(state.teams, state.games, state.currentScoring, state.owners);
  const expected = expectedStandings(state.teams, state.games, state.currentScoring, undefined, state.owners);
  const odds = ownerWinOdds(state.teams, state.games, state.currentScoring, undefined, undefined, undefined, state.owners);
  const paths = ownerWinningPaths(state.teams, state.games, state.currentScoring, undefined, undefined, undefined, state.owners);
  const maxByOwner = new Map(max.map((row) => [row.owner, row.max]));
  const expectedByOwner = new Map(expected.map((row) => [row.owner, row.expected]));
  const oddsByOwner = new Map(odds.map((row) => [row.owner, row.odds]));

  return {
    season: state.season,
    updatedAt: state.updatedAt,
    owners: state.owners,
    rounds: state.rounds,
    currentScoring: state.currentScoring,
    teams: state.teams,
    games: state.games,
    draft: {
      ...state.draft,
      currentOwner: state.draft.order[state.draft.currentPickIndex] ?? null
    },
    standings: current.map((row, index) => ({
      owner: row.owner,
      points: row.points,
      max: maxByOwner.get(row.owner),
      expected: expectedByOwner.get(row.owner),
      winOdds: oddsByOwner.get(row.owner) ?? 0,
      place: index + 1
    })),
    paths,
    teamRows: teamRows(state.teams, state.games, state.currentScoring),
    unresolvedGames: unresolvedGames(state.games)
  };
}
