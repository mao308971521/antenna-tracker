'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'

// 模块配置
const MODULES = [
  { key: 'news', name: '行业动态', path: '/news', color: '#667eea' },
  { key: 'market', name: '市场', path: '/market', color: '#00C49F' },
  { key: 'companies', name: '企业', path: '/companies', color: '#FFBB28' },
  { key: 'prices', name: '价格', path: '/prices', color: '#FF8042' },
  { key: 'standards', name: '标准', path: '/standards', color: '#9966FF' },
  { key: 'technology', name: '技术', path: '/technology', color: '#FF6699' },
]

// 数据项接口
interface SearchItem {
  id: string
  title: string
  summary?: string
  content?: string
  module: string
  moduleName: string
  path: string
  extra?: string
}

// 搜索结果分组
interface GroupedResults {
  module: string
  moduleName: string
  moduleColor: string
  path: string
  items: SearchItem[]
}

// 模糊匹配函数
function fuzzyMatch(text: string, query: string): boolean {
  if (!text || !query) return false
  const textLower = text.toLowerCase()
  const queryLower = query.toLowerCase()

  // 完全匹配优先
  if (textLower.includes(queryLower)) return true

  // 简单模糊匹配：检查query中每个字符是否按顺序出现在text中
  let textIndex = 0
  for (const char of queryLower) {
    const found = textLower.indexOf(char, textIndex)
    if (found === -1) return false
    textIndex = found + 1
  }
  return true
}

// 提取搜索文本（从任意数据结构中提取可搜索的文本）
function extractSearchableText(data: unknown, module: string): string[] {
  const texts: string[] = []

  function extract(obj: unknown) {
    if (!obj || typeof obj !== 'object') return

    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (
        typeof value === 'string' &&
        value.length > 2 &&
        value.length < 500 &&
        !key.includes('url') &&
        !key.includes('link') &&
        !key.includes('icon') &&
        !key.includes('color')
      ) {
        texts.push(value)
      } else if (Array.isArray(value)) {
        value.forEach(item => extract(item))
      } else if (typeof value === 'object' && value !== null) {
        extract(value)
      }
    }
  }

  extract(data)
  return texts
}

