'use client'

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card'
import { useState } from 'react'
import { ResponsiveScatterPlot } from '@nivo/scatterplot'
import { useTooltip } from '@nivo/tooltip'
import React from 'react'

// 👇 Custom Layer definition with glowing rings and sharp contrast
const CustomHoverLayer = ({ nodes, setHoveredClause }) => {
  const { showTooltipFromEvent, hideTooltip } = useTooltip()

  return (
    <g>
      {nodes.map((node, i) => {
        const color =
          node.data.impact === 'favourable'
            ? '#22c55e'
            : node.data.impact === 'unfavourable'
            ? '#ff2233'
            : '#f59e0b'

        return (
          <g key={i}>
            {/* Outer halo aura */}
            <circle
              cx={node.x}
              cy={node.y}
              r={16}
              fill={color}
              fillOpacity={0.3}
              stroke={color}
              strokeWidth={1.5}
            />
            {/* Inner radiant core with white border */}
            <circle
              cx={node.x}
              cy={node.y}
              r={7}
              fill={color}
              stroke="#ffffff"
              strokeWidth={2}
            />
            {/* Large invisible hit area */}
            <circle
              cx={node.x}
              cy={node.y}
              r={24}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setHoveredClause(node.data)}
              onMouseMove={(event) => {
                setHoveredClause(node.data)
                showTooltipFromEvent(
                  <div className="bg-zinc-950 text-white border border-red-500/50 w-64 rounded-lg p-2.5 text-xs shadow-2xl">
                    <div className="font-semibold text-red-400 mb-1 flex items-center justify-between">
                      <span>Clause #{i + 1}</span>
                      <span className="uppercase text-[10px] px-1.5 py-0.5 rounded bg-zinc-800">{node.data.impact}</span>
                    </div>
                    <p className="text-zinc-200 line-clamp-3">{node.data.summary}</p>
                  </div>,
                  event,
                  'top'
                )
              }}
              onMouseLeave={hideTooltip}
            />
          </g>
        )
      })}
    </g>
  )
}

export default function Report({ clausesData }) {
  const [hoveredClause, setHoveredClause] = useState(clausesData?.[0] || null)

  const data = [
    {
      id: 'Clauses',
      data: clausesData.map((clause) => ({
        x: clause.x,
        y: clause.y,
        ...clause,
      })),
    },
  ]

  return (
    <div className="flex flex-col xl:flex-row relative w-full p-4 gap-6">
      {/* Chart + Labels */}
      <div className="flex-1 relative min-h-[460px] bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-4 shadow-xl">
        <div className="flex items-center justify-between mb-2 px-2 text-xs font-medium text-zinc-400 border-b border-zinc-800 pb-2">
          <span className="text-emerald-400">👈 User favourable</span>
          <span className="text-red-400">Other party favourable 👉</span>
        </div>

        <div className="relative h-[400px]">
          <ResponsiveScatterPlot
            data={data}
            margin={{ top: 20, right: 30, bottom: 40, left: 40 }}
            xScale={{ type: 'linear', min: 0, max: 1 }}
            yScale={{ type: 'linear', min: 0, max: 1 }}
            blendMode="normal"
            nodeSize={18}
            colors={(d) => {
              switch (d.impact) {
                case 'favourable':
                  return '#22c55e'
                case 'unfavourable':
                  return '#ff2233'
                default:
                  return '#f59e0b'
              }
            }}
            axisTop={null}
            axisRight={null}
            axisBottom={{
              tickValues: [0, 0.5, 1],
              tickSize: 0,
              tickPadding: 10,
              legend: '← Favorability Axis →',
              legendPosition: 'middle',
              legendOffset: 32,
            }}
            axisLeft={{
              tickValues: [0, 0.5, 1],
              tickSize: 0,
              tickPadding: 10,
              legend: '← Risk & Impact Axis →',
              legendPosition: 'middle',
              legendOffset: -30,
            }}
            layers={[
              'grid',
              'axes',
              (props) => <CustomHoverLayer {...props} setHoveredClause={setHoveredClause} />,
            ]}
            theme={{
              grid: {
                line: {
                  stroke: '#27272a',
                  strokeWidth: 1,
                  strokeDasharray: '4 4',
                },
              },
              axis: {
                ticks: {
                  text: {
                    fill: '#71717a',
                    fontSize: 10,
                  },
                },
                legend: {
                  text: {
                    fill: '#a1a1aa',
                    fontSize: 11,
                  },
                },
              },
            }}
            role="application"
          />
        </div>
      </div>

      {/* Sidebar with full clause info */}
      <div className="w-full xl:w-[420px]">
        {hoveredClause ? (
          <Card className="w-full text-left bg-zinc-950/90 border border-zinc-800 shadow-2xl">
            <CardHeader className="pb-3 border-b border-zinc-800/80">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs uppercase font-mono tracking-wider px-2 py-0.5 rounded bg-red-950/60 text-red-400 border border-red-800/40">
                  {hoveredClause.impact}
                </span>
                <span className="text-xs text-zinc-400">
                  Favorability: <strong className="text-zinc-100">{hoveredClause.favorability_score}%</strong>
                </span>
              </div>
              <CardTitle className="text-base text-zinc-100 leading-snug">{hoveredClause.summary}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3.5 text-sm pt-4 overflow-auto max-h-[55vh] text-zinc-300">
              <div>
                <strong className="text-xs uppercase text-zinc-400 tracking-wider">Clause Original Text:</strong>
                <div className="mt-1 text-zinc-300 bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800/80 text-xs leading-relaxed">{hoveredClause.clause_text}</div>
              </div>
              {hoveredClause.pros?.length > 0 && (
                <div>
                  <strong className="text-xs uppercase text-emerald-400 tracking-wider">Favorable Points:</strong>
                  <ul className="mt-1 list-disc list-inside text-xs space-y-1 text-emerald-300/90">
                    {hoveredClause.pros.map((pro, i) => (
                      <li key={i}>{pro}</li>
                    ))}
                  </ul>
                </div>
              )}
              {hoveredClause.cons?.length > 0 && (
                <div>
                  <strong className="text-xs uppercase text-red-400 tracking-wider">Risks & Perils:</strong>
                  <ul className="mt-1 list-disc list-inside text-xs space-y-1 text-red-300/90">
                    {hoveredClause.cons.map((con, i) => (
                      <li key={i}>{con}</li>
                    ))}
                  </ul>
                </div>
              )}
              {hoveredClause.suggested_rewrite && (
                <div>
                  <strong className="text-xs uppercase text-cyan-400 tracking-wider">Suggested Dark Rewrite:</strong>
                  <div className="mt-1 text-zinc-300 bg-cyan-950/20 border border-cyan-900/40 p-2.5 rounded-lg text-xs leading-relaxed">{hoveredClause.suggested_rewrite}</div>
                </div>
              )}
              {hoveredClause.sith_view && (
                <div>
                  <strong className="text-xs uppercase text-red-500 tracking-wider flex items-center gap-1.5">
                    <span>⚔️</span> Sith Lord Interpretation:
                  </strong>
                  <div className="mt-1 italic text-zinc-300 bg-red-950/20 border border-red-900/40 p-2.5 rounded-lg text-xs leading-relaxed">{hoveredClause.sith_view}</div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="text-sm text-zinc-500 italic p-6 border border-dashed border-zinc-800 rounded-xl text-center">
            Hover over any glowing node on the scatterplot to inspect the clause.
          </div>
        )}
      </div>
    </div>
  )
}

