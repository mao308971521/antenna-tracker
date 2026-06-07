'use client'
import { useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import pricesData from '@/app/_data/prices.json'

export default function PricesPage() {
  const [activeCategory, setActiveCategory] = useState(0)
  const [activeMaterial, setActiveMaterial] = useState(0)

  const currentCategory = pricesData.categories[activeCategory]
  const currentMat = currentCategory.materials[activeMaterial]

  // 只显示近6个月数据（避免旧数据干扰）
  const chartData = useMemo(() => {
    const hist = currentMat.historical || []
    return hist.slice(-6).map(h => ({
      month: h.month,
      price: h.price,
      unit: currentMat.unit,
    }))
  }, [currentMat])

  const fmtYAxis = (v: number) => {
    if (currentMat.unit === '元/克') return v.toFixed(1)
    if (v >= 10000) return `${(v / 10000).toFixed(1)}万`
    if (v >= 1000) return v.toLocaleString()
    return v.toString()
  }

  // Y轴范围动态计算：让价格曲线占满图表至少1/3高度
  const yDomain = useMemo(() => {
    const prices = chartData.map(d => d.price)
    if (prices.length === 0) return [0, 100]
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    const range = max - min
    // 上下各留5%边距，但确保最低点不低于 chart 下边缘的 15% 处
    const lowerPadding = range * 0.15
    const upperPadding = range * 0.15
    const domainMin = Math.max(0, min - lowerPadding)
    const domainMax = max + upperPadding
    // 如果价格全相同，用 ±10% 代替
    if (range === 0) return [min * 0.9, max * 1.1]
    return [domainMin, domainMax]
  }, [chartData])

  return (
    <div>
      <header className="header">
        <h1>💰 原材料价格</h1>
        <p>天线制造主要原材料价格走势 · 数据来源：长江有色/SMM/我的钢铁网</p>
        <p className="update-info">数据更新：{pricesData.lastUpdate}</p>
      </header>

      {/* 数据来源 */}
      <div style={{ marginBottom: '16px', padding: '10px 16px', background: '#f0f4ff', borderRadius: '8px', fontSize: '0.8rem', color: '#555' }}>
        <span style={{ fontWeight: 600, color: '#667eea' }}>📡 数据来源：</span>
        长江有色金属网 ccmn.cn · 上海有色网 SMM · 我的钢铁网 mysteel.com · 金投网
      </div>

      {/* 原材料分类Tab */}
      <section className="card">
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {pricesData.categories.map((cat, i) => (
            <button
              key={i}
              onClick={() => { setActiveCategory(i); setActiveMaterial(0) }}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: activeCategory === i ? '2px solid #667eea' : '2px solid #e0e0e0',
                background: activeCategory === i ? '#667eea' : 'white',
                color: activeCategory === i ? 'white' : '#333',
                cursor: 'pointer',
                fontSize: '0.95rem',
                fontWeight: 600,
              }}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '8px' }}>{currentCategory.description}</p>
        </div>

        {/* 材料选择Tab */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {currentCategory.materials.map((mat, i) => (
            <button
              key={i}
              onClick={() => setActiveMaterial(i)}
              style={{
                padding: '6px 16px',
                borderRadius: '20px',
                border: activeMaterial === i ? '2px solid #667eea' : '2px solid #e0e0e0',
                background: activeMaterial === i ? '#eef2ff' : 'white',
                color: activeMaterial === i ? '#667eea' : '#666',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: activeMaterial === i ? 600 : 400,
              }}
            >
              {mat.name}
            </button>
          ))}
        </div>

        {/* 当前价格概览 */}
        <div style={{
          display: 'flex',
          gap: '20px',
          padding: '20px',
          background: '#f8f9fa',
          borderRadius: '12px',
          marginBottom: '24px',
          flexWrap: 'wrap'
        }}>
          <div style={{ flex: 1, minWidth: '140px' }}>
            <div style={{ fontSize: '0.78rem', color: '#999', marginBottom: '4px' }}>当前价格</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#333' }}>
              {currentMat.currentPrice.toLocaleString()}
              <span style={{ fontSize: '0.9rem', color: '#666', marginLeft: '4px' }}>{currentMat.unit}</span>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: '140px' }}>
            <div style={{ fontSize: '0.78rem', color: '#999', marginBottom: '4px' }}>近期涨跌</div>
            <div style={{
              fontSize: '1.5rem', fontWeight: 700,
              color: currentMat.trend === '上涨' ? '#e53935' : currentMat.trend === '下跌' ? '#43a047' : '#666'
            }}>
              {currentMat.change}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: '140px' }}>
            <div style={{ fontSize: '0.78rem', color: '#999', marginBottom: '4px' }}>趋势</div>
            <div style={{
              fontSize: '1.2rem', fontWeight: 600,
              color: currentMat.trend === '上涨' ? '#e53935' : currentMat.trend === '下跌' ? '#43a047' : '#666'
            }}>
              {currentMat.trend}
            </div>
          </div>
          <div style={{ flex: 2, minWidth: '240px' }}>
            <div style={{ fontSize: '0.78rem', color: '#999', marginBottom: '4px' }}>对天线行业的影响</div>
            <div style={{ fontSize: '0.95rem', color: '#333', lineHeight: 1.5 }}>{currentMat.impact}</div>
          </div>
        </div>

        {/* 折线图：近6个月 */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <h3 style={{ fontSize: '1rem', color: '#333', margin: 0 }}>
              📈 {currentMat.name} 近6个月价格走势
            </h3>
            {currentMat.dataSource && (
              <span style={{ fontSize: '0.72rem', color: '#999', background: '#f5f5f5', padding: '3px 10px', borderRadius: '10px' }}>
                来源：{currentMat.dataSource}
              </span>
            )}
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart key={`chart-${activeMaterial}-${activeCategory}`} data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: '#999' }}
                tickLine={false}
                axisLine={{ stroke: '#e0e0e0' }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#999' }}
                tickLine={false}
                axisLine={{ stroke: '#e0e0e0' }}
                tickFormatter={fmtYAxis}
                width={60}
                domain={[yDomain[0], yDomain[1]]}
                interval={0}
              />
              <Tooltip
                formatter={(value: number) => [
                  `${value.toLocaleString()} ${currentMat.unit}`,
                  '价格'
                ]}
                labelFormatter={(label) => `月份: ${label}`}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e0e0e0', fontSize: '0.85rem' }}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#667eea"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#667eea', strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#667eea' }}
                isAnimationActive={true}
                animationDuration={600}
                animationEasing="ease-out"
              />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ fontSize: '0.75rem', color: '#aaa', marginTop: '6px', textAlign: 'right' }}>
            数据来源：{currentMat.dataSource || '行业公开数据'}
            {currentMat.dataUrl && (
              <a href={currentMat.dataUrl} target="_blank" rel="noopener noreferrer" style={{ marginLeft: '8px', color: '#667eea' }}>
                查看原始数据 →
              </a>
            )}
          </div>
        </div>

        {/* 所有材料快速浏览表格 */}
        <div>
          <h3 style={{ fontSize: '1rem', marginBottom: '16px' }}>📋 {currentCategory.name} 分类材料一览</h3>
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
                  <td style={{ fontSize: '12px', color: '#666' }}>{mat.impact}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}