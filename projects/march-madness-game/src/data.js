export const owners = ["Berkman", "Cory", "Shuster", "Seiden"];

export const rounds = [
  "Round of 32 Appearance",
  "Sweet 16 Appearance",
  "Elite 8 Appearance",
  "Final Four Appearance",
  "Championship Appearance",
  "Champion"
];

export const roundOrder = Object.fromEntries(rounds.map((round, index) => [round, index]));

export const currentScoring = {
  1: [0, 2, 4, 7, 12, 20],
  2: [1, 2, 5, 9, 14, 23],
  3: [1, 2, 6, 12, 16, 25],
  4: [1, 3, 8, 15, 20, 30],
  5: [1, 3, 8, 15, 20, 30],
  6: [1, 4, 10, 20, 28, 35],
  7: [1, 4, 10, 20, 28, 35],
  8: [2, 5, 12, 25, 35, 45],
  9: [2, 5, 12, 25, 35, 45],
  10: [2, 5, 12, 25, 35, 45],
  11: [3, 6, 15, 30, 40, 50],
  12: [3, 6, 15, 30, 40, 50],
  13: [3, 6, 15, 30, 40, 50],
  14: [5, 12, 20, 32, 40, 50],
  15: [5, 12, 20, 32, 40, 50],
  16: [10, 20, 35, 50, 10000, 10000000]
};

// Historical advancement rates by seed from the modern 64-team era.
// Source: BetFirm/Boyds Bets 2026 seed-history table.
export const seedProbabilities = {
  1: [0.988, 0.85, 0.669, 0.413, 0.256, 0.163],
  2: [0.931, 0.638, 0.45, 0.2, 0.081, 0.031],
  3: [0.856, 0.525, 0.256, 0.106, 0.069, 0.025],
  4: [0.794, 0.481, 0.156, 0.094, 0.025, 0.013],
  5: [0.644, 0.344, 0.075, 0.056, 0.025, 0],
  6: [0.613, 0.294, 0.106, 0.019, 0.013, 0.006],
  7: [0.613, 0.181, 0.063, 0.019, 0.006, 0.006],
  8: [0.481, 0.1, 0.056, 0.038, 0.025, 0.006],
  9: [0.519, 0.05, 0.031, 0.013, 0, 0],
  10: [0.388, 0.156, 0.056, 0.006, 0, 0],
  11: [0.388, 0.169, 0.063, 0.038, 0, 0],
  12: [0.356, 0.138, 0.013, 0, 0, 0],
  13: [0.206, 0.038, 0, 0, 0, 0],
  14: [0.144, 0.013, 0, 0, 0, 0],
  15: [0.069, 0.025, 0.006, 0, 0, 0],
  16: [0.013, 0, 0, 0, 0, 0]
};

export const scoringSourceUrl = "https://www.betfirm.com/seeds-national-championship-odds/";

export const teams = [
  ["Duke", 1, "Shuster"], ["Arizona", 1, "Berkman"], ["Michigan", 1, "Cory"], ["Florida", 1, "Seiden"],
  ["Houston", 2, "Cory"], ["UConn", 2, "Cory"], ["Iowa St", 2, "Seiden"], ["Purdue", 2, "Shuster"],
  ["Michigan St", 3, "Berkman"], ["Illinois", 3, "Berkman"], ["Gonzaga", 3, "Berkman"], ["Virginia", 3, "Seiden"],
  ["Nebraska", 4, "Shuster"], ["Alabama", 4, "Shuster"], ["Kansas", 4, "Seiden"], ["Arkansas", 4, "Shuster"],
  ["Vanderbilt", 5, "Seiden"], ["St John's (NY)", 5, "Shuster"], ["Texas Tech", 5, "Cory"], ["Wisconsin", 5, "Seiden"],
  ["Tennessee", 6, "Berkman"], ["North Carolina", 6, "Cory"], ["Louisville", 6, "Cory"], ["BYU", 6, "Cory"],
  ["Kentucky", 7, "Berkman"], ["Saint Mary's (CA)", 7, "Seiden"], ["Miami (FL)", 7, "Berkman"], ["UCLA", 7, "Berkman"],
  ["Clemson", 8, "Shuster"], ["Villanova", 8, "Cory"], ["Ohio St", 8, "Cory"], ["Georgia", 8, "Shuster"],
  ["Utah St", 9, "Seiden"], ["TCU", 9, "Seiden"], ["Saint Louis", 9, "Berkman"], ["Iowa", 9, "Cory"],
  ["Santa Clara", 10, "Shuster"], ["UCF", 10, "Seiden"], ["Missouri", 10, "Shuster"], ["Texas A&M", 10, "Shuster"],
  ["Texas", 11, "Seiden"], ["SMU", 11, "Shuster"], ["Miami (OH)", 11, "Shuster"], ["VCU", 11, "Berkman"], ["South Fla", 11, "Berkman"],
  ["McNeese", 12, "Cory"], ["Akron", 12, "Berkman"], ["UNI", 12, "Seiden"], ["High Point", 12, "Cory"],
  ["California Baptist", 13, "Shuster"], ["Hofstra", 13, "Seiden"], ["Troy", 13, "Berkman"], ["Hawaii", 13, "Cory"],
  ["North Dakota St", 14, "Berkman"], ["Penn", 14, "Seiden"], ["Wright St", 14, "Shuster"], ["Kennesaw St", 14, "Cory"],
  ["Tennessee St", 15, "Seiden"], ["Idaho", 15, "Cory"], ["Furman", 15, "Berkman"], ["Queens (NC)", 15, "Shuster"],
  ["Siena", 16, "Cory"], ["LIU", 16, "Seiden"], ["Howard", 16, "Shuster"], ["Prairie View", 16, "Berkman"]
].map(([name, seed, owner]) => ({ name, seed, owner }));

