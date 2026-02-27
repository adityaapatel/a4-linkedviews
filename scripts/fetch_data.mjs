import fs from "fs/promises";

const ATHLETE_ID = 4431452; // Drake "Drake Maye" Maye
const SEASON = 2025;

// ESPN gamelog endpoint (undocumented, can be inconsistent, so we try to be flexible in parsing)
const URL = `https://site.web.api.espn.com/apis/common/v3/sports/football/nfl/athletes/${ATHLETE_ID}/gamelog?season=${SEASON}`;

function clean(v) {
  if (v === null || v === undefined) return "";
  return String(v).replaceAll(",", " "); // keep CSV simple
}
function num(v) {
  const x = Number(v);
  return Number.isFinite(x) ? x : "";
}
// Try multiple label options to find the right stat, since ESPN can be inconsistent
function findStat(statsArr, wantedLabels) {
  if (!Array.isArray(statsArr)) return "";
  // ESPN often returns stats like: [{label:"YDS", value:"245"}, ...]
  for (const label of wantedLabels) {
    const hit = statsArr.find(s => (s?.label || "").toUpperCase() === label);
    if (hit && hit.value !== undefined) return hit.value;
  }
  return "";
}
// convert array of row objects to CSV string
function rowsToCsv(rows) {
  const header = [
    "week",
    "date",
    "opponent",
    "result",
    "pass_yds",
    "pass_td",
    "int",
    "qbr"
  ];
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(header.map(h => clean(r[h])).join(","));
  }
  return lines.join("\n") + "\n";
}
// Main async function to fetch, parse, and save data
async function main() 
{
  console.log(`Fetching gamelog for athlete ${ATHLETE_ID} season ${SEASON}...`);
const res = await fetch(URL);
if (!res.ok) {
  throw new Error(`Fetch failed ${res.status}: ${URL}`);
}
const json = await res.json();

// locate games in a flexible way
let events =
  json?.events ||
  json?.gamelog?.events ||
  json?.gamelog ||
  [];

// If events is an object but not an array, extract values
if (typeof events === "object" && !Array.isArray(events)) {
  events = Object.values(events);
}

if (!Array.isArray(events) || events.length === 0) {
  console.log("Could not find events array. Here are top-level keys:", Object.keys(json || {}));
  throw new Error("No events found in ESPN gamelog response.");
}

// parse each game into a simple row
const rows = events.map((ev, idx) => {
  const week = ev?.week?.number ?? ev?.week ?? ev?.competition?.week?.number ?? "";
  const date = ev?.date || ev?.gameDate || ev?.competition?.date || "";
  const opp = ev?.opponent?.displayName || ev?.opponent?.shortDisplayName || ev?.opponent?.name || "";
  const result = ev?.result || ev?.atVs || ev?.gameResult || "";

  // Log full first event to understand structure
  if (idx === 0) {
    console.log("Sample full event keys:");
    console.log(JSON.stringify(Object.keys(ev).sort(), null, 2).slice(0, 500));
  }

  // Stats: attempt to find passing yds/td/int, qbr
  const stats = ev?.stats || ev?.statistics || ev?.playerStats || [];

  const passYds = findStat(stats, ["YDS", "PASSYDS", "PYDS"]);
  const passTd  = findStat(stats, ["TD", "PASSTD", "PTD"]);
  const ints    = findStat(stats, ["INT", "INTS"]);
  const qbr     = findStat(stats, ["QBR"]);

  return {
    week: week,
    date: date ? date.slice(0, 10) : "",
    opponent: opp,
    result: result,
    pass_yds: num(passYds),
    pass_td: num(passTd),
    int: num(ints),
    qbr: num(qbr)
  };
}).filter(r => r.week !== "");

// Ensure output dir exists
await fs.mkdir("data", { recursive: true });

const outPath = "data/drake_maye_2025_gamelog.csv";
await fs.writeFile(outPath, rowsToCsv(rows), "utf8");

console.log(`Saved ${rows.length} rows to ${outPath}`);
console.log(`Source: ${URL}`);
}

main().catch(err => console.error("Error:", err));
