'use client'
import { useMemo } from 'react'
import marketDataRaw from '@/app/_data/market.json'
import newsDataRaw from '@/app/_data/news.json'
import companiesDataRaw from '@/app/_data/companies.json'
import pricesDataRaw from '@/app/_data/prices.json'
import standardsDataRaw from '@/app/_data/standards.json'

const marketData: any = marketDataRaw
const newsData: any = newsDataRaw
const companiesData: any = companiesDataRaw
const pricesData: any = pricesDataRaw
const standardsData: any = standardsDataRaw

import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
         XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function Home() {
  const newsArray = Object.values(newsData) as any[]

  // companiesData tier 结构
  const tierOrder = [
    'tier1_operators', 'tier2_equipment_vendors', 'tier3_antenna_oems',
    'tier4_antenna_parts', 'tier5_rf_parts', 'tier6_key_materials', 'tier7_raw_materials'
  ]
  const allCompanies = useMemo(() => {
    const chain = (companiesData as any).supplyChain || {}
    return tierOrder.flatMap(tier => (chain[tier]?.companies || []) as any[])
  }, [])

  // pricesData
  const allMaterials = useMemo(() => {
    return (pricesData as any).categories?.flatMap((cat: any) => cat.materials || []) || []
  }, [])

  // standardsData
  const allStandards = useMemo(() => {
    return (standardsData as any).categories?.flatMap((cat: any) => cat.standards || []) || []
  }, [])

  return (
    <div className="container">
      {/* Header */}
      <header className="header">
        <h1>📡 天线行业情报追踪</h1>
        <p>市场研究 · 行业动态 · 企业追踪 · 价格监测 · 标准更新 · 技术前沿</p>
        <p className="update-info">数据更新：{marketData.lastUpdate}</p>
      </header>

      {/* === 市场概览 === */}
      <section className="card">
        <h2 className="text-lg sm:text-xl font-semibold mb-4">📊 市场概览</h2>
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-value">{marketData.summary.globalMarketSize2024}</div>
            <div className="stat-label">2024全球天线市场规模</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{marketData.summary.chinaMarketSize2024}</div>
            <div className="stat-label">2024中国市场规模</div>
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
        <h3 style={{ marginTop: '24px' }} className="text-base sm:text-lg font-semibold">🚀 增长驱动因素</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {(marketData.keyDrivers as any[]).map((driver: any, i: any) => (
            <span key={i} className="tag">{driver}</span>
          ))}
        </div>
      </section>

      {/* === 市场规模趋势 === */}
      <section className="card">
        <h2 className="text-lg sm:text-xl font-semibold mb-4">📈 市场规模趋势 (2020-2030)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={marketData.trendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(value: any) => `${value}亿元`} />
            <Legend />
            <Line type="monotone" dataKey="global" name="全球市场" stroke="#0088FE" strokeWidth={2} />
            <Line type="monotone" dataKey="china" name="中国市场" stroke="#00C49F" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </section>

      {/* === 细分市场占比 === */}
      <section className="card">
        <h2 className="text-lg sm:text-xl font-semibold mb-4">🥧 细分市场占比</h2>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={marketData.segmentData}
              cx="50%"
              cy="50%"
              outerRadius={100}
              dataKey="value"
              label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {marketData.segmentData.map((entry: any, index: any) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value: any) => `${value}亿元`} />
          </PieChart>
        </ResponsiveContainer>
      </section>

      {/* === 细分市场详情 === */}
      <section className="card">
        <h2 className="text-lg sm:text-xl font-semibold mb-4">📋 细分市场详情</h2>
        <div className="segment-grid">
          {(marketData.segments as any[]).map((seg: any, i: any) => (
            <div key={i} className="segment-card">
              <div className="segment-name">{seg.name}</div>
              {seg.globalSize && (
                <div className="segment-stat">
                  <span>全球规模</span>
                  <span>{seg.globalSize}</span>
                </div>
              )}
              {seg.chinaSize && (
                <div className="segment-stat">
                  <span>中国规模</span>
                  <span>{seg.chinaSize}</span>
                </div>
              )}
              {seg.cagr && (
                <div className="segment-stat">
                  <span>年复合增长率</span>
                  <span style={{ color: '#667eea', fontWeight: 600 }}>{seg.cagr}</span>
                </div>
              )}
              {seg.drivers && seg.drivers.length > 0 && (
                <div style={{ marginTop: '12px' }}>
                  <span style={{ fontSize: '12px', color: '#999' }}>驱动因素：</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                    {seg.drivers.map((d: any, j: any) => (
                      <span key={j} className="tag" style={{ fontSize: '0.75rem' }}>{d}</span>
                    ))}
                  </div>
                </div>
              )}
              {seg.types && seg.types.length > 0 && (
                <div style={{ marginTop: '12px' }}>
                  <span style={{ fontSize: '12px', color: '#999' }}>主要类型：</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                    {seg.types.map((t: any, j: any) => (
                      <span key={j} className="tag" style={{ fontSize: '0.75rem' }}>{t}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* === 行业动态 === */}
      <section className="card">
        <h2>📰 行业动态 <span style={{ fontSize: '0.9rem', color: '#999' }}>({newsArray.length}条)</span></h2>
        {newsArray.length === 0 ? (
          <p style={{ color: '#999', textAlign: 'center', padding: '40px' }}>暂无数据</p>
        ) : (
          <ul className="news-list">
            {newsArray.slice(0, 10).map((news: any) => (
              <li key={news.id} className="news-item">
                <div className="news-date">{news.date} · {news.source}</div>
                <div className="news-title">
                  {news.url ? (
                    <a href={news.url} target="_blank" rel="noopener noreferrer">{news.title}</a>
                  ) : news.title}
                </div>
                <div className="news-summary">{news.summary}</div>
                {news.tags && news.tags.length > 0 && (
                  <div className="news-tags">
                    {news.tags.map((tag: string, j: number) => (
                      <span key={j} className="tag">{tag}</span>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* === 重点企业 === */}
      <section className="card">
        <h2 className="text-lg sm:text-xl font-semibold mb-4">🏭 重点企业 <span style={{ fontSize: '0.9rem', color: '#999' }}>({allCompanies.length}家)</span></h2>
        {allCompanies.length === 0 ? (
          <p style={{ color: '#999', textAlign: 'center', padding: '40px' }}>暂无数据</p>
        ) : (
          <div className="company-grid">
            {allCompanies.slice(0, 12).map((company: any, i: number) => (
              <div key={i} className="company-card">
                <div className="company-name">{company.name}</div>
                <div className="company-country">{company.location || ''}</div>
                <div style={{ fontSize: '13px', color: '#666', marginTop: '8px' }}>
                  {company.position || company.role || ''}
                </div>
                {company.highlights && company.highlights.length > 0 && (
                  <div style={{ marginTop: '8px' }}>
                    {company.highlights.slice(0, 3).map((h: string, j: number) => (
                      <span key={j} className="product-tag" style={{ marginRight: '4px' }}>{h}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* === 原材料价格 === */}
      <section className="card">
        <h2 className="text-lg sm:text-xl font-semibold mb-4">💰 原材料价格 <span style={{ fontSize: '0.9rem', color: '#999' }}>({allMaterials.length}种)</span></h2>
        <div className="overflow-x-auto">
          <table className="price-table">
            <thead>
              <tr>
                <th>材料</th>
                <th>当前价格</th>
                <th>涨跌</th>
                <th>趋势</th>
                <th>对天线的影响</th>
              </tr>
            </thead>
            <tbody>
              {allMaterials.slice(0, 20).map((price: any, i: number) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{price.name}</td>
                  <td>{price.currentPrice.toLocaleString()} {price.unit}</td>
                  <td className={price.trend === '上涨' ? 'price-up' : price.trend === '下跌' ? 'price-down' : 'price-stable'}>
                    {price.change}
                  </td>
                  <td className={price.trend === '上涨' ? 'price-up' : price.trend === '下跌' ? 'price-down' : 'price-stable'}>
                    {price.trend}
                  </td>
                  <td style={{ fontSize: '12px', color: '#999' }}>{price.impact}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* === 行业标准 === */}
      <section className="card">
        <h2 className="text-lg sm:text-xl font-semibold mb-4">📋 行业标准 <span style={{ fontSize: '0.9rem', color: '#999' }}>({allStandards.length}条)</span></h2>
        <ul className="standards-list">
          {allStandards.slice(0, 15).map((std: any, i: number) => (
            <li key={i} className="standard-item">
              <div className="standard-name">{std.name}</div>
              <div className="standard-title">{std.title}</div>
              <div className="standard-meta">
                {std.organization} · {std.publishDate} · 状态：{std.status}
              </div>
              <div style={{ fontSize: '13px', color: '#666', marginTop: '8px' }}>{std.description}</div>
            </li>
          ))}
        </ul>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>天线行业情报追踪系统 · 数据持续更新中</p>
      </footer>
    </div>
  )
}
