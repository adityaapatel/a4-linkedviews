# Assignment 4 - Brushing and Linking

**Aditya Patel- A4**

---

## 🎥 Live Demo
[View Visualization](https://adityaapatel.github.io/a4-linkedviews/)

---

## 📊 Description of Visualization

This visualization analyzes Drake Maye's 2025 season passing performance using real NFL data retrieved from ESPN's public API and stored locally as a CSV file.

The visualization consists of two linked charts: **a scatterplot and a histogram**.

### Scatterplot
Shows Air Yards (throw depth) on the x-axis and Expected Points Added (EPA) on the y-axis. Each point represents one pass attempt.

### Histogram
Shows the distribution of EPA values across all passes.

---

## 🔗 Brushing Interactions

The two views are linked through brushing interactions:

- **Brushing a region in the scatterplot** filters the histogram to show only the EPA distribution of the selected throws.

- **Brushing a range in the histogram** highlights the corresponding throws in the scatterplot.

---
## Screenshot
![screenshot](assets/screenshot.png)


## ✨ Technical Achievements

- Implemented two independent SVG visualizations using D3.js
- Used `d3.brush()` for 2D brushing in the scatterplot
- Used `d3.brushX()` for 1D range brushing in the histogram
- Implemented shared state between both views for coordinated filtering and highlighting
- Dynamic bin recalculation in histogram when scatter selection changes
- Data retrieved from ESPN API and converted into structured CSV format

---

## 🎨 Design Achievements

- Clear axis labeling and minimal visual styling for readability
- Coordinated highlighting (fading non-selected elements)
- Double-click reset behavior for both brushes
- Analytical framing focused on throw depth vs efficiency
- Simple interaction instructions provided on page

---

## 📚 Resources

- [Observable: D3 Brushing & Linking](https://observablehq.com/@philippkoytek/d3-part-3-brushing-and-linking)
- [D3 Brush Documentation](https://github.com/d3/d3-brush)
- [D3 Brush Examples](https://gist.github.com/nntrn/ee26cb2a0716de0947a0a4e9a157bc1c)
- [Drake Maye on ESPN](https://www.espn.com/nfl/player/_/id/4431452/drake-maye)

---

## 🤖 AI Usage

AI was used to help:
- Structure the D3 brushing logic
- Organize shared state between linked views
- Convert ESPN API JSON data into CSV format
- Refine README for clarity and organization
- Debug interaction behavior
