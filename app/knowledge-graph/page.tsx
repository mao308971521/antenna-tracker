'use client'
import { useState, useMemo, useRef, useEffect } from 'react'
import kgData from '@/app/_data/knowledge-graph.json'

type Entity = typeof kgData.entities[0]
type Relation = typeof kgData.relations[0]

const ENTITY_COLORS: Record<string, string> = {
  technology: '#667eea',
  company: '#f093fb',
  standard: '#4facfe',
  material: '#43e97b',
  event: '#fa709a',
}

const ENTITY_LABELS: Record<string, string> = {
  technology: '技术',
  company: '企业',
  standard: '标准',
  material: '材料',
  event: '事件',
}

function EntityIcon(type: string): string {
  switch (type) {
    case 'technology': return '🔬'
    case 'company': return '🏢'
    case 'standard': return '📜'
    case 'material': return '🧪'
    case 'event': return '⚡'
    default: return '📌'
  }
}

// Hub 抽样：实体太多时保留度数最高的节点，避免 O(N²) 算法卡死浏览器
function sampleHubEntities(
  entities: Entity[],
  relations: Relation[],
  maxN: number = 100
): { entities: Entity[]; relations: Relation[] } {
  if (entities.length <= maxN) {
    return { entities, relations }
  }
  // 计算每个实体的度数（被多少关系引用）
  const degree = new Map<string, number>()
  entities.forEach(e => degree.set(e.id, 0))
  relations.forEach(r => {
    degree.set(r.source, (degree.get(r.source) || 0) + 1)
    degree.set(r.target, (degree.get(r.target) || 0) + 1)
  })
  // 按度数降序，取 top maxN
  const sorted = [...entities].sort((a, b) => (degree.get(b.id) || 0) - (degree.get(a.id) || 0))
  const kept = new Set(sorted.slice(0, maxN).map(e => e.id))
  const keptEnts = entities.filter(e => kept.has(e.id))
  const keptRels = relations.filter(r => kept.has(r.source) && kept.has(r.target))
  return { entities: keptEnts, relations: keptRels }
}

// Force-directed layout simulation (simple)
function simulateLayout(
  entities: Entity[],
  relations: Relation[],
  iterations: number = 80
): { id: string; x: number; y: number }[] {
  const W = 1400
  const H = 1000
  const nodeMap = new Map<string, { id: string; x: number; y: number; vx: number; vy: number }>()

  entities.forEach((e, i) => {
    const angle = (i / entities.length) * Math.PI * 2
    const r = Math.min(W, H) * 0.3
    nodeMap.set(e.id, {
      id: e.id,
      x: W / 2 + Math.cos(angle) * r,
      y: H / 2 + Math.sin(angle) * r,
      vx: 0,
      vy: 0,
    })
  })

  const nodeArr = Array.from(nodeMap.values())
  const links = relations
    .map(r => ({ source: r.source, target: r.target }))
    .filter(l => nodeMap.has(l.source) && nodeMap.has(l.target))

  for (let iter = 0; iter < iterations; iter++) {
    const alpha = 1 - iter / iterations

    // Repulsion between all pairs
    for (let i = 0; i < nodeArr.length; i++) {
      for (let j = i + 1; j < nodeArr.length; j++) {
        const a = nodeArr[i]
        const b = nodeArr[j]
        let dx = b.x - a.x
        let dy = b.y - a.y
        let dist = Math.sqrt(dx * dx + dy * dy) || 1
        let force = 8000 / (dist * dist)
        let fx = (dx / dist) * force * alpha
        let fy = (dy / dist) * force * alpha
        a.vx -= fx
        a.vy -= fy
        b.vx += fx
        b.vy += fy
      }
    }

    // Attraction along links
    for (const link of links) {
      const source = nodeMap.get(link.source)
      const target = nodeMap.get(link.target)
      if (!source || !target) continue
      let dx = target.x - source.x
      let dy = target.y - source.y
      let dist = Math.sqrt(dx * dx + dy * dy) || 1
      let force = (dist - 150) * 0.01 * alpha
      let fx = (dx / dist) * force
      let fy = (dy / dist) * force
      source.vx += fx
      source.vy += fy
      target.vx -= fx
      target.vy -= fy
    }

    // Center gravity
    for (const node of nodeArr) {
      node.vx += (W / 2 - node.x) * 0.002 * alpha
      node.vy += (H / 2 - node.y) * 0.002 * alpha
    }

    // Apply velocity
    for (const node of nodeArr) {
      node.vx *= 0.6
      node.vy *= 0.6
      node.x += node.vx
      node.y += node.vy
      // Boundary
      node.x = Math.max(80, Math.min(W - 80, node.x))
      node.y = Math.max(60, Math.min(H - 20, node.y))
    }
  }

  return nodeArr.map(n => ({ id: n.id, x: n.x, y: n.y }))
}

