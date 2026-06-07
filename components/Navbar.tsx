'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import GlobalSearch from '@/components/GlobalSearch'
import SearchTrigger from '@/components/SearchTrigger'

export default function Navbar() {
  const pathname = usePathname()
  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          <Link href="/" className="navbar-brand">📡 天线情报</Link>
          <div className="navbar-nav">
            <Link href="/" className={`nav-link${pathname === '/' ? ' active' : ''}`}>首页</Link>
            <Link href="/market" className={`nav-link${pathname === '/market' ? ' active' : ''}`}>市场</Link>
            <Link href="/news" className={`nav-link${pathname === '/news' ? ' active' : ''}`}>行业动态</Link>
            <Link href="/companies" className={`nav-link${pathname === '/companies' ? ' active' : ''}`}>企业</Link>
            <Link href="/prices" className={`nav-link${pathname === '/prices' ? ' active' : ''}`}>价格</Link>
            <Link href="/standards" className={`nav-link${pathname === '/standards' ? ' active' : ''}`}>标准</Link>
            <Link href="/technology" className={`nav-link${pathname === '/technology' ? ' active' : ''}`}>技术</Link>
          </div>
          <div className="navbar-search">
            <SearchTrigger />
          </div>
        </div>
      </nav>
      <GlobalSearch />
    </>
  )
}