export const games = [
  ["Duke", "Siena", "Duke", "Round of 32 Appearance"],
  ["Ohio St", "TCU", "TCU", "Round of 32 Appearance"],
  ["St John's (NY)", "UNI", "St John's (NY)", "Round of 32 Appearance"],
  ["Kansas", "California Baptist", "Kansas", "Round of 32 Appearance"],
  ["Louisville", "South Fla", "Louisville", "Round of 32 Appearance"],
  ["Michigan St", "North Dakota St", "Michigan St", "Round of 32 Appearance"],
  ["UCLA", "UCF", "UCLA", "Round of 32 Appearance"],
  ["UConn", "Furman", "UConn", "Round of 32 Appearance"],
  ["Florida", "Prairie View", "Florida", "Round of 32 Appearance"],
  ["Clemson", "Iowa", "Iowa", "Round of 32 Appearance"],
  ["Vanderbilt", "McNeese", "Vanderbilt", "Round of 32 Appearance"],
  ["Nebraska", "Troy", "Nebraska", "Round of 32 Appearance"],
  ["North Carolina", "VCU", "VCU", "Round of 32 Appearance"],
  ["Illinois", "Penn", "Illinois", "Round of 32 Appearance"],
  ["Saint Mary's (CA)", "Texas A&M", "Texas A&M", "Round of 32 Appearance"],
  ["Houston", "Idaho", "Houston", "Round of 32 Appearance"],
  ["Arizona", "LIU", "Arizona", "Round of 32 Appearance"],
  ["Villanova", "Utah St", "Utah St", "Round of 32 Appearance"],
  ["Wisconsin", "High Point", "High Point", "Round of 32 Appearance"],
  ["Arkansas", "Hawaii", "Arkansas", "Round of 32 Appearance"],
  ["BYU", "Texas", "Texas", "Round of 32 Appearance"],
  ["Gonzaga", "Kennesaw St", "Gonzaga", "Round of 32 Appearance"],
  ["Miami (FL)", "Missouri", "Miami (FL)", "Round of 32 Appearance"],
  ["Purdue", "Queens (NC)", "Purdue", "Round of 32 Appearance"],
  ["Michigan", "Howard", "Michigan", "Round of 32 Appearance"],
  ["Georgia", "Saint Louis", "Saint Louis", "Round of 32 Appearance"],
  ["Texas Tech", "Akron", "Texas Tech", "Round of 32 Appearance"],
  ["Alabama", "Hofstra", "Alabama", "Round of 32 Appearance"],
  ["Tennessee", "Miami (OH)", "Tennessee", "Round of 32 Appearance"],
  ["Virginia", "Wright St", "Virginia", "Round of 32 Appearance"],
  ["Kentucky", "Santa Clara", "Kentucky", "Round of 32 Appearance"],
  ["Iowa St", "Tennessee St", "Iowa St", "Round of 32 Appearance"],
  ["Duke", "TCU", "Duke", "Sweet 16 Appearance"],
  ["St John's (NY)", "Kansas", "St John's (NY)", "Sweet 16 Appearance"],
  ["Louisville", "Michigan St", "Michigan St", "Sweet 16 Appearance"],
  ["UCLA", "UConn", "UConn", "Sweet 16 Appearance"],
  ["Florida", "Iowa", "Iowa", "Sweet 16 Appearance"],
  ["Vanderbilt", "Nebraska", "Nebraska", "Sweet 16 Appearance"],
  ["VCU", "Illinois", "Illinois", "Sweet 16 Appearance"],
  ["Texas A&M", "Houston", "Houston", "Sweet 16 Appearance"],
  ["Arizona", "Utah St", "Arizona", "Sweet 16 Appearance"],
  ["High Point", "Arkansas", "Arkansas", "Sweet 16 Appearance"],
  ["Texas", "Gonzaga", "Texas", "Sweet 16 Appearance"],
  ["Miami (FL)", "Purdue", "Purdue", "Sweet 16 Appearance"],
  ["Michigan", "Saint Louis", "Michigan", "Sweet 16 Appearance"],
  ["Texas Tech", "Alabama", "Alabama", "Sweet 16 Appearance"],
  ["Tennessee", "Virginia", "Tennessee", "Sweet 16 Appearance"],
  ["Kentucky", "Iowa St", "Iowa St", "Sweet 16 Appearance"],
  ["Duke", "St John's (NY)", "Duke", "Elite 8 Appearance"],
  ["Michigan St", "UConn", "UConn", "Elite 8 Appearance"],
  ["Iowa", "Nebraska", "Iowa", "Elite 8 Appearance"],
  ["Illinois", "Houston", "Illinois", "Elite 8 Appearance"],
  ["Arizona", "Arkansas", "Arizona", "Elite 8 Appearance"],
  ["Texas", "Purdue", "Purdue", "Elite 8 Appearance"],
  ["Michigan", "Alabama", "Michigan", "Elite 8 Appearance"],
  ["Tennessee", "Iowa St", "Tennessee", "Elite 8 Appearance"],
  ["Duke", "UConn", "UConn", "Final Four Appearance"],
  ["Iowa", "Illinois", "Illinois", "Final Four Appearance"],
  ["Arizona", "Purdue", "Arizona", "Final Four Appearance"],
  ["Michigan", "Tennessee", "Michigan", "Final Four Appearance"],
  ["UConn", "Illinois", "UConn", "Championship Appearance"],
  ["Arizona", "Michigan", "Michigan", "Championship Appearance"],
  ["UConn", "Michigan", null, "Champion"]
].map(([topTeam, bottomTeam, winner, round]) => ({ topTeam, bottomTeam, winner, round }));
