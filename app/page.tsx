'use client'
import { useState, useMemo } from 'react'
import marketData from '../data/market.json'
import newsData from '../data/news.json'
import companiesData from '../data/companies.json'
import pricesData from '../data/prices.json'
import standardsData from '../data/standards.json'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
         XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function Home() {
  const [activeTab, setActiveTab] = useState('overview')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [newsFilter, setNewsFilter] = useState('全部')
  const [companyFilter, setCompanyFilter] = useState('全部')
  
  // 筛选后的新闻
  const filteredNews = useMemo(() => {
    let result = newsData
    if (searchKeyword) {
      const kw = searchKeyword.toLowerCase()
      result = result.filter(n => 
        n.title.toLowerCase().includes(kw) || 
        n.summary.toLowerCase().includes(kw) ||
        n.tags.some(t => t.toLowerCase().includes(kw))
      )
    }
    if (newsFilter !== '全部') {
      result = result.filter(n => n.tags.includes(newsFilter))
    }
    return result
  }, [searchKeyword, newsFilter])

  // 筛选后的企业
  const filteredCompanies = useMemo(() => {
    let result = companiesData
    if (searchKeyword) {
      const kw = searchKeyword.toLowerCase()
      result = result.filter(c => 
        c.name.toLowerCase().includes(kw) || 
        c.description.toLowerCase().includes(kw) ||
        c.products.some(p => p.toLowerCase().includes(kw))
      )
    }
    if (companyFilter !== '全部') {
      result = result.filter(c => c.country === companyFilter)
    }
    return result
  }, [searchKeyword, companyFilter])

  // 获取所有新闻标签
  const allNewsTags = useMemo(() => {
    const tags = new Set<string>()
    newsData.forEach(n => n.tags.forEach(t => tags.add(t)))
    return ['全部', ...Array.from(tags)]
  }, [])

  // 获取所有国家
  const allCountries = useMemo(() => {
    const countries = new Set<string>()
    companiesData.forEach(c => countries.add(c.country))
    return ['全部', ...Array.from(countries)]
  }, [])

  return (
    <div className="container">
      {/* Header */}
      <header className="header">
        <h1>📡 天线行业情报追踪</h1>
        <p>市场研究 · 行业动态 · 企业追踪 · 价格监测 · 标准更新 · 技术前沿</p>
        <p className="update-info">数据更新：{marketData.lastUpdate}</p>
      </header>

      {/* Search Bar */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="🔍 搜索新闻、企业、产品..."
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            fontSize: '1rem',
            border: '1px solid #ddd',
            borderRadius: '8px',
            outline: 'none'
          }}
        />
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {['overview', 'market', 'news', 'companies', 'prices', 'standards', 'technology'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '6px',
              background: activeTab === tab ? '#667eea' : '#f0f0f0',
              color: activeTab === tab ? 'white' : '#666',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            {tab === 'overview' ? '📊 概览' : 
             tab === 'market' ? '📈 市场' :
             tab === 'news' ? '📰 动态' :
             tab === 'companies' ? '🏭 企业' :
             tab === 'prices' ? '💰 价格' :
             tab === 'standards' ? '📋 标准' : '🔬 技术'}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          <section className="card">
            <h2>📊 市场概览</h2>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-value">{marketData.summary.globalMarketSize2024}</div>
                <div className="stat-label">2024全球市场规模</div>
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
            <h3>🚀 增长驱动因素</h3>
            <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px'}}>
              {marketData.keyDrivers.map((driver, i) => (
                <span key={i} className="tag">{driver}</span>
              ))}
            </div>
          </section>

          <section className="card">
            <h2>📈 市场规模趋势 (2020-2030)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={marketData.trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip formatter={(value) => `${value}亿元`} />
                <Legend />
                <Line type="monotone" dataKey="global" name="全球市场" stroke="#0088FE" strokeWidth={2} />
                <Line type="monotone" dataKey="china" name="中国市场" stroke="#00C49F" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </section>
        </>
      )}

      {/* Market Tab */}
      {activeTab === 'market' && (
        <>
          <section className="card">
            <h2>📈 市场规模趋势 (2020-2030)</h2>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={marketData.trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip formatter={(value) => `${value}亿元`} />
                <Legend />
                <Line type="monotone" dataKey="global" name="全球市场" stroke="#0088FE" strokeWidth={2} dot={{r:4}} />
                <Line type="monotone" dataKey="china" name="中国市场" stroke="#00C49F" strokeWidth={2} dot={{r:4}} />
              </LineChart>
            </ResponsiveContainer>
          </section>

          <section className="card">
            <h2>🥧 细分市场占比</h2>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={marketData.segmentData}
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  dataKey="value"
                  label={({name, percent}) => `${name} ${(percent*100).toFixed(0)}%`}
                >
                  {marketData.segmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}亿元`} />
              </PieChart>
            </ResponsiveContainer>
          </section>

          <section className="card">
            <h2>📋 细分市场详情</h2>
            <div className="segment-grid">
              {marketData.segments.map((seg, i) => (
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
                  {seg.growth && (
                    <div className="segment-stat">
                      <span>增长率</span>
                      <span>{seg.growth}</span>
                    </div>
                  )}
                  {seg.types && (
                    <div style={{marginTop: '12px'}}>
                      <span style={{fontSize: '12px', color: '#999'}}>主要类型：</span>
                      <div style={{display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px'}}>
                        {seg.types.map((t, j) => (
                          <span key={j} className="tag">{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {/* News Tab */}
      {activeTab === 'news' && (
        <>
          {/* News Filters */}
          <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{color: '#666', lineHeight: '32px'}}>标签筛选：</span>
            {allNewsTags.map(tag => (
              <button
                key={tag}
                onClick={() => setNewsFilter(tag)}
                style={{
                  padding: '4px 12px',
                  border: 'none',
                  borderRadius: '16px',
                  background: newsFilter === tag ? '#667eea' : '#f0f0f0',
                  color: newsFilter === tag ? 'white' : '#666',
                  cursor: 'pointer',
                  fontSize: '0.85rem'
                }}
              >
                {tag}
              </button>
            ))}
          </div>
          
          <section className="card">
            <h2>📰 行业动态 <span style={{fontSize: '0.9rem', color: '#999'}}>({filteredNews.length}条)</span></h2>
            {filteredNews.length === 0 ? (
              <p style={{color: '#999', textAlign: 'center', padding: '40px'}}>暂无匹配结果</p>
            ) : (
              <ul className="news-list">
                {filteredNews.map((news) => (
                  <li key={news.id} className="news-item">
                    <div className="news-date">{news.date} · {news.source}</div>
                    <div className="news-title">
                      <a href={news.url} target="_blank" rel="noopener noreferrer">
                        {news.title}
                      </a>
                    </div>
                    <div className="news-summary">{news.summary}</div>
                    <div className="news-tags">
                      {news.tags.map((tag, j) => (
                        <span key={j} className="tag">{tag}</span>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      {/* Companies Tab */}
      {activeTab === 'companies' && (
        <>
          {/* Company Filters */}
          <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{color: '#666', lineHeight: '32px'}}>国家筛选：</span>
            {allCountries.map(country => (
              <button
                key={country}
                onClick={() => setCompanyFilter(country)}
                style={{
                  padding: '4px 12px',
                  border: 'none',
                  borderRadius: '16px',
                  background: companyFilter === country ? '#667eea' : '#f0f0f0',
                  color: companyFilter === country ? 'white' : '#666',
                  cursor: 'pointer',
                  fontSize: '0.85rem'
                }}
              >
                {country}
              </button>
            ))}
          </div>
          
          <section className="card">
            <h2>🏭 重点企业 <span style={{fontSize: '0.9rem', color: '#999'}}>({filteredCompanies.length}家)</span></h2>
            {filteredCompanies.length === 0 ? (
              <p style={{color: '#999', textAlign: 'center', padding: '40px'}}>暂无匹配结果</p>
            ) : (
              <div className="company-grid">
                {filteredCompanies.map((company, i) => (
                  <div key={i} className="company-card">
                    <div className="company-name">{company.name}</div>
                    <div className="company-country">{company.country}</div>
                    <div style={{fontSize: '13px', color: '#666', marginTop: '8px'}}>
                      {company.description}
                    </div>
                    <div className="company-products">
                      {company.products.map((p, j) => (
                        <span key={j} className="product-tag">{p}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* Prices Tab */}
      {activeTab === 'prices' && (
        <section className="card">
          <h2>💰 原材料价格</h2>
          <table className="price-table">
            <thead>
              <tr>
                <th>材料</th>
                <th>当前价格</th>
                <th>涨跌</th>
                <th>趋势</th>
                <th>影响</th>
              </tr>
            </thead>
            <tbody>
              {pricesData.filter(p => !searchKeyword || p.name.toLowerCase().includes(searchKeyword.toLowerCase())).map((price, i) => (
                <tr key={i}>
                  <td>{price.name}</td>
                  <td>{price.currentPrice} {price.unit}</td>
                  <td className={
                    price.trend === '上涨' ? 'price-up' :
                    price.trend === '下跌' ? 'price-down' : 'price-stable'
                  }>
                    {price.change}
                  </td>
                  <td className={
                    price.trend === '上涨' ? 'price-up' :
                    price.trend === '下跌' ? 'price-down' : 'price-stable'
                  }>
                    {price.trend}
                  </td>
                  <td style={{fontSize: '12px', color: '#999'}}>{price.impact}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Standards Tab */}
      {activeTab === 'standards' && (
        <section className="card">
          <h2>📋 行业标准</h2>
          <ul className="standards-list">
            {standardsData.filter(s => !searchKeyword || s.name.toLowerCase().includes(searchKeyword.toLowerCase()) || s.title.toLowerCase().includes(searchKeyword.toLowerCase())).map((std, i) => (
              <li key={i} className="standard-item">
                <div className="standard-name">{std.name}</div>
                <div className="standard-title">{std.title}</div>
                <div className="standard-meta">
                  {std.organization} · {std.publishDate} · 状态：{std.status}
                </div>
                <div style={{fontSize: '13px', color: '#666', marginTop: '8px'}}>
                  {std.description}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Technology Tab */}
      {activeTab === 'technology' && (
        <>
          {[
            { name: '基站天线 (AAS)', desc: '有源天线系统 Massive MIMO', mainstream: ['Massive MIMO', 'AAU集成', '64T64R'], research: ['RIS智能超表面', '毫米波AAU', '太赫兹通信'], progress: '5G基站规模部署' },
            { name: '微波天线', desc: '微波传输设备', mainstream: ['高频段(70-80GHz)', '超疏水表面'], research: ['介质透镜天线', 'OTA测试技术'], progress: '5G承载网建设' },
            { name: '网通天线', desc: '网络通信天线', mainstream: ['Wi-Fi 7', 'MIMO增强', '相控阵'], research: ['AI波束赋形', '低轨卫星通信'], progress: 'Wi-Fi 7终端商用' },
            { name: '手机AIP', desc: '封装天线模组', mainstream: ['AiP封装', '毫米波模组', 'LCP/LDS'], research: ['封装新材料', '柔性天线'], progress: '5G手机商用' }
          ].filter(cat => !searchKeyword || cat.name.toLowerCase().includes(searchKeyword.toLowerCase()) || cat.desc.toLowerCase().includes(searchKeyword.toLowerCase())).map((cat, i) => (
            <section key={i} className="card">
              <h2>{cat.name}</h2>
              <p style={{color: '#666', marginBottom: '16px'}}>{cat.desc}</p>
              <div style={{marginBottom: '16px'}}>
                <h3 style={{fontSize: '1rem', color: '#00cc66', marginBottom: '8px'}}>✅ 主流技术</h3>
                <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px'}}>
                  {cat.mainstream.map((t, j) => <span key={j} className="tag" style={{background: '#e8f5e9', color: '#2e7d32'}}>{t}</span>)}
                </div>
              </div>
              <div style={{marginBottom: '16px'}}>
                <h3 style={{fontSize: '1rem', color: '#ff9800', marginBottom: '8px'}}>🔬 预研技术</h3>
                <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px'}}>
                  {cat.research.map((t, j) => <span key={j} className="tag" style={{background: '#fff3e0', color: '#e65100'}}>{t}</span>)}
                </div>
              </div>
              <div>
                <h3 style={{fontSize: '1rem', color: '#2196f3', marginBottom: '8px'}}>📈 应用进展</h3>
                <p style={{color: '#666', fontSize: '0.95rem'}}>{cat.progress}</p>
              </div>
            </section>
          ))}
        </>
      )}

      {/* Footer */}
      <footer className="footer">
        <p>天线行业情报追踪系统 · 数据持续更新中</p>
      </footer>
    </div>
  )
}