// 解析不同模块的数据，提取可搜索项
function parseModuleData(data: unknown, moduleKey: string, moduleName: string, modulePath: string): SearchItem[] {
  const items: SearchItem[] = []

  if (moduleKey === 'news' && Array.isArray(data)) {
    data.forEach((item: { id?: number; title?: string; summary?: string; tags?: string[] }) => {
      if (item.title) {
        items.push({
          id: `${moduleKey}-${item.id}`,
          title: item.title,
          summary: item.summary,
          module: moduleKey,
          moduleName,
          path: modulePath,
          extra: item.tags?.join(', ')
        })
      }
    })
  } else if (moduleKey === 'market' && typeof data === 'object') {
    const marketData = data as { segments?: Array<{ name?: string; drivers?: string[] }>; keyDrivers?: string[] }
    if (marketData.segments) {
      marketData.segments.forEach((seg, idx) => {
        const searchableText = [
          seg.name,
          ...(seg.drivers || [])
        ].filter(Boolean).join(' ')
        items.push({
          id: `${moduleKey}-segment-${idx}`,
          title: seg.name || '',
          content: searchableText,
          module: moduleKey,
          moduleName,
          path: modulePath
        })
      })
    }
    if (marketData.keyDrivers) {
      marketData.keyDrivers.forEach((driver, idx) => {
        items.push({
          id: `${moduleKey}-driver-${idx}`,
          title: driver,
          module: moduleKey,
          moduleName,
          path: modulePath
        })
      })
    }
  } else if (moduleKey === 'companies' && typeof data === 'object') {
    const companiesData = data as { supplyChain?: { upstream?: { companies?: Array<{ name?: string; position?: string; highlights?: string[] }> }; midstream?: { companies?: Array<{ name?: string; position?: string; highlights?: string[] }> }; downstream?: { companies?: Array<{ name?: string; position?: string; highlights?: string[] }> } } }
    const sections = [
      companiesData.supplyChain?.upstream?.companies,
      companiesData.supplyChain?.midstream?.companies,
      companiesData.supplyChain?.downstream?.companies
    ]
    sections.forEach(companies => {
      if (Array.isArray(companies)) {
        companies.forEach((company, idx) => {
          if (company.name) {
            items.push({
              id: `${moduleKey}-${idx}`,
              title: company.name,
              summary: company.position,
              content: company.highlights?.join(', '),
              module: moduleKey,
              moduleName,
              path: modulePath
            })
          }
        })
      }
    })
  } else if (moduleKey === 'prices' && typeof data === 'object') {
    const pricesData = data as { categories?: Array<{ name?: string; materials?: Array<{ name?: string; impact?: string; trend?: string }> }> }
    if (pricesData.categories) {
      pricesData.categories.forEach(cat => {
        if (cat.materials) {
          cat.materials.forEach((mat, idx) => {
            items.push({
              id: `${moduleKey}-${idx}`,
              title: mat.name ?? '',
              summary: mat.impact ?? '',
              extra: mat.trend,
              module: moduleKey,
              moduleName,
              path: modulePath
            })
          })
        }
      })
    }
  } else if (moduleKey === 'standards' && typeof data === 'object') {
    const standardsData = data as { categories?: Array<{ standards?: Array<{ name?: string; title?: string; description?: string }> }> }
    if (standardsData.categories) {
      standardsData.categories.forEach(cat => {
        if (cat.standards) {
          cat.standards.forEach((std, idx) => {
            items.push({
              id: `${moduleKey}-${idx}`,
              title: std.name ?? '',
              summary: std.title ?? '',
              content: std.description ?? '',
              module: moduleKey,
              moduleName,
              path: modulePath
            })
          })
        }
      })
    }
  } else if (moduleKey === 'technology' && typeof data === 'object') {
    const techData = data as { technologies?: Array<{ name?: string; nameCn?: string; currentStatus?: string; phase?: string }> }
    if (techData.technologies) {
      techData.technologies.forEach((tech, idx) => {
        items.push({
          id: `${moduleKey}-${idx}`,
          title: tech.nameCn || tech.name || '',
          summary: tech.currentStatus,
          extra: tech.phase,
          module: moduleKey,
          moduleName,
          path: modulePath
        })
      })
    }
  }

  return items
}

