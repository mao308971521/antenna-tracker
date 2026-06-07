'use client'

import { useEffect } from 'react'

export default function SearchTrigger() {
  // 触发搜索弹窗
  const openSearch = () => {
    const event = new CustomEvent('openGlobalSearch')
    document.dispatchEvent(event)
  }

  // 监听 "/" 快捷键唤起搜索
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !e.defaultPrevented) {
        const target = e.target as HTMLElement
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
        e.preventDefault()
        openSearch()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <button
      className="search-trigger"
      onClick={openSearch}
      title="搜索 (按 / 唤起)"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="search-icon-svg">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
      <span className="search-trigger-text">搜索</span>
      <kbd className="search-kbd">/</kbd>
    </button>
  )
}