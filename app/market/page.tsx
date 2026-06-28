'use client'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import marketData from '@/app/_data/market.json'

export default function MarketPage() {
  const trendChartData = marketData.trendData.map(d => ({
    year: d.year,
    全球: d.global,
    中国: d.china
  }))

  return (
    <div>
      <header className="header">
        <h1>📊 市场分析</h1>
        <p>全球与中国天线市场规模、细分市场、增长驱动因素</p>
        <p className="update-info">数据更新：{marketData.lastUpdate}</p>
      </header>

      {/* 周报 banner（由 generate_banner_report.py 自动维护） */}
      {marketData.weekly_banner && (
        <section className="card weekly-banner">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            <h2 className="text-lg sm:text-xl font-semibold">📅 本周市场周报（{marketData.weekly_banner.period_label}）</h2>
            <span className="text-xs text-gray-500">
              生成时间：{marketData.weekly_banner.generated_at}
            </span>
          </div>
          <p className="text-base sm:text-lg leading-relaxed text-gray-700">
            {marketData.weekly_banner.highlight}
          </p>
          {marketData.weekly_banner.top_segment && (
            <p className="mt-2 text-sm text-gray-600">
              领跑细分：<strong>{marketData.weekly_banner.top_segment}</strong>
              {marketData.weekly_banner.top_segment_cagr && (
                <span>（CAGR {marketData.weekly_banner.top_segment_cagr}）</span>
              )}
            </p>
          )}
        </section>
      )}

      {/* 市场总览卡片 */}
      <section className="card">
        <h2 className="text-lg sm:text-xl font-semibold mb-4">🌐 市场总览</h2>
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-value">{marketData.summary.globalMarketSize2024}</div>
            <div className="stat-label">2024年全球天线市场规模</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{marketData.summary.chinaMarketSize2024}</div>
            <div className="stat-label">2024年中国市场规模</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{marketData.summary.forecast2030}</div>
            <div className="stat-label">2030年预测规模</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{marketData.summary.cagr}</div>
            <div className="stat-label">年复合增长率</div>
          </div>
        </div>
      </section>

      {/* 增长驱动因素 */}
      <section className="card">
        <h2 className="text-lg sm:text-xl font-semibold mb-4">🚀 增长驱动因素</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {marketData.keyDrivers.map((driver, i) => (
            <span key={i} className="tag">{driver}</span>
          ))}
        </div>
      </section>

      {/* 市场规模趋势图 */}
      <section className="card">
        <h2 className="text-lg sm:text-xl font-semibold mb-4">📈 市场规模趋势（2020-2030预测）</h2>
        <ResponsiveContainer width="100%" height={280} className="sm:h-80">
          <LineChart data={trendChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#999' }} tickLine={false} axisLine={{ stroke: '#e0e0e0' }} />
            <YAxis tick={{ fontSize: 11, fill: '#999' }} tickLine={false} axisLine={{ stroke: '#e0e0e0' }} tickFormatter={(v) => `${v}亿`} width={50} />
            <Tooltip formatter={(value: number) => [`${value} 亿元`, '']} contentStyle={{ borderRadius: '8px', border: '1px solid #e0e0e0', fontSize: '0.85rem' }} />
            <Legend wrapperStyle={{ fontSize: '0.85rem' }} />
            <Line type="monotone" dataKey="全球" stroke="#667eea" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            <Line type="monotone" dataKey="中国" stroke="#e53935" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </section>

      {/* 细分市场 - 全部渲染 */}
      <section className="card">
        <h2 className="text-lg sm:text-xl font-semibold mb-4">📈 细分市场详情</h2>
        <div className="segment-grid">
          {marketData.segments.map((seg, i) => (
            <div key={i} className="segment-card" style={{ borderTop: '3px solid #667eea' }}>
              <div className="segment-name">{seg.name}</div>

              {(seg.globalSize || seg.chinaSize) && (
                <div className="segment-stat">
                  <span>全球规模</span>
                  <span style={{ fontWeight: 600 }}>{seg.globalSize || '—'}</span>
                </div>
              )}
              {(seg.chinaSize) && (
                <div className="segment-stat">
                  <span>中国规模</span>
                  <span style={{ fontWeight: 600 }}>{seg.chinaSize}</span>
                </div>
              )}
              {seg.cagr && (
                <div className="segment-stat">
                  <span>年复合增长率</span>
                  <span style={{ fontWeight: 600, color: '#667eea' }}>{seg.cagr}</span>
                </div>
              )}
              {seg.forecastYear && seg.forecastGlobal && (
                <div className="segment-stat">
                  <span>预测年份</span>
                  <span>{seg.forecastYear}年全球 {seg.forecastGlobal}</span>
                </div>
              )}
              {seg.drivers && seg.drivers.length > 0 && (
                <div style={{ marginTop: '12px' }}>
                  <span style={{ fontSize: '12px', color: '#999' }}>驱动因素：</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                    {seg.drivers.map((d, j) => (
                      <span key={j} className="tag" style={{ fontSize: '0.75rem' }}>{d}</span>
                    ))}
                  </div>
                </div>
              )}
              {seg.types && seg.types.length > 0 && (
                <div style={{ marginTop: '12px' }}>
                  <span style={{ fontSize: '12px', color: '#999' }}>主要类型：</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                    {seg.types.map((t, j) => (
                      <span key={j} className="tag" style={{ fontSize: '0.75rem' }}>{t}</span>
                    ))}
                  </div>
                </div>
              )}
              {seg.keyPlayers && seg.keyPlayers.length > 0 && (
                <div style={{ marginTop: '12px' }}>
                  <span style={{ fontSize: '12px', color: '#999' }}>主要玩家：</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                    {seg.keyPlayers.map((p, j) => (
                      <span key={j} style={{
                        display: 'inline-block', padding: '2px 8px',
                        background: '#eef2ff', color: '#667eea',
                        borderRadius: '4px', fontSize: '0.75rem', fontWeight: 500
                      }}>{p}</span>
                    ))}
                  </div>
                </div>
              )}
              {seg.status && (
                <div style={{ marginTop: '10px', fontSize: '0.75rem', color: '#999', fontStyle: 'italic' }}>
                  {seg.status}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}