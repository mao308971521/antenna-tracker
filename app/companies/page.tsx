import companiesData from '../data/companies.json'

export default function CompaniesPage() {
  return (
    <div>
      <header className="header">
        <h1>🏭 重点企业</h1>
        <p>国内外天线行业重点企业及产品</p>
      </header>

      <section className="card">
        <div className="company-grid">
          {companiesData.map((company, i) => (
            <div key={i} className="company-card">
              <div className="company-name">{company.name}</div>
              <div className="company-country">{company.country}</div>
              <div style={{ fontSize: '13px', color: '#666', marginTop: '8px' }}>
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
    </div>
  )
}