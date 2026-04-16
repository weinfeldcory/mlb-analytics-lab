import { games as defaultGames, rounds } from "../data.js";
import { draftStats, parseTeamsText, scoringToText, teamsToText } from "./state.js";

const REGION_NAMES = ["East", "West", "South", "Midwest"];
const REGION_SIDES = ["left", "right", "left", "right"];

function bracketTemplateGames(appData) {
  return appData.games?.length ? appData.games : defaultGames;
}

function buildBracketRegions(appData) {
  const templateGames = bracketTemplateGames(appData);
  const teamsByName = new Map(appData.teams.map((team) => [team.name, team]));
  const firstRoundGames = templateGames.filter((game) => game.round === rounds[0]);

  return Array.from({ length: 4 }, (_, regionIndex) => ({
    name: REGION_NAMES[regionIndex] ?? `Region ${regionIndex + 1}`,
    opening: firstRoundGames.slice(regionIndex * 8, (regionIndex + 1) * 8).map((game, index) => ({
      ...game,
      slotNumber: index + 1,
      top: teamsByName.get(game.topTeam),
      bottom: teamsByName.get(game.bottomTeam)
    })),
  }));
}

function renderTeamSlot(team) {
  if (!team) {
    return '<div class="bracket-slot is-empty">Open slot</div>';
  }

  if (team.owner) {
    return `
      <button class="bracket-slot is-owned" type="button" data-team-unassign="${team.name}">
        <strong>${team.name}</strong>
        <span>${team.seed}-seed · ${team.owner}</span>
      </button>
    `;
  }

  return `
    <button class="bracket-slot" type="button" data-team="${team.name}">
      <strong>${team.name}</strong>
      <span>${team.seed}-seed · available</span>
    </button>
  `;
}

function renderFutureMatchup(topLabel, bottomLabel, label, className = "") {
  return `
    <article class="future-matchup ${className}">
      <span class="future-round">${label}</span>
      <div class="future-slot">
        <strong>${topLabel}</strong>
        <span>path slot</span>
      </div>
      <div class="future-slot">
        <strong>${bottomLabel}</strong>
        <span>path slot</span>
      </div>
    </article>
  `;
}

function renderRegionBracket(region, side) {
  const sweet16 = Array.from({ length: 4 }, (_, index) => {
    const leftGame = (index * 2) + 1;
    const rightGame = leftGame + 1;
    return renderFutureMatchup(`Winner of Game ${leftGame}`, `Winner of Game ${rightGame}`, "Sweet 16", `sweet16-matchup sweet16-matchup-${index + 1}`);
  }).join("");

  const elite8 = Array.from({ length: 2 }, (_, index) => {
    const leftGame = (index * 2) + 1;
    const rightGame = leftGame + 1;
    return renderFutureMatchup(`Winner of Sweet 16 ${leftGame}`, `Winner of Sweet 16 ${rightGame}`, "Elite 8", `elite8-matchup elite8-matchup-${index + 1}`);
  }).join("");

  const regionalFinal = renderFutureMatchup("Winner of Elite 8 1", "Winner of Elite 8 2", "Regional Final", "regional-final-matchup");

  const opening = region.opening.map((game) => `
    <article class="bracket-matchup opening-matchup opening-matchup-${game.slotNumber}">
      <span class="future-round">Game ${game.slotNumber}</span>
      ${renderTeamSlot(game.top)}
      ${renderTeamSlot(game.bottom)}
    </article>
  `).join("");

  const columns = side === "left"
    ? `
      <div class="region-column is-opening">
        <span class="region-column-label">Round of 64</span>
        ${opening}
      </div>
      <div class="region-column is-path">
        <span class="region-column-label">Sweet 16</span>
        ${sweet16}
      </div>
      <div class="region-column is-path">
        <span class="region-column-label">Elite 8</span>
        ${elite8}
      </div>
      <div class="region-column is-path is-center-edge">
        <span class="region-column-label">Final Four</span>
        ${regionalFinal}
      </div>
    `
    : `
      <div class="region-column is-path is-center-edge">
        <span class="region-column-label">Final Four</span>
        ${regionalFinal}
      </div>
      <div class="region-column is-path">
        <span class="region-column-label">Elite 8</span>
        ${elite8}
      </div>
      <div class="region-column is-path">
        <span class="region-column-label">Sweet 16</span>
        ${sweet16}
      </div>
      <div class="region-column is-opening">
        <span class="region-column-label">Round of 64</span>
        ${opening}
      </div>
    `;

  return `
    <article class="region-card region-card-${side}">
      <div class="region-head">
        <h4>${region.name}</h4>
      </div>
      <div class="region-grid region-grid-${side}">
        ${columns}
      </div>
    </article>
  `;
}

