/**
 * Discriminated union of all widget IDs. WidgetId labels which data row
 * (highlight or project) gets which widget illustration. Adding a widget
 * means: (1) extend this union, (2) add a component file under
 * ../components/widgets/, (3) wire it into the dispatcher in
 * ../components/widgets/index.tsx.
 */
export type WidgetId =
  | "clinical-note"
  | "compounding-arc"
  | "huddle"
  | "ai-tooling"
  | "fraud-filter"
  | "coldstart"
  | "reyrey-terminal"
  | "battle-map";