export default function KnowledgeGraphPage() {
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null)
  const [hoveredEntity, setHoveredEntity] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<string>('all')
  const [layout, setLayout] = useState<{ id: string; x: number; y: number }[]>([])
  const [layoutReady, setLayoutReady] = useState(false)
  const layoutRef = useRef<{ id: string; x: number; y: number }[]>([])

  const entities = kgData.entities
  const relations = kgData.relations

  // Hub 抽样 + 异步计算 layout，避免 O(N²) 卡死主线程
  useEffect(() => {
    const sampled = sampleHubEntities(entities, relations, 100)
    // 用 setTimeout 让浏览器先 paint 骨架，再算 layout
    const handle = setTimeout(() => {
      const result = simulateLayout(sampled.entities, sampled.relations, 80)
      layoutRef.current = result
      setLayout(result)
      setLayoutReady(true)
    }, 30)
    return () => clearTimeout(handle)
  }, [entities, relations])

  // Filter by type
  const filteredEntities = useMemo(() => {
    if (filterType === 'all') return entities
    return entities.filter(e => e.type === filterType)
  }, [entities, filterType])

  const filteredEntityIds = new Set(filteredEntities.map(e => e.id))
  // layoutNodeIds = 当前实际有 layout 坐标的节点集合（抽样后可能少于全集）
  const layoutNodeIds = useMemo(() => new Set(layout.map(n => n.id)), [layout])
  const filteredRelations = useMemo(() => {
    return relations.filter(r =>
      filteredEntityIds.has(r.source) && filteredEntityIds.has(r.target)
      && layoutNodeIds.has(r.source) && layoutNodeIds.has(r.target)
    )
  }, [relations, filteredEntityIds, layoutNodeIds])

  // Get connected entities for selected entity
  const connectedEntityIds = useMemo(() => {
    if (!selectedEntity) return new Set<string>()
    const ids = new Set<string>()
    ids.add(selectedEntity.id)
    relations.forEach(r => {
      if (r.source === selectedEntity.id) ids.add(r.target)
      if (r.target === selectedEntity.id) ids.add(r.source)
    })
    return ids
  }, [selectedEntity, relations])

  const layoutNode = (id: string) => layout.find(n => n.id === id) || { x: 0, y: 0 }

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: entities.length }
    entities.forEach(e => { counts[e.type] = (counts[e.type] || 0) + 1 })
    return counts
  }, [entities])

  return (
    <div>
      <header className="header">
        <h1>🕸️ 知识图谱</h1>
        <p>天线行业知识网络 — 实体关系可视化 · 数据来源：各板块结构化数据 + 小月技术解读笔记</p>
        <p className="update-info">数据更新：{kgData.lastUpdate} · {entities.length} 个实体 · {relations.length} 条关系</p>
      </header>

      {/* 类型筛选 */}
      <section className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setFilterType('all')}
            style={{
              padding: '8px 18px',
              borderRadius: '20px',
              border: filterType === 'all' ? '2px solid #667eea' : '2px solid #e0e00e0',
              background: filterType === 'all' ? '#667eea' : 'white',
              color: filterType === 'all' ? 'white' : '#333',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 600,
            }}
          >
            全部 ({typeCounts.all})
          </button>
          {Object.entries(ENTITY_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilterType(key)}
              style={{
                padding: '8px 18px',
                borderRadius: '20px',
                border: filterType === key ? `2px solid ${ENTITY_COLORS[key]}` : '2px solid #e0e0e0',
                background: filterType === key ? ENTITY_COLORS[key] : 'white',
                color: filterType === key ? 'white' : '#333',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 600,
              }}
            >
              {EntityIcon(key)} {label} ({typeCounts[key] || 0})
            </button>
          ))}
        </div>
      </section>

      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        {/* 图谱可视化 */}
        <div className="card" style={{ flex: '1 1 600px', minWidth: '0' }}>
          <h3 style={{ marginBottom: '16px' }}>📊 知识图谱关系图</h3>
          <div style={{ position: 'relative', width: '100%', overflow: 'hidden', minHeight: '500px' }}>
            {layoutReady ? (
            <svg
              viewBox="0 0 1400 1000"
              style={{ width: '100%', height: 'auto', background: '#fafbfc', borderRadius: '8px', border: '1px solid #eee' }}
            >
              {/* 关系线 */}
              {filteredRelations.map((rel, i) => {
                const src = layoutNode(rel.source)
                const tgt = layoutNode(rel.target)
                const isHighlighted = hoveredEntity
                  ? (rel.source === hoveredEntity || rel.target === hoveredEntity)
                  : (!selectedEntity || connectedEntityIds.has(rel.source) && connectedEntityIds.has(rel.target))
                const opacity = hoveredEntity || selectedEntity ? (isHighlighted ? 0.8 : 0.1) : 0.3
                return (
                  <line
                    key={i}
                    x1={src.x}
                    y1={src.y + 20}
                    x2={tgt.x}
                    y2={tgt.y + 20}
                    stroke={isHighlighted ? '#667eea' : '#ccc'}
                    strokeWidth={isHighlighted ? 2 : 1}
                    opacity={opacity}
                    markerEnd="url(#arrowhead)"
                  />
                )
              })}

              {/* 箭头 */}
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#667eea" opacity="0.8" />
                </marker>
              </defs>

              {/* 实体节点 */}
              {filteredEntities.map((entity, i) => {
                const pos = layoutNode(entity.id)
                const isSelected = selectedEntity?.id === entity.id
                const isHovered = hoveredEntity === entity.id
                const isConnected = selectedEntity ? connectedEntityIds.has(entity.id) : true
                const color = ENTITY_COLORS[entity.type] || '#999'
                const radius = isSelected ? 32 : (isHovered ? 30 : Math.max(16, Math.min(24, 300 / Math.sqrt(entities.length))))
                return (
                  <g
                    key={entity.id}
                    onClick={() => setSelectedEntity(isSelected ? null : entity)}
                    onMouseEnter={() => setHoveredEntity(entity.id)}
                    onMouseLeave={() => setHoveredEntity(null)}
                    style={{ cursor: 'pointer' }}
                  >
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={radius}
                      fill={color}
                      fillOpacity={isConnected ? 0.85 : 0.15}
                      stroke={isSelected ? '#333' : 'white'}
                      strokeWidth={isSelected ? 3 : 2}
                      style={{ transition: 'all 0.3s ease' }}
                    />
                    <text
                      x={pos.x}
                      y={pos.y + 4}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="14"
                      pointerEvents="none"
                    >
                      {EntityIcon(entity.type)}
                    </text>
                    <text
                      x={pos.x}
                      y={pos.y + radius + 14}
                      textAnchor="middle"
                      fontSize="11"
                      fill={isConnected ? '#333' : '#ccc'}
                      fontWeight={isSelected ? 700 : 400}
                      pointerEvents="none"
                    >
                      {entity.name.length > 8 ? entity.name.slice(0, 8) + '…' : entity.name}
                    </text>
                  </g>
                )
              })}
            </svg>
            ) : (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                height: '500px', background: '#fafbfc', borderRadius: '8px',
                border: '1px solid #eee', color: '#999', fontSize: '0.95rem',
                flexDirection: 'column', gap: '12px'
              }}>
                <div style={{
                  width: '40px', height: '40px', border: '3px solid #e0e0e0',
                  borderTopColor: '#667eea', borderRadius: '50%',
                  animation: 'kg-spin 1s linear infinite'
                }} />
                <span>正在计算 {entities.length} 个实体的布局…</span>
                <style>{`@keyframes kg-spin { to { transform: rotate(360deg) } }`}</style>
              </div>
            )}
          </div>
          <p style={{ fontSize: '0.75rem', color: '#aaa', marginTop: '8px' }}>
            💡 点击节点查看详情，悬浮高亮关联关系，使用上方筛选器按类型过滤
          </p>
        </div>

        {/* 详情面板 */}
        <div style={{ flex: '0 0 340px', minWidth: '280px' }}>
          {selectedEntity ? (
            <div className="card">
              <h3 style={{ marginBottom: '16px' }}>📋 实体详情</h3>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px',
                padding: '12px', background: `${ENTITY_COLORS[selectedEntity.type]}15`, borderRadius: '8px'
              }}>
                <span style={{ fontSize: '2rem' }}>{EntityIcon(selectedEntity.type)}</span>
                <div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#333' }}>{selectedEntity.name}</div>
                  <span className="tag" style={{ background: ENTITY_COLORS[selectedEntity.type], color: 'white' }}>
                    {ENTITY_LABELS[selectedEntity.type]}
                  </span>
                </div>
              </div>
              <p style={{ color: '#666', lineHeight: 1.6, marginBottom: '16px' }}>
                {selectedEntity.description}
              </p>
              {selectedEntity.metadata && (
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '0.85rem', color: '#999', marginBottom: '8px' }}>属性</h4>
                  <table style={{ width: '100%', fontSize: '0.85rem' }}>
                    <tbody>
                      {Object.entries(selectedEntity.metadata).map(([key, val]) => (
                        <tr key={key}>
                          <td style={{ color: '#999', padding: '4px 0', width: '100px' }}>{key}</td>
                          <td style={{ color: '#333', fontWeight: 500 }}>{String(val)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {/* 关联关系 */}
              <div>
                <h4 style={{ fontSize: '0.85rem', color: '#999', marginBottom: '8px' }}>
                  🔗 关联关系 ({connectedEntityIds.size - 1} 条)
                </h4>
                {relations
                  .filter(r => r.source === selectedEntity.id || r.target === selectedEntity.id)
                  .map((rel, i) => {
                    const isSource = rel.source === selectedEntity.id
                    const otherId = isSource ? rel.target : rel.source
                    const otherEntity = entities.find(e => e.id === otherId)
                    if (!otherEntity) return null
                    return (
                      <div
                        key={i}
                        style={{
                          padding: '8px 12px',
                          marginBottom: '8px',
                          background: '#f8f9fa',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          border: `1px solid ${hoveredEntity === otherEntity.id ? ENTITY_COLORS[otherEntity.type] + '40' : '#eee'}`,
                        }}
                        onClick={() => setSelectedEntity(otherEntity)}
                        onMouseEnter={() => setHoveredEntity(otherEntity.id)}
                        onMouseLeave={() => setHoveredEntity(null)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span>{EntityIcon(otherEntity.type)}</span>
                          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{otherEntity.name}</span>
                          <span style={{
                            fontSize: '0.75rem',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            background: '#667eea',
                            color: 'white',
                          }}>
                            {isSource ? rel.relation + '→' : '←' + rel.relation}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#999' }}>{rel.evidence}</div>
                      </div>
                    )
                  })
                }
              </div>
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔍</div>
              <p>点击图谱中的节点查看实体详情</p>
              <p style={{ fontSize: '0.85rem', marginTop: '8px' }}>
                共 {entities.length} 个实体，{relations.length} 条关系
              </p>
            </div>
          )}

          {/* 实体类型图例 */}
          <div className="card" style={{ marginTop: '24px' }}>
            <h4 style={{ marginBottom: '12px' }}>📌 图例</h4>
            {Object.entries(ENTITY_LABELS).map(([key, label]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{
                  width: '16px', height: '16px', borderRadius: '50%',
                  background: ENTITY_COLORS[key], display: 'inline-block'
                }} />
                <span style={{ fontSize: '0.85rem' }}>{EntityIcon(key)} {label}</span>
                <span style={{ fontSize: '0.75rem', color: '#999', marginLeft: 'auto' }}>{typeCounts[key] || 0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