function renderCenterFinals() {
  return `
    <section class="finals-stage">
      <div class="finals-column">
        <span class="region-column-label">National Semifinals</span>
        ${renderFutureMatchup("East Winner", "West Winner", "Semifinal 1", "semifinal-matchup semifinal-matchup-1")}
        ${renderFutureMatchup("South Winner", "Midwest Winner", "Semifinal 2", "semifinal-matchup semifinal-matchup-2")}
      </div>
      <div class="finals-column championship-column">
        <span class="region-column-label">Championship</span>
        ${renderFutureMatchup("Winner of Semifinal 1", "Winner of Semifinal 2", "National Title", "championship-matchup")}
      </div>
    </section>
  `;
}

export function renderDraftRoom(appData, uiState, actions) {
  const isHistoricalSeason = Number(appData.currentSeason) !== Number(appData.season);
  const stats = draftStats(appData);
  const ownerCounts = new Map(appData.owners.map((owner) => [owner, 0]));

  for (const team of appData.teams) {
    if (team.owner) {
      ownerCounts.set(team.owner, ownerCounts.get(team.owner) + 1);
    }
  }

  const bracketRegions = buildBracketRegions(appData);
  const groupedBySeed = Object.groupBy(
    appData.teams.filter((team) => !team.owner),
    ({ seed }) => String(seed)
  );
  const draftedByOwner = Map.groupBy(
    appData.teams.filter((team) => team.owner),
    ({ owner }) => owner
  );

  document.querySelector("#draft-room").innerHTML = `
    <div class="draft-commissioner">
      <div class="draft-status-card">
        <span class="eyebrow">Current Pick</span>
        <h3>${appData.draft.currentOwner ?? "No owner set"}</h3>
        <p>Pick ${appData.draft.currentPickNumber} · ${appData.draft.snake ? "Snake draft" : "Linear draft"} · ${appData.draft.locked ? "Locked" : "Open"}</p>
        <div class="draft-meta">
          <span>${stats.draftedTeams}/${stats.totalTeams} drafted</span>
          <span>${stats.availableTeams} available</span>
        </div>
        ${isHistoricalSeason ? '<p class="history-note">Historical season view is read-only.</p>' : ""}
        <div class="draft-controls">
          <button type="button" data-action="toggle-lock" ${isHistoricalSeason ? "disabled" : ""}>${appData.draft.locked ? "Unlock Draft" : "Lock Draft"}</button>
          <button type="button" data-action="undo" ${isHistoricalSeason ? "disabled" : ""}>Undo Pick</button>
          <button type="button" data-action="reset-empty" ${isHistoricalSeason ? "disabled" : ""}>Start Empty Draft</button>
          <button type="button" data-action="restore-sheet" ${isHistoricalSeason ? "disabled" : ""}>Restore Sheet</button>
        </div>
      </div>
      <div class="draft-settings-card">
        <div class="draft-panel-head">
          <h3>Commissioner Settings</h3>
          <p>${isHistoricalSeason ? "Historical season settings are visible for reference only." : "Control order and use manual assignment when needed."}</p>
        </div>
        <label class="field-label" for="draft-order">Draft order</label>
        <textarea id="draft-order" class="setup-input setup-textarea" rows="3" ${isHistoricalSeason ? "disabled" : ""}>${appData.draft.order.join("\n")}</textarea>
        <label class="checkbox-row">
          <input id="snake-mode" type="checkbox" ${appData.draft.snake ? "checked" : ""} ${isHistoricalSeason ? "disabled" : ""} />
          <span>Snake draft</span>
        </label>
        <button type="button" data-action="save-draft-settings" ${isHistoricalSeason ? "disabled" : ""}>Save Draft Settings</button>
        <label class="field-label" for="manual-owner">Manual assign owner</label>
        <select id="manual-owner" class="setup-input" ${isHistoricalSeason ? "disabled" : ""}>
          ${appData.owners.map((owner) => `<option value="${owner}" ${uiState.manualOwner === owner ? "selected" : ""}>${owner}</option>`).join("")}
        </select>
      </div>
    </div>
    <div class="draft-stack">
      <section class="draft-panel draft-panel-primary">
        <div class="draft-panel-head">
          <h3>Bracket Board</h3>
          <p>Draft directly from the actual tournament path so matchups and future routes are visible while you pick.</p>
        </div>
        <div class="bracket-board bracket-board-top">
          ${renderRegionBracket(bracketRegions[0], REGION_SIDES[0])}
          ${renderRegionBracket(bracketRegions[1], REGION_SIDES[1])}
        </div>
        ${renderCenterFinals()}
        <div class="bracket-board bracket-board-bottom">
          ${renderRegionBracket(bracketRegions[2], REGION_SIDES[2])}
          ${renderRegionBracket(bracketRegions[3], REGION_SIDES[3])}
        </div>
      </section>
      <section class="draft-panel">
        <div class="draft-panel-head">
          <h3>Available By Seed</h3>
          <p>Fallback inventory view for quick scanning by seed.</p>
        </div>
        <div class="seed-grid">
          ${Array.from({ length: 16 }, (_, index) => index + 1).map((seed) => `
            <article class="seed-column">
              <div class="seed-head">
                <h4>${seed}-Seed</h4>
                <span>${(groupedBySeed[String(seed)] || []).length} left</span>
              </div>
              <div class="seed-list">
                ${(groupedBySeed[String(seed)] || []).map((team) => `
                  <button class="draft-team draft-team-compact" type="button" data-team="${team.name}" ${isHistoricalSeason ? "disabled" : ""}>
                    <strong>${team.name}</strong>
                    <span>${seed}-seed</span>
                  </button>
                `).join("") || '<p class="empty-state">No teams left</p>'}
              </div>
            </article>
          `).join("")}
        </div>
      </section>
      <section class="draft-panel">
        <div class="draft-panel-head">
          <h3>Drafted Teams</h3>
          <p>Click a team to return it to the pool. Order history is tracked for undo.</p>
        </div>
        <div class="drafted-grid">
          ${appData.owners.map((owner) => `
            <article class="draft-owner-card">
              <div class="draft-owner-head">
                <h4>${owner}</h4>
                <span>${ownerCounts.get(owner)} teams</span>
              </div>
              <div class="seed-list">
                ${(draftedByOwner.get(owner) || [])
                  .sort((a, b) => a.seed - b.seed || a.name.localeCompare(b.name))
                  .map((team) => `
                    <button class="draft-team is-owned" type="button" data-team-unassign="${team.name}" ${isHistoricalSeason ? "disabled" : ""}>
                      <strong>${team.name}</strong>
                      <span>${team.seed}-seed</span>
                    </button>
                  `).join("") || '<p class="empty-state">No teams drafted</p>'}
              </div>
            </article>
          `).join("")}
        </div>
      </section>
    </div>
    <div class="draft-history">
      <div class="draft-panel-head">
        <h3>Recent Picks</h3>
        <p>Most recent picks first.</p>
      </div>
      <div class="history-list">
        ${(appData.draft.history || []).slice().reverse().map((entry) => `
          <div class="history-row">
            <strong>Pick ${entry.pickNumber}</strong>
            <span>${entry.owner}</span>
            <span>${entry.teamName}</span>
          </div>
        `).join("") || '<p class="empty-state">No picks yet</p>'}
      </div>
    </div>
  `;

  document.querySelector("#manual-owner")?.addEventListener("change", (event) => {
    uiState.manualOwner = event.target.value;
    actions.render();
  });

  document.querySelector("[data-action='toggle-lock']")?.addEventListener("click", () => {
    actions.toggleLock(!appData.draft.locked);
  });

  document.querySelector("[data-action='undo']")?.addEventListener("click", () => {
    actions.undo();
  });

  document.querySelector("[data-action='reset-empty']")?.addEventListener("click", () => {
    actions.reset("empty");
  });

  document.querySelector("[data-action='restore-sheet']")?.addEventListener("click", () => {
    actions.reset("sheet");
  });

  document.querySelector("[data-action='save-draft-settings']")?.addEventListener("click", () => {
    const order = document.querySelector("#draft-order").value
      .split("\n")
      .map((value) => value.trim())
      .filter(Boolean);
    const snake = document.querySelector("#snake-mode").checked;
    actions.saveDraftSettings({ order, snake });
  });

  document.querySelectorAll("[data-team]").forEach((button) => {
    button.addEventListener("click", () => {
      actions.pick(button.dataset.team);
    });
  });

  document.querySelectorAll("[data-team-unassign]").forEach((button) => {
    button.addEventListener("click", () => {
      actions.unassign(button.dataset.teamUnassign);
    });
  });
}

