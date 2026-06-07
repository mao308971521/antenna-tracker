'use client'
import { useState } from 'react'
import standardsData from '../../data/standards.json'

export default function StandardsPage() {
  const [activeCategory, setActiveCategory] = useState(0)
  const [hoveredStd, setHoveredStd] = useState<string | null>(null)

  const currentCategory = standardsData.categories[activeCategory]
  const categoryColors: Record<string, string> = {
    tech: '#667eea',
    reliability: '#e53935',
    testing: '#43a047',
    international: '#ff9800',
    safety: '#9c27b0'
  }

  return (
    <div>
      <header className="header">
        <h2>📋 行业标准</h2>
        <p>国内外天线行业相关标准规范 · 按分类查看 · 点击标准编号/名称跳转官方页面</p>
        <p className="update-info">数据更新：{standardsData.lastUpdate}</p>
      </header>

      {/* 分类Tab */}
      <section className="card">
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
          {standardsData.categories.map((cat, i) => {
            const color = categoryColors[cat.code] || '#667eea'
            return (
              <button
                key={i}
                onClick={() => setActiveCategory(i)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: activeCategory === i ? `2px solid ${color}` : '2px solid #e0e0e0',
                  background: activeCategory === i ? color : 'white',
                  color: activeCategory === i ? 'white' : '#333',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                }}
              >
                {cat.name}（{cat.standards.length}）
              </button>
            )
          })}
        </div>

        <p style={{ color: '#666', marginBottom: '20px', fontSize: '0.95rem' }}>
          {currentCategory.description}
        </p>

        {/* 标准列表 */}
        <div>
          {currentCategory.standards.map((std, i) => {
            const isHovered = hoveredStd === std.name
            return (
              <div
                key={i}
                style={{
                  padding: '18px 0',
                  borderBottom: '1px solid #eee',
                  background: isHovered ? '#f8f9fa' : 'transparent',
                  borderRadius: isHovered ? '8px' : '0px',
                  paddingLeft: isHovered ? '12px' : '0px',
                  paddingRight: isHovered ? '12px' : '0px',
                  transition: 'all 0.15s',
                  marginBottom: isHovered ? '4px' : '0px',
                }}
                onMouseEnter={() => setHoveredStd(std.name)}
                onMouseLeave={() => setHoveredStd(null)}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '8px' }}>
                  {/* 标准编号：可点击卡片 */}
                  <div
                    style={{
                      minWidth: '160px',
                      fontWeight: 700,
                      fontSize: '1rem',
                      color: categoryColors[currentCategory.code],
                      textDecoration: 'none',
                      cursor: 'pointer',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      background: isHovered ? categoryColors[currentCategory.code] + '15' : 'transparent',
                      border: `1.5px solid ${categoryColors[currentCategory.code]}`,
                      display: 'inline-block',
                      transition: 'all 0.15s',
                    }}
                    onClick={() => std.url && window.open(std.url, '_blank', 'noopener')}
                    title={std.url ? `访问标准页面: ${std.url}` : '暂无官方链接'}
                  >
                    {std.name}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '6px', color: '#333' }}>
                      {std.url ? (
                        <a href={std.url} target="_blank" rel="noopener noreferrer" style={{ color: '#333', textDecoration: 'underline', textDecorationColor: categoryColors[currentCategory.code], textUnderlineOffset: '3px' }}>
                          {std.title}
                        </a>
                      ) : (
                        <span>{std.title}</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.85rem', color: '#999' }}>
                      <span>🏛️ {std.organization}</span>
                      <span>📅 {std.publishDate}</span>
                      <span>📌 状态：
                        <span style={{
                          color: std.status === '现行' ? '#43a047' : std.status === '废止' ? '#e53935' : '#ff9800',
                          fontWeight: 600
                        }}>
                          {std.status}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.8rem', color: '#999' }}>适用范围：</span>
                  <span style={{ fontSize: '0.9rem', color: '#666' }}>{std.scope}</span>
                </div>

                <div style={{ fontSize: '0.9rem', color: '#555', lineHeight: 1.6, marginBottom: '10px' }}>
                  {std.description}
                </div>

                {std.url ? (
                  <a
                    href={std.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      padding: '6px 14px', background: '#eef2ff', color: '#667eea',
                      borderRadius: '6px', textDecoration: 'none', fontSize: '0.85rem',
                      fontWeight: 500
                    }}
                  >
                    🔗 访问官方标准页面 →
                  </a>
                ) : (
                  <span style={{ fontSize: '0.8rem', color: '#ccc' }}>暂无官方链接</span>
                )}
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}