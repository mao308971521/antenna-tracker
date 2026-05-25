// 行业技术页面 - 主流技术路线、预研技术、研究验证应用进展

const technologyData = {
  lastUpdate: '2026-05-25',
  categories: [
    {
      name: '基站天线 (AAS)',
      description: '有源天线系统 Massive MIMO',
      mainstream: ['Massive MIMO', 'AAU集成', '数字化天线', '64T64R'],
      research: ['RIS智能超表面', '毫米波AAU', '太赫兹通信'],
      progress: '5G基站规模部署中，6G预研启动'
    },
    {
      name: '微波天线',
      description: '微波传输设备',
      mainstream: ['高频段(70-80GHz)', '超疏水表面处理', '多波束'],
      research: ['介质透镜天线', 'OTA测试技术', '相控阵微波'],
      progress: '运营商5G承载网建设'
    },
    {
      name: '网通天线',
      description: '网络通信天线',
      mainstream: ['Wi-Fi 7', 'MIMO增强', '相控阵', 'FWA'],
      research: ['AI波束赋形', '低轨卫星通信', '智能天线'],
      progress: 'Wi-Fi 7终端商用，卫星通信热点'
    },
    {
      name: '手机AIP',
      description: '封装天线模组',
      mainstream: ['AiP封装集成', '毫米波模组', 'LCP/LDS'],
      research: ['封装新材料', '柔性天线', '可穿戴天线'],
      progress: '5G手机毫米波方案商用'
    }
  ]
}

export default function TechnologyPage() {
  return (
    <div>
      <header className="header">
        <h1>🔬 行业技术</h1>
        <p>主流技术路线 · 预研技术 · 研究验证应用进展</p>
        <p className="update-info">数据更新：{technologyData.lastUpdate}</p>
      </header>

      {technologyData.categories.map((category, i) => (
        <section key={i} className="card">
          <h2>{category.name}</h2>
          <p style={{ color: '#666', marginBottom: '16px' }}>{category.description}</p>
          
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', color: '#00cc66', marginBottom: '8px' }}>✅ 主流技术</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {category.mainstream.map((tech, j) => (
                <span key={j} className="tag" style={{ background: '#e8f5e9', color: '#2e7d32' }}>{tech}</span>
              ))}
            </div>
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', color: '#ff9800', marginBottom: '8px' }}>🔬 预研技术</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {category.research.map((tech, j) => (
                <span key={j} className="tag" style={{ background: '#fff3e0', color: '#e65100' }}>{tech}</span>
              ))}
            </div>
          </div>
          
          <div>
            <h3 style={{ fontSize: '1rem', color: '#2196f3', marginBottom: '8px' }}>📈 应用进展</h3>
            <p style={{ color: '#666', fontSize: '0.95rem' }}>{category.progress}</p>
          </div>
        </section>
      ))}
    </div>
  )
}