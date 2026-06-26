'use client'
import { useState, useMemo } from 'react'
import newsData from '@/app/_data/news.json'

type NewsItem = {
  id: number
  date: string
  title: string
  source: string
  summary: string
  tags: string[]
  url: string
}

// 按来源配色
const SOURCE_COLORS: Record<string, string> = {
  'C114通信网': '#1565c0',
  '通信世界网': '#00897b',
  '飞象网': '#ad1457',
  '腾讯网': '#e53935',
  '产业调研网': '#43a047',
  '中商产业研究院': '#ff9800',
  '行业研究': '#9c27b0',
}

// 天线相关性白名单
const ANTENNA_KEYWORDS = [
  '天线', 'AAU', 'aau', 'RIS', 'ris', 'MIMO', 'mimo', '相控阵', '毫米波', 'AiP', 'aip', 'LCP', 'lcp',
  '智能超表面', '波束赋形', '波束管理', '波束扫描', '可重构电磁表面', '可重构智能表面',
  'massive', 'Massive',
  '微波', '射频', 'RRU', 'rru', 'BBU', 'bbu', '塔顶放大器', '塔放', '滤波器', '双工器', '合路器',
  'PTFE', 'ptfe', '高频PCB', '高频覆铜板', '介电常数',
  '5G', '5g', '6G', '6g', '5G-A', '5G Advanced', '5.5G', 'n258', 'n260', 'n257', 'n261', 'n262',
  'E-band', 'V-band', 'sub-6',
  'Starlink', 'starlink', 'SpaceX', 'spacex', 'FWA', 'fwa', 'CPE', 'cpe', 'Mesh', 'mesh',
  '集采', '运营商集采', '运营商招标',
  '基站',
  '华为', '中兴', '盛路', '通宇', '亨鑫', '京信', '世嘉', '信维', '硕贝德', '摩比', '三维通信',
  '中国电信', '中国移动', '中国联通', '中国广电',
  '村田', 'Rogers', 'Taconic', '苹果供应链', 'iPhone', 'LCP软板',
]

function isAntennaRelated(item: NewsItem): boolean {
  if (!item || typeof item !== 'object') return false
  const tags = Array.isArray(item.tags) ? item.tags.join(' ') : ''
  const text = `${item.title || ''} ${item.summary || ''} ${tags}`.toLowerCase()
  return ANTENNA_KEYWORDS.some(kw => text.includes(kw.toLowerCase()))
}

// ============================================================
// 新闻链接兜底逻辑（老大 2026-06-15 拍板）
// ============================================================
const SOURCE_SEARCH_URL: Record<string, string> = {
  'C114通信网': 'https://www.c114.com.cn/search/?keyword={kw}',
  '通信世界网': 'https://www.cww.net.cn/search.html?wd={kw}',
  '飞象网': 'https://www.cctime.com/search/?wd={kw}',
  '工信部官网': 'https://search.miit.gov.cn/search/info.html?keywords={kw}',
  '工信部': 'https://search.miit.gov.cn/search/info.html?keywords={kw}',
  '中国联通官网': 'https://www.chinaunicom.com.cn/news/list.html?keyword={kw}',
  '中兴官网': 'https://www.zte.com.cn/china/about/news?keyword={kw}',
  '盛路通信公告': 'https://www.shenglu.com/news?keyword={kw}',
  '行业研究': 'https://www.baidu.com/s?wd=site%3Ac114.com.cn+{kw}',
}

function extractKeyword(title: string): string {
  if (!title) return ''
  const m = title.match(/[一-鿿]{4,30}/)
  if (m) {
    const phrase = m[0]
    return phrase.length > 15 ? phrase.slice(0, 15) : phrase
  }
  return title.replace(/[《》【】\[\]"']/g, '').slice(0, 15)
}

function isHomepageUrl(url: string): boolean {
  if (!url) return true
  const trimmed = url.trim()
  if (!trimmed) return true
  return /^https?:\/\/[^/]+\/?(\?.*)?$/i.test(trimmed)
}

function resolveNewsUrl(item: NewsItem): string {
  if (!isHomepageUrl(item.url)) return item.url
  const tpl = SOURCE_SEARCH_URL[item.source]
  if (!tpl) {
    const kw = encodeURIComponent(extractKeyword(item.title) || item.source)
    return `https://www.baidu.com/s?wd=${kw}`
  }
  const kw = encodeURIComponent(extractKeyword(item.title) || item.source)
  return tpl.replace('{kw}', kw)
}

// ============================================================
// 组件
// ============================================================
export default function NewsPage() {
  const newsArray = useMemo(() => {
    return (Object.values(newsData) as NewsItem[])
      .filter((n): n is NewsItem =>
        n != null && typeof n === 'object' && 'title' in n && isAntennaRelated(n as NewsItem)
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [])

  // 所有来源（按出现顺序）
  const sources = useMemo(() => {
    const arr: string[] = []
    newsArray.forEach(n => {
      if (!arr.includes(n.source)) arr.push(n.source)
    })
    return ['全部', ...arr]
  }, [newsArray])

  const [activeFilter, setActiveFilter] = useState('全部')

  const filtered = useMemo(() => {
    return activeFilter === '全部' ? newsArray : newsArray.filter(n => n.source === activeFilter)
  }, [activeFilter, newsArray])

  return (
    <div>
      <header className="header">
        <h1>📰 行业动态</h1>
        <p>天线行业最新资讯 · 按时间排序 · 原子卡片展示</p>
      </header>

      {/* 来源筛选 */}
      <section className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {sources.map(src => (
            <button
              key={src}
              onClick={() => setActiveFilter(src)}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                border: activeFilter === src ? '2px solid #667eea' : '2px solid #e0e0e0',
                background: activeFilter === src ? '#667eea' : 'white',
                color: activeFilter === src ? 'white' : '#666',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: activeFilter === src ? 600 : 400,
              }}
            >
              {src}
            </button>
          ))}
        </div>
        <div style={{ marginTop: '12px', fontSize: '0.85rem', color: '#999' }}>
          共 {filtered.length} 条资讯
        </div>
      </section>

      {/* 原子卡片列表 */}
      <section>
        {filtered.map((news) => {
          const srcColor = SOURCE_COLORS[news.source] || '#999'
          return (
            <div
              key={news.id}
              className="card news-card"
              style={{
                marginBottom: '16px',
                padding: '20px',
                borderLeft: `4px solid ${srcColor}`,
              }}
            >
              {/* 顶部：日期 + 来源 */}
              <div className="news-card-header">
                <span className="news-date">{news.date}</span>
                <span
                  className="news-source-badge"
                  style={{
                    fontSize: '0.75rem',
                    padding: '3px 10px',
                    borderRadius: '12px',
                    background: srcColor + '18',
                    color: srcColor,
                    fontWeight: 600,
                  }}
                >
                  {news.source}
                </span>
              </div>

              {/* 标题 */}
              <h3 className="news-card-title">
                <a
                  href={resolveNewsUrl(news)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {news.title}
                </a>
              </h3>

              {/* 摘要 */}
              {news.summary && news.summary !== news.title && (
                <p className="news-card-summary">{news.summary}</p>
              )}

              {/* 底部：Tags + 链接文字 */}
              <div className="news-card-footer">
                <div className="news-card-tags">
                  {news.tags?.map((tag, j) => (
                    <span key={j} className="news-tag">{tag}</span>
                  ))}
                </div>
                <a
                  href={resolveNewsUrl(news)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="news-read-more"
                  style={{ color: srcColor }}
                >
                  阅读原文 →
                </a>
              </div>
            </div>
          )
        })}
      </section>
    </div>
  )
}
