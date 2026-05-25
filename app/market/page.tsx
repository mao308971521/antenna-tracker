import marketData from '../data/market.json'

export default function MarketPage() {
  return (
    <div>
      <header className="header">
        <h1>📊 市场分析</h1>
        <p>全球与中国天线市场规模、细分市场、增长驱动因素</p>
        <p className="update-info">数据更新：{marketData.lastUpdate}</p>
      </header>

      {/* 市场概览 */}
      <section className="card">
        <h2>🚀 增长驱动因素</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {marketData.keyDrivers.map((driver, i) => (
            <span key={i} className="tag">{driver}</span>
          ))}
        </div>
      </section>

      {/* 细分市场 */}
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
                <div style={{ marginTop: '12px' }}>
                  <span style={{ fontSize: '12px', color: '#999' }}>主要类型：</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
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
    </div>
  )
}