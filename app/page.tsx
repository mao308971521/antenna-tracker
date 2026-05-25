import marketData from '../data/market.json'
import newsData from '../data/news.json'
import companiesData from '../data/companies.json'
import pricesData from '../data/prices.json'
import standardsData from '../data/standards.json'

export default function Home() {
  return (
    <div className="container">
      {/* Header */}
      <header className="header">
        <h1>📡 天线行业情报追踪</h1>
        <p>市场研究 · 行业动态 · 企业追踪 · 价格监测 · 标准更新</p>
        <p className="update-info">数据更新：{marketData.lastUpdate}</p>
      </header>

      {/* Summary Stats */}
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

      {/* Segments */}
      <section className="card">
        <h2>📈 细分市场</h2>
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
              {seg.cagr && (
                <div className="segment-stat">
                  <span>年复合增长率</span>
                  <span>{seg.cagr}</span>
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
              {seg.drivers && (
                <div style={{marginTop: '12px'}}>
                  <span style={{fontSize: '12px', color: '#999'}}>驱动因素：</span>
                  <div style={{display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px'}}>
                    {seg.drivers.map((d, j) => (
                      <span key={j} className="tag">{d}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* News */}
      <section className="card">
        <h2>📰 行业动态</h2>
        <ul className="news-list">
          {newsData.map((news) => (
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
      </section>

      {/* Companies */}
      <section className="card">
        <h2>🏭 重点企业</h2>
        <div className="company-grid">
          {companiesData.map((company, i) => (
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
      </section>

      {/* Prices */}
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
            {pricesData.map((price, i) => (
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

      {/* Standards */}
      <section className="card">
        <h2>📋 行业标准</h2>
        <ul className="standards-list">
          {standardsData.map((std, i) => (
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

      {/* Footer */}
      <footer className="footer">
        <p>天线行业情报追踪系统 · 数据持续更新中</p>
      </footer>
    </div>
  )
}
