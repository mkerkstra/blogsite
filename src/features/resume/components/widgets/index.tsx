import type { WidgetId } from "../../data/widget-id";

import { BattleMap } from "./battle-map";
import { Coldstart } from "./coldstart";
import { CompoundingArc } from "./compounding-arc";
import { FraudFilter } from "./fraud-filter";
import { Huddle } from "./huddle";
import { ReyreyTerminal } from "./reyrey-terminal";

// REGISTRY maps every WidgetId to its component. Adding a new widget is
// a three-step change: (1) extend the WidgetId union in data/widget-id,
// (2) create the component file next to this one, (3) wire it into the
// REGISTRY below. TypeScript enforces exhaustiveness via the
// `Record<WidgetId, ...>` type — missing an id fails typecheck.
const REGISTRY: Record<WidgetId, () => React.JSX.Element> = {
  "compounding-arc": CompoundingArc,
  huddle: Huddle,
  "fraud-filter": FraudFilter,
  coldstart: Coldstart,
  "reyrey-terminal": ReyreyTerminal,
  "battle-map": BattleMap,
};

export function Widget({ id }: { id: WidgetId }) {
  const Component = REGISTRY[id];
  if (!Component) return null;
  return <Component />;
}
