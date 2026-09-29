# Spectra UI Overhaul Plan

## Scope

Modernize the entire Spectra frontend from inline-style React components to a polished, animated design system using:
- **Tailwind CSS v4** for utility-based styling
- **Framer Motion** (via `motion` package, already installed) for animations
- **beUI components** for premium animated elements
- **DESIGN.md tokens** (adapted for Spectra's dark financial terminal theme)

## Design Direction

Adapt DESIGN.md's Expo-inspired system for Spectra's **dark financial terminal** context:
- **Dark canvas** (`#0D0E12`) with elevated dark cards (`#16181D`, `#1E2329`)
- **Binance Gold accent** (`#F0B90B`) as the primary brand voltage
- **Rounded cards** (`12px`), rounded buttons (`8px`), smooth transitions
- **Inter** for UI text, **JetBrains Mono** for data/code surfaces
- **Spring animations** on cards, tabs, navigation transitions
- **Glassy/frosted effects** on overlays and modals

## Architecture Change

### Current State
- All UI in `packages/ui/src/*.tsx` using React inline `style={{}}` objects
- No CSS framework, no Tailwind, no animations
- Pages in `apps/web/src/app/` compose inline-styled components

### Target State
- **Tailwind CSS v4** configured in `apps/web` with custom design tokens
- **CSS module or globals.css** for base resets and custom utilities  
- `packages/ui` components use Tailwind classes + `motion` animations
- beUI components installed for: tabs, number animations, tilt cards, marquee, text animations, tooltips, loaders
- Smooth page transitions, card hover effects, animated data displays

## Phase Breakdown

### Phase A: Foundation (Tailwind + globals + design tokens)
1. Install & configure Tailwind CSS v4 in `apps/web`
2. Create `globals.css` with design tokens as CSS custom properties
3. Configure Tailwind theme with Spectra colors, radii, spacing
4. Add `motion` to `packages/ui` dependencies

### Phase B: Core Layout (Header + Footer + Layout)
1. Redesign `layout.tsx` — frosted glass header with blur, animated nav links
2. Redesign `FooterBar.tsx` / `TickerTape` — animated marquee, glass bar
3. Add page transition wrapper

### Phase C: Homepage / Market Intelligence (`/`)
1. Redesign `MarketStatusBanner` — animated status pill, live pulse
2. Redesign `SectorTabs` — spring-animated tab indicator (beUI tabs)
3. Redesign `AnomalyFilters` — animated filter chips
4. Redesign `HeatmapView` — tilt cards with hover glare
5. Redesign `ScreenerTable` — animated table rows, number animations
6. Redesign `TickerDetailView` — modal/drawer with morph animation
7. Redesign `PlatformComparison` — animated comparison cards

### Phase D: Flow Radar (`/flow`)
1. Redesign `FlowDashboard` — animated metric cards with number counters
2. Redesign `WhaleTable` — animated data table
3. Redesign `TickerFlowChart` — animated chart display
4. Redesign `CrossPlatformFlow` — animated venue comparison

### Phase E: Strategy Forge (`/forge`)
1. Redesign `TemplateGallery` — tilt cards with spring selection
2. Redesign `NLInput` — animated text input
3. Redesign `StrategyPreview` — code block styling
4. Redesign `Simulator` — animated results display
5. Redesign `ExecutionLog` — animated log entries

### Phase F: Unified Loop (`/loop`)
1. Redesign `UnifiedLoopNav` — stepper with spring indicator
2. Redesign all 4 stage panels with consistent card treatment

### Phase G: Polish & Iteration
1. Playwright screenshot loop per ui-iteration.md
2. Fix alignment, spacing, contrast issues
3. Ensure responsive behavior
4. Run full test suite

## beUI Components to Integrate

| beUI Component | Where Used |
|---|---|
| `tabs` | SectorTabs, AnomalyFilters, UnifiedLoopNav |
| `tilt-card` | HeatmapView cards, TemplateGallery |
| `marquee` | TickerTape signal stream |
| `number` | FlowDashboard metrics, ScreenerTable values |
| `text-animation` | MarketStatusBanner, page headers |
| `tooltip` | Data point hover info |
| `loader` | Loading states |
| `animated-badge` | Signal severity badges |
| `shared-layout-bg` | Navigation hover state |
| `table` | ScreenerTable, WhaleTable |

## Constraints
- Must preserve all existing test contracts (214 tests)
- Must preserve all data types and prop interfaces
- Financial math stays BigInt — no floating point
- `packages/ui` exports must remain compatible
