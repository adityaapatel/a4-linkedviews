const CSV_PATH = "data/drake_maye_2025_gamelog.csv";

// Shared state for linking
const state = {
  weekRange: null,       // [minWeek, maxWeek] from line brush
  selectedWeeks: null    // Set(week numbers) from scatter brush
};

d3.csv(CSV_PATH, d => ({
  week: +d.week,
  date: d.date,
  opponent: d.opponent,
  result: d.result,
  pass_yds: +d.pass_yds,
  pass_td: +d.pass_td,
  int: +d.int,
  qbr: +d.qbr
})).then(data => {
  data = data.filter(d =>
    Number.isFinite(d.week) &&
    Number.isFinite(d.pass_yds) &&
    Number.isFinite(d.pass_td) &&
    Number.isFinite(d.qbr)
  );

  // sort by week so line chart is clean
  data.sort((a, b) => a.week - b.week);

  const line = buildLine("#line", data);
  const scatter = buildScatter("#scatter", data);

  line.render(data);
  scatter.render(data);

  // LINK A -> B: week brush filters scatter (fade out-of-range)
  line.onBrush = (rangeOrNull) => {
    state.weekRange = rangeOrNull;
    scatter.applyFilter(data, keepGame(d => inWeekRange(d.week)));
  };

  // LINK B -> A: scatter brush selects games -> highlight weeks in line
  scatter.onBrush = (weekSetOrNull) => {
    state.selectedWeeks = weekSetOrNull;
    line.highlightWeeks(data, weekSetOrNull);
  };

  // initial no filters
  scatter.applyFilter(data, () => true);
  line.highlightWeeks(data, null);
});

// helpers
function inWeekRange(week) {
  if (!state.weekRange) return true;
  const [lo, hi] = state.weekRange;
  return week >= lo && week <= hi;
}
function keepGame(pred) {
  return pred;
}

// -------------------- LINE (QBR by Week) --------------------
function buildLine(container, data) {
  const W = 520, H = 360, m = { t: 10, r: 10, b: 40, l: 45 };
  const iw = W - m.l - m.r, ih = H - m.t - m.b;

  const svg = d3.select(container).append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`);

  const g = svg.append("g").attr("transform", `translate(${m.l},${m.t})`);

  const x = d3.scaleLinear()
    .domain(d3.extent(data, d => d.week)).nice()
    .range([0, iw]);

  const y = d3.scaleLinear()
    .domain(d3.extent(data, d => d.qbr)).nice()
    .range([ih, 0]);

  g.append("g").attr("transform", `translate(0,${ih})`).call(d3.axisBottom(x).ticks(10));
  g.append("g").call(d3.axisLeft(y).ticks(6));

  // labels
  svg.append("text")
    .attr("x", m.l + iw / 2).attr("y", H - 8)
    .attr("text-anchor", "middle").text("Week");
  svg.append("text")
    .attr("transform", `translate(14, ${m.t + ih/2}) rotate(-90)`)
    .attr("text-anchor", "middle").text("QBR");

  const lineGen = d3.line()
    .x(d => x(d.week))
    .y(d => y(d.qbr));

  const path = g.append("path").attr("class", "line");
  const ptsG = g.append("g");

  // brushX to select week range
  const brush = d3.brushX()
    .extent([[0, 0], [iw, ih]])
    .on("brush end", (event) => {
      if (!event.selection) {
        api.onBrush?.(null);
        return;
      }
      const [x0, x1] = event.selection;
      const lo = Math.round(x.invert(x0));
      const hi = Math.round(x.invert(x1));
      api.onBrush?.([Math.min(lo, hi), Math.max(lo, hi)]);
    });

  const brushG = g.append("g").attr("class", "brush").call(brush);
  svg.on("dblclick", () => brushG.call(brush.move, null));

  const api = {
    onBrush: null,

    render(arr) {
      path.datum(arr).attr("d", lineGen);

      ptsG.selectAll("circle")
        .data(arr, d => d.week)
        .join("circle")
        .attr("class", "weekpt")
        .attr("r", 3.3)
        .attr("cx", d => x(d.week))
        .attr("cy", d => y(d.qbr))
        .append("title")
        .text(d => `Week ${d.week}\nQBR ${d.qbr}`);
    },

    highlightWeeks(arr, weekSetOrNull) {
      ptsG.selectAll("circle")
        .classed("faded", d => weekSetOrNull ? !weekSetOrNull.has(d.week) : false);
    }
  };

  return api;
}

// -------------------- SCATTER (Pass Yds vs TD) --------------------
function buildScatter(container, data) {
  const W = 520, H = 360, m = { t: 10, r: 10, b: 40, l: 45 };
  const iw = W - m.l - m.r, ih = H - m.t - m.b;

  const svg = d3.select(container).append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`);

  const g = svg.append("g").attr("transform", `translate(${m.l},${m.t})`);

  const x = d3.scaleLinear()
    .domain(d3.extent(data, d => d.pass_yds)).nice()
    .range([0, iw]);

  const y = d3.scaleLinear()
    .domain(d3.extent(data, d => d.pass_td)).nice()
    .range([ih, 0]);

  g.append("g").attr("transform", `translate(0,${ih})`).call(d3.axisBottom(x).ticks(6));
  g.append("g").call(d3.axisLeft(y).ticks(6).tickFormat(d3.format("d")));

  svg.append("text")
    .attr("x", m.l + iw / 2).attr("y", H - 8)
    .attr("text-anchor", "middle").text("Passing Yards");
  svg.append("text")
    .attr("transform", `translate(14, ${m.t + ih/2}) rotate(-90)`)
    .attr("text-anchor", "middle").text("Passing TD");

  const dotsG = g.append("g");

  // 2D brush selects games
  const brush = d3.brush()
    .extent([[0, 0], [iw, ih]])
    .on("brush end", (event) => {
      if (!event.selection) {
        api.onBrush?.(null);
        return;
      }
      const [[x0, y0], [x1, y1]] = event.selection;

      const weeks = new Set();
      for (const d of data) {
        const px = x(d.pass_yds);
        const py = y(d.pass_td);
        if (px >= x0 && px <= x1 && py >= y0 && py <= y1) {
          weeks.add(d.week);
        }
      }
      api.onBrush?.(weeks);
    });

  const brushG = g.append("g").attr("class", "brush").call(brush);
  svg.on("dblclick", () => brushG.call(brush.move, null));

  const api = {
    onBrush: null,

    render(arr) {
      dotsG.selectAll("circle")
        .data(arr, d => d.week)
        .join("circle")
        .attr("class", "dot")
        .attr("r", 4)
        .attr("cx", d => x(d.pass_yds))
        .attr("cy", d => y(d.pass_td))
        .attr("fill", "#555")
        .append("title")
        .text(d => `Week ${d.week} vs ${d.opponent}\nYds ${d.pass_yds}, TD ${d.pass_td}\nQBR ${d.qbr}`);
    },

    applyFilter(arr, keepFn) {
      dotsG.selectAll("circle")
        .classed("faded", d => !keepFn(d));
    }
  };

  return api;
}
