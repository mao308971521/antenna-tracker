import './globals.css'
import type { Metadata } from 'next'
import Navbar from '../components/Navbar'

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
      <body>
        <Navbar />
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