export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [allItems, setAllItems] = useState<SearchItem[]>([])
  const [results, setResults] = useState<GroupedResults[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  // 加载所有数据
  const loadAllData = useCallback(async () => {
    setIsLoading(true)
    const items: SearchItem[] = []

    try {
      const dataFiles = ['market', 'news', 'companies', 'prices', 'standards', 'technology']

      await Promise.all(
        dataFiles.map(async (moduleKey) => {
          try {
            const response = await fetch(`/data/${moduleKey}.json`)
            if (response.ok) {
              const data = await response.json()
              const module = MODULES.find(m => m.key === moduleKey)
              if (module) {
                const parsed = parseModuleData(data, moduleKey, module.name, module.path)
                items.push(...parsed)
              }
            }
          } catch (error) {
            console.error(`Failed to load ${moduleKey}.json:`, error)
          }
        })
      )

      setAllItems(items)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 初始化加载数据
  useEffect(() => {
    loadAllData()
  }, [loadAllData])

  // 搜索逻辑
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setSelectedIndex(-1)
      return
    }

    const matchedItems = allItems.filter(item => {
      const searchFields = [
        item.title,
        item.summary,
        item.content,
        item.extra
      ].filter(Boolean)

      return searchFields.some(field => fuzzyMatch(field!, query))
    })

    // 按模块分组
    const grouped: Record<string, GroupedResults> = {}
    matchedItems.forEach(item => {
      if (!grouped[item.module]) {
        const moduleConfig = MODULES.find(m => m.key === item.module)
        if (moduleConfig) {
          grouped[item.module] = {
            module: item.module,
            moduleName: item.moduleName,
            moduleColor: moduleConfig.color,
            path: item.path,
            items: []
          }
        }
      }
      if (grouped[item.module]) {
        grouped[item.module].items.push(item)
      }
    })

    const groupedResults = Object.values(grouped)
    setResults(groupedResults)

    // 重置选中状态
    setSelectedIndex(-1)
  }, [query, allItems])

  // "/" 快捷键唤起搜索
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 如果在输入框中按 "/" 则不触发
      if (e.key === '/' && !isOpen) {
        const target = e.target as HTMLElement
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

        e.preventDefault()
        setIsOpen(true)
        setQuery('')
        setTimeout(() => inputRef.current?.focus(), 100)
      }

      // ESC 关闭搜索
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
        setQuery('')
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (resultsRef.current && !resultsRef.current.contains(e.target as Node)) {
        // 如果点击的不是搜索框本身，不关闭
      }
    }

    if (isOpen) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [isOpen])

  // 键盘导航
  const handleKeyNavigation = (e: React.KeyboardEvent) => {
    if (!results.length) return

    const totalItems = results.reduce((sum, g) => sum + g.items.length, 0)

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, totalItems - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, -1))
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault()
      let current = 0
      for (const group of results) {
        for (const item of group.items) {
          if (current === selectedIndex) {
            window.location.href = item.path
            setIsOpen(false)
            setQuery('')
            return
          }
          current++
        }
      }
    }
  }

  // 高亮匹配文本
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)
    return parts.map((part, i) =>
      regex.test(part) ? <mark key={i} className="search-highlight">{part}</mark> : part
    )
  }

  // 计算总结果数
  const totalResults = results.reduce((sum, g) => sum + g.items.length, 0)

  // 计算某个索引在哪个组
  const getItemAtIndex = (index: number): { group: GroupedResults; item: SearchItem; localIndex: number } | null => {
    let current = 0
    for (const group of results) {
      for (const item of group.items) {
        if (current === index) {
          return { group, item, localIndex: group.items.indexOf(item) }
        }
        current++
      }
    }
    return null
  }

  if (!isOpen) return null

  return (
    <>
      {/* 遮罩层 */}
      <div
        className="search-overlay"
        onClick={() => {
          setIsOpen(false)
          setQuery('')
        }}
      />

      {/* 搜索弹窗 */}
      <div className="search-modal" ref={resultsRef}>
        {/* 搜索输入框 */}
        <div className="search-input-wrapper">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder="搜索行业动态、市场、企业、价格、标准、技术..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyNavigation}
          />
          <span className="search-shortcut">按 ESC 关闭</span>
        </div>

        {/* 搜索结果 */}
        {isLoading && (
          <div className="search-loading">加载数据中...</div>
        )}

        {!isLoading && query && results.length === 0 && (
          <div className="search-empty">
            未找到与 "{query}" 相关的结果
          </div>
        )}

        {!isLoading && results.length > 0 && (
          <div className="search-results">
            <div className="search-results-header">
              找到 {totalResults} 个结果
            </div>

            {results.map(group => (
              <div key={group.module} className="search-group">
                <div
                  className="search-group-header"
                  style={{ borderLeftColor: group.moduleColor }}
                >
                  <span
                    className="search-group-badge"
                    style={{ backgroundColor: group.moduleColor }}
                  >
                    {group.moduleName}
                  </span>
                  <span className="search-group-count">{group.items.length} 项</span>
                  <Link
                    href={group.path}
                    className="search-group-more"
                    onClick={() => {
                      setIsOpen(false)
                      setQuery('')
                    }}
                  >
                    查看全部 &rarr;
                  </Link>
                </div>

                <div className="search-group-items">
                  {group.items.slice(0, 5).map((item, idx) => {
                    const globalIndex = results
                      .slice(0, results.indexOf(group))
                      .reduce((sum, g) => sum + g.items.length, 0) + idx

                    return (
                      <Link
                        key={item.id}
                        href={item.path}
                        className={`search-item ${globalIndex === selectedIndex ? 'search-item-selected' : ''}`}
                        onClick={() => {
                          setIsOpen(false)
                          setQuery('')
                        }}
                        onMouseEnter={() => setSelectedIndex(globalIndex)}
                      >
                        <div className="search-item-title">
                          {highlightMatch(item.title, query)}
                        </div>
                        {item.summary && (
                          <div className="search-item-summary">
                            {highlightMatch(item.summary, query)}
                          </div>
                        )}
                        {item.extra && (
                          <div className="search-item-extra">
                            {highlightMatch(item.extra, query)}
                          </div>
                        )}
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 底部提示 */}
        {!query && (
          <div className="search-hints">
            <span className="search-hint-title">快捷操作</span>
            <div className="search-hint-items">
              <span className="search-hint-item">
                <kbd>/</kbd> 唤起搜索
              </span>
              <span className="search-hint-item">
                <kbd>↑</kbd><kbd>↓</kbd> 导航
              </span>
              <span className="search-hint-item">
                <kbd>Enter</kbd> 跳转
              </span>
              <span className="search-hint-item">
                <kbd>ESC</kbd> 关闭
              </span>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .search-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 999;
        }

        .search-modal {
          position: fixed;
          top: 80px;
          left: 50%;
          transform: translateX(-50%);
          width: 600px;
          max-width: 90vw;
          max-height: 70vh;
          background: white;
          border-radius: 12px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
          z-index: 1000;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .search-input-wrapper {
          display: flex;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #eee;
          gap: 12px;
        }

        .search-icon {
          width: 20px;
          height: 20px;
          color: #999;
          flex-shrink: 0;
        }

        .search-input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 16px;
          padding: 8px 0;
          background: transparent;
        }

        .search-input::placeholder {
          color: #aaa;
        }

        .search-shortcut {
          font-size: 12px;
          color: #999;
          background: #f5f5f5;
          padding: 4px 8px;
          border-radius: 4px;
        }

        .search-loading,
        .search-empty {
          padding: 40px;
          text-align: center;
          color: #999;
        }

        .search-results {
          flex: 1;
          overflow-y: auto;
          padding: 8px 0;
        }

        .search-results-header {
          padding: 8px 20px;
          font-size: 12px;
          color: #999;
        }

        .search-group {
          margin-bottom: 8px;
        }

        .search-group-header {
          display: flex;
          align-items: center;
          padding: 12px 20px;
          border-left: 3px solid;
          background: #fafafa;
        }

        .search-group-badge {
          color: white;
          font-size: 12px;
          padding: 2px 8px;
          border-radius: 4px;
          margin-right: 12px;
        }

        .search-group-count {
          font-size: 12px;
          color: #999;
          margin-right: auto;
        }

        .search-group-more {
          font-size: 12px;
          color: #667eea;
          text-decoration: none;
        }

        .search-group-more:hover {
          text-decoration: underline;
        }

        .search-group-items {
          padding: 0 12px;
        }

        .search-item {
          display: block;
          padding: 12px 16px;
          text-decoration: none;
          color: inherit;
          border-radius: 8px;
          transition: background 0.15s;
        }

        .search-item:hover,
        .search-item-selected {
          background: #f0f4ff;
        }

        .search-item-title {
          font-size: 14px;
          font-weight: 500;
          color: #333;
          margin-bottom: 4px;
        }

        .search-item-summary {
          font-size: 13px;
          color: #666;
          line-height: 1.4;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .search-item-extra {
          font-size: 12px;
          color: #999;
          margin-top: 4px;
        }

        :global(.search-highlight) {
          background: #fff3cd;
          padding: 0 2px;
          border-radius: 2px;
        }

        .search-hints {
          padding: 16px 20px;
          border-top: 1px solid #eee;
          background: #fafafa;
        }

        .search-hint-title {
          font-size: 12px;
          color: #999;
          margin-bottom: 8px;
          display: block;
        }

        .search-hint-items {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }

        .search-hint-item {
          font-size: 12px;
          color: #666;
        }

        .search-hint-item kbd {
          background: white;
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 2px 6px;
          font-size: 11px;
          margin-right: 4px;
        }
      `}</style>
    </>
  )
}