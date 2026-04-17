import { dom } from "./dom.js";

const glossaryGroups = [
  {
    title: "Core Score Terms",
    terms: [
      {
        term: "Team-Building Value",
        meaning: "The main all-in board score for roster construction. It balances talent, playing time, role fit, upside, and risk instead of treating raw production alone as the answer.",
      },
      {
        term: "Blended Talent",
        meaning: "Overall player quality after combining preseason prior expectations with bounded current-season signal.",
      },
      {
        term: "Blended Playing Time",
        meaning: "Expected opportunity after combining prior role expectation with live-season usage evidence.",
      },
      {
        term: "Upside",
        meaning: "Ceiling view of the player if the role and skill outcomes break well.",
      },
      {
        term: "Floor",
        meaning: "Lower-end usable outcome. High floor means the player is easier to trust even if the ceiling is not elite.",
      },
    ],
  },
  {
    title: "Hitter Terms",
    terms: [
      {
        term: "Starter Probability",
        meaning: "Likelihood the hitter keeps a regular lineup role rather than falling into partial or bench usage.",
      },
      {
        term: "Stability",
        meaning: "Reliability proxy combining sample confidence and role durability. Higher stability usually means less projection volatility.",
      },
      {
        term: "Platoon Risk",
        meaning: "Risk that the hitter loses role value because of handedness splits or reduced everyday access.",
      },
      {
        term: "Current wOBA Diff",
        meaning: "Difference between current wOBA and projected offensive quality. Positive means the hitter is outperforming the projection right now; negative means the current line is lighter than the projection baseline.",
      },
      {
        term: "Weighted PA Sample",
        meaning: "The prior plate appearance sample behind the preseason base. Larger weighted samples usually make the prior more trustworthy.",
      },
    ],
  },
  {
    title: "Pitcher Terms",
    terms: [
      {
        term: "Blended Run Prevention",
        meaning: "Pitcher quality score centered on preventing runs after combining priors and current-season performance.",
      },
      {
        term: "Blended Pitch Quality",
        meaning: "Pitch-quality score driven mostly by prior stuff, location, and shape indicators rather than only ERA outcomes.",
      },
      {
        term: "Projected Role Bucket",
        meaning: "Model role class such as starter, closer, high-leverage reliever, swingman, or reliever. It helps determine workload and slot fit.",
      },
      {
        term: "Current ERA Diff",
        meaning: "Difference between current ERA and projected ERA. Negative means the pitcher is currently preventing runs better than the model baseline.",
      },
      {
        term: "Weighted IP Sample",
        meaning: "Weighted historical innings sample used to build the pitcher prior. Larger samples usually mean the base skill view is more stable.",
      },
    ],
  },
  {
    title: "Team And Roster Terms",
    terms: [
      {
        term: "Season Estimate",
        meaning: "Team-level wins estimate built from selected hitters and pitchers. The app scales the roster to a full-season team offense and staff, then applies a Pythagorean win formula.",
      },
      {
        term: "Runs Scored / Runs Allowed",
        meaning: "The core team outputs behind the season estimate. Roster moves matter when they shift one or both of these totals.",
      },
      {
        term: "Roster Role",
        meaning: "Viewer-facing label for how the player is expected to help a team, such as core lineup bat or front-line starter.",
      },
      {
        term: "162-Game Pace",
        meaning: "Current-season production pace normalized to a full MLB season. It is useful for context, but it is not the same thing as the projection.",
      },
      {
        term: "Decision View vs Projected Stats",
        meaning: "Decision view emphasizes roster-fit scores and trust signals. Projected stats view emphasizes raw expected production lines such as PA, HR, ERA, or IP.",
      },
    ],
  },
];

function termMarkup(entry) {
  return `
    <details class="dictionary-card">
      <summary>
        <span>${entry.term}</span>
      </summary>
      <p>${entry.meaning}</p>
    </details>
  `;
}

export function renderGlossary() {
  if (!dom.dictionaryGrid) {
    return;
  }

  dom.dictionaryGrid.innerHTML = glossaryGroups
    .map(
      (group) => `
        <section class="dictionary-group">
          <h3>${group.title}</h3>
          <div class="dictionary-cards">
            ${group.terms.map((entry) => termMarkup(entry)).join("")}
          </div>
        </section>
      `,
    )
    .join("");
}