export function renderSeasonSetup(appData, uiState, actions) {
  const isHistoricalSeason = Number(appData.currentSeason) !== Number(appData.season);
  document.querySelector("#season-setup").innerHTML = `
    <form id="season-setup-form" class="setup-form">
      ${isHistoricalSeason ? '<p class="history-note">Historical seasons are read-only. Switch back to the current season to edit commissioner settings.</p>' : ""}
      <div class="setup-grid">
        <label class="setup-field">
          <span>Season Year</span>
          <input id="setup-season" class="setup-input" type="number" value="${appData.season}" ${isHistoricalSeason ? "disabled" : ""} />
        </label>
        <label class="setup-field">
          <span>Owners</span>
          <textarea id="setup-owners" class="setup-input setup-textarea" rows="6" ${isHistoricalSeason ? "disabled" : ""}>${appData.owners.join("\n")}</textarea>
        </label>
      </div>
      <div class="setup-grid setup-grid-wide">
        <label class="setup-field">
          <span>Teams</span>
          <textarea id="setup-teams" class="setup-input setup-textarea" rows="18" ${isHistoricalSeason ? "disabled" : ""}>${teamsToText(appData.teams)}</textarea>
          <small>One team per line: <code>seed, team name</code></small>
        </label>
        <label class="setup-field">
          <span>Scoring Matrix</span>
          <textarea id="setup-scoring" class="setup-input setup-textarea" rows="18" ${isHistoricalSeason ? "disabled" : ""}>${scoringToText(appData.currentScoring)}</textarea>
          <small>JSON object keyed by seed with ${rounds.length} values per seed.</small>
        </label>
      </div>
      <div class="setup-actions">
        <button type="submit" ${uiState.savingSetup || isHistoricalSeason ? "disabled" : ""}>${uiState.savingSetup ? "Saving…" : "Save Season Config"}</button>
      </div>
      ${uiState.setupMessage ? `<p class="setup-message">${uiState.setupMessage}</p>` : ""}
      ${uiState.setupError ? `<p class="setup-error">${uiState.setupError}</p>` : ""}
    </form>
  `;

  document.querySelector("#season-setup-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    uiState.savingSetup = true;
    uiState.setupMessage = "";
    uiState.setupError = "";
    actions.render();

    try {
      const season = Number(document.querySelector("#setup-season").value);
      const owners = document.querySelector("#setup-owners").value
        .split("\n")
        .map((value) => value.trim())
        .filter(Boolean);
      const teams = parseTeamsText(document.querySelector("#setup-teams").value);
      const currentScoring = JSON.parse(document.querySelector("#setup-scoring").value);

      await actions.saveSeasonConfig({ season, owners, teams, currentScoring });
      uiState.setupMessage = "Season configuration saved.";
    } catch (error) {
      uiState.setupError = error.message;
    } finally {
      uiState.savingSetup = false;
      actions.render();
    }
  });
}
