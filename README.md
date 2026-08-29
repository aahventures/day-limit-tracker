# Day Limit Tracker

A calendar visualization tool for tracking days within a rolling window. Useful for:

- **Tax residency** - staying under 90 days in a 365-day window
- **Schengen visa** - 90 days within 180 days
- **Any rolling day limit** - configurable window and threshold

## Live Demo

https://aahventures.github.io/day-limit-tracker/

## Features

- Click to toggle days, Shift+click for range selection
- Configurable window size and day limit
- Preset configurations (365/90, Schengen 180/90)
- Visual stats with color gradients showing proximity to limits
- Sliding window to check any date range
- Jump to "most marked window" to find worst-case scenario
- Load/export dates as JSON
- Dates and window settings persist in browser localStorage (the view always opens on today)
- Keyboard navigation support

## Usage

1. Open `index.html` in a browser
2. Click days to mark them
3. Use the slider to move the rolling window
4. Watch the stats to stay under your limit

## Data Format

Load or export dates as JSON:

```json
[
  { "start": "2024-03-10", "end": "2024-03-25" },
  { "start": "2024-07-01", "end": "2024-07-14" }
]
```

## Development

```bash
npm install
npm run lint        # Check for issues
npm run lint:fix    # Auto-fix issues
npm run format      # Format with Prettier
```

## License

MIT
