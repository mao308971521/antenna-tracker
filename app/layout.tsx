import './globals.css'
import type { Metadata } from 'next'
import Link from 'next/link'
import GlobalSearch from '@/components/GlobalSearch'

export const metadata: Metadata = {
  title: '天线行业情报追踪系统',
  description: '天线行业情报追踪 - 市场研究、行业动态、企业追踪、价格监测、标准更新',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <nav className="navbar">
          <div className="navbar-container">
            <Link href="/" className="navbar-brand">📡 天线情报</Link>
            {/* Desktop Navigation */}
            <div className="navbar-nav desktop-nav">
              <Link href="/" className="nav-link">首页</Link>
              <Link href="/market" className="nav-link">市场</Link>
              <Link href="/news" className="nav-link">行业动态</Link>
              <Link href="/companies" className="nav-link">企业</Link>
              <Link href="/prices" className="nav-link">价格</Link>
              <Link href="/standards" className="nav-link">标准</Link>
              <Link href="/technology" className="nav-link">技术</Link>
            </div>
            {/* Mobile Navigation - Hamburger Menu */}
            <details className="mobile-nav-wrapper">
              <summary className="mobile-nav-trigger">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="hamburger-icon">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </summary>
              <div className="mobile-nav-menu">
                <Link href="/" className="mobile-nav-link">首页</Link>
                <Link href="/market" className="mobile-nav-link">市场</Link>
                <Link href="/news" className="mobile-nav-link">行业动态</Link>
                <Link href="/companies" className="mobile-nav-link">企业</Link>
                <Link href="/prices" className="mobile-nav-link">价格</Link>
                <Link href="/standards" className="mobile-nav-link">标准</Link>
                <Link href="/technology" className="mobile-nav-link">技术</Link>
              </div>
            </details>
            <div className="navbar-search">
              <button
                className="search-trigger"
                onClick={() => {
                  // 触发 GlobalSearch 组件显示
                  const event = new KeyboardEvent('keydown', { key: '/' })
                  document.dispatchEvent(event)
                }}
                title="搜索 (按 / 唤起)"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="search-icon-svg">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <span className="search-trigger-text">搜索</span>
                <kbd className="search-kbd">/</kbd>
              </button>
            </div>
          </div>
        </nav>
        <GlobalSearch />
        <main className="container">
          {children}
        </main>
        <footer className="footer">
          <p>天线行业情报追踪系统 · 数据持续更新中</p>
        </footer>
      </body>
    </html>
  )
}