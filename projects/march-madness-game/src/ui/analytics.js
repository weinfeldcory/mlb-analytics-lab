import { rounds, scoringSourceUrl } from "../data.js";
import {
  constrainedEqualValueScoring,
  equalValueScoring,
  expectedStandings,
  inferredRoundExpectedValues,
  probabilityBasedScoring,
  scoringFairnessSummary,
  scoringSummary,
  standings,
  teamRows,
  trueMaxStandings
} from "../scoring.js";
import { formatNumber, formatPercent } from "../lib/format.js";

export function renderStandings(appData) {
  const { currentScoring, games, teams } = appData;
  const current = standings(teams, games, currentScoring, appData.owners);
  const max = new Map(trueMaxStandings(teams, games, currentScoring, appData.owners).map((row) => [row.owner, row.max]));
  const expected = new Map(expectedStandings(teams, games, currentScoring, undefined, appData.owners).map((row) => [row.owner, row.expected]));
  const summaryByOwner = new Map((appData.standings || []).map((row) => [row.owner, row]));
  const optimized = probabilityBasedScoring();
  const optimizedCurrent = new Map(standings(teams, games, optimized, appData.owners).map((row) => [row.owner, row.points]));
  const optimizedExpected = new Map(expectedStandings(teams, games, optimized, undefined, appData.owners).map((row) => [row.owner, row.expected]));

  document.querySelector("#standings").innerHTML = `
    <div class="standings-cards">
      ${current.map((row, index) => `
        <article class="rank-card">
          <span class="rank">#${summaryByOwner.get(row.owner)?.place ?? index + 1}</span>
          <h3>${row.owner}</h3>
          <p class="score">${summaryByOwner.get(row.owner)?.points ?? row.points}</p>
          <dl>
            <div><dt>Win odds</dt><dd>${formatPercent(summaryByOwner.get(row.owner)?.winOdds, 1)}</dd></div>
            <div><dt>Expected</dt><dd>${formatNumber(expected.get(row.owner))}</dd></div>
            <div><dt>True max</dt><dd>${summaryByOwner.get(row.owner)?.max ?? max.get(row.owner)}</dd></div>
            <div><dt>Optimized now</dt><dd>${optimizedCurrent.get(row.owner)}</dd></div>
            <div><dt>Optimized exp.</dt><dd>${formatNumber(optimizedExpected.get(row.owner))}</dd></div>
          </dl>
        </article>
      `).join("")}
    </div>
    <table>
      <thead>
        <tr><th>Owner</th><th>Current</th><th>Win Odds</th><th>Expected</th><th>True Max</th><th>Optimized Current</th><th>Optimized Expected</th></tr>
      </thead>
      <tbody>
        ${current.map((row) => `
          <tr>
            <td>${row.owner}</td>
            <td>${summaryByOwner.get(row.owner)?.points ?? row.points}</td>
            <td>${formatPercent(summaryByOwner.get(row.owner)?.winOdds, 1)}</td>
            <td>${formatNumber(expected.get(row.owner))}</td>
            <td>${summaryByOwner.get(row.owner)?.max ?? max.get(row.owner)}</td>
            <td>${optimizedCurrent.get(row.owner)}</td>
            <td>${formatNumber(optimizedExpected.get(row.owner))}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

export function renderPaths(appData) {
  const rows = appData.paths || [];
  document.querySelector("#paths").innerHTML = `
    <div class="paths-intro">
      <p>
        These are not exact scripts. They are the results that show up more often than normal in each owner's winning simulations.
        Read them as: if this owner wins the pool, these outcomes usually helped get them there.
      </p>
    </div>
    <div class="path-grid">
      ${rows.map((row) => `
        <article class="path-card">
          <div class="path-card-head">
            <div>
              <span class="pill">${formatPercent(row.odds, 1)} to win</span>
              <h3>${row.owner}</h3>
            </div>
            <div class="path-score">
              <strong>${row.currentPoints}</strong>
              <span>${row.pointsBehind ? `${row.pointsBehind} back` : "leader"}</span>
            </div>
          </div>
          <p class="path-summary">${row.summary || "No strong path signal surfaced."}</p>
          <div class="path-sections">
            <div class="path-section">
              <h4>Needs</h4>
              <div class="path-tags">
                ${row.mustHave.map((outcome) => `
                  <span class="path-tag">
                    ${outcome.team}
                    <small>shows up in ${formatPercent(outcome.conditionalProbability, 0)} of this owner's wins</small>
                  </span>
                `).join("") || '<span class="path-tag is-muted">No true must-have outcome surfaced</span>'}
              </div>
            </div>
            <div class="path-section">
              <h4>Helps</h4>
              <div class="path-tags">
                ${row.favorable.map((outcome) => `
                  <span class="path-tag">
                    ${outcome.team}
                    <small>${formatPercent(outcome.lift, 0)} more common than baseline</small>
                  </span>
                `).join("") || '<span class="path-tag is-muted">No strongly favorable swing left</span>'}
              </div>
            </div>
            <div class="path-section">
              <h4>Hurts</h4>
              <div class="path-tags">
                ${row.avoid.map((outcome) => `
                  <span class="path-tag is-danger">
                    ${outcome.team}
                    <small>${formatPercent(Math.abs(outcome.lift), 0)} less common in winning paths</small>
                  </span>
                `).join("") || '<span class="path-tag is-muted">No major spoiler left</span>'}
              </div>
            </div>
          </div>
        </article>
      `).join("") || `
        <article class="path-card">
          <h3>No Paths Left</h3>
          <p>No remaining games. The result is already decided.</p>
        </article>
      `}
    </div>
  `;
}

export function renderMatrix(appData) {
  const strict = equalValueScoring(appData.currentScoring);
  const proposed = constrainedEqualValueScoring(appData.currentScoring);
  const summary = scoringSummary(appData.currentScoring, proposed);
  const currentFairness = scoringFairnessSummary(appData.currentScoring);
  const strictFairness = scoringFairnessSummary(strict);
  const optimizedFairness = scoringFairnessSummary(proposed);
  const roundTargets = inferredRoundExpectedValues(appData.currentScoring);
  document.querySelector("#matrix").innerHTML = `
    <div class="model-note">
      <h3>Constrained Equal-EV model</h3>
      <p>
        This version starts from the rigorous equal-EV solution, then applies human-usable round caps and monotonic rules so
        late-round underdog payouts do not explode while seed EV stays much flatter than the current system.
      </p>
      <a href="${scoringSourceUrl}" target="_blank" rel="noreferrer">Historical seed table source</a>
    </div>
    <div class="fairness-strip">
      <div><dt>Current EV spread</dt><dd>${formatNumber(currentFairness.spread, 2)}</dd></div>
      <div><dt>Strict EV spread</dt><dd>${formatNumber(strictFairness.spread, 2)}</dd></div>
      <div><dt>Constrained EV spread</dt><dd>${formatNumber(optimizedFairness.spread, 2)}</dd></div>
      <div><dt>Current CV</dt><dd>${formatNumber(currentFairness.coefficientOfVariation, 3)}</dd></div>
      <div><dt>Constrained CV</dt><dd>${formatNumber(optimizedFairness.coefficientOfVariation, 3)}</dd></div>
    </div>
    <div class="table-scroll compact">
      <table>
        <thead>
          <tr><th>Round</th><th>Target EV</th><th>Current 1-seed</th><th>Current 12-seed</th><th>Constrained 1-seed</th><th>Constrained 12-seed</th></tr>
        </thead>
        <tbody>
          ${summary.map((row, index) => `
            <tr>
              <td>${row.round.replace(" Appearance", "")}</td>
              <td>${formatNumber(roundTargets[index], 2)}</td>
              <td>${row.currentOneSeed}</td>
              <td>${row.currentCinderella}</td>
              <td>${row.optimizedOneSeed}</td>
              <td>${row.optimizedCinderella}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
    <div class="table-scroll compact">
      <table>
        <thead>
          <tr><th>Round</th><th>Strict 1-seed</th><th>Strict 12-seed</th><th>Strict 16-seed</th></tr>
        </thead>
        <tbody>
          ${rounds.map((round, index) => `
            <tr>
              <td>${round.replace(" Appearance", "")}</td>
              <td>${strict[1][index]}</td>
              <td>${strict[12][index]}</td>
              <td>${strict[16][index]}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
    <div class="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Seed</th>
            ${rounds.map((round) => `<th>${round.replace(" Appearance", "")}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${Object.keys(appData.currentScoring).map((seed) => `
            <tr>
              <td>${seed}</td>
              ${appData.currentScoring[seed].map((points, index) => `
                <td><strong>${points}</strong><span>${proposed[seed][index]}</span></td>
              `).join("")}
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
    <p class="note">Bold is current app scoring. Small numbers are the constrained equal-EV recommendation. The strict table above shows the unconstrained math-only solution for comparison.</p>
  `;
}

export function renderTeams(appData) {
  const rows = (appData.teamRows || teamRows(appData.teams, appData.games, appData.currentScoring))
    .filter((team) => team.owner && (team.points || team.remaining))
    .sort((a, b) => b.points - a.points || b.remaining - a.remaining);
  const byOwner = Map.groupBy(rows, (team) => team.owner);

  document.querySelector("#teams").innerHTML = `
    <div class="owner-grid">
      ${[...byOwner.entries()].map(([owner, ownerTeams]) => `
        <article class="owner-card">
          <div class="owner-header">
            <h3>${owner}</h3>
            <span>${ownerTeams.reduce((sum, team) => sum + team.points, 0)} pts</span>
          </div>
          <div class="team-list">
            ${ownerTeams.map((team) => `
              <div class="team-row">
                <div>
                  <strong>${team.name}</strong>
                  <span>${team.seed}-seed</span>
                </div>
                <div class="team-metrics">
                  <span>${team.points} pts</span>
                  ${team.remaining ? `<span>${formatNumber(team.expectedRemaining)} exp. left</span>` : `<span>done</span>`}
                </div>
              </div>
            `).join("")}
          </div>
        </article>
      `).join("")}
    </div>
  `;
}

export function renderTeamTable(appData) {
  const rows = (appData.teamRows || teamRows(appData.teams, appData.games, appData.currentScoring))
    .filter((team) => team.points || team.remaining)
    .sort((a, b) => b.points - a.points || b.remaining - a.remaining);

  document.querySelector("#team-table").innerHTML = `
    <div class="table-scroll">
      <table>
        <thead>
          <tr><th>Team</th><th>Owner</th><th>Seed</th><th>Points</th><th>Max Left</th><th>Expected Left</th></tr>
        </thead>
        <tbody>
          ${rows.map((row) => `
            <tr>
              <td>${row.name}</td>
              <td>${row.owner ?? "—"}</td>
              <td>${row.seed}</td>
              <td>${row.points}</td>
              <td>${row.remaining}</td>
              <td>${formatNumber(row.expectedRemaining)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}
