import { useState } from 'react';

const Settings = () => {
  const [settings, setSettings] = useState({
    monthlyIncome: '3500000',
    currency: 'COP',
    whatsappNumber: '+57 300 123 4567',
    notifications: {
      budgetAlerts: true,
      weeklyReports: true,
      goalReminders: true,
    },
    categories: [
      { name: 'Alimentación', color: '#FF6B6B', active: true },
      { name: 'Transporte', color: '#4ECDC4', active: true },
      { name: 'Entretenimiento', color: '#45B7D1', active: true },
      { name: 'Servicios', color: '#96CEB4', active: true },
    ]
  });

  const handleSave = () => {
    // Aquí guardarías la configuración
    alert('Configuración guardada exitosamente');
  };

  return (
    <div className="settings">
      <h1>⚙️ Configuración</h1>

      {/* Perfil del Usuario */}
      <div className="settings-section">
        <h3>👤 Perfil</h3>
        <div className="form-group">
          <label>Ingresos Mensuales</label>
          <input
            type="number"
            value={settings.monthlyIncome}
            onChange={(e) => setSettings({...settings, monthlyIncome: e.target.value})}
            placeholder="Ingresos mensuales"
          />
        </div>
        
        <div className="form-group">
          <label>Moneda</label>
          <select
            value={settings.currency}
            onChange={(e) => setSettings({...settings, currency: e.target.value})}
          >
            <option value="COP">Peso Colombiano (COP)</option>
            <option value="USD">Dólar Americano (USD)</option>
            <option value="EUR">Euro (EUR)</option>
          </select>
        </div>
      </div>

      {/* Configuración de WhatsApp */}
      <div className="settings-section">
        <h3>📱 WhatsApp</h3>
        <div className="whatsapp-config">
          <div className="form-group">
            <label>Número de WhatsApp Registrado</label>
            <input
              type="tel"
              value={settings.whatsappNumber}
              onChange={(e) => setSettings({...settings, whatsappNumber: e.target.value})}
              placeholder="+57 300 123 4567"
            />
          </div>
          
          <div className="whatsapp-status">
            <span className="status-indicator connected">🟢</span>
            <span>Bot conectado y funcionando</span>
          </div>
          
          <div className="whatsapp-help">
            <h4>Comandos disponibles:</h4>
            <ul>
              <li><code>Gasté [monto] en [descripción]</code> - Registrar gasto</li>
              <li><code>Recibí [monto] por [descripción]</code> - Registrar ingreso</li>
              <li><code>Saldo</code> - Ver balance actual</li>
              <li><code>Reporte</code> - Generar reporte del mes</li>
              <li><code>Presupuesto</code> - Ver estado del presupuesto</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Notificaciones */}
      <div className="settings-section">
        <h3>🔔 Notificaciones</h3>
        <div className="notifications-config">
          <div className="notification-item">
            <label>
              <input
                type="checkbox"
                checked={settings.notifications.budgetAlerts}
                onChange={(e) => setSettings({
                  ...settings,
                  notifications: {...settings.notifications, budgetAlerts: e.target.checked}
                })}
              />
              Alertas de presupuesto (cuando superes el 80%)
            </label>
          </div>
          
          <div className="notification-item">
            <label>
              <input
                type="checkbox"
                checked={settings.notifications.weeklyReports}
                onChange={(e) => setSettings({
                  ...settings,
                  notifications: {...settings.notifications, weeklyReports: e.target.checked}
                })}
              />
              Reportes semanales por WhatsApp
            </label>
          </div>
          
          <div className="notification-item">
            <label>
              <input
                type="checkbox"
                checked={settings.notifications.goalReminders}
                onChange={(e) => setSettings({
                  ...settings,
                  notifications: {...settings.notifications, goalReminders: e.target.checked}
                })}
              />
              Recordatorios de metas financieras
            </label>
          </div>
        </div>
      </div>

      {/* Categorías */}
      <div className="settings-section">
        <h3>🏷️ Categorías</h3>
        <div className="categories-config">
          {settings.categories.map((category, index) => (
            <div key={index} className="category-item">
              <div className="category-info">
                <div 
                  className="color-indicator"
                  style={{ backgroundColor: category.color }}
                />
                <span className="category-name">{category.name}</span>
              </div>
              
              <div className="category-actions">
                <input
                  type="color"
                  value={category.color}
                  onChange={(e) => {
                    const newCategories = [...settings.categories];
                    newCategories[index].color = e.target.value;
                    setSettings({...settings, categories: newCategories});
                  }}
                />
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={category.active}
                    onChange={(e) => {
                      const newCategories = [...settings.categories];
                      newCategories[index].active = e.target.checked;
                      setSettings({...settings, categories: newCategories});
                    }}
                  />
                  <span className="slider"></span>
                </label>
              </div>
            </div>
          ))}
          
          <button className="btn-secondary add-category">
            + Agregar Categoría
          </button>
        </div>
      </div>

      {/* Exportar Datos */}
      <div className="settings-section">
        <h3>📤 Exportar Datos</h3>
        <div className="export-options">
          <button className="btn-secondary">
            📊 Exportar a Excel
          </button>
          <button className="btn-secondary">
            📄 Exportar a PDF
          </button>
          <button className="btn-secondary">
            💾 Backup Completo
          </button>
        </div>
      </div>

      {/* Zona Peligrosa */}
      <div className="settings-section danger-zone">
        <h3>⚠️ Zona Peligrosa</h3>
        <div className="danger-actions">
          <button className="btn-danger">
            🗑️ Eliminar Todas las Transacciones
          </button>
          <button className="btn-danger">
            ❌ Eliminar Cuenta
          </button>
        </div>
      </div>

      <div className="settings-actions">
        <button onClick={handleSave} className="btn-primary">
          💾 Guardar Configuración
        </button>
      </div>
    </div>
  );
};

export default Settings;
