'use client'
import { useState } from 'react'
import standardsData from '../../data/standards.json'

export default function StandardsPage() {
  const [activeCategory, setActiveCategory] = useState(0)
  const [showUrlTip, setShowUrlTip] = useState<string | null>(null)

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
        <p>国内外天线行业相关标准规范 · 按分类查看 · 点击标准编号跳转官方页面</p>
        <p className="update-info">数据更新：{standardsData.lastUpdate}</p>
      </header>

      {/* 分类Tab */}
      <section className="card">
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
          {standardsData.categories.map((cat, i) => (
            <button
              key={i}
              onClick={() => setActiveCategory(i)}
              className="px-4 py-2 rounded-lg text-sm sm:text-base font-semibold transition-colors"
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: activeCategory === i ? `2px solid ${categoryColors[cat.code]}` : '2px solid #e0e0e0',
                background: activeCategory === i ? categoryColors[cat.code] : 'white',
                color: activeCategory === i ? 'white' : '#333',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              {cat.name}（{cat.standards.length}）
            </button>
          ))}
        </div>

        <p style={{ color: '#666', marginBottom: '20px', fontSize: '0.9rem' }}>
          {currentCategory.description}
        </p>

        {/* 标准列表 */}
        <div>
          {currentCategory.standards.map((std, i) => (
            <div key={i} className="standard-item" style={{ padding: '16px 0', borderBottom: '1px solid #eee' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
                <div style={{
                  minWidth: '140px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  color: categoryColors[currentCategory.code],
                  cursor: 'pointer'
                }}
                onMouseEnter={() => setShowUrlTip(std.name)}
                onMouseLeave={() => setShowUrlTip(null)}
                >
                  {std.name}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#333', marginBottom: '6px' }}>
                    {std.title}
                  </div>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '0.8rem', color: '#999' }}>
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

              <div style={{ marginBottom: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: '#999' }}>适用范围：</span>
                <span style={{ fontSize: '0.85rem', color: '#666' }}>{std.scope}</span>
              </div>

              <div style={{ fontSize: '0.85rem', color: '#555', lineHeight: 1.6, marginBottom: '8px' }}>
                {std.description}
              </div>

              {std.url ? (
                <a
                  href={std.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '4px 12px', background: '#eef2ff', color: '#667eea',
                    borderRadius: '6px', textDecoration: 'none', fontSize: '0.8rem',
                    fontWeight: 500
                  }}
                >
                  🔗 访问官方标准页面 →
                </a>
              ) : (
                <span style={{ fontSize: '0.75rem', color: '#ccc' }}>暂无官方链接</span>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}