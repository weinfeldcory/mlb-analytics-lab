import { formatDate, formatNumber, formatOdds } from "../lib/format.js";

function formatLineRow(game) {
  return [game.day, game.awayTeam, game.homeTeam, game.line, game.total].join(" | ");
}

function parseLineRows(value) {
  return value
    .split("\n")
    .map((row) => row.trim())
    .filter(Boolean)
    .map((row) => {
      const [day = "", awayTeam = "", homeTeam = "", line = "", total = ""] = row.split("|").map((part) => part.trim());
      return { day, awayTeam, homeTeam, line, total };
    });
}

function formatWinners(value) {
  return (value || []).join(", ");
}

function parseWinnerRows(value) {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function formatResultRow(result) {
  return [
    result.date,
    result.away,
    result.home,
    result.score,
    result.odds,
    result.coveredBy,
    result.totalPoints,
    result.totalLine,
    result.winner
  ].join(" | ");
}

function parseResultRows(value) {
  return value
    .split("\n")
    .map((row) => row.trim())
    .filter(Boolean)
    .map((row) => {
      const [
        date = "",
        away = "",
        home = "",
        score = "",
        odds = "",
        coveredBy = "",
        totalPoints = "",
        totalLine = "",
        winner = ""
      ] = row.split("|").map((part) => part.trim());

      return {
        date,
        away,
        home,
        score,
        odds,
        coveredBy,
        totalPoints: Number(totalPoints) || 0,
        totalLine: Number(totalLine) || 0,
        winner
      };
    });
}

function renderOwnerInputs(prefix, owners) {
  return `
    <div class="owner-editor" data-owner-editor="${prefix}">
      ${(owners || []).map((owner, index) => `
        <div class="owner-editor-row">
          <label class="field owner-editor-field">
            <span>Player ${index + 1}</span>
            <input data-owner-input type="text" value="${owner}" placeholder="Enter player name" />
          </label>
          <button type="button" class="owner-row-button subtle" data-owner-remove ${owners.length <= 2 ? "disabled" : ""}>Remove</button>
        </div>
      `).join("")}
    </div>
  `;
}

function bindOwnerEditor(root, minimumOwners = 2, maximumOwners = 10) {
  const editor = root?.querySelector("[data-owner-editor]");
  const addButton = root?.querySelector("[data-owner-add]");
  const count = () => editor?.querySelectorAll("[data-owner-input]").length || 0;

  const syncButtons = () => {
    const total = count();
    editor?.querySelectorAll("[data-owner-remove]").forEach((button) => {
      button.disabled = total <= minimumOwners;
    });
    if (addButton) {
      addButton.disabled = total >= maximumOwners;
    }
  };

  editor?.addEventListener("click", (event) => {
    const removeButton = event.target.closest("[data-owner-remove]");
    if (!removeButton) return;
    removeButton.closest(".owner-editor-row")?.remove();
    syncButtons();
  });

  addButton?.addEventListener("click", () => {
    if (!editor || count() >= maximumOwners) return;
    const nextIndex = count() + 1;
    const row = document.createElement("div");
    row.className = "owner-editor-row";
    row.innerHTML = `
      <label class="field owner-editor-field">
        <span>Player ${nextIndex}</span>
        <input data-owner-input type="text" value="" placeholder="Enter player name" />
      </label>
      <button type="button" class="owner-row-button subtle" data-owner-remove>Remove</button>
    `;
    editor.append(row);
    syncButtons();
    row.querySelector("[data-owner-input]")?.focus();
  });

  syncButtons();
}

function collectOwnerInputs(root) {
  return [...root.querySelectorAll("[data-owner-input]")]
    .map((input) => input.value.trim())
    .filter(Boolean);
}

function countCompletedPickCards(owners, week) {
  return owners.filter((owner) => (
    week.potd?.[owner]
    && week.overUnder?.[owner]?.game
    && week.overUnder?.[owner]?.pick
    && week.dotd?.[owner]?.team
    && week.dotd?.[owner]?.line
  )).length;
}

function getSelectedWeekSummary(appData, currentWeek, currentOutcome, currentScorecard) {
  const completedCards = countCompletedPickCards(appData.owners, currentWeek);
  const resultsCount = appData.recentResults.filter((game) => game.week === currentWeek.label).length;
  const scoringRows = appData.owners.map((owner) => ({
    owner,
    ...(currentScorecard?.owners?.[owner] || { potd: 0, overUnder: 0, dotd: 0, total: 0 })
  })).sort((a, b) => b.total - a.total || a.owner.localeCompare(b.owner));

  return {
    completedCards,
    resultsCount,
    scoringRows,
    outcomeReady: Boolean(
      currentOutcome.potdWinner
      || currentOutcome.overUnder?.game
      || currentOutcome.overUnder?.outcome
      || currentOutcome.dotdWinners?.length
    )
  };
}

function getOwnerGridColumns(ownerCount) {
  if (ownerCount <= 2) return 2;
  if (ownerCount <= 4) return 2;
  if (ownerCount <= 6) return 3;
  if (ownerCount <= 8) return 4;
  return 5;
}

export function renderOverview(appData) {
  const leaders = appData.standings.slice().sort((a, b) => a.rank - b.rank);
  const leader = leaders[0];
  const runnerUp = leaders[1];
  const closestGap = runnerUp ? formatNumber(leader.points - runnerUp.points) : "—";
  const scoringMode = appData.scoring?.mode === "app" ? "App scoring live" : "Imported standings";
  const scoringWeeks = appData.scoring?.mode === "app" ? `${appData.scoring.completedWeeks} finalized weeks` : "Snapshot baseline";

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
        <span class="label">Scoring</span>
        <h3>${scoringMode}</h3>
        <p>${scoringWeeks}. Source snapshot ${appData.source.snapshotDate}.</p>
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
  const currentWeek = appData.weeklyPicks.find((week) => week.week === appData.uiSelectedWeek)
    || appData.weeklyPicks.find((week) => week.week === appData.currentWeek)
    || appData.weeklyPicks.at(-1);
  const currentOutcome = appData.weeklyOutcomes?.find((week) => week.week === currentWeek.week) || {
    potdWinner: "",
    overUnder: { game: "", line: "", outcome: "" },
    dotdWinners: [],
    finalized: false
  };
  const currentScorecard = appData.weeklyScorecards?.find((week) => week.week === currentWeek.week);
  const ownerGridColumns = getOwnerGridColumns(appData.owners.length);
  const summary = getSelectedWeekSummary(appData, currentWeek, currentOutcome, currentScorecard);
  const archivedWeeks = appData.weeklyPicks.filter((week) => week !== currentWeek).slice().reverse();

  document.querySelector("#weekly-board").innerHTML = `
    <section class="week-command">
      <div class="week-command-head">
        <div>
          <span class="label">Live Week Command</span>
          <h3>${currentWeek.label}</h3>
        </div>
        <div class="current-week-tools">
          <label class="inline-field inline-field-strong">
            <span>Board Week</span>
            <select id="board-week-select">
              ${appData.weeklyPicks.map((week) => `<option value="${week.week}" ${week.week === currentWeek.week ? "selected" : ""}>${week.label}</option>`).join("")}
            </select>
          </label>
          <span class="status-chip">${currentWeek.status}</span>
          <span class="status-chip ${currentOutcome.finalized ? "status-chip-success" : ""}">${currentOutcome.finalized ? "Scored Final" : "Scoring Open"}</span>
        </div>
      </div>
      <div class="command-grid">
        <article class="command-card command-card-accent">
          <span class="label">Picks In</span>
          <h4>${summary.completedCards}/${appData.owners.length}</h4>
          <p>${summary.completedCards === appData.owners.length ? "All owners have full cards entered." : "Some owner cards still need picks completed."}</p>
        </article>
        <article class="command-card">
          <span class="label">Results Posted</span>
          <h4>${summary.resultsCount}</h4>
          <p>${summary.resultsCount ? "Weekly results are posted for reconciliation." : "No weekly results have been entered yet."}</p>
        </article>
        <article class="command-card">
          <span class="label">Outcome State</span>
          <h4>${summary.outcomeReady ? "Tracked" : "Blank"}</h4>
          <p>${currentOutcome.finalized ? "This week is finalized in the scoring engine." : "Commissioner outcomes can still be updated."}</p>
        </article>
        <article class="command-card">
          <span class="label">Top Week Score</span>
          <h4>${formatNumber(summary.scoringRows[0]?.total || 0)}</h4>
          <p>${summary.scoringRows[0]?.owner ? `${summary.scoringRows[0].owner} leads this week right now.` : "No scores posted yet."}</p>
        </article>
      </div>
    </section>
    <div class="current-week-stack">
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
              ${["Open", "In Progress", "Finalized", "Upcoming"].map((status) => `<option value="${status}" ${currentWeek.status === status ? "selected" : ""}>${status}</option>`).join("")}
            </select>
          </label>
          <span class="status-chip">${currentWeek.status}</span>
        </div>
      </div>
      <div class="owner-picks-grid" style="--owner-grid-columns:${ownerGridColumns};">
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
    <div class="week-side-rail">
    <form id="current-week-outcome-form" class="current-week-panel outcome-panel">
      <div class="week-head week-head-featured">
        <div>
          <span class="label">Scoring Engine</span>
          <h3>${currentWeek.label} Outcomes</h3>
        </div>
        <div class="current-week-tools">
          <label class="inline-field">
            <span>Finalize Week</span>
            <select id="current-week-finalized">
              <option value="false" ${!currentOutcome.finalized ? "selected" : ""}>In Review</option>
              <option value="true" ${currentOutcome.finalized ? "selected" : ""}>Final</option>
            </select>
          </label>
          <span class="status-chip">${currentOutcome.finalized ? "Finalized" : "Needs Results"}</span>
        </div>
      </div>
      <div class="form-grid">
        <label class="field">
          <span>POTD Winner</span>
          <input id="outcome-potd-winner" type="text" value="${currentOutcome.potdWinner || ""}" placeholder="BUF -2.5" />
        </label>
        <label class="field">
          <span>Totals Game</span>
          <input id="outcome-ou-game" type="text" value="${currentOutcome.overUnder?.game || ""}" placeholder="BUF/NYJ" />
        </label>
      </div>
      <div class="form-grid form-grid-tight">
        <label class="field">
          <span>Totals Line</span>
          <input id="outcome-ou-line" type="text" value="${currentOutcome.overUnder?.line || ""}" placeholder="44.5" />
        </label>
        <label class="field">
          <span>Totals Result</span>
          <select id="outcome-ou-pick">
            <option value="" ${!currentOutcome.overUnder?.outcome ? "selected" : ""}>—</option>
            <option value="O" ${currentOutcome.overUnder?.outcome === "O" ? "selected" : ""}>Over</option>
            <option value="U" ${currentOutcome.overUnder?.outcome === "U" ? "selected" : ""}>Under</option>
          </select>
        </label>
      </div>
      <label class="field">
        <span>DOTD Winners</span>
        <input id="outcome-dotd-winners" type="text" value="${formatWinners(currentOutcome.dotdWinners)}" placeholder="BUF, PHI" />
      </label>
      <div class="form-actions">
        <button type="submit" ${appData.uiSavingOutcome ? "disabled" : ""}>${appData.uiSavingOutcome ? "Saving…" : "Save Week Outcomes"}</button>
        ${appData.uiOutcomeMessage ? `<span class="form-message">${appData.uiOutcomeMessage}</span>` : ""}
        ${appData.uiOutcomeError ? `<span class="form-error">${appData.uiOutcomeError}</span>` : ""}
      </div>
      <div class="table-scroll compact">
        <table>
          <thead>
            <tr>
              <th>Owner</th>
              <th>POTD</th>
              <th>O/U</th>
              <th>DOTD</th>
              <th>Week Total</th>
            </tr>
          </thead>
          <tbody>
            ${appData.owners.map((owner) => {
              const ownerScore = currentScorecard?.owners?.[owner] || { potd: 0, overUnder: 0, dotd: 0, total: 0 };
              return `
                <tr>
                  <td><strong>${owner}</strong></td>
                  <td>${formatNumber(ownerScore.potd, 0)}</td>
                  <td>${formatNumber(ownerScore.overUnder, 0)}</td>
                  <td>${formatNumber(ownerScore.dotd)}</td>
                  <td>${formatNumber(ownerScore.total)}</td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    </form>
    <section class="current-week-panel score-rail-panel">
      <div class="week-head week-head-featured">
        <div>
          <span class="label">Week Snapshot</span>
          <h3>${currentWeek.label} Leaderboard</h3>
        </div>
      </div>
      <div class="score-rail-list">
        ${summary.scoringRows.map((row, index) => `
          <article class="score-rail-item ${index === 0 && row.total > 0 ? "is-leading" : ""}">
            <div class="score-rail-top">
              <strong>${row.owner}</strong>
              <span>${formatNumber(row.total)}</span>
            </div>
            <div class="score-rail-meta">
              <span>POTD ${formatNumber(row.potd, 0)}</span>
              <span>O/U ${formatNumber(row.overUnder, 0)}</span>
              <span>DOTD ${formatNumber(row.dotd)}</span>
            </div>
          </article>
        `).join("")}
      </div>
    </section>
    </div>
    </div>
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

  document.querySelector("#board-week-select")?.addEventListener("change", (event) => {
    window.__busyPicksActions.selectWeek(Number(event.currentTarget.value));
  });

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

  document.querySelector("#current-week-outcome-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const uiState = window.__busyPicksUiState;
    const actions = window.__busyPicksActions;

    uiState.savingOutcome = true;
    uiState.outcomeMessage = "";
    uiState.outcomeError = "";
    actions.render();

    try {
      await actions.saveWeeklyOutcome({
        week: currentWeek.week,
        potdWinner: document.querySelector("#outcome-potd-winner").value,
        overUnder: {
          game: document.querySelector("#outcome-ou-game").value,
          line: document.querySelector("#outcome-ou-line").value,
          outcome: document.querySelector("#outcome-ou-pick").value
        },
        dotdWinners: parseWinnerRows(document.querySelector("#outcome-dotd-winners").value),
        finalized: document.querySelector("#current-week-finalized").value === "true"
      });
      uiState.outcomeMessage = `${currentWeek.label} outcomes saved.`;
    } catch (error) {
      uiState.outcomeError = error.message;
    } finally {
      uiState.savingOutcome = false;
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
  const selectedWeekLabel = `Week ${appData.uiSelectedWeek || appData.currentWeek}`;
  const selectedWeekResults = appData.recentResults.filter((game) => game.week === selectedWeekLabel);

  document.querySelector("#results-board").innerHTML = `
    <div class="results-grid">
      ${selectedWeekResults.slice(0, 6).map((game) => `
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
    ${selectedWeekResults.length ? "" : `
      <div class="empty-state">
        <h3>No results posted for ${selectedWeekLabel}</h3>
        <p>Use the commissioner panel to enter final scores, spreads, totals, and winners for this week.</p>
      </div>
    `}
    <div class="summary-inline">
      <span class="pill">${selectedWeekLabel}</span>
      <span class="pill">${selectedWeekResults.length} posted results</span>
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
          ${selectedWeekResults.map((game) => `
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
  const selectedWeekLabel = `Week ${appData.uiSelectedWeek || appData.currentWeek}`;
  const selectedWeekResults = appData.recentResults.filter((game) => game.week === selectedWeekLabel);

  document.querySelector("#admin-board").innerHTML = `
    <div class="admin-intro">
      <article class="admin-note">
        <span class="label">Commissioner Workflow</span>
        <h3>Operate the season here. Keep the live board readable.</h3>
        <p>Lower-frequency tools are grouped below so week-to-week play stays faster to scan above the fold.</p>
      </article>
    </div>
    <div class="admin-grid">
      <details class="admin-group" open>
      <summary class="admin-group-summary">
        <span>Season Setup</span>
        <span>Owners, notes, and week controls</span>
      </summary>
      <form id="season-config-form" class="admin-form">
        <h3>Season Setup</h3>
        <div class="form-grid">
          <label class="field">
            <span>Season</span>
            <input id="season-year" type="number" value="${appData.season}" />
          </label>
          <label class="field">
            <span>Current Week</span>
            <input id="current-week" type="number" min="1" max="${appData.weeklyPicks.length}" value="${appData.currentWeek}" />
          </label>
        </div>
        <div class="field">
          <span>Players</span>
          ${renderOwnerInputs("season", appData.owners)}
          <div class="form-inline-actions">
            <button type="button" class="owner-row-button subtle" data-owner-add>Add Player</button>
            <span class="form-helper">The weekly board supports 2 to 10 players.</span>
          </div>
        </div>
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
      </details>

      <details class="admin-group">
      <summary class="admin-group-summary">
        <span>Lines Board</span>
        <span>Manage the current slate</span>
      </summary>
      <form id="lines-config-form" class="admin-form">
        <h3>Lines Board</h3>
        <div class="form-grid">
          <label class="field">
            <span>Lines Week</span>
            <input id="lines-week" type="number" min="1" max="${appData.weeklyPicks.length}" value="${appData.availableLines.week}" />
          </label>
          <div class="field field-hint">
            <span>Format</span>
            <p>One game per line: <code>Day | Away | Home | Spread | Total</code></p>
          </div>
        </div>
        <label class="field">
          <span>Game Lines</span>
          <textarea id="lines-rows" rows="10">${appData.availableLines.games.map(formatLineRow).join("\n")}</textarea>
        </label>
        <div class="form-actions">
          <button type="submit" ${uiState.savingLines ? "disabled" : ""}>${uiState.savingLines ? "Saving…" : "Save Lines Board"}</button>
          ${uiState.linesMessage ? `<span class="form-message">${uiState.linesMessage}</span>` : ""}
          ${uiState.linesError ? `<span class="form-error">${uiState.linesError}</span>` : ""}
        </div>
      </form>
      </details>

      <details class="admin-group">
      <summary class="admin-group-summary">
        <span>Launch Next Season</span>
        <span>Start fresh without touching files</span>
      </summary>
      <form id="launch-season-form" class="admin-form">
        <h3>Launch Next Season</h3>
        <div class="form-grid">
          <label class="field">
            <span>New Season</span>
            <input id="launch-season-year" type="number" value="${appData.season + 1}" />
          </label>
          <label class="field">
            <span>Total Weeks</span>
            <input id="launch-total-weeks" type="number" min="1" max="25" value="${Math.max(appData.weeklyPicks.length, 18)}" />
          </label>
        </div>
        <div class="form-grid">
          <label class="field">
            <span>Start Week</span>
            <input id="launch-current-week" type="number" min="1" value="1" />
          </label>
          <label class="field">
            <span>Pool Title</span>
            <input id="launch-title" type="text" value="${appData.title}" />
          </label>
        </div>
        <div class="field">
          <span>Players</span>
          ${renderOwnerInputs("launch", appData.owners)}
          <div class="form-inline-actions">
            <button type="button" class="owner-row-button subtle" data-owner-add>Add Player</button>
            <span class="form-helper">Launch between 2 and 10 players. The board layout will adapt automatically.</span>
          </div>
        </div>
        <label class="field">
          <span>Season Notes</span>
          <textarea id="launch-notes" rows="4" placeholder="New season, blank weekly cards, lines to be added later."></textarea>
        </label>
        <div class="form-actions">
          <button type="submit" ${uiState.launchingSeason ? "disabled" : ""}>${uiState.launchingSeason ? "Launching…" : "Launch Clean Season"}</button>
          ${uiState.launchMessage ? `<span class="form-message">${uiState.launchMessage}</span>` : ""}
          ${uiState.launchError ? `<span class="form-error">${uiState.launchError}</span>` : ""}
        </div>
      </form>
      </details>

      <details class="admin-group" open>
      <summary class="admin-group-summary">
        <span>Weekly Results Feed</span>
        <span>${selectedWeekLabel} reconciliation input</span>
      </summary>
      <form id="results-config-form" class="admin-form">
        <h3>Weekly Results Feed</h3>
        <div class="form-grid">
          <label class="field">
            <span>Results Week</span>
            <input id="results-week" type="number" min="1" max="${appData.weeklyPicks.length}" value="${appData.uiSelectedWeek || appData.currentWeek}" />
          </label>
          <div class="field field-hint">
            <span>Format</span>
            <p>One result per line: <code>Date | Away | Home | Score | Spread | Covered By | Total Points | Total Line | Winner</code></p>
          </div>
        </div>
        <label class="field">
          <span>${selectedWeekLabel} Results</span>
          <textarea id="results-rows" rows="10">${selectedWeekResults.map(formatResultRow).join("\n")}</textarea>
        </label>
        <div class="form-actions">
          <button type="submit" ${uiState.savingResults ? "disabled" : ""}>${uiState.savingResults ? "Saving…" : "Save Weekly Results"}</button>
          ${uiState.resultsMessage ? `<span class="form-message">${uiState.resultsMessage}</span>` : ""}
          ${uiState.resultsError ? `<span class="form-error">${uiState.resultsError}</span>` : ""}
        </div>
      </form>
      </details>
    </div>
  `;

  bindOwnerEditor(document.querySelector("#season-config-form"));
  bindOwnerEditor(document.querySelector("#launch-season-form"));

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
        owners: collectOwnerInputs(document.querySelector("#season-config-form")),
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

  document.querySelector("#lines-config-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    uiState.savingLines = true;
    uiState.linesMessage = "";
    uiState.linesError = "";
    actions.render();

    try {
      await actions.saveAvailableLines({
        week: Number(document.querySelector("#lines-week").value),
        games: parseLineRows(document.querySelector("#lines-rows").value)
      });
      uiState.linesMessage = "Lines board saved.";
    } catch (error) {
      uiState.linesError = error.message;
    } finally {
      uiState.savingLines = false;
      actions.render();
    }
  });

  document.querySelector("#launch-season-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    uiState.launchingSeason = true;
    uiState.launchMessage = "";
    uiState.launchError = "";
    actions.render();

    try {
      await actions.launchSeason({
        season: Number(document.querySelector("#launch-season-year").value),
        totalWeeks: Number(document.querySelector("#launch-total-weeks").value),
        currentWeek: Number(document.querySelector("#launch-current-week").value),
        title: document.querySelector("#launch-title").value.trim(),
        owners: collectOwnerInputs(document.querySelector("#launch-season-form")),
        notes: document.querySelector("#launch-notes").value.trim()
      });
      uiState.launchMessage = "New season launched.";
    } catch (error) {
      uiState.launchError = error.message;
    } finally {
      uiState.launchingSeason = false;
      actions.render();
    }
  });

  document.querySelector("#results-config-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    uiState.savingResults = true;
    uiState.resultsMessage = "";
    uiState.resultsError = "";
    actions.render();

    try {
      await actions.saveRecentResults({
        week: Number(document.querySelector("#results-week").value),
        results: parseResultRows(document.querySelector("#results-rows").value)
      });
      uiState.resultsMessage = "Weekly results saved.";
    } catch (error) {
      uiState.resultsError = error.message;
    } finally {
      uiState.savingResults = false;
      actions.render();
    }
  });
}
