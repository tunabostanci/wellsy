/**
 * Sidebar – Reusable left navigation panel (CSS Çakışmaları Engellenmiş Güvenli Sürüm)
 */
export default function Sidebar({ dark = false, logo = 'Wellsy', badge, navItems = [], user }) {
  
  const sidebarStyle = {
    width: '260px', // Sabit genişlik garanti altına alındı
    minWidth: '260px',
    height: '100vh', // Sayfanın en altına kadar uzanması için
    background: dark ? '#2C2C2A' : '#004d40', // Kurumsal Wellsy yeşili koruması (Fallback)
    backgroundColor: dark ? '#2C2C2A' : 'var(--sidebar-bg, #004d40)',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    boxSizing: 'border-box',
    padding: '0 0 16px 0',
    position: 'sticky',
    top: 0,
    left: 0,
    zIndex: 1000
  }

  const logoStyle = {
    padding: '24px 20px',
    fontSize: '22px',
    fontWeight: '700',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'baseline',
    gap: '6px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    marginBottom: '16px'
  }

  return (
    <aside style={sidebarStyle} className="wellsy-sidebar-container">
      {/* Logo Alanı */}
      <div style={logoStyle}>
        <span style={{ color: '#ffffff', fontFamily: 'sans-serif' }}>
          {logo.slice(0, -2)}<em style={{ fontStyle: 'italic', color: '#33ab9f' }}>{logo.slice(-2)}</em>
        </span>
        {badge && (
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontStyle: 'normal', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
            {badge}
          </span>
        )}
      </div>

      {/* Navigasyon Butonları */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '0 12px', flex: 1 }}>
        {navItems.map((item, i) => {
          const isBtnActive = !!item.active;
          
          const baseBtnStyle = {
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            width: '100%',
            padding: '12px 16px',
            border: 'none',
            borderRadius: '8px',
            cursor: item.disabled ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: isBtnActive ? '600' : '400',
            textAlign: 'left',
            transition: 'all 0.15s ease-in-out',
            backgroundColor: isBtnActive ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
            color: isBtnActive ? '#ffffff' : 'rgba(255, 255, 255, 0.75)',
            boxSizing: 'border-box',
            opacity: item.disabled ? 0.5 : 1,
            boxShadow: isBtnActive ? '0 2px 6px rgba(0,0,0,0.05)' : 'none'
          }

          return (
            <button
              key={i}
              type="button"
              className={`wellsy-nav-btn ${isBtnActive ? 'active' : ''}`}
              onClick={item.onClick}
              disabled={item.disabled}
              style={baseBtnStyle}
            >
              {/* Boxicons veya Tabler Icons font desteği */}
              <i className={`ti ${item.icon}`} style={{ fontSize: '18px', minWidth: '18px', color: isBtnActive ? '#ffffff' : 'rgba(255, 255, 255, 0.6)' }} aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Alt Kullanıcı Bilgisi Kartı */}
      {user && (
        <div style={{ 
          padding: '12px 16px', 
          margin: '0 12px', 
          background: 'rgba(255,255,255,0.06)', 
          borderRadius: '10px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px',
          border: '1px solid rgba(255,255,255,0.04)'
        }} className="wellsy-sidebar-user">
          <div style={{ 
            width: '36px', 
            height: '36px', 
            borderRadius: '50%', 
            background: '#ffffff', 
            color: dark ? '#2C2C2A' : '#004d40', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            fontWeight: 'bold', 
            fontSize: '13px' 
          }}>
            {user.initials}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontWeight: '600', fontSize: '13px', color: '#ffffff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user.name}</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '1px' }}>{user.role}</div>
          </div>
        </div>
      )}
    </aside>
  )
}