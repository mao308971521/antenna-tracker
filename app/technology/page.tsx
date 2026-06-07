'use client'
import { useState } from 'react'
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis, Line, ComposedChart } from 'recharts'
import techData from '../../data/technology.json'

// TRL 阶段颜色（从低到高）
const TRL_COLORS = [
  '#e53935', '#f57c00', '#ff9800', '#ffb74d', '#fdd835',
  '#cddc39', '#8bc34a', '#43a047', '#2e7d32',
]

const PHASE_COLORS: Record<string, string> = {
  'trigger': '#e53935',
  'peak': '#f57c00',
  'trough': '#ff9800',
  'slope': '#8bc34a',
  'plateau': '#2e7d32',
}

const PHASE_NAMES: Record<string, string> = {
  trigger: '概念期', peak: '过热期', trough: '低谷期', slope: '爬坡期', plateau: '成熟期',
}

// 每个技术的 TRL 等级（1-9）、期望值（0-10）、投资规模（气泡大小相对值）
const TECH_PLOT_DATA = [
  { name: 'THz Antenna',            nameCn: '太赫兹通信天线',       trl: 2, expectation: 5, investment: 20,  phase: 'trigger' },
  { name: 'RIS',                   nameCn: 'RIS智能超表面',         trl: 4, expectation: 6, investment: 45,  phase: 'trough' },
  { name: 'Digital Twin Antenna',  nameCn: '数字孪生天线',          trl: 4, expectation: 5, investment: 30,  phase: 'trough' },
  { name: 'Lens Antenna',          nameCn: '透镜天线',              trl: 5, expectation: 6, investment: 40,  phase: 'slope' },
  { name: 'AI Beamforming',        nameCn: 'AI辅助波束赋形',        trl: 5, expectation: 7, investment: 60,  phase: 'slope' },
  { name: 'Spectrum Sharing',       nameCn: '频谱共享天线',          trl: 5, expectation: 6, investment: 50,  phase: 'slope' },
  { name: 'Luneburg Lens Antenna', nameCn: '龙伯透镜天线',          trl: 6, expectation: 7, investment: 55,  phase: 'peak' },
  { name: 'Wearable Flexible',     nameCn: '柔性/可穿戴天线',       trl: 6, expectation: 6, investment: 50,  phase: 'slope' },
  { name: 'Satcom Phased Array',   nameCn: '卫星平板相控阵',         trl: 7, expectation: 8, investment: 75,  phase: 'slope' },
  { name: '5G NR mmWave',          nameCn: '5G毫米波天线',          trl: 8, expectation: 8, investment: 90,  phase: 'slope' },
  { name: 'Phased Array Antenna', nameCn: '相控阵天线',             trl: 7, expectation: 8, investment: 85,  phase: 'slope' },
  { name: 'LCP/LDS Antenna',       nameCn: 'LCP/LDS天线',           trl: 8, expectation: 9, investment: 90,  phase: 'plateau' },
  { name: 'Massive MIMO',          nameCn: '大规模天线阵列',        trl: 9, expectation: 9, investment: 100, phase: 'plateau' },
  { name: 'AAU',                   nameCn: '有源天线单元(AAU)',      trl: 9, expectation: 9, investment: 100, phase: 'plateau' },
]

const HYPE_CURVE = [
  { trl: 1, y: 3 }, { trl: 2, y: 5 }, { trl: 3, y: 8 }, { trl: 4, y: 4 },
  { trl: 5, y: 5 }, { trl: 6, y: 6 }, { trl: 7, y: 7 }, { trl: 8, y: 8 }, { trl: 9, y: 9 },
]

// 气泡名称 → technologyDetail 索引（按新增后的顺序）
const TECH_NAME_MAP: Record<string, number> = {
  'THz Antenna': 13, 'RIS': 1, 'Digital Twin Antenna': 11, 'Lens Antenna': 9,
  'AI Beamforming': 5, 'Spectrum Sharing': 10, 'Luneburg Lens Antenna': 6,
  'Wearable Flexible': 8, 'Satcom Phased Array': 7, '5G NR mmWave': 2,
  'Phased Array Antenna': 3, 'LCP/LDS Antenna': 4, 'Massive MIMO': 0, 'AAU': 12,
}

