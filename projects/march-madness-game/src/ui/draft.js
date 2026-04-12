import { rounds } from "../data.js";
import { draftStats, parseTeamsText, scoringToText, teamsToText } from "./state.js";

export function renderDraftRoom(appData, uiState, actions) {
  const stats = draftStats(appData);
  const ownerCounts = new Map(appData.owners.map((owner) => [owner, 0]));

  for (const team of appData.teams) {
    if (team.owner) {
      ownerCounts.set(team.owner, ownerCounts.get(team.owner) + 1);
    }
  }

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
        <div class="draft-controls">
          <button type="button" data-action="toggle-lock">${appData.draft.locked ? "Unlock Draft" : "Lock Draft"}</button>
          <button type="button" data-action="undo">Undo Pick</button>
          <button type="button" data-action="reset-empty">Start Empty Draft</button>
          <button type="button" data-action="restore-sheet">Restore Sheet</button>
        </div>
      </div>
      <div class="draft-settings-card">
        <div class="draft-panel-head">
          <h3>Commissioner Settings</h3>
          <p>Control order and use manual assignment when needed.</p>
        </div>
        <label class="field-label" for="draft-order">Draft order</label>
        <textarea id="draft-order" class="setup-input setup-textarea" rows="3">${appData.draft.order.join("\n")}</textarea>
        <label class="checkbox-row">
          <input id="snake-mode" type="checkbox" ${appData.draft.snake ? "checked" : ""} />
          <span>Snake draft</span>
        </label>
        <button type="button" data-action="save-draft-settings">Save Draft Settings</button>
        <label class="field-label" for="manual-owner">Manual assign owner</label>
        <select id="manual-owner" class="setup-input">
          ${appData.owners.map((owner) => `<option value="${owner}" ${uiState.manualOwner === owner ? "selected" : ""}>${owner}</option>`).join("")}
        </select>
      </div>
    </div>
    <div class="draft-grid">
      <section class="draft-panel">
        <div class="draft-panel-head">
          <h3>Available Teams</h3>
          <p>Click a team to draft it to the current owner. Use commissioner controls above only when you need to override.</p>
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
                  <button class="draft-team draft-team-compact" type="button" data-team="${team.name}">
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
                    <button class="draft-team is-owned" type="button" data-team-unassign="${team.name}">
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
  document.querySelector("#season-setup").innerHTML = `
    <form id="season-setup-form" class="setup-form">
      <div class="setup-grid">
        <label class="setup-field">
          <span>Season Year</span>
          <input id="setup-season" class="setup-input" type="number" value="${appData.season}" />
        </label>
        <label class="setup-field">
          <span>Owners</span>
          <textarea id="setup-owners" class="setup-input setup-textarea" rows="6">${appData.owners.join("\n")}</textarea>
        </label>
      </div>
      <div class="setup-grid setup-grid-wide">
        <label class="setup-field">
          <span>Teams</span>
          <textarea id="setup-teams" class="setup-input setup-textarea" rows="18">${teamsToText(appData.teams)}</textarea>
          <small>One team per line: <code>seed, team name</code></small>
        </label>
        <label class="setup-field">
          <span>Scoring Matrix</span>
          <textarea id="setup-scoring" class="setup-input setup-textarea" rows="18">${scoringToText(appData.currentScoring)}</textarea>
          <small>JSON object keyed by seed with ${rounds.length} values per seed.</small>
        </label>
      </div>
      <div class="setup-actions">
        <button type="submit" ${uiState.savingSetup ? "disabled" : ""}>${uiState.savingSetup ? "Saving…" : "Save Season Config"}</button>
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
