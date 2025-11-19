import { Link, useLocation } from 'react-router-dom';

interface NavigationProps {
  user: any;
  signOut: () => void;
}

const Navigation = ({ user, signOut }: NavigationProps) => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/transactions', label: 'Transacciones', icon: '💳' },
    { path: '/budget', label: 'Presupuesto', icon: '🎯' },
    { path: '/reports', label: 'Reportes', icon: '📈' },
    { path: '/settings', label: 'Configuración', icon: '⚙️' },
  ];

  return (
    <nav className="navigation">
      <div className="nav-header">
        <h1>💰 FinanzasApp</h1>
        <p>Hola, {user?.attributes?.given_name || 'Usuario'}</p>
      </div>
      
      <ul className="nav-menu">
        {navItems.map((item) => (
          <li key={item.path}>
            <Link 
              to={item.path} 
              className={location.pathname === item.path ? 'active' : ''}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>

      <div className="nav-footer">
        <button onClick={signOut} className="sign-out-btn">
          🚪 Cerrar Sesión
        </button>
      </div>
    </nav>
  );
};

export default Navigation;
