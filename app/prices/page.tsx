'use client'
import { useState, useMemo } from 'react'
import type { CSSProperties } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import pricesData from '@/app/_data/prices.json'

export default function PricesPage() {
  const [activeCategory, setActiveCategory] = useState<number | 'all'>('all')

  // 统计
  const allMats = useMemo(() => {
    return pricesData.categories.flatMap((c, ci) =>
      c.materials.map((m, mi) => ({ ...m, _catIdx: ci, _catName: c.name, _catIcon: c.icon, _matIdx: mi }))
    )
  }, [])

  const totalMat = allMats.length
  const totalUp = allMats.filter(m => m.trend === '上涨').length
  const totalDown = allMats.filter(m => m.trend === '下跌').length
  const totalFlat = totalMat - totalUp - totalDown

  // 涨跌幅榜
  const parsePct = (s: any) => {
    const v = String(s || '0').replace('%', '').replace('+', '')
    const n = parseFloat(v)
    return isNaN(n) ? 0 : n
  }
  const matsWithPct = allMats.map(m => ({ ...m, _pct: parsePct(m.change) }))
  const upTop = [...matsWithPct].sort((a, b) => b._pct - a._pct).filter(m => m._pct > 0).slice(0, 3)
  const downTop = [...matsWithPct].sort((a, b) => a._pct - b._pct).filter(m => m._pct < 0).slice(0, 3)
  const keyMovers = [...matsWithPct].filter(m => Math.abs(m._pct) >= 1.0)
    .sort((a, b) => Math.abs(b._pct) - Math.abs(a._pct)).slice(0, 8)

  // Y轴格式化（自适应单位）
  const fmtYAxis = (v: number, unit?: string) => {
    if (unit === '元/克') return v.toFixed(1)
    if (unit === '元/米') return v.toFixed(1)
    if (v >= 10000) return `${(v / 10000).toFixed(1)}万`
    if (v >= 1000) return v.toLocaleString()
    return v.toString()
  }

  // 分类统计
  const catStats = pricesData.categories.map(c => {
    const up = c.materials.filter(m => m.trend === '上涨').length
    const down = c.materials.filter(m => m.trend === '下跌').length
    const flat = c.materials.length - up - down
    return { ...c, up, down, flat }
  })

  // 影响分析文案
  const impactMap: Record<string, string> = {
    '金属原材料': '金属类直接影响天线振子、馈电网络、滤波器等射频结构件成本。铜、铝价格波动直接传导至AAU散热器、PCB铜箔等关键部件。',
    '工程塑料': '工程塑料用于天线外壳、滤波器介质、绝缘骨架等结构件。LCP、PPS等特种工程塑料涨价对5G毫米波天线成本压力较大。',
    'PCB/覆铜板': 'PCB及覆铜板是天线射频电路核心基材。FR-4、PTFE高频覆铜板占天线PCB成本30%以上，AI算力需求驱动高端CCL持续紧缺涨价。',
    '化工类原材料': '化工原料影响天线镀膜（LDS工艺银浆）、防护涂层、表面处理等工艺。银浆价格随银价波动，PVDF氟膜用于天线外罩防护。',
  }

  // 后续展望
  const outlookData = [
    {
      title: '📡 覆铜板产业链',
      text: 'AI算力需求持续旺盛，建滔积层板、生益科技等头部CCL厂商已开启年内多轮提价（累计涨幅超50%），电子布7628价格较年初涨超70%。M8/M9高端高速覆铜板产能100%锁单，现货断供。FR-4通用覆铜板跟随铜价波动，整体维持高位运行。预计Q3高端CCL紧缺格局延续。',
    },
    {
      title: '🔩 金属原材料',
      text: '铜、铝价格近期承压回落（电解铜-5.9%、铝锭-5.1%），主因美元走强及需求端季节性走弱。锡价表现强势（沪锡+2.2%），缅甸佤邦复产进度不及预期叠加AI算力对电子锡需求支撑。镍、锌、铅整体偏弱震荡，不锈钢304需求平淡。',
    },
    {
      title: '🧪 工程塑料',
      text: '工程塑料整体平稳偏弱，环氧树脂-6.1%跌幅明显（上游双酚A、环氧氯丙烷价格回落）。LCP、PTFE、PPS等特种工程塑料受AI/5G高端应用支撑，价格相对坚挺。PA66、PBT跟随上游己二胺、PTA价格波动。',
    },
    {
      title: '⚗️ 化工原料',
      text: '导电银浆受银价波动+2.3%，AI服务器LDS振子需求带动高端银浆用量增长。电子级环氧树脂+1.3%，覆铜板及5G高频材料升级对低介电环氧树脂需求强劲。PVDF氟膜、导热硅脂等小品类价格平稳，5G基站散热需求带动用量增长。',
    },
  ]

  // 采购建议
  const tips = [
    { tag: '覆铜板/电子布', text: 'AI驱动高端CCL紧缺延续，建议Q3提前锁单备货，关注生益科技、南亚新材等国产替代标的' },
    { tag: '金属', text: '铜、铝短期承压但中长期受能源转型支撑，建议按需采购避免追高' },
    { tag: '特种工程塑料', text: 'LCP/PTFE/PPS供应紧张，建议建立安全库存（≥2个月用量）' },
    { tag: '银浆', text: '银价高位震荡，关注美联储利率政策对银价的边际影响' },
  ]

  // 过滤后的分类
  const visibleCats = activeCategory === 'all'
    ? pricesData.categories
    : pricesData.categories.filter((_, i) => i === activeCategory)

  return (
    <div style={{ background: '#f5f6f8', minHeight: '100vh' }}>
      {/* ===== Hero ===== */}
      <div style={{
        background: 'linear-gradient(135deg, #2c5aa0 0%, #1a4480 100%)',
        color: 'white',
        padding: '40px 24px 32px',
        textAlign: 'center'
      }}>
        <h1 style={{ margin: 0, fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 700 }}>
          📡 基站天线BOM原材料价格
        </h1>
        <p style={{ margin: '10px 0 4px', opacity: 0.85, fontSize: '14px' }}>
          天线制造主要原材料价格走势 · 27种核心材料
        </p>
        <p style={{ margin: 0, opacity: 0.7, fontSize: '12px' }}>
          数据更新：{pricesData.lastUpdate} · 数据来源：web_search 公开信息
        </p>

        {/* 行情统计卡片 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px',
          maxWidth: 560,
          margin: '24px auto 0',
        }}>
          {[
            { num: totalUp, label: '↑ 上涨', color: '#ff8a80' },
            { num: totalDown, label: '↓ 下跌', color: '#69f0ae' },
            { num: totalFlat, label: '— 平稳', color: '#90a4ae' },
            { num: totalMat, label: '总计', color: 'white', big: true },
          ].map((s, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.12)',
              borderRadius: 10,
              padding: '14px 6px',
              backdropFilter: 'blur(4px)',
            }}>
              <div style={{
                fontSize: s.big ? 32 : 26,
                fontWeight: 700,
                color: s.color,
                lineHeight: 1,
              }}>{s.num}</div>
              <div style={{ fontSize: 11, opacity: 0.85, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px' }}>

        {/* ===== 综合分析 ===== */}
        <div style={{
          background: 'white',
          borderRadius: 10,
          padding: '20px 24px',
          marginTop: 20,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <h2 style={{
            fontSize: 17, margin: '0 0 16px', color: '#2c5aa0',
            borderLeft: '3px solid #2c5aa0', paddingLeft: 10,
          }}>📋 今日综合分析</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {/* 涨幅榜 */}
            <div>
              <h3 style={{ fontSize: 14, margin: '0 0 10px', color: '#e74c3c' }}>🔥 涨幅榜 TOP 3</h3>
              {upTop.length === 0 && <p style={{ color: '#999', fontSize: 13, margin: 0 }}>今日无上涨材料</p>}
              {upTop.map((m, i) => (
                <div key={i} style={{
                  padding: '8px 12px',
                  background: '#fff5f5',
                  borderLeft: '3px solid #e74c3c',
                  borderRadius: 4,
                  marginBottom: 6,
                  fontSize: 13,
                }}>
                  <strong>{m.name}</strong> <span style={{ color: '#888', fontSize: 11 }}>({m._catName})</span>
                  <div style={{ marginTop: 2 }}>
                    {m.currentPrice.toLocaleString()} {m.unit} ·
                    <span style={{ color: '#e74c3c', fontWeight: 700, marginLeft: 4 }}>+{m._pct.toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>

            {/* 跌幅榜 */}
            <div>
              <h3 style={{ fontSize: 14, margin: '0 0 10px', color: '#27ae60' }}>📉 跌幅榜 TOP 3</h3>
              {downTop.length === 0 && <p style={{ color: '#999', fontSize: 13, margin: 0 }}>今日无下跌材料</p>}
              {downTop.map((m, i) => (
                <div key={i} style={{
                  padding: '8px 12px',
                  background: '#f0faf4',
                  borderLeft: '3px solid #27ae60',
                  borderRadius: 4,
                  marginBottom: 6,
                  fontSize: 13,
                }}>
                  <strong>{m.name}</strong> <span style={{ color: '#888', fontSize: 11 }}>({m._catName})</span>
                  <div style={{ marginTop: 2 }}>
                    {m.currentPrice.toLocaleString()} {m.unit} ·
                    <span style={{ color: '#27ae60', fontWeight: 700, marginLeft: 4 }}>{m._pct.toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 分类统计表 */}
          <h3 style={{ fontSize: 14, margin: '24px 0 10px', color: '#2c5aa0' }}>📊 分类行情分布</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8f9fb' }}>
                  <th style={{ padding: '8px 10px', textAlign: 'left', color: '#555' }}>类别</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center', color: '#555' }}>上涨</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center', color: '#555' }}>下跌</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center', color: '#555' }}>平稳</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center', color: '#555' }}>总计</th>
                </tr>
              </thead>
              <tbody>
                {catStats.map((c, i) => (
                  <tr key={i} style={{ borderTop: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '8px 10px' }}>{c.icon} {c.name}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'center', color: '#e74c3c', fontWeight: 600 }}>{c.up}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'center', color: '#27ae60', fontWeight: 600 }}>{c.down}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'center', color: '#888' }}>{c.flat}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600 }}>{c.materials.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 关键波动材料 */}
          {keyMovers.length > 0 && (
            <>
              <h3 style={{ fontSize: 14, margin: '24px 0 10px', color: '#2c5aa0' }}>⚡ 关键波动材料（涨跌≥1%）</h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: 8,
              }}>
                {keyMovers.map((m, i) => {
                  const isUp = m._pct > 0
                  return (
                    <div key={i} style={{
                      padding: '8px 12px',
                      background: isUp ? '#fff5f5' : '#f0faf4',
                      borderLeft: `3px solid ${isUp ? '#e74c3c' : '#27ae60'}`,
                      borderRadius: 4,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: 12,
                    }}>
                      <strong style={{ flex: '0 0 90px' }}>{m.name}</strong>
                      <span style={{ flex: 1, color: '#888', fontSize: 11 }}>{m._catName}</span>
                      <span style={{ flex: '0 0 90px', textAlign: 'right', fontWeight: 600 }}>
                        {m.currentPrice.toLocaleString()} {m.unit}
                      </span>
                      <span style={{
                        flex: '0 0 50px',
                        textAlign: 'right',
                        fontWeight: 700,
                        color: isUp ? '#e74c3c' : '#27ae60',
                      }}>
                        {isUp ? '+' : ''}{m._pct.toFixed(1)}%
                      </span>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* ===== 分类筛选 Tab ===== */}
        <div style={{ marginTop: 20, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveCategory('all')}
            style={tabStyle(activeCategory === 'all')}
          >📊 全部</button>
          {pricesData.categories.map((c, i) => (
            <button
              key={i}
              onClick={() => setActiveCategory(i)}
              style={tabStyle(activeCategory === i)}
            >{c.icon} {c.name}</button>
          ))}
        </div>

        {/* ===== 分类展示 ===== */}
        {visibleCats.map((cat, ci) => (
          <div key={ci} style={{
            background: 'white',
            borderRadius: 10,
            padding: '20px 24px',
            marginTop: 16,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              marginBottom: 4,
              flexWrap: 'wrap',
              gap: 8,
            }}>
              <h2 style={{
                fontSize: 17, margin: 0, color: '#2c5aa0',
                borderLeft: '3px solid #2c5aa0', paddingLeft: 10,
              }}>{cat.icon} {cat.name}</h2>
              <span style={{ fontSize: 12, color: '#888' }}>{cat.materials.length} 种材料</span>
            </div>
            <p style={{ color: '#666', fontSize: 13, margin: '0 0 16px' }}>{cat.description}</p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 14,
            }}>
              {cat.materials.map((mat, mi) => (
                <MaterialCard key={mi} mat={mat} fmtYAxis={fmtYAxis} />
              ))}
            </div>

            {/* 分类影响分析 */}
            {impactMap[cat.name] && (
              <div style={{
                marginTop: 16,
                padding: '12px 16px',
                background: '#f8f9fb',
                borderLeft: '3px solid #2c5aa0',
                borderRadius: 6,
                fontSize: 13,
                color: '#555',
                lineHeight: 1.7,
              }}>
                <strong style={{ color: '#2c5aa0' }}>💡 对天线BOM成本的影响：</strong>
                {impactMap[cat.name]}
              </div>
            )}
          </div>
        ))}

        {/* ===== 后续展望 ===== */}
        <div style={{
          background: 'white',
          borderRadius: 10,
          padding: '20px 24px',
          marginTop: 16,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <h2 style={{
            fontSize: 17, margin: '0 0 16px', color: '#2c5aa0',
            borderLeft: '3px solid #2c5aa0', paddingLeft: 10,
          }}>🔮 后续展望</h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 12,
          }}>
            {outlookData.map((o, i) => (
              <div key={i} style={{
                background: '#f8f9fb',
                padding: '12px 16px',
                borderRadius: 6,
              }}>
                <h4 style={{ margin: '0 0 6px', fontSize: 14, color: '#2c5aa0' }}>{o.title}</h4>
                <p style={{ margin: 0, fontSize: 12, lineHeight: 1.7, color: '#555' }}>{o.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ===== 采购建议 ===== */}
        <div style={{
          background: '#fffbe6',
          border: '1px solid #ffe58f',
          borderLeft: '4px solid #f39c12',
          borderRadius: 10,
          padding: '20px 24px',
          marginTop: 16,
          marginBottom: 32,
        }}>
          <h2 style={{ fontSize: 17, margin: '0 0 12px', color: '#b88200' }}>⚠️ 采购建议</h2>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, lineHeight: 1.9, color: '#444' }}>
            {tips.map((t, i) => (
              <li key={i}>
                <strong>{t.tag}：</strong>{t.text}
              </li>
            ))}
          </ul>
        </div>

        <div style={{ textAlign: 'center', padding: '20px 0 32px', fontSize: 12, color: '#999' }}>
          数据来源：web_search 公开信息整合 · 仅供工作参考
        </div>
      </div>
    </div>
  )
}

function tabStyle(active: boolean): React.CSSProperties {
  return {
    padding: '8px 18px',
    borderRadius: 20,
    border: active ? '2px solid #2c5aa0' : '2px solid #e0e0e0',
    background: active ? '#2c5aa0' : 'white',
    color: active ? 'white' : '#333',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
  }
}

function MaterialCard({ mat, fmtYAxis }: { mat: any; fmtYAxis: (v: number, u?: string) => string }) {
  const hist = (mat.historical || []).slice(-6).map((h: any) => ({
    month: h.month,
    price: h.price,
  }))
  const trendColor = mat.trend === '上涨' ? '#e74c3c' : mat.trend === '下跌' ? '#27ae60' : '#888'

  // Y轴动态范围
  const prices = hist.map((d: any) => d.price)
  const yDomain: [number, number] = useMemo(() => {
    if (prices.length === 0) return [0, 100]
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    const range = max - min
    if (range === 0) return [min * 0.9, max * 1.1]
    return [min - range * 0.15, max + range * 0.15]
  }, [JSON.stringify(prices)])

  return (
    <div style={{
      background: '#fafbfc',
      border: '1px solid #eee',
      borderRadius: 8,
      padding: 12,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6, flexWrap: 'wrap', gap: 4 }}>
        <h3 style={{ margin: 0, fontSize: 14, color: '#333' }}>{mat.name}</h3>
        <span style={{ fontSize: 11, color: '#888' }}>{mat.unit}</span>
      </div>

      {/* 价格类型标签 */}
      {mat.priceType && (
        <div style={{ marginBottom: 6 }}>
          <span style={{
            display: 'inline-block',
            padding: '1px 6px',
            background: '#e3f2fd',
            color: '#1976d2',
            fontSize: 10,
            borderRadius: 3,
          }}>{mat.priceType}</span>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 22, fontWeight: 700, color: '#333' }}>
          {mat.currentPrice.toLocaleString()}
        </span>
        <span style={{ fontSize: 13, color: trendColor, fontWeight: 600 }}>{mat.change}</span>
        <span style={{ fontSize: 12, color: trendColor, padding: '2px 8px', background: mat.trend === '上涨' ? '#fff5f5' : mat.trend === '下跌' ? '#f0faf4' : '#f5f5f5', borderRadius: 10 }}>
          {mat.trend}
        </span>
      </div>

      <ResponsiveContainer width="100%" height={140}>
        <LineChart data={hist} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 9, fill: '#999' }}
            tickLine={false}
            axisLine={{ stroke: '#e0e0e0' }}
            interval="preserveStartEnd"
            minTickGap={20}
          />
          <YAxis
            tick={{ fontSize: 9, fill: '#999' }}
            tickLine={false}
            axisLine={{ stroke: '#e0e0e0' }}
            tickFormatter={(v) => fmtYAxis(v, mat.unit)}
            width={45}
            domain={yDomain}
          />
          <Tooltip
            formatter={(value: any) => [`${Number(value).toLocaleString()} ${mat.unit}`, '价格']}
            labelFormatter={(label) => `月份: ${label}`}
            contentStyle={{ borderRadius: 6, border: '1px solid #e0e0e0', fontSize: 12, padding: '4px 8px' }}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke={trendColor === '#888' ? '#667eea' : trendColor}
            strokeWidth={2}
            dot={{ r: 3, fill: trendColor === '#888' ? '#667eea' : trendColor, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
            isAnimationActive={true}
            animationDuration={400}
          />
        </LineChart>
      </ResponsiveContainer>

      {mat.dataSource && (
        <div style={{ fontSize: 10, color: '#aaa', marginTop: 4, textAlign: 'right' }}>
          数据范围：{mat.dataSpan || `${hist.length}月数据`} · 来源：{mat.dataSource}
        </div>
      )}
    </div>
  )
}