function ChartContent({ techPlotData, hypeCurveData, phaseColors, phaseNames, onTechSelect }: {
  techPlotData: typeof TECH_PLOT_DATA
  hypeCurveData: typeof HYPE_CURVE
  phaseColors: typeof PHASE_COLORS
  phaseNames: typeof PHASE_NAMES
  onTechSelect: (detailIdx: number) => void
}) {
  const handleBubbleClick = (techName: string) => {
    const detailIdx = TECH_NAME_MAP[techName] ?? 0
    onTechSelect(detailIdx)
  }

  return (
    <ResponsiveContainer width="100%" height={420}>
      <ComposedChart margin={{ top: 10, right: 30, left: 0, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" />
        <XAxis
          type="number" dataKey="trl" name="TRL"
          domain={[0.5, 9.5]} tick={{ fontSize: 11, fill: '#999' }}
          tickLine={false} axisLine={{ stroke: '#e0e0e0' }}
          label={{ value: 'TRL（技术成熟度等级）→', position: 'insideBottom', offset: -12, fontSize: 11, fill: '#999' }}
          ticks={[1, 2, 3, 4, 5, 6, 7, 8, 9]}
          tickFormatter={(v) => ['基本原理','概念形成','实验验证','实验室验证','相关验证','环境演示','原型演示','系统定型','规模商用'][v - 1]}
        />
        <YAxis
          type="number" dataKey="expectation" name="期望值" domain={[0, 10]}
          tick={{ fontSize: 11, fill: '#999' }} tickLine={false}
          axisLine={{ stroke: '#e0e0e0' }}
          tickFormatter={(v) => v <= 3 ? '低' : v <= 6 ? '中' : '高'}
          width={42}
          label={{ value: '市场期望值 →', angle: -90, position: 'insideLeft', offset: 10, fontSize: 11, fill: '#999' }}
        />
        <ZAxis range={[80, 600]} />
        <Tooltip
          cursor={{ strokeDasharray: '3 3' }}
          content={({ active, payload }) => {
            if (!active || !payload || !payload.length) return null
            const d = payload[0]?.payload
            if (!d || !d.name) return null
            return (
              <div style={{
                background: 'white', border: `2px solid ${phaseColors[d.phase]}`,
                borderRadius: '10px', padding: '12px 16px', fontSize: '0.85rem',
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)', maxWidth: '300px'
              }}>
                <div style={{ fontWeight: 700, color: '#333', marginBottom: '6px', fontSize: '1rem' }}>{d.nameCn}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '8px' }}>
                  <div style={{ background: '#f5f5f5', borderRadius: '6px', padding: '6px 8px' }}>
                    <div style={{ fontSize: '0.7rem', color: '#999' }}>成熟等级</div>
                    <div style={{ fontWeight: 700, color: '#333', fontSize: '1.1rem' }}>TRL {d.trl}</div>
                  </div>
                  <div style={{ background: '#f5f5f5', borderRadius: '6px', padding: '6px 8px' }}>
                    <div style={{ fontSize: '0.7rem', color: '#999' }}>市场期望</div>
                    <div style={{ fontWeight: 700, color: '#333', fontSize: '1.1rem' }}>{d.expectation}/10</div>
                  </div>
                </div>
                <div style={{ fontSize: '0.75rem', color: phaseColors[d.phase], fontWeight: 600 }}>
                  ● {phaseNames[d.phase]}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '4px' }}>
                  投资规模：{d.investment}%
                </div>
              </div>
            )
          }}
        />
        <Line type="monotone" data={hypeCurveData} dataKey="y" stroke="#4A90D9" strokeWidth={3} strokeDasharray="8 4" dot={false} legendType="none" isAnimationActive={false} />
        <Scatter
          data={techPlotData}
          shape={(props: any) => {
            const { cx = 0, cy = 0, payload } = props
            if (!payload || !payload.name) return <g />
            const r = Math.sqrt(payload.investment) * 2.2
            const labelFontSize = Math.max(7, Math.min(11, r / 7))
            const tx = cx + r + 6
            const ty = cy - r * 0.3
            return (
              <g onClick={() => handleBubbleClick(payload.name)}>
                <circle cx={cx} cy={cy} r={r + 4} fill={phaseColors[payload.phase]} opacity={0.12} />
                <circle cx={cx} cy={cy} r={r} fill={phaseColors[payload.phase]} opacity={0.82} stroke="white" strokeWidth={2} style={{ cursor: 'pointer' }} />
                <text x={tx} y={ty} fontSize={labelFontSize} fill="#444" textAnchor="start" dominantBaseline="auto" style={{ pointerEvents: 'none', fontWeight: 500 }}>
                  {payload.nameCn}
                </text>
                <title>{payload.nameCn}</title>
              </g>
            )
          }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

export default function TechnologyPage() {
  const [selectedTech, setSelectedTech] = useState(0)
  const [showHypeCycle, setShowHypeCycle] = useState(true)

  const handleBubbleSelect = (detailIdx: number) => setSelectedTech(detailIdx)

  const currentTech = techData.technologyDetail[selectedTech]

  return (
    <div>
      <header className="header">
        <h1>🔬 行业技术</h1>
        <p>天线行业技术成熟度（TRL）· 市场期望 · 投资规模 三维视图</p>
        <p className="update-info">数据更新：{techData.lastUpdate}</p>
      </header>

      <section className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>📊 技术成熟度 × 市场期望 × 投资规模</h2>
          <button
            onClick={() => setShowHypeCycle(!showHypeCycle)}
            style={{
              padding: '6px 16px', borderRadius: '6px', border: '1px solid #e0e0e0',
              background: showHypeCycle ? '#667eea' : 'white',
              color: showHypeCycle ? 'white' : '#666', cursor: 'pointer', fontSize: '0.85rem'
            }}
          >
            {showHypeCycle ? '🙈 隐藏图表' : '👁️ 显示图表'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '16px', fontSize: '0.8rem', color: '#666' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#888' }}>X轴：</span>
            <span style={{ fontWeight: 600, color: '#333' }}>TRL 1-9</span>
            <span style={{ color: '#999' }}>（技术成熟度，1=原理验证，9=规模商用）</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#888' }}>Y轴：</span>
            <span style={{ fontWeight: 600, color: '#333' }}>期望值</span>
            <span style={{ color: '#999' }}>（市场/资本期望，高≠成熟）</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#888' }}>气泡大小：</span>
            <span style={{ fontWeight: 600, color: '#333' }}>投资规模</span>
            <span style={{ color: '#999' }}>（行业应用广度/资本投入量）</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
          {Object.entries(PHASE_NAMES).map(([phase, name]) => (
            <div key={phase} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: PHASE_COLORS[phase] }} />
              <span style={{ fontSize: '0.78rem', color: '#555' }}>{name}</span>
            </div>
          ))}
        </div>

        <div style={{ flex: 1, height: '6px', borderRadius: '3px', overflow: 'hidden', marginBottom: '4px' }}>
          {TRL_COLORS.map((c, i) => <div key={i} style={{ flex: 1, background: c }} />)}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#999', marginBottom: '16px' }}>
          <span>不成熟</span><span>→</span><span>→</span><span>→</span><span>→</span><span>→</span><span>→</span><span>→</span><span>规模商用</span>
        </div>
        {showHypeCycle && (
          <>
            <div style={{ width: '100%', height: '420px', background: '#fafafa', borderRadius: '12px', overflow: 'hidden' }}>
              <ChartContent
                techPlotData={TECH_PLOT_DATA}
                hypeCurveData={HYPE_CURVE}
                phaseColors={PHASE_COLORS}
                phaseNames={PHASE_NAMES}
                onTechSelect={handleBubbleSelect}
              />
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '20px' }}>
              {TECH_PLOT_DATA.map((tech, i) => {
                const detailIdx = TECH_NAME_MAP[tech.name] ?? i
                return (
                  <div
                    key={i}
                    onClick={() => setSelectedTech(detailIdx)}
                    style={{
                      padding: '5px 12px', borderRadius: '14px',
                      border: `1.5px solid ${PHASE_COLORS[tech.phase]}`,
                      background: selectedTech === detailIdx ? PHASE_COLORS[tech.phase] + '22' : 'white',
                      cursor: 'pointer', fontSize: '0.78rem',
                      fontWeight: selectedTech === detailIdx ? 600 : 400,
                      color: selectedTech === detailIdx ? PHASE_COLORS[tech.phase] : '#444',
                    }}
                  >
                    <span style={{ color: PHASE_COLORS[tech.phase], marginRight: '3px' }}>●</span>
                    {tech.nameCn}
                    <span style={{ fontSize: '0.7rem', color: '#aaa', marginLeft: '4px' }}>T{tech.trl}</span>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </section>

      <section className="card">
        <h2>🔍 技术深度解析</h2>
        <div style={{ padding: '14px 18px', background: '#f0f4ff', borderRadius: '10px', marginBottom: '24px', fontSize: '0.88rem', color: '#555' }}>
          👆 点击上方气泡或在底部标签栏选择技术，查看对应深度解析
        </div>

        {currentTech && (
          <>
            <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '12px', borderLeft: '4px solid #667eea', marginBottom: '24px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#333' }}>{currentTech.nameCn}</h3>
                <span style={{ padding: '4px 12px', background: '#e3f2fd', color: '#1976d2', borderRadius: '20px', fontSize: '0.8rem' }}>{currentTech.category}</span>
                <span style={{ padding: '4px 12px', background: '#fff3e0', color: '#e65100', borderRadius: '20px', fontSize: '0.8rem' }}>成熟度 {currentTech.maturityLevel}/9</span>
              </div>
              <p style={{ color: '#555', lineHeight: 1.7, margin: 0 }}>{currentTech.currentStatus}</p>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '1rem', color: '#333', marginBottom: '12px' }}>🔧 主流技术路线</h4>
              <div>
                {currentTech.mainstreamRoutes.map((route, i) => (
                  <div key={i} style={{ padding: '12px 16px', background: i % 2 === 0 ? '#fafafa' : 'white', borderRadius: '8px', marginBottom: '8px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <span style={{ fontWeight: 700, color: '#667eea', minWidth: '20px' }}>{i + 1}.</span>
                    <span style={{ color: '#555', lineHeight: 1.6 }}>{route}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '1rem', color: '#333', marginBottom: '12px' }}>🏭 主要厂商技术路线对比</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                {Object.entries(currentTech.vendorAnalysis).map(([vendor, analysis]) => (
                  <div key={vendor} style={{ padding: '14px', background: '#f8f9fa', borderRadius: '8px', borderTop: '2px solid #667eea' }}>
                    <div style={{ fontWeight: 700, color: '#333', marginBottom: '6px' }}>{vendor}</div>
                    <div style={{ fontSize: '0.85rem', color: '#666', lineHeight: 1.6 }}>{analysis as string}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '1rem', color: '#333', marginBottom: '12px' }}>🚀 主流发展方向</h4>
              <div style={{ padding: '14px', background: '#e8f5e9', borderRadius: '8px' }}>
                <p style={{ color: '#2e7d32', margin: 0, lineHeight: 1.7 }}>{currentTech.developmentDirection}</p>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '1rem', color: '#333', marginBottom: '12px' }}>⚠️ 技术难点与挑战</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {currentTech.challenges.map((ch, i) => (
                  <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <span style={{ color: '#e53935', fontWeight: 700 }}>●</span>
                    <span style={{ color: '#555', lineHeight: 1.6 }}>{ch}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '1rem', color: '#333', marginBottom: '12px' }}>⏰ 商用时间线预测</h4>
              <div style={{ padding: '14px', background: '#e3f2fd', borderRadius: '8px' }}>
                <p style={{ color: '#1565c0', margin: 0, fontWeight: 500 }}>{currentTech.timeline}</p>
              </div>
            </div>
          </>
        )}
      </section>

      <section className="card">
        <h2>📋 技术分类总览</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
          {techData.categorySummary.map((cat, i) => (
            <div key={i} style={{ padding: '16px', background: '#f8f9fa', borderRadius: '10px', borderLeft: '3px solid #667eea' }}>
              <div style={{ fontWeight: 700, color: '#333', marginBottom: '6px' }}>{cat.nameCn}</div>
              <div style={{ fontSize: '0.85rem', color: '#666', lineHeight: 1.6, marginBottom: '8px' }}>{cat.description}</div>
              <div style={{ fontSize: '0.8rem', color: '#999' }}>
                <span style={{ fontWeight: 600 }}>代表厂商：</span>{cat.keyPlayers}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}