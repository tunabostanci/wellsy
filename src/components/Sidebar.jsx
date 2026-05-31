/**
 * Sidebar – reusable left navigation panel.
 *
 * Props:
 *   dark      {boolean}  use dark (#2C2C2A) background instead of teal
 *   logo      {string}   brand name, second half in italic accent color
 *   badge     {string}   small role badge next to logo (admin only)
 *   navItems  {Array}    [{ icon, label, active }]
 *   user      {Object}   { initials, name, role }
 */
export default function Sidebar({ dark = false, logo = 'Wellsy', badge, navItems = [], user }) {
  const sidebarStyle = {
    width: 'var(--sidebar-w)',
    background: dark ? '#2C2C2A' : 'var(--sidebar-bg)',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    overflowY: 'auto',
  }

  return (
    <aside style={sidebarStyle} aria-label="Sidebar navigation">
      {/* Logo */}
      <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span>
          {logo.slice(0, -2)}<em>{logo.slice(-2)}</em>
        </span>
        {badge && (
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font)', fontStyle: 'normal' }}>
            {badge}
          </span>
        )}
      </div>

      {/* Nav */}
      <nav>
        {navItems.map((item, i) => (
          <div key={i} className={`nav-item${item.active ? ' active' : ''}`}>
            <i className={`ti ${item.icon}`} aria-hidden="true" />
            {item.label}
          </div>
        ))}
      </nav>

      <div className="sidebar-spacer" />

      {/* User row */}
      {user && (
        <div className="sidebar-user">
          <div className="avatar-circle">{user.initials}</div>
          <div>
            <div className="user-name">{user.name}</div>
            <div className="user-role">{user.role}</div>
          </div>
        </div>
      )}
    </aside>
  )
}