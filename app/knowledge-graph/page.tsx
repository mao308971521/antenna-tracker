'use client'
import { useState, useMemo, useRef, useEffect } from 'react'
import kgData from '@/app/_data/knowledge-graph.json'
import relationsData from '@/app/_data/relations.json'

type Entity = typeof kgData.entities[0]
type Relation = typeof kgData.relations[0]
type TechRelation = typeof relationsData[0]

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

const ENTITY_ICONS: Record<string, string> = {
  technology: '🔬',
  company: '🏢',
  standard: '📜',
  material: '🧪',
  event: '⚡',
}

// Force-directed layout simulation
function simulateLayout(
  entities: Entity[],
  relations: Relation[],
  iterations: number = 300
): { id: string; x: number; y: number }[] {
  const nodeMap = new Map<string, { id: string; x: number; y: number; vx: number; vy: number }>()
  const W = 1600
  const H = 1000

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

    for (let i = 0; i < nodeArr.length; i++) {
      for (let j = i + 1; j < nodeArr.length; j++) {
        const a = nodeArr[i]
        const b = nodeArr[j]
        let dx = b.x - a.x
        let dy = b.y - a.y
        let dist = Math.sqrt(dx * dx + dy * dy) || 1
        let force = 15000 / (dist * dist)
        let fx = (dx / dist) * force * alpha
        let fy = (dy / dist) * force * alpha
        a.vx -= fx
        a.vy -= fy
        b.vx += fx
        b.vy += fy
      }
    }

    for (const link of links) {
      const source = nodeMap.get(link.source)
      const target = nodeMap.get(link.target)
      if (!source || !target) continue
      let dx = target.x - source.x
      let dy = target.y - source.y
      let dist = Math.sqrt(dx * dx + dy * dy) || 1
      let force = (dist - 100) * 0.015 * alpha
      let fx = (dx / dist) * force
      let fy = (dy / dist) * force
      source.vx += fx
      source.vy += fy
      target.vx -= fx
      target.vy -= fy
    }

    for (const node of nodeArr) {
      node.vx += (W / 2 - node.x) * 0.005 * alpha
      node.vy += (H / 2 - node.y) * 0.005 * alpha
    }

    for (const node of nodeArr) {
      node.vx *= 0.6
      node.vy *= 0.6
      node.x += node.vx
      node.y += node.vy
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
  const [expandedNodeId, setExpandedNodeId] = useState<string | null>(null)
  const [focusMode, setFocusMode] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null)
  const layoutRef = useRef<{ id: string; x: number; y: number }[]>([])

  const entities = kgData.entities
  const relations = kgData.relations

  // Merge both relation sources for layout simulation
  const allRelations = useMemo(() => [
    ...relations,
    ...relationsData.map(r => ({ source: r.source, target: r.target, relation: r.predicate, confidence: 0.9, evidence: '' }))
  ], [relations, relationsData])

  const layout = useMemo(() => simulateLayout(entities, allRelations), [entities, allRelations])

  // Search filter + highlight (side-effects moved to useEffect below)
  const searchFilteredEntities = useMemo(() => {
    if (!searchQuery.trim()) return entities
    const q = searchQuery.toLowerCase().trim()
    return entities.filter(e => 
      e.name.toLowerCase().includes(q) || 
      (e.description && e.description.toLowerCase().includes(q)) ||
      e.type.toLowerCase().includes(q)
    )
  }, [entities, searchQuery])

  // Highlight single-match entity on search
  useEffect(() => {
    const matched = searchFilteredEntities
    if (matched.length === 1) {
      setHighlightedNodeId(matched[0].id)
      setSelectedEntity(matched[0])
    } else {
      setHighlightedNodeId(null)
    }
  }, [searchFilteredEntities])

  // Type filter
  const filteredEntities = useMemo(() => {
    if (filterType === 'all') return searchFilteredEntities
    return searchFilteredEntities.filter(e => e.type === filterType)
  }, [searchFilteredEntities, filterType])

  const filteredEntityIds = new Set(filteredEntities.map(e => e.id))
  const filteredRelations = useMemo(() => {
    return allRelations.filter(r => filteredEntityIds.has(r.source) && filteredEntityIds.has(r.target))
  }, [allRelations, filteredEntityIds])

  // Connected entities for selected entity or focus mode
  const connectedEntityIds = useMemo(() => {
    const focusId = focusMode || (selectedEntity ? selectedEntity.id : null)
    if (!focusId) return new Set<string>()
    const ids = new Set<string>()
    ids.add(focusId)
    allRelations.forEach(r => {
      if (r.source === focusId) ids.add(r.target)
      if (r.target === focusId) ids.add(r.source)
    })
    return ids
  }, [focusMode, selectedEntity, allRelations])

  // Expanded subgraph nodes
  const expandedNodeIds = useMemo(() => {
    if (!expandedNodeId) return new Set<string>()
    const ids = new Set<string>()
    ids.add(expandedNodeId)
    allRelations.forEach(r => {
      if (r.source === expandedNodeId) ids.add(r.target)
      if (r.target === expandedNodeId) ids.add(r.source)
    })
    return ids
  }, [expandedNodeId, allRelations])

  // Recommended entities based on selected entity's relationships
  const recommendedEntities = useMemo(() => {
    if (!selectedEntity) return []
    const recs: Entity[] = []
    allRelations.forEach(r => {
      if (r.source === selectedEntity.id) {
        const target = entities.find(e => e.id === r.target)
        if (target && !recs.find(r => r.id === target!.id)) recs.push(target)
      }
      if (r.target === selectedEntity.id) {
        const source = entities.find(e => e.id === r.source)
        if (source && !recs.find(r => r.id === source!.id)) recs.push(source)
      }
    })
    return recs.slice(0, 6)
  }, [selectedEntity, allRelations, entities])

  const layoutNode = (id: string) => layout.find(n => n.id === id) || { x: 0, y: 0 }

  // Node size: entities with summary are key entities (larger)
  const getNodeRadius = (entity: Entity, isExpanded: boolean, isSelected: boolean, isHovered: boolean) => {
    const hasSummary = entity.summary || entity.summary_vernacular
    const baseSize = hasSummary ? 24 : 18
    if (isExpanded) return baseSize + 8
    if (isSelected) return baseSize + 4
    if (isHovered) return baseSize + 2
    return baseSize
  }

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: entities.length }
    entities.forEach(e => { counts[e.type] = (counts[e.type] || 0) + 1 })
    return counts
  }, [entities])

  const groupedEntities = useMemo(() => {
    const groups: Record<string, Entity[]> = {}
    entities.forEach(e => {
      if (!groups[e.type]) groups[e.type] = []
      groups[e.type].push(e)
    })
    return groups
  }, [entities])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Top bar: search + donut chart */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        padding: '12px 20px',
        background: '#fff',
        borderBottom: '1px solid #eee',
        flexShrink: 0,
      }}>
        {/* Left: Search */}
        <div style={{ flex: 1, maxWidth: '400px' }}>
          <input
            type="text"
            placeholder="搜索实体..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 14px',
              borderRadius: '20px',
              border: '1px solid #ddd',
              fontSize: '0.9rem',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Center: Donut chart */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <svg width="60" height="60" viewBox="0 0 60 60">
            {(() => {
              const total = entities.length || 1
              const types = Object.keys(ENTITY_LABELS)
              let cumAngle = -Math.PI / 2
              return types.map(type => {
                const count = typeCounts[type] || 0
                const angle = (count / total) * Math.PI * 2
                const startAngle = cumAngle
                const endAngle = cumAngle + angle
                cumAngle = endAngle
                
                const r = 24
                const cx = 30
                const cy = 30
                const x1 = cx + r * Math.cos(startAngle)
                const y1 = cy + r * Math.sin(startAngle)
                const x2 = cx + r * Math.cos(endAngle)
                const y2 = cy + r * Math.sin(endAngle)
                const largeArc = angle > Math.PI ? 1 : 0
                
                const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`
                
                return <path key={type} d={d} fill={ENTITY_COLORS[type]} stroke="#fff" strokeWidth="1" />
              })
            })()}
            <circle cx="30" cy="30" r="14" fill="#fff" />
            <text x="30" y="28" textAnchor="middle" fontSize="8" fill="#999">{entities.length}</text>
            <text x="30" y="36" textAnchor="middle" fontSize="6" fill="#bbb">实体</text>
          </svg>
          
          {/* Legend */}
          <div style={{ display: 'flex', gap: '12px', fontSize: '0.78rem', color: '#666' }}>
            {Object.entries(ENTITY_LABELS).map(([key, label]) => (
              <span key={key} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: ENTITY_COLORS[key], display: 'inline-block' }} />
                {label}: {typeCounts[key] || 0}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Main area: graph + sidebar */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      <section className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <input
            type="text"
            placeholder="搜索实体名称、描述或类型..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: '8px',
              border: '1px solid #e0e0e0',
              fontSize: '0.95rem',
              outline: 'none',
            }}
          />
          <span style={{ fontSize: '0.85rem', color: '#999' }}>
            找到 {searchFilteredEntities.length} 个实体
          </span>
        </div>
      </section>

      {/* 类型筛选 */}
      <section className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setFilterType('all')}
            style={{
              padding: '8px 18px',
              borderRadius: '20px',
              border: filterType === 'all' ? '2px solid #667eea' : '2px solid #e0e0e0',
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
              {ENTITY_ICONS[key]} {label} ({typeCounts[key] || 0})
            </button>
          ))}
        </div>
      </section>

      {/* 实体总览卡片网格 */}
      <section className="card" style={{ marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '16px' }}>📋 实体总览</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {Object.entries(groupedEntities).map(([type, ents]) => (
            <div key={type} style={{ gridColumn: '1 / -1', marginBottom: '8px' }}>
              <h4 style={{ 
                fontSize: '0.95rem', 
                color: ENTITY_COLORS[type], 
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                {ENTITY_ICONS[type]} {ENTITY_LABELS[type]} ({ents.length})
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
                {ents.map(entity => (
                  <div
                    key={entity.id}
                    onClick={() => setSelectedEntity(entity)}
                    onMouseEnter={() => setHoveredEntity(entity.id)}
                    onMouseLeave={() => setHoveredEntity(null)}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      border: `1px solid ${ENTITY_COLORS[type]}30`,
                      background: `${ENTITY_COLORS[type]}08`,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '1.1rem' }}>{ENTITY_ICONS[entity.type]}</span>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{entity.name}</span>
                    </div>
                    <p style={{ 
                      fontSize: '0.8rem', 
                      color: '#666', 
                      margin: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {entity.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

        {/* Graph area */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#fafbfc' }}>
          <svg
            viewBox="0 0 1600 1000"
            style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
          >
              {/* 关系线 */}
              {filteredRelations.map((rel, i) => {
                const src = layoutNode(rel.source)
                const tgt = layoutNode(rel.target)
                const isRelHighlighted = focusMode
                  ? (connectedEntityIds.has(rel.source) && connectedEntityIds.has(rel.target))
                  : expandedNodeId
                    ? (expandedNodeIds.has(rel.source) && expandedNodeIds.has(rel.target))
                    : hoveredEntity
                      ? (rel.source === hoveredEntity || rel.target === hoveredEntity)
                      : (!selectedEntity || (connectedEntityIds.has(rel.source) && connectedEntityIds.has(rel.target)))
                const opacity = focusMode || expandedNodeId || hoveredEntity || selectedEntity ? (isRelHighlighted ? 0.8 : 0.08) : 0.3
                const relPredicate = (rel as any).predicate || (rel as any).relation || ''
                return (
                  <g key={i}>
                    <line
                      x1={src.x}
                      y1={src.y + 20}
                      x2={tgt.x}
                      y2={tgt.y + 20}
                      stroke={isRelHighlighted ? '#667eea' : '#ccc'}
                      strokeWidth={isRelHighlighted ? 2 : 1}
                      opacity={opacity}
                      markerEnd="url(#arrowhead)"
                    />
                    {(isRelHighlighted || (!focusMode && !expandedNodeId && !selectedEntity && !hoveredEntity)) && relPredicate && (
                      <text
                        x={(src.x + tgt.x) / 2}
                        y={(src.y + tgt.y) / 2 - 4}
                        textAnchor="middle"
                        fontSize="8"
                        fill={isRelHighlighted ? '#667eea' : '#bbb'}
                        opacity={opacity}
                        pointerEvents="none"
                      >
                        {relPredicate}
                      </text>
                    )}
                  </g>
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
                const isExpanded = expandedNodeId === entity.id
                const isConnected = expandedNodeId ? expandedNodeIds.has(entity.id) : focusMode ? connectedEntityIds.has(entity.id) : selectedEntity ? connectedEntityIds.has(entity.id) : true
                const color = ENTITY_COLORS[entity.type] || '#999'
                const radius = getNodeRadius(entity, isExpanded, isSelected, isHovered)
                return (
                  <g
                    key={entity.id}
                    onClick={(e) => {
                      if (expandedNodeId === entity.id) {
                        setExpandedNodeId(null)
                      } else {
                        setExpandedNodeId(entity.id)
                      }
                      if (isSelected) {
                        setSelectedEntity(null)
                        setFocusMode(null)
                      } else {
                        setSelectedEntity(entity)
                        setFocusMode(entity.id)
                      }
                    }}
                    onDoubleClick={() => {
                      if (expandedNodeId === entity.id) {
                        setExpandedNodeId(null)
                      } else {
                        setExpandedNodeId(entity.id)
                      }
                    }}
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
                      stroke={isExpanded ? '#333' : isSelected ? '#333' : 'white'}
                      strokeWidth={isExpanded || isSelected ? 3 : 2}
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
                      {ENTITY_ICONS[entity.type]}
                    </text>
                    <text
                      x={pos.x}
                      y={pos.y + radius + 14}
                      textAnchor="middle"
                      fontSize="11"
                      fill={isConnected ? '#333' : '#ccc'}
                      fontWeight={isExpanded || isSelected ? 700 : 400}
                      pointerEvents="none"
                    >
                      {entity.name.length > 8 ? entity.name.slice(0, 8) + '…' : entity.name}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#aaa', marginTop: '8px' }}>
            💡 单击节点选中并查看详情，双击节点展开关联子图，再次双击收起
            {focusMode && (
              <span style={{ marginLeft: '12px', color: '#667eea', cursor: 'pointer', fontWeight: 600 }}
                onClick={() => { setFocusMode(null); setSelectedEntity(null); }}
              >
                [退出聚焦]
              </span>
            )}
          </p>
        </div>

        {/* 详情面板 */}
        <div style={{ flex: '0 0 320px', minWidth: '280px' }}>
          {selectedEntity ? (
            <div className="card">
              <h3 style={{ marginBottom: '16px' }}>📋 实体详情</h3>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px',
                padding: '12px', background: `${ENTITY_COLORS[selectedEntity.type]}15`, borderRadius: '8px'
              }}>
                <span style={{ fontSize: '2rem' }}>{ENTITY_ICONS[selectedEntity.type]}</span>
                <div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#333' }}>{selectedEntity.name}</div>
                  <span className="tag" style={{ background: ENTITY_COLORS[selectedEntity.type], color: 'white' }}>
                    {ENTITY_LABELS[selectedEntity.type]}
                  </span>
                </div>
              </div>
              {/* 专业介绍 */}
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '0.75rem', color: '#999', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  专业介绍
                </h4>
                <p style={{ color: '#444', lineHeight: 1.7, fontSize: '0.85rem', margin: 0 }}>
                  {selectedEntity.summary || selectedEntity.description}
                </p>
              </div>
              {/* 通俗解释 */}
              {selectedEntity.summary_vernacular && (
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '0.75rem', color: '#999', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    通俗解释
                  </h4>
                  <p style={{ color: '#555', lineHeight: 1.7, fontSize: '0.85rem', margin: 0, fontStyle: 'italic' }}>
                    {selectedEntity.summary_vernacular}
                  </p>
                </div>
              )}
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
                          <span>{ENTITY_ICONS[otherEntity.type]}</span>
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
                共 {kgData.entities.length} 个实体，{relations.length + relationsData.length} 条关系
              </p>
            </div>
          )}

          {/* 推荐关联 */}
          {selectedEntity && recommendedEntities.length > 0 && (
            <div className="card" style={{ marginTop: '24px' }}>
              <h4 style={{ marginBottom: '12px' }}>💡 推荐关联</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {recommendedEntities.map(entity => (
                  <div
                    key={entity.id}
                    onClick={() => setSelectedEntity(entity)}
                    onMouseEnter={() => setHoveredEntity(entity.id)}
                    onMouseLeave={() => setHoveredEntity(null)}
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      border: `1px solid ${ENTITY_COLORS[entity.type]}30`,
                      background: `${ENTITY_COLORS[entity.type]}08`,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '1rem' }}>{ENTITY_ICONS[entity.type]}</span>
                      <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{entity.name}</span>
                    </div>
                    <p style={{ 
                      fontSize: '0.75rem', 
                      color: '#666', 
                      margin: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {entity.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
                  </div>
        
        {/* Sidebar - Wiki panel */}
        <div style={{
          width: '320px',
          flexShrink: 0,
          overflowY: 'auto',
          borderLeft: '1px solid #eee',
          background: '#fff',
          padding: '16px',
          transition: 'width 0.3s ease',
        }}>
          {selectedEntity ? (
            <div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px',
                padding: '12px', background: `${ENTITY_COLORS[selectedEntity.type]}15`, borderRadius: '8px'
              }}>
                <span style={{ fontSize: '1.8rem' }}>{ENTITY_ICONS[selectedEntity.type]}</span>
                <div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#333' }}>{selectedEntity.name}</div>
                  <span className="tag" style={{ background: ENTITY_COLORS[selectedEntity.type], color: 'white', fontSize: '0.7rem' }}>
                    {ENTITY_LABELS[selectedEntity.type]}
                  </span>
                </div>
              </div>

              {/* 专业介绍 */}
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '0.7rem', color: '#999', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  专业介绍
                </h4>
                <p style={{ color: '#444', lineHeight: 1.7, fontSize: '0.83rem', margin: 0 }}>
                  {selectedEntity.summary || selectedEntity.description}
                </p>
              </div>

              {/* 通俗解释 */}
              {selectedEntity.summary_vernacular && (
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '0.7rem', color: '#999', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    通俗解释
                  </h4>
                  <p style={{ color: '#555', lineHeight: 1.7, fontSize: '0.83rem', margin: 0, fontStyle: 'italic' }}>
                    {selectedEntity.summary_vernacular}
                  </p>
                </div>
              )}

              {selectedEntity.metadata && (
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '0.75rem', color: '#999', marginBottom: '8px' }}>属性</h4>
                  <table style={{ width: '100%', fontSize: '0.8rem' }}>
                    <tbody>
                      {Object.entries(selectedEntity.metadata).map(([key, val]) => (
                        <tr key={key}>
                          <td style={{ color: '#999', padding: '3px 0', width: '90px' }}>{key}</td>
                          <td style={{ color: '#333', fontWeight: 500 }}>{String(val)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 关联关系 */}
              <div>
                <h4 style={{ fontSize: '0.75rem', color: '#999', marginBottom: '8px' }}>
                  关联关系
                </h4>
                {(() => {
                  const allRelated = new Map()
                  const entitiesList = kgData.entities
                  relations
                    .filter(r => r.source === selectedEntity.id || r.target === selectedEntity.id)
                    .forEach(r => {
                      const isSource = r.source === selectedEntity.id
                      const otherId = isSource ? r.target : r.source
                      const otherEntity = entitiesList.find(e => e.id === otherId)
                      if (otherEntity && !allRelated.has(otherId)) {
                        allRelated.set(otherId, { entity: otherEntity, predicate: r.relation, isSource, evidence: r.evidence })
                      }
                    })
                  relationsData
                    .filter(r => r.source === selectedEntity.id || r.target === selectedEntity.id)
                    .forEach(r => {
                      const isSource = r.source === selectedEntity.id
                      const otherId = isSource ? r.target : r.source
                      const otherEntity = entitiesList.find(e => e.id === otherId)
                      if (otherEntity && !allRelated.has(otherId)) {
                        allRelated.set(otherId, { entity: otherEntity, predicate: r.predicate, isSource })
                      }
                    })
                  
                  const predicateLabels = {
                    applied_by: '应用于', depends_on: '依赖', competes_with: '竞争',
                    related_to: '相关', referenced_in: '引用于', supplies_to: '供应给',
                  }
                  
                  return Array.from(allRelated.entries()).map(([id, info]) => (
                    <div
                      key={id}
                      onClick={() => { setSelectedEntity(info.entity); setFocusMode(info.entity.id) }}
                      onMouseEnter={() => setHoveredEntity(info.entity.id)}
                      onMouseLeave={() => setHoveredEntity(null)}
                      style={{
                        padding: '6px 10px',
                        marginBottom: '4px',
                        background: '#f8f9fa',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        border: `1px solid ${hoveredEntity === info.entity.id ? ENTITY_COLORS[info.entity.type] + '40' : '#eee'}`,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.9rem' }}>{ENTITY_ICONS[info.entity.type]}</span>
                        <span style={{ fontWeight: 600, fontSize: '0.82rem', flex: 1 }}>{info.entity.name}</span>
                        <span style={{
                          fontSize: '0.65rem', padding: '1px 5px', borderRadius: '8px',
                          background: '#667eea', color: 'white',
                        }}>
                          {info.isSource ? '→' : '←'} {predicateLabels[info.predicate] || info.predicate || ''}
                        </span>
                      </div>
                    </div>
                  ))
                })()}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🔍</div>
              <p style={{ fontSize: '0.85rem' }}>点击图谱节点查看实体详情</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}