"use client"

import type { ReactNode } from "react"
import type { ChartConfig, Margins } from "./chart-context"
import type { BloomInput } from "./dither-paint"
import { PolarRoot } from "./polar-root"
import { RadarCanvas } from "./radar-canvas"
import { RadarFrame } from "./radar-frame"

// `object` rather than `Record<string, unknown>`: interfaces don't get an
// implicit index signature, so interface-typed rows failed to satisfy the
// generic. Internal layers still index rows through their own Row type.
type Row = object

export type RadarChartProps<TData extends Row> = {
  data: TData[]
  config: ChartConfig
  children: ReactNode
  nameKey: string // axis-label field
  margins?: Partial<Margins>
  className?: string
  animate?: boolean
  animationDuration?: number
  replayToken?: number
  bloom?: BloomInput
  bloomOnHover?: boolean
  defaultSelectedDataKey?: string | null
  onSelectionChange?: (key: string | null) => void
}

/** Composable dither **radar** chart. Compose `<Radar>` series, `<Legend>`, … inside. */
export function RadarChart<TData extends Row>(props: RadarChartProps<TData>) {
  return (
    <PolarRoot
      chartType="radar"
      Canvas={RadarCanvas}
      backDecoration={<RadarFrame />}
      dataKey=""
      {...props}
    />
  )
}
