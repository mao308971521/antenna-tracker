'use client'
import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import pricesData from '../../data/prices.json'

export default function PricesPage() {
  const [activeCategory, setActiveCategory] = useState(0)
  const [activeMaterial, setActiveMaterial] = useState(0)

  const currentCategory = pricesData.categories[activeCategory]
  const currentMat = currentCategory.materials[activeMaterial]
  const chartData = currentMat.historical.map(h => ({
    month: h.month,
    价格: h.price
  }))

  return (
    <div>
      <header className="header">
        <h1>💰 原材料价格</h1>
        <p>天线制造主要原材料价格走势 · 原材料分类：金属/塑胶/PCB板材</p>
        <p className="update-info">数据更新：{pricesData.lastUpdate}</p>
      </header>

      {/* 原材料分类Tab */}
      <section className="card">
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {pricesData.categories.map((cat, i) => (
            <button
              key={i}
              onClick={() => { setActiveCategory(i); setActiveMaterial(0) }}
              className="px-4 py-2 rounded-lg text-sm sm:text-base font-semibold transition-colors"
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: activeCategory === i ? '2px solid #667eea' : '2px solid #e0e0e0',
                background: activeCategory === i ? '#667eea' : 'white',
                color: activeCategory === i ? 'white' : '#333',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <p style={{ color: '#666', fontSize: '0.85rem', marginBottom: '8px' }}>{currentCategory.description}</p>
        </div>

        {/* 材料选择Tab */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {currentCategory.materials.map((mat, i) => (
            <button
              key={i}
              onClick={() => setActiveMaterial(i)}
              className="px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors"
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                border: activeMaterial === i ? '2px solid #667eea' : '2px solid #e0e0e0',
                background: activeMaterial === i ? '#eef2ff' : 'white',
                color: activeMaterial === i ? '#667eea' : '#666',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: activeMaterial === i ? 600 : 400,
              }}
            >
              {mat.name}
            </button>
          ))}
        </div>

        {/* 当前价格概览 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '16px',
          padding: '16px',
          background: '#f8f9fa',
          borderRadius: '12px',
          marginBottom: '24px',
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#999', marginBottom: '4px' }}>当前价格</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#333' }}>
              {currentMat.currentPrice.toLocaleString()} <span style={{ fontSize: '0.8rem', color: '#666' }}>{currentMat.unit}</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#999', marginBottom: '4px' }}>近期涨跌</div>
            <div style={{
              fontSize: '1.2rem',
              fontWeight: 700,
              color: currentMat.trend === '上涨' ? '#e53935' : currentMat.trend === '下跌' ? '#43a047' : '#666'
            }}>
              {currentMat.change}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#999', marginBottom: '4px' }}>趋势</div>
            <div style={{
              fontSize: '1rem',
              fontWeight: 600,
              color: currentMat.trend === '上涨' ? '#e53935' : currentMat.trend === '下跌' ? '#43a047' : '#666'
            }}>
              {currentMat.trend}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#999', marginBottom: '4px' }}>对天线行业的影响</div>
            <div style={{ fontSize: '0.85rem', color: '#333', lineHeight: 1.5 }}>{currentMat.impact}</div>
          </div>
        </div>

        {/* 折线图 */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '16px', color: '#333' }}>
            📈 {currentMat.name} 近24个月价格走势
          </h3>
          <ResponsiveContainer width="100%" height={280} className="sm:h-80">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 10, fill: '#999' }}
                tickLine={false}
                axisLine={{ stroke: '#e0e0e0' }}
                interval={2}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#999' }}
                tickLine={false}
                axisLine={{ stroke: '#e0e0e0' }}
                tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                width={45}
              />
              <Tooltip
                formatter={(value: number) => [`${value.toLocaleString()} ${currentMat.unit}`, '价格']}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e0e0e0', fontSize: '0.85rem' }}
              />
              <Legend wrapperStyle={{ fontSize: '0.85rem' }} />
              <Line
                type="monotone"
                dataKey="价格"
                stroke="#667eea"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#667eea' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 所有材料快速浏览表格 */}
        <div>
          <h3 style={{ fontSize: '1rem', marginBottom: '16px' }}>📋 {currentCategory.name} 分类材料一览</h3>
          <div className="overflow-x-auto">
            <table className="price-table">
              <thead>
                <tr>
                  <th>材料名称</th>
                  <th>当前价格</th>
                  <th>涨跌</th>
                  <th>趋势</th>
                  <th>对天线的影响</th>
                </tr>
              </thead>
              <tbody>
                {currentCategory.materials.map((mat, i) => (
                  <tr
                    key={i}
                    style={{ cursor: 'pointer', background: i === activeMaterial ? '#f0f4ff' : 'transparent' }}
                    onClick={() => setActiveMaterial(i)}
                  >
                    <td style={{ fontWeight: 600 }}>{mat.name}</td>
                    <td>{mat.currentPrice.toLocaleString()} {mat.unit}</td>
                    <td className={mat.trend === '上涨' ? 'price-up' : mat.trend === '下跌' ? 'price-down' : 'price-stable'}>
                      {mat.change}
                    </td>
                    <td className={mat.trend === '上涨' ? 'price-up' : mat.trend === '下跌' ? 'price-down' : 'price-stable'}>
                      {mat.trend}
                    </td>
                    <td style={{ fontSize: '11px', color: '#666' }}>{mat.impact}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}