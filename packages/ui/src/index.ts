// packages/ui/src/index.ts
//
// Barrel export for Spectra UI component library.

export { MarketStatusBanner, type MarketStatusBannerProps } from "./MarketStatusBanner.js";
export { AnomalyFilters, type AnomalyFiltersProps, type AnomalyFilterType } from "./AnomalyFilters.js";
export { SectorTabs, type SectorTabsProps, type SectorType } from "./SectorTabs.js";
export { HeatmapView, type HeatmapViewProps, type HeatmapItem } from "./HeatmapView.js";
export { ScreenerTable, type ScreenerTableProps, type ScreenerRow } from "./ScreenerTable.js";
export { PlatformComparison, type PlatformComparisonProps, type PlatformQuote } from "./PlatformComparison.js";
export { TickerDetailView, type TickerDetailViewProps, type SignalDetail } from "./TickerDetailView.js";
export { FlowDashboard, type FlowDashboardProps, type FlowLeaderboardItem } from "./FlowDashboard.js";
export { TickerFlowChart, type TickerFlowChartProps, type FlowChartPoint } from "./TickerFlowChart.js";
export { WhaleTable, type WhaleTableProps, type WhaleAlertRow } from "./WhaleTable.js";
export { CrossPlatformFlow, type CrossPlatformFlowProps } from "./CrossPlatformFlow.js";
export { TemplateGallery, type TemplateGalleryProps, type TemplateCardItem } from "./TemplateGallery.js";
export { NLInput, type NLInputProps } from "./NLInput.js";
export { StrategyPreview, type StrategyPreviewProps } from "./StrategyPreview.js";
export { Simulator, type SimulatorProps, type SimulationResultView } from "./Simulator.js";
export { ExecutionLog, type ExecutionLogProps, type ExecutionRecordView } from "./ExecutionLog.js";
export { UnifiedLoopNav, type UnifiedLoopNavProps, type LoopStepMeta, type LoopStepId, LOOP_STEPS } from "./UnifiedLoopNav.js";
export { TickerTape, type TickerTapeProps, type TickerTapeSignal } from "./TickerTape.js";

// Motion & beUI components (DESIGN.md modern overhaul)
export { TiltCard, type TiltCardProps } from "./motion/TiltCard.js";
export { MorphingModal, type MorphingModalProps } from "./motion/MorphingModal.js";
export { AnimatedTabs, type AnimatedTabsProps, type TabItem } from "./motion/AnimatedTabs.js";
export { AnimatedButton, type AnimatedButtonProps } from "./motion/AnimatedButton.js";
export { ColorSelector, type ColorSelectorProps, type ColorOption } from "./motion/ColorSelector.js";
export { AnimatedBadge, type AnimatedBadgeProps } from "./motion/AnimatedBadge.js";
export * from "./motion/ease.js";
