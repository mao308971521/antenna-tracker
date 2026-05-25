import newsData from '../data/news.json'

export default function NewsPage() {
  return (
    <div>
      <header className="header">
        <h1>📰 行业动态</h1>
        <p>天线行业最新资讯、新闻动态</p>
      </header>

      <section className="card">
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
    </div>
  )
}