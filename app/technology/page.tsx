'use client'
import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine, ScatterChart, Scatter, ZAxis } from 'recharts'
import techData from '../../data/technology.json'

const PHASE_COLORS: Record<string, string> = {
  'trigger': '#9c27b0',
  'peak': '#e53935',
  'trough': '#ff9800',
  'slope': '#2196f3',
  'plateau': '#43a047'
}

const PHASE_NAMES: Record<string, string> = {
  trigger: '技术触发期',
  peak: '泡沫顶峰期',
  trough: '幻灭低谷期',
  slope: '复苏爬坡期',
  plateau: '生产力平稳期'
}

const PHASE_ORDER = ['trigger', 'peak', 'trough', 'slope', 'plateau']

// Gartner Hype Cycle 理论曲线
const HYPE_CURVE = [
  { year: 2014, maturity: 1 },
  { year: 2016, maturity: 3 },
  { year: 2018, maturity: 7 },
  { year: 2020, maturity: 9 },
  { year: 2021, maturity: 6 },
  { year: 2023, maturity: 4 },
  { year: 2025, maturity: 5 },
  { year: 2027, maturity: 6.5 },
  { year: 2029, maturity: 7.5 },
  { year: 2032, maturity: 9 },
]

export default function TechnologyPage() {
  const [selectedTech, setSelectedTech] = useState(0)
  const [showHypeCycle, setShowHypeCycle] = useState(true)

  // 构建气泡图数据：X=涌现年份, Y=成熟度, Z=圆点大小
  const scatterData = techData.hypeCycle.technologies.map((t) => {
    const maturityMap: Record<string, number> = {
      trigger: 2, peak: 8, trough: 3, slope: 5, plateau: 9
    }
    return {
      name: t.name,
      nameCn: t.nameCn,
      phase: t.phase,
      year: t.yearEmerging,
      yearPeak: t.yearPeak,
      yearPlateau: t.yearPlateau,
      maturity: maturityMap[t.phase],
      confidence: t.confidence,
      currentStatus: t.currentStatus,
      color: PHASE_COLORS[t.phase]
    }
  })

  const currentTech = techData.technologyDetail[selectedTech]

  return (
    <div>
      <header className="header">
        <h1>🔬 行业技术</h1>
        <p>天线行业 Gartner 技术成熟度曲线 · 各技术发展现状 · 厂商路线对比</p>
        <p className="update-info">数据更新：{techData.lastUpdate}</p>
      </header>

      {/* 行业技术趋势概述 */}
      <section className="card">
        <h2 className="text-lg sm:text-xl font-semibold mb-4">📝 行业技术趋势综述</h2>
        <p style={{ color: '#555', lineHeight: 1.8, fontSize: '0.9rem' }}>{techData.industryOverview}</p>
      </section>

      {/* Gartner 曲线气泡图 */}
      <section className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <h2 className="text-lg sm:text-xl font-semibold">📊 Gartner 技术成熟度曲线（Hype Cycle）</h2>
          <button
            onClick={() => setShowHypeCycle(!showHypeCycle)}
            className="px-3 py-1.5 rounded-md text-xs sm:text-sm transition-colors"
            style={{
              padding: '6px 14px', borderRadius: '6px', border: '1px solid #e0e0e0',
              background: showHypeCycle ? '#667eea' : 'white',
              color: showHypeCycle ? 'white' : '#666', cursor: 'pointer', fontSize: '0.85rem'
            }}
          >
            {showHypeCycle ? '🙈 隐藏' : '👁️ 显示'}
          </button>
        </div>

        {/* 阶段图例 */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {PHASE_ORDER.map(phase => (
            <div key={phase} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: PHASE_COLORS[phase] }} />
              <span style={{ fontSize: '0.75rem', color: '#666' }}>{PHASE_NAMES[phase]}</span>
            </div>
          ))}
        </div>

        {showHypeCycle && (
          <>
            <p style={{ fontSize: '0.85rem', color: '#999', marginBottom: '12px' }}>
              💡 气泡大小表示技术重要度（仅供参考），点击气泡查看技术详情 ↓
            </p>

            {/* Gartner 参考曲线 + 气泡 */}
            <ResponsiveContainer width="100%" height={320} className="sm:h-96">
              <ScatterChart margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis
                  type="number" dataKey="year" name="年份"
                  domain={[2013, 2036]} tick={{ fontSize: 10, fill: '#999' }}
                  tickLine={false} axisLine={{ stroke: '#e0e0e0' }}
                  label={{ value: '年份', position: 'insideBottom', offset: -20, fontSize: 10, fill: '#999' }}
                />
                <YAxis
                  type="number" dataKey="maturity" name="成熟度" domain={[0, 10]}
                  tick={{ fontSize: 10, fill: '#999' }} tickLine={false}
                  axisLine={{ stroke: '#e0e0e0' }}
                  tickFormatter={(v) => v === 1 ? '触发' : v === 5 ? '低谷' : v === 9 ? '成熟' : ''}
                  width={45}
                  label={{ value: '成熟度', angle: -90, position: 'insideLeft', offset: 15, fontSize: 10, fill: '#999' }}
                />
                <ZAxis range={[40, 80]} />
                <Tooltip
                  formatter={(value: any, name: string) => {
                    if (name === 'maturity') return [`成熟度: ${value}/10`, '']
                    if (name === 'year') return [`涌现年份: ${value}`, '']
                    return [value, name]
                  }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e0e0e0', fontSize: '0.85rem' }}
                />
                {/* Gartner参考曲线 */}
                <Line data={HYPE_CURVE} type="monotone" dataKey="maturity"
                  stroke="#ccc" strokeWidth={2} dot={false} strokeDasharray="5 5"
                  legendType="none" />
                {/* 技术气泡 - 每项技术一个独立Scatter点，按phase着色 */}
                {scatterData.map((d, i) => (
                  <Scatter
                    key={i}
                    name={d.name}
                    data={[{ x: d.year, y: d.maturity, name: d.name, nameCn: d.nameCn, phase: d.phase }]}
                    fill={PHASE_COLORS[d.phase]}
                    onClick={() => {
                      const idx = techData.technologyDetail.findIndex(t => t.name === d.name || t.nameCn === d.nameCn)
                      if (idx >= 0) { setSelectedTech(idx); setShowHypeCycle(false) }
                    }}
                    shape={(props: any) => <circle {...props} r={7} opacity={0.85} />}
                  />
                ))}
              </ScatterChart>
            </ResponsiveContainer>

            {/* 技术列表 - 气泡颜色标识 */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
              {techData.hypeCycle.technologies.map((tech, i) => (
                <div
                  key={i}
                  onClick={() => { setSelectedTech(i); setShowHypeCycle(false) }}
                  className="px-2 py-1 rounded-full text-xs cursor-pointer transition-colors"
                  style={{
                    padding: '4px 10px',
                    borderRadius: '16px',
                    border: `1.5px solid ${PHASE_COLORS[tech.phase]}`,
                    background: selectedTech === i ? PHASE_COLORS[tech.phase] + '25' : 'white',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: selectedTech === i ? 600 : 400,
                    color: selectedTech === i ? PHASE_COLORS[tech.phase] : '#555',
                  }}
                >
                  <span style={{ color: PHASE_COLORS[tech.phase], marginRight: '4px' }}>●</span>
                  {tech.nameCn}
                  <span style={{ fontSize: '0.65rem', color: '#999', marginLeft: '4px' }}>
                    {tech.yearEmerging}→{tech.yearPlateau}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* 技术详情 */}
      <section className="card">
        <h2 className="text-lg sm:text-xl font-semibold mb-4">🔍 技术深度解析</h2>
        {/* 技术选择Tab */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
          {techData.technologyDetail.map((tech, i) => (
            <button
              key={i}
              onClick={() => setSelectedTech(i)}
              className="px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors"
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                border: selectedTech === i ? '2px solid #667eea' : '2px solid #e0e0e0',
                background: selectedTech === i ? '#eef2ff' : 'white',
                color: selectedTech === i ? '#667eea' : '#666',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: selectedTech === i ? 600 : 400,
              }}
            >
              {tech.nameCn}
            </button>
          ))}
        </div>

        {currentTech && (
          <>
            <div style={{
              padding: '16px', background: '#f8f9fa', borderRadius: '12px',
              borderLeft: '4px solid #667eea', marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#333' }}>{currentTech.nameCn}</h3>
                <span style={{
                  padding: '4px 10px', background: '#e3f2fd', color: '#1976d2',
                  borderRadius: '20px', fontSize: '0.75rem'
                }}>{currentTech.category}</span>
                <span style={{
                  padding: '4px 10px', background: '#fff3e0', color: '#e65100',
                  borderRadius: '20px', fontSize: '0.75rem'
                }}>
                  成熟度 {currentTech.maturityLevel}/9
                </span>
              </div>
              <p style={{ color: '#555', lineHeight: 1.7, margin: 0, fontSize: '0.9rem' }}>{currentTech.currentStatus}</p>
            </div>

            {/* 主流技术路线 */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '0.95rem', color: '#333', marginBottom: '12px' }}>🔧 主流技术路线</h4>
              <div>
                {currentTech.mainstreamRoutes.map((route, i) => (
                  <div key={i} style={{
                    padding: '10px 14px',
                    background: i % 2 === 0 ? '#fafafa' : 'white',
                    borderRadius: '8px', marginBottom: '6px',
                    display: 'flex', gap: '10px', alignItems: 'flex-start'
                  }}>
                    <span style={{ fontWeight: 700, color: '#667eea', minWidth: '20px' }}>{i + 1}.</span>
                    <span style={{ color: '#555', lineHeight: 1.6, fontSize: '0.9rem' }}>{route}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 主要厂商分析 */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '0.95rem', color: '#333', marginBottom: '12px' }}>🏭 主要厂商技术路线对比</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
                {Object.entries(currentTech.vendorAnalysis).map(([vendor, analysis]) => (
                  <div key={vendor} style={{
                    padding: '12px', background: '#f8f9fa', borderRadius: '8px',
                    borderTop: '2px solid #667eea'
                  }}>
                    <div style={{ fontWeight: 700, color: '#333', marginBottom: '6px', fontSize: '0.9rem' }}>{vendor}</div>
                    <div style={{ fontSize: '0.8rem', color: '#666', lineHeight: 1.6 }}>{analysis}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 主流发展方向 */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '0.95rem', color: '#333', marginBottom: '12px' }}>🚀 主流发展方向</h4>
              <div style={{ padding: '12px', background: '#e8f5e9', borderRadius: '8px' }}>
                <p style={{ color: '#2e7d32', margin: 0, lineHeight: 1.7, fontSize: '0.9rem' }}>{currentTech.developmentDirection}</p>
              </div>
            </div>

            {/* 技术难点 */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '0.95rem', color: '#333', marginBottom: '12px' }}>⚠️ 技术难点与挑战</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {currentTech.challenges.map((ch, i) => (
                  <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <span style={{ color: '#e53935', fontWeight: 700 }}>●</span>
                    <span style={{ color: '#555', lineHeight: 1.6, fontSize: '0.9rem' }}>{ch}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 商用时间线 */}
            <div>
              <h4 style={{ fontSize: '0.95rem', color: '#333', marginBottom: '12px' }}>⏰ 商用时间线预测</h4>
              <div style={{ padding: '12px', background: '#e3f2fd', borderRadius: '8px' }}>
                <p style={{ color: '#1565c0', margin: 0, fontWeight: 500, fontSize: '0.9rem' }}>{currentTech.timeline}</p>
              </div>
            </div>
          </>
        )}
      </section>

      {/* 分类总览 */}
      <section className="card">
        <h2 className="text-lg sm:text-xl font-semibold mb-4">📋 技术分类总览</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
          {techData.categorySummary.map((cat, i) => (
            <div key={i} style={{
              padding: '14px', background: '#f8f9fa', borderRadius: '10px',
              borderLeft: '3px solid #667eea'
            }}>
              <div style={{ fontWeight: 700, color: '#333', marginBottom: '6px', fontSize: '0.95rem' }}>{cat.nameCn}</div>
              <div style={{ fontSize: '0.85rem', color: '#666', lineHeight: 1.6, marginBottom: '8px' }}>
                {cat.description}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#999' }}>
                <span style={{ fontWeight: 600 }}>代表厂商：</span>{cat.keyPlayers}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}