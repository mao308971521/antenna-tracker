import pricesData from '../data/prices.json'

export default function PricesPage() {
  return (
    <div>
      <header className="header">
        <h1>💰 原材料价格</h1>
        <p>天线制造主要原材料价格走势</p>
      </header>

      <section className="card">
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
                <td style={{ fontSize: '12px', color: '#999' }}>{price.impact}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}