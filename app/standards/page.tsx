import standardsData from '../data/standards.json'

export default function StandardsPage() {
  return (
    <div>
      <header className="header">
        <h2>📋 行业标准</h2>
        <p>国内外天线行业相关标准规范</p>
      </header>

      <section className="card">
        <ul className="standards-list">
          {standardsData.map((std, i) => (
            <li key={i} className="standard-item">
              <div className="standard-name">{std.name}</div>
              <div className="standard-title">{std.title}</div>
              <div className="standard-meta">
                {std.organization} · {std.publishDate} · 状态：{std.status}
              </div>
              <div style={{ fontSize: '13px', color: '#666', marginTop: '8px' }}>
                {std.description}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}