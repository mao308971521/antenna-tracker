'use client'
import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import * as d3 from 'd3'
import kgData from '@/app/_data/knowledge-graph.json'
import relationsData from '@/app/_data/relations.json'

type Entity = typeof kgData.entities[0]
type Relation = typeof kgData.relations[0]
type TechRelation = typeof relationsData[0]

interface D3Node extends d3.SimulationNodeDatum {
  id: string
  name: string
  type: string
  description?: string
  summary?: string
  summary_vernacular?: string
  metadata?: Record<string, any>
  radius: number
  icon: string
}

interface D3Link extends d3.SimulationLinkDatum<D3Node> {
  source: string | D3Node
  target: string | D3Node
  relation?: string
  predicate?: string
}

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

// SVG Donut Chart for entity type distribution
function DonutChart({ typeCounts }: { typeCounts: Record<string, number> }) {
  const total = typeCounts.all || 1
  const entries = Object.entries(ENTITY_LABELS).map(([key, label]) => ({
    key,
    label,
    count: typeCounts[key] || 0,
    color: ENTITY_COLORS[key],
    icon: ENTITY_ICONS[key],
  })).filter(e => e.count > 0)

  let startAngle = -Math.PI / 2
  const radius = 80
  const innerRadius = 50
  const arcs = entries.map(entry => {
    const fraction = entry.count / total
    const angle = fraction * Math.PI * 2
    const endAngle = startAngle + angle
    const largeArc = angle > Math.PI ? 1 : 0

    const x1Outer = Math.cos(startAngle) * radius
    const y1Outer = Math.sin(startAngle) * radius
    const x2Outer = Math.cos(endAngle) * radius
    const y2Outer = Math.sin(endAngle) * radius
    const x1Inner = Math.cos(endAngle) * innerRadius
    const y1Inner = Math.sin(endAngle) * innerRadius
    const x2Inner = Math.cos(startAngle) * innerRadius
    const y2Inner = Math.sin(startAngle) * innerRadius

    const d = [
      `M ${x1Outer} ${y1Outer}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${x2Outer} ${y2Outer}`,
      `L ${x1Inner} ${y1Inner}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x2Inner} ${y2Inner}`,
      'Z',
    ].join(' ')

    const midAngle = startAngle + angle / 2
    const labelR = (radius + innerRadius) / 2
    const lx = Math.cos(midAngle) * labelR
    const ly = Math.sin(midAngle) * labelR

    startAngle = endAngle
    return { ...entry, d, lx, ly }
  })

  return (
    <svg width="160" height="160" viewBox="-80 -80 160 160">
      {arcs.map((arc, i) => (
        <path key={i} d={arc.d} fill={arc.color} opacity="0.85" />
      ))}
      <text x="0" y="-6" textAnchor="middle" fontSize="14" fontWeight="700" fill="#333">{total}</text>
      <text x="0" y="10" textAnchor="middle" fontSize="8" fill="#999">总计</text>
      {arcs.map((arc, i) => (
        <text key={i} x={arc.lx} y={arc.ly} textAnchor="middle" dominantBaseline="middle" fontSize="7" fill="white" fontWeight="600" pointerEvents="none">
          {arc.icon} {arc.count}
        </text>
      ))}
    </svg>
  )
}

export default function KnowledgeGraphPage() {
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null)
  const [hoveredEntity, setHoveredEntity] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<string>('all')
  const [expandedNodeId, setExpandedNodeId] = useState<string | null>(null)
  const [focusMode, setFocusMode] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [graphError, setGraphError] = useState<string | null>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)
  const simulationRef = useRef<d3.Simulation<D3Node, D3Link> | null>(null)

  const entities = kgData.entities
  const relations = kgData.relations

  // Merge both relation sources
  const allRelations = useMemo(() => [
    ...relations,
    ...relationsData.map(r => ({ source: r.source, target: r.target, predicate: r.predicate, relation: r.predicate }))
  ], [relations, relationsData])

  // Search filter
  const searchFilteredEntities = useMemo(() => {
    if (!searchQuery.trim()) return entities
    const q = searchQuery.toLowerCase().trim()
    return entities.filter(e =>
      e.name.toLowerCase().includes(q) ||
      (e.description && e.description.toLowerCase().includes(q)) ||
      e.type.toLowerCase().includes(q)
    )
  }, [entities, searchQuery])

  // Type filter
  const filteredEntities = useMemo(() => {
    if (filterType === 'all') return searchFilteredEntities
    return searchFilteredEntities.filter(e => e.type === filterType)
  }, [searchFilteredEntities, filterType])

  const filteredEntityIds = new Set(filteredEntities.map(e => e.id))
  const filteredRelations = useMemo(() => {
    return allRelations.filter(r => filteredEntityIds.has(r.source) && filteredEntityIds.has(r.target))
  }, [allRelations, filteredEntityIds])

  // Connected entities
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

  // Expanded subgraph
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

  // Recommended entities
  const recommendedEntities = useMemo(() => {
    if (!selectedEntity) return []
    const recs: Entity[] = []
    allRelations.forEach(r => {
      if (r.source === selectedEntity.id) {
        const target = entities.find(e => e.id === r.target)
        if (target && !recs.find(x => x.id === target!.id)) recs.push(target)
      }
      if (r.target === selectedEntity.id) {
        const source = entities.find(e => e.id === r.source)
        if (source && !recs.find(x => x.id === source!.id)) recs.push(source)
      }
    })
    return recs.slice(0, 6)
  }, [selectedEntity, allRelations, entities])

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: entities.length }
    entities.forEach(e => { counts[e.type] = (counts[e.type] || 0) + 1 })
    return counts
  }, [entities])

  // D3 force simulation
  useEffect(() => {
    if (!svgRef.current) return

    try {
      const width = svgRef.current.clientWidth || 1000
      const height = 600

      // Destroy previous simulation
      if (simulationRef.current) {
        simulationRef.current.stop()
      }

      // Build D3 nodes and links
      const nodeMap = new Map<string, Entity>()
      entities.forEach(e => nodeMap.set(e.id, e))

      if (filteredEntities.length === 0) {
        setGraphError('没有可显示的实体')
        return
      }

      const d3Nodes: D3Node[] = filteredEntities.map(e => {
      const hasSummary = !!(e.summary || e.summary_vernacular)
      const baseRadius = hasSummary ? 24 : 18
      return {
        ...e,
        radius: baseRadius,
        icon: ENTITY_ICONS[e.type] || '🔹',
      }
    })

    const d3Links: D3Link[] = filteredRelations
      .map(r => ({
        source: r.source as string,
        target: r.target as string,
        relation: (r as any).relation,
        predicate: (r as any).predicate,
      }))
      .filter(l => d3Nodes.some(n => n.id === l.source)
        && d3Nodes.some(n => n.id === l.target))

    // Create simulation
    const simulation = d3.forceSimulation<D3Node>(d3Nodes)
      .force('link', d3.forceLink<D3Node, D3Link>(d3Links).id((d: any) => typeof d === 'string' ? d : d.id).distance(120) as any)
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide<D3Node>().radius((d: any) => (d.radius || 18) + 8) as any)
      .force('x', d3.forceX(width / 2).strength(0.06))
      .force('y', d3.forceY(height / 2).strength(0.06))
      .alphaDecay(0.02)
      .velocityDecay(0.4)

    simulationRef.current = simulation

    const svg = d3.select(svgRef.current)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('width', '100%')
      .style('height', 'auto')

    // Clear previous content
    svg.selectAll('*').remove()

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 4])
      .on('zoom', (event) => {
        svgGroup.attr('transform', event.transform)
      })

    svg.call(zoom)

    const svgGroup = svg.append('g').attr('class', 'graph-group')

    // Arrow marker
    svg.append('defs').append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 28)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#667eea')
      .attr('opacity', 0.6)

    // Links
    const link = svgGroup.append('g')
      .selectAll('line')
      .data(d3Links)
      .join('line')
      .attr('stroke', '#ccc')
      .attr('stroke-opacity', 0.3)
      .attr('stroke-width', 1)

    // Link labels
    const linkLabel = svgGroup.append('g')
      .selectAll('text')
      .data(d3Links.filter(d => d.predicate || d.relation))
      .join('text')
      .attr('font-size', '7px')
      .attr('fill', '#bbb')
      .attr('text-anchor', 'middle')
      .attr('pointer-events', 'none')
      .text(d => d.predicate || d.relation || '')

    // Nodes group
    const node = svgGroup.append('g').attr('class', 'nodes-group')
      .selectAll('g')
      .data(d3Nodes)
      .join('g')
      .attr('class', 'node-item')
      .attr('cursor', 'grab')
      .call(d3.drag<SVGGElement, D3Node>()
        .on('start', (event: any, d: D3Node) => {
          if (!event.active) simulation.alphaTarget(0.3).restart()
          d.fx = d.x
          d.fy = d.y
        })
        .on('drag', (event: any, d: D3Node) => {
          d.fx = event.x
          d.fy = event.y
        })
        .on('end', (event: any, d: D3Node) => {
          if (!event.active) simulation.alphaTarget(0)
          d.fx = null
          d.fy = null
        }) as any)

    // Node circles + halo for hover/select/expand feedback
    node.each(function(d) {
      const g = d3.select(this)
      const color = ENTITY_COLORS[d.type] || '#999'
      const r = d.radius

      g.append('circle')
        .attr('class', 'node-base')
        .attr('r', r)
        .attr('fill', color)
        .attr('fill-opacity', 0.85)
        .attr('stroke', 'white')
        .attr('stroke-width', 2)

      g.append('circle')
        .attr('class', 'node-halo')
        .attr('r', 0)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 2)
        .attr('opacity', 0)

      g.append('text')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .attr('font-size', '14px')
        .attr('pointer-events', 'none')
        .text(d.icon)

      g.append('text')
        .attr('y', r + 14)
        .attr('text-anchor', 'middle')
        .attr('font-size', '10px')
        .attr('fill', '#333')
        .attr('font-weight', 400)
        .attr('pointer-events', 'none')
        .text(d.name.length > 8 ? d.name.slice(0, 8) + '…' : d.name)
    })

    // Node interactions
    node.on('click', (event, d) => {
      event.stopPropagation()
      const entity = nodeMap.get(d.id)
      if (!entity) return
      if (expandedNodeId === d.id) {
        setExpandedNodeId(null)
      } else {
        setExpandedNodeId(d.id)
      }
      if (selectedEntity?.id === d.id) {
        setSelectedEntity(null)
        setFocusMode(null)
      } else {
        setSelectedEntity(entity)
        setFocusMode(d.id)
      }
    })
    .on('dblclick', (event, d) => {
      event.stopPropagation()
      if (expandedNodeId === d.id) {
        setExpandedNodeId(null)
      } else {
        setExpandedNodeId(d.id)
      }
    })
    .on('mouseenter', (event, d) => setHoveredEntity(d.id))
    .on('mouseleave', () => setHoveredEntity(null))

    // Tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as D3Node).x!)
        .attr('y1', d => (d.source as D3Node).y!)
        .attr('x2', d => (d.target as D3Node).x!)
        .attr('y2', d => (d.target as D3Node).y!)

      linkLabel
        .attr('x', d => ((d.source as D3Node).x! + (d.target as D3Node).x!) / 2)
        .attr('y', d => ((d.source as D3Node).y! + (d.target as D3Node).y!) / 2 - 4)

      node.attr('transform', d => `translate(${d.x!},${d.y!})`)
    })

    // Click on background to deselect
    svg.on('click', () => {
      setSelectedEntity(null)
      setFocusMode(null)
      setExpandedNodeId(null)
    })

    return () => {
      simulation.stop()
    }
    } catch (err: any) {
      console.error('Knowledge graph error:', err)
      setGraphError(err.message || '图谱渲染出错')
    }
  }, [filteredEntities, filteredRelations])

  // Update node visual state when selection/hover changes
  useEffect(() => {
    if (!svgRef.current) return
    try {
      const svg = d3.select(svgRef.current)
      const nodes = svg.selectAll('.node-item')

      if (nodes.empty()) return

      nodes.each(function(d: any) {
        if (!d) return
        const g = d3.select(this)
        const isSelected = selectedEntity?.id === d.id
        const isHovered = hoveredEntity === d.id
        const isExpanded = expandedNodeId === d.id
        const isConnected = expandedNodeId ? expandedNodeIds.has(d.id) : focusMode ? connectedEntityIds.has(d.id) : selectedEntity ? connectedEntityIds.has(d.id) : true
        const color = ENTITY_COLORS[d.type] || '#999'
        const baseR = d.radius
        const haloR = isExpanded ? baseR + 8 : isSelected ? baseR + 4 : isHovered ? baseR + 2 : 0

        g.select('.node-base')
          .attr('fill', color)
          .attr('fill-opacity', isConnected ? 0.85 : 0.15)
          .attr('stroke', isExpanded || isSelected ? '#333' : 'white')
          .attr('stroke-width', isExpanded || isSelected ? 3 : 2)

        g.select('.node-halo')
          .attr('r', haloR)
          .attr('stroke', isExpanded ? '#333' : color)
          .attr('opacity', haloR > 0 ? 0.6 : 0)

        const labels = g.selectAll('text').filter((_: any, __: number, node: any) => {
          const textEl = node[0]?.textContent
          return textEl && textEl.length <= 10 && !['🔬','🏢','📜','🧪','⚡'].includes(textEl)
        })
        labels
          .attr('fill', isConnected ? '#333' : '#ccc')
          .attr('font-weight', isExpanded || isSelected ? 700 : 400)
      })
    } catch (err: any) {
      console.error('Knowledge graph update error:', err)
      setGraphError(err.message || '图谱更新出错')
    }
  }, [selectedEntity, hoveredEntity, expandedNodeId, focusMode, connectedEntityIds, expandedNodeIds])

  const layoutNode = (id: string) => {
    const node = filteredEntities.find(e => e.id === id)
    return node
  }

  // Node size helper
  const getNodeRadius = (entity: Entity, isExpanded: boolean, isSelected: boolean, isHovered: boolean) => {
    const hasSummary = entity.summary || entity.summary_vernacular
    const baseSize = hasSummary ? 24 : 18
    if (isExpanded) return baseSize + 8
    if (isSelected) return baseSize + 4
    if (isHovered) return baseSize + 2
    return baseSize
  }

  const groupedEntities = useMemo(() => {
    const groups: Record<string, Entity[]> = {}
    entities.forEach(e => {
      if (!groups[e.type]) groups[e.type] = []
      groups[e.type].push(e)
    })
    return groups
  }, [entities])

  return (
    <div>
      <header className="header">
        <h1>🕸️ 知识图谱</h1>
        <p>天线行业知识网络 — 实体关系可视化 · 数据来源：各板块结构化数据 + 小月技术解读笔记</p>
        <p className="update-info">数据更新：{kgData.lastUpdate} · {kgData.entities.length} 个实体 · {relations.length + relationsData.length} 条关系</p>
      </header>

      {/* 搜索框 */}
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

      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        {/* 图谱可视化 */}
        <div className="card" style={{ flex: '1 1 600px', minWidth: '0' }}>
          <h3 style={{ marginBottom: '16px' }}>📊 知识图谱关系图</h3>

          {/* 环形图 - 实体类型分布 */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <DonutChart typeCounts={typeCounts} />
          </div>
          <div style={{ position: 'relative', width: '100%', overflow: 'hidden', borderRadius: '8px', border: '1px solid #eee' }}>
            {graphError ? (
              <div style={{ width: '100%', height: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', background: '#fafbfc', color: '#999' }}>
                <div style={{ fontSize: '2rem', marginBottom: '12px' }}>⚠️</div>
                <div style={{ marginBottom: '8px' }}>图谱加载失败</div>
                <div style={{ fontSize: '0.82rem', maxWidth: '400px', textAlign: 'center' }}>{graphError}</div>
                <button
                  onClick={() => setGraphError(null)}
                  style={{ marginTop: '16px', padding: '6px 20px', borderRadius: '6px', border: '1px solid #667eea', background: '#667eea', color: 'white', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  重试
                </button>
              </div>
            ) : (
              <svg ref={svgRef} style={{ width: '100%', height: '600px', background: '#fafbfc' }} />
            )}
          </div>
          <p style={{ fontSize: '0.75rem', color: '#aaa', marginTop: '8px' }}>
            💡 单击节点选中并查看详情，双击节点展开关联子图，再次双击收起
            {' '}滚轮缩放 / 拖拽画布 / 拖拽节点调整位置
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
                {allRelations
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
                        <div style={{ fontSize: '0.78rem', color: '#999' }}>{(rel as any).evidence || ''}</div>
                      </div>
                    )
                  })
                }
              </div>
              {/* 通俗解读 */}
              {selectedEntity.summary_vernacular && (
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #eee' }}>
                  <h4 style={{ fontSize: '0.75rem', color: '#999', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    📝 通俗解读
                  </h4>
                  <p style={{ color: '#555', lineHeight: 1.7, fontSize: '0.85rem', margin: 0, fontStyle: 'italic' }}>
                    {selectedEntity.summary_vernacular}
                  </p>
                </div>
              )}
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
                <span style={{ fontSize: '0.85rem' }}>{ENTITY_ICONS[key]} {label}</span>
                <span style={{ fontSize: '0.75rem', color: '#999', marginLeft: 'auto' }}>{typeCounts[key] || 0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
