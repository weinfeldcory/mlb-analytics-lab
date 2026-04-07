import { currentScoring, games, rounds, scoringSourceUrl, teams } from "./data.js";
import {
  expectedStandings,
  probabilityBasedScoring,
  remainingOutcomesForGame,
  scoringSummary,
  standings,
  teamRows,
  trueMaxStandings,
  unresolvedGames
} from "./scoring.js";

function formatNumber(value, digits = 1) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits
  }).format(value);
}

function renderStandings() {
  const current = standings(teams, games);
  const max = new Map(trueMaxStandings(teams, games).map((row) => [row.owner, row.max]));
  const expected = new Map(expectedStandings(teams, games).map((row) => [row.owner, row.expected]));
  const optimized = probabilityBasedScoring();
  const optimizedCurrent = new Map(standings(teams, games, optimized).map((row) => [row.owner, row.points]));
  const optimizedExpected = new Map(expectedStandings(teams, games, optimized).map((row) => [row.owner, row.expected]));

  document.querySelector("#standings").innerHTML = `
    <div class="standings-cards">
      ${current.map((row, index) => `
        <article class="rank-card">
          <span class="rank">#${index + 1}</span>
          <h3>${row.owner}</h3>
          <p class="score">${row.points}</p>
          <dl>
            <div><dt>Expected</dt><dd>${formatNumber(expected.get(row.owner))}</dd></div>
            <div><dt>True max</dt><dd>${max.get(row.owner)}</dd></div>
            <div><dt>Optimized now</dt><dd>${optimizedCurrent.get(row.owner)}</dd></div>
            <div><dt>Optimized exp.</dt><dd>${formatNumber(optimizedExpected.get(row.owner))}</dd></div>
          </dl>
        </article>
      `).join("")}
    </div>
    <table>
      <thead>
        <tr><th>Owner</th><th>Current</th><th>Expected</th><th>True Max</th><th>Optimized Current</th><th>Optimized Expected</th></tr>
      </thead>
      <tbody>
        ${current.map((row) => `
          <tr>
            <td>${row.owner}</td>
            <td>${row.points}</td>
            <td>${formatNumber(expected.get(row.owner))}</td>
            <td>${max.get(row.owner)}</td>
            <td>${optimizedCurrent.get(row.owner)}</td>
            <td>${formatNumber(optimizedExpected.get(row.owner))}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function renderPaths() {
  const rows = unresolvedGames(games).flatMap((game) => remainingOutcomesForGame(game, teams));
  document.querySelector("#paths").innerHTML = `
    <div class="cards">
      ${rows.map((row) => `
        <article class="card">
          <span class="pill">${row.round}</span>
          <h3>${row.team}</h3>
          <p>${row.owner} can add <strong>${row.points}</strong> points with a title.</p>
        </article>
      `).join("")}
    </div>
  `;
}

function renderMatrix() {
  const proposed = probabilityBasedScoring();
  const summary = scoringSummary(currentScoring, proposed);
  document.querySelector("#matrix").innerHTML = `
    <div class="model-note">
      <h3>Optimized model status</h3>
      <p>
        The optimized scoring is now based on historical seed advancement rates, then inverse-weighted so rare
        low-seed runs can compete with champion ownership. This is a proposed tuning model, not yet the final game rule.
      </p>
      <a href="${scoringSourceUrl}" target="_blank" rel="noreferrer">Historical seed table source</a>
    </div>
    <div class="table-scroll compact">
      <table>
        <thead>
          <tr><th>Round</th><th>Current 1-seed</th><th>Current 12-seed</th><th>Optimized 1-seed</th><th>Optimized 12-seed</th></tr>
        </thead>
        <tbody>
          ${summary.map((row) => `
            <tr>
              <td>${row.round.replace(" Appearance", "")}</td>
              <td>${row.currentOneSeed}</td>
              <td>${row.currentCinderella}</td>
              <td>${row.optimizedOneSeed}</td>
              <td>${row.optimizedCinderella}</td>
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
          ${Object.keys(currentScoring).map((seed) => `
            <tr>
              <td>${seed}</td>
              ${currentScoring[seed].map((points, index) => `
                <td><strong>${points}</strong><span>${proposed[seed][index]}</span></td>
              `).join("")}
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
    <p class="note">Bold is current sheet scoring. Small numbers are a capped probability-based starting point, not the final recommended matrix.</p>
  `;
}

function renderTeams() {
  const rows = teamRows(teams, games)
    .filter((team) => team.points || team.remaining)
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

function renderTeamTable() {
  const rows = teamRows(teams, games)
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
              <td>${row.owner}</td>
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

renderStandings();
renderPaths();
renderMatrix();
renderTeams();
renderTeamTable();
