import { formatDate, formatNumber, formatOdds } from "../lib/format.js";

export function renderOverview(appData) {
  const leaders = appData.standings.slice().sort((a, b) => a.rank - b.rank);
  const leader = leaders[0];
  const runnerUp = leaders[1];
  const closestGap = runnerUp ? formatNumber(leader.points - runnerUp.points) : "—";

  document.querySelector("#overview-content").innerHTML = `
    <div class="summary-grid summary-grid-top">
      <article class="summary-card accent summary-card-lead">
        <span class="label">Leader Right Now</span>
        <h3>${leader.owner}</h3>
        <p>${formatNumber(leader.points)} points with ${formatOdds(leader.liveOdds)} live odds.</p>
      </article>
      <article class="summary-card">
        <span class="label">Chase Margin</span>
        <h3>${closestGap}</h3>
        <p>${runnerUp ? `${runnerUp.owner} is the next closest entry.` : "Only one entry loaded."}</p>
      </article>
      <article class="summary-card">
        <span class="label">Current Week</span>
        <h3>Week ${appData.currentWeek}</h3>
        <p>Use this page as the live week command center.</p>
      </article>
      <article class="summary-card">
        <span class="label">Source</span>
        <h3>${appData.source.sheetTitle}</h3>
        <p>Snapshot imported on ${appData.source.snapshotDate} for migration.</p>
      </article>
    </div>
    <div class="section-subgrid">
      ${leaders.map((row) => `
        <article class="leader-card ${row.rank === 1 ? "is-first" : ""}">
          <div class="leader-head">
            <span class="leader-rank">#${row.rank}</span>
            <strong>${row.owner}</strong>
            <span class="leader-odds">${formatOdds(row.liveOdds)}</span>
          </div>
          <div class="leader-points">${formatNumber(row.points)}</div>
          <div class="leader-meta">
            <span>Expected ${formatNumber(row.expectedPoints)}</span>
            <span>POTD ${formatNumber(row.breakdown.potd, 0)}</span>
            <span>O/U ${formatNumber(row.breakdown.overUnder, 0)}</span>
            <span>DOTD ${formatNumber(row.breakdown.dotd)}</span>
          </div>
        </article>
      `).join("")}
    </div>
    <div class="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Owner</th>
            <th>Points</th>
            <th>Expected</th>
            <th>Live Odds</th>
            <th>POTD</th>
            <th>O/U</th>
            <th>DOTD</th>
          </tr>
        </thead>
        <tbody>
          ${leaders.map((row) => `
            <tr>
              <td>${row.rank}</td>
              <td><strong>${row.owner}</strong></td>
              <td>${formatNumber(row.points)}</td>
              <td>${formatNumber(row.expectedPoints)}</td>
              <td>${formatOdds(row.liveOdds)}</td>
              <td>${formatNumber(row.breakdown.potd, 0)}</td>
              <td>${formatNumber(row.breakdown.overUnder, 0)}</td>
              <td>${formatNumber(row.breakdown.dotd)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

export function renderWeeklyBoard(appData) {
  const currentWeek = appData.weeklyPicks.find((week) => week.week === appData.currentWeek) || appData.weeklyPicks.at(-1);
  const archivedWeeks = appData.weeklyPicks.filter((week) => week !== currentWeek).slice().reverse();

  document.querySelector("#weekly-board").innerHTML = `
    <form id="current-week-form" class="current-week-panel">
      <div class="week-head week-head-featured">
        <div>
          <span class="label">Primary Board</span>
          <h3>${currentWeek.label}</h3>
        </div>
        <div class="current-week-tools">
          <label class="inline-field">
            <span>Status</span>
            <select id="current-week-status">
              ${["In Progress", "Finalized"].map((status) => `<option value="${status}" ${currentWeek.status === status ? "selected" : ""}>${status}</option>`).join("")}
            </select>
          </label>
          <span class="status-chip">${currentWeek.status}</span>
        </div>
      </div>
      <div class="owner-picks-grid">
        ${appData.owners.map((owner) => `
          <article class="owner-pick-card">
            <div class="owner-pick-head">
              <h4>${owner}</h4>
            </div>
            <div class="pick-editor">
              <label class="field">
                <span>POTD</span>
                <input name="potd-${owner}" type="text" value="${currentWeek.potd[owner] || ""}" placeholder="BUF -2.5" />
              </label>
              <label class="field">
                <span>Totals Game</span>
                <input name="ou-game-${owner}" type="text" value="${currentWeek.overUnder[owner]?.game || ""}" placeholder="BUF/NYJ" />
              </label>
              <div class="form-grid form-grid-tight">
                <label class="field">
                  <span>Total</span>
                  <input name="ou-line-${owner}" type="text" value="${currentWeek.overUnder[owner]?.line || ""}" placeholder="44.5" />
                </label>
                <label class="field">
                  <span>O/U</span>
                  <select name="ou-pick-${owner}">
                    <option value="" ${!currentWeek.overUnder[owner]?.pick ? "selected" : ""}>—</option>
                    <option value="O" ${currentWeek.overUnder[owner]?.pick === "O" ? "selected" : ""}>O</option>
                    <option value="U" ${currentWeek.overUnder[owner]?.pick === "U" ? "selected" : ""}>U</option>
                  </select>
                </label>
              </div>
              <div class="form-grid form-grid-tight">
                <label class="field">
                  <span>DOTD Team</span>
                  <input name="dotd-team-${owner}" type="text" value="${currentWeek.dotd[owner]?.team || ""}" placeholder="BUF" />
                </label>
                <label class="field">
                  <span>ML</span>
                  <input name="dotd-line-${owner}" type="text" value="${currentWeek.dotd[owner]?.line || ""}" placeholder="145" />
                </label>
              </div>
            </div>
          </article>
        `).join("")}
      </div>
      <div class="form-actions">
        <button type="submit" ${appData.owners.length === 0 || appData.uiSavingWeek ? "disabled" : ""}>${appData.uiSavingWeek ? "Saving…" : "Save Current Week Picks"}</button>
        ${appData.uiWeekMessage ? `<span class="form-message">${appData.uiWeekMessage}</span>` : ""}
        ${appData.uiWeekError ? `<span class="form-error">${appData.uiWeekError}</span>` : ""}
      </div>
      <div class="table-scroll compact">
        <table>
          <thead>
            <tr>
              <th>Owner</th>
              <th>POTD</th>
              <th>Totals Game</th>
              <th>Total</th>
              <th>O/U</th>
              <th>DOTD</th>
              <th>ML</th>
            </tr>
          </thead>
          <tbody>
            ${appData.owners.map((owner) => `
              <tr>
                <td><strong>${owner}</strong></td>
                <td>${currentWeek.potd[owner] || "—"}</td>
                <td>${currentWeek.overUnder[owner]?.game || "—"}</td>
                <td>${currentWeek.overUnder[owner]?.line || "—"}</td>
                <td>${currentWeek.overUnder[owner]?.pick || "—"}</td>
                <td>${currentWeek.dotd[owner]?.team || "—"}</td>
                <td>${currentWeek.dotd[owner]?.line || "—"}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </form>
    <div class="week-list">
      ${archivedWeeks.map((week) => `
        <details class="week-archive-card">
          <summary class="week-head">
            <span>${week.label}</span>
            <span>${week.status}</span>
          </summary>
          <div class="table-scroll compact">
            <table>
              <thead>
                <tr>
                  <th>Owner</th>
                  <th>POTD</th>
                  <th>Totals Game</th>
                  <th>Total</th>
                  <th>O/U</th>
                  <th>DOTD</th>
                  <th>ML</th>
                </tr>
              </thead>
              <tbody>
                ${appData.owners.map((owner) => `
                  <tr>
                    <td><strong>${owner}</strong></td>
                    <td>${week.potd[owner] || "—"}</td>
                    <td>${week.overUnder[owner]?.game || "—"}</td>
                    <td>${week.overUnder[owner]?.line || "—"}</td>
                    <td>${week.overUnder[owner]?.pick || "—"}</td>
                    <td>${week.dotd[owner]?.team || "—"}</td>
                    <td>${week.dotd[owner]?.line || "—"}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </details>
      `).join("")}
    </div>
  `;

  document.querySelector("#current-week-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const uiState = window.__busyPicksUiState;
    const actions = window.__busyPicksActions;

    uiState.savingWeek = true;
    uiState.weekMessage = "";
    uiState.weekError = "";
    actions.render();

    try {
      await actions.saveWeeklyPicks({
        week: currentWeek.week,
        status: form.querySelector("#current-week-status").value,
        potd: Object.fromEntries(appData.owners.map((owner) => [owner, form.querySelector(`[name="potd-${owner}"]`).value])),
        overUnder: Object.fromEntries(appData.owners.map((owner) => [owner, {
          game: form.querySelector(`[name="ou-game-${owner}"]`).value,
          line: form.querySelector(`[name="ou-line-${owner}"]`).value,
          pick: form.querySelector(`[name="ou-pick-${owner}"]`).value
        }])),
        dotd: Object.fromEntries(appData.owners.map((owner) => [owner, {
          team: form.querySelector(`[name="dotd-team-${owner}"]`).value,
          line: form.querySelector(`[name="dotd-line-${owner}"]`).value
        }]))
      });
      uiState.weekMessage = `${currentWeek.label} picks saved.`;
    } catch (error) {
      uiState.weekError = error.message;
    } finally {
      uiState.savingWeek = false;
      actions.render();
    }
  });
}

export function renderLinesBoard(appData) {
  document.querySelector("#lines-board").innerHTML = `
    <div class="summary-inline">
      <span class="pill">Week ${appData.availableLines.week}</span>
      <span class="pill">${appData.availableLines.games.length} games</span>
    </div>
    <div class="line-card-grid">
      ${appData.availableLines.games.map((game) => `
        <article class="line-card">
          <div class="line-card-top">
            <span class="label">${game.day}</span>
            <span class="line-total">O/U ${game.total}</span>
          </div>
          <h3>${game.awayTeam} at ${game.homeTeam}</h3>
          <p class="line-spread">${game.line}</p>
        </article>
      `).join("")}
    </div>
    <div class="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Day</th>
            <th>Away</th>
            <th>Home</th>
            <th>Spread</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${appData.availableLines.games.map((game) => `
            <tr>
              <td>${game.day}</td>
              <td>${game.awayTeam}</td>
              <td>${game.homeTeam}</td>
              <td>${game.line}</td>
              <td>${game.total}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

export function renderResultsBoard(appData) {
  document.querySelector("#results-board").innerHTML = `
    <div class="results-grid">
      ${appData.recentResults.slice(0, 6).map((game) => `
        <article class="result-card">
          <span class="label">${game.week}</span>
          <h3>${game.away} at ${game.home}</h3>
          <p class="result-score">${game.score}</p>
          <div class="result-meta">
            <span>${game.coveredBy || "No cover edge"}</span>
            <span>Total ${game.totalPoints} / ${game.totalLine}</span>
          </div>
        </article>
      `).join("")}
    </div>
    <div class="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Week</th>
            <th>Date</th>
            <th>Matchup</th>
            <th>Score</th>
            <th>Spread</th>
            <th>Covered</th>
            <th>Total</th>
            <th>Winner</th>
          </tr>
        </thead>
        <tbody>
          ${appData.recentResults.map((game) => `
            <tr>
              <td>${game.week}</td>
              <td>${formatDate(game.date)}</td>
              <td>${game.away} at ${game.home}</td>
              <td>${game.score}</td>
              <td>${game.odds}</td>
              <td>${game.coveredBy || "—"}</td>
              <td>${game.totalPoints} / ${game.totalLine}</td>
              <td>${game.winner}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

export function renderAdmin(appData, uiState, actions) {
  document.querySelector("#admin-board").innerHTML = `
    <div class="admin-intro">
      <article class="admin-note">
        <span class="label">Commissioner Workflow</span>
        <h3>Keep setup separate from the live board.</h3>
        <p>Live reading should stay simple. Admin editing belongs here so players are not forced through configuration noise.</p>
      </article>
    </div>
    <form id="season-config-form" class="admin-form">
      <div class="form-grid">
        <label class="field">
          <span>Season</span>
          <input id="season-year" type="number" value="${appData.season}" />
        </label>
        <label class="field">
          <span>Current Week</span>
          <input id="current-week" type="number" value="${appData.currentWeek}" />
        </label>
      </div>
      <label class="field">
        <span>Owners</span>
        <textarea id="owners-list" rows="5">${appData.owners.join("\n")}</textarea>
      </label>
      <label class="field">
        <span>Commissioner Notes</span>
        <textarea id="season-notes" rows="5">${appData.notes || ""}</textarea>
      </label>
      <div class="form-actions">
        <button type="submit" ${uiState.saving ? "disabled" : ""}>${uiState.saving ? "Saving…" : "Save Season Config"}</button>
        ${uiState.message ? `<span class="form-message">${uiState.message}</span>` : ""}
        ${uiState.error ? `<span class="form-error">${uiState.error}</span>` : ""}
      </div>
    </form>
  `;

  document.querySelector("#season-config-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    uiState.saving = true;
    uiState.message = "";
    uiState.error = "";
    actions.render();

    try {
      await actions.saveSeasonConfig({
        season: Number(document.querySelector("#season-year").value),
        currentWeek: Number(document.querySelector("#current-week").value),
        owners: document.querySelector("#owners-list").value
          .split("\n")
          .map((value) => value.trim())
          .filter(Boolean),
        notes: document.querySelector("#season-notes").value.trim()
      });
      uiState.message = "Season configuration saved.";
    } catch (error) {
      uiState.error = error.message;
    } finally {
      uiState.saving = false;
      actions.render();
    }
  });
}
