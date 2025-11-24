import { useState, useEffect } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';

const Settings = () => {
  const [settings, setSettings] = useState({
    monthlyIncome: '3500000',
    currency: 'COP',
    whatsappNumber: '',
    countryCode: '+57',
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
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isLinked, setIsLinked] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState('');
  const [telegramNumber, setTelegramNumber] = useState('');
  const [isTelegramLinked, setIsTelegramLinked] = useState(false);
  const [telegramOtp, setTelegramOtp] = useState('');
  const [telegramMessage, setTelegramMessage] = useState('');
  const [telegramCountryCode, setTelegramCountryCode] = useState('+57');

  const countryCodes = [
    { code: '+57', country: 'Colombia' },
    { code: '+1', country: 'USA/Canada' },
    { code: '+52', country: 'México' },
    { code: '+34', country: 'España' },
    { code: '+54', country: 'Argentina' },
    { code: '+56', country: 'Chile' },
    { code: '+51', country: 'Perú' },
  ];

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    // Polling cuando hay OTP pendiente
    if (telegramOtp && !isTelegramLinked) {
      const interval = setInterval(() => {
        loadUserData();
      }, 3000);
      return () => clearInterval(interval);
    }
    if (showOtpInput && !isLinked) {
      const interval = setInterval(() => {
        loadUserData();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [telegramOtp, isTelegramLinked, showOtpInput, isLinked]);

  const loadUserData = async () => {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();

      const response = await fetch('https://d5b928o88l.execute-api.us-east-2.amazonaws.com/prod/users', {
        headers: { 'Authorization': token || '' }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.user?.whatsappNumber && data.user?.verified) {
          const whatsappFull = data.user.whatsappNumber;
          const whatsappCode = countryCodes.find(c => whatsappFull.startsWith(c.code));
          if (whatsappCode) {
            setSettings(prev => ({ 
              ...prev, 
              countryCode: whatsappCode.code,
              whatsappNumber: whatsappFull.substring(whatsappCode.code.length)
            }));
          }
          setIsLinked(true);
          setShowOtpInput(false);
          setOtp('');
          setMessage('✅ WhatsApp vinculado correctamente');
        }
        if (data.user?.telegramNumber && data.user?.verified) {
          const telegramFull = data.user.telegramNumber;
          const telegramCode = countryCodes.find(c => telegramFull.startsWith(c.code));
          if (telegramCode) {
            setTelegramCountryCode(telegramCode.code);
            setTelegramNumber(telegramFull.substring(telegramCode.code.length));
          }
          setIsTelegramLinked(true);
          setTelegramOtp(''); // Limpiar OTP cuando se confirma vinculación
          setTelegramMessage('✅ Telegram vinculado correctamente');
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleLinkWhatsApp = async () => {
    setLoading(true);
    setMessage('');

    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      const fullNumber = settings.countryCode + settings.whatsappNumber.replace(/\s/g, '');

      const response = await fetch('https://d5b928o88l.execute-api.us-east-2.amazonaws.com/prod/users/link-whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token || ''
        },
        body: JSON.stringify({ whatsappNumber: fullNumber })
      });

      if (response.ok) {
        setMessage('✅ Código enviado a WhatsApp. Revisa tu chat.');
        setShowOtpInput(true);
      } else if (response.status === 409) {
        const data = await response.json();
        setMessage(`❌ ${data.error || 'Este número ya está registrado'}`);
      } else {
        setMessage('❌ Error al vincular WhatsApp');
      }
    } catch (error) {
      setMessage('❌ Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    setMessage('');

    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();

      const response = await fetch('https://d5b928o88l.execute-api.us-east-2.amazonaws.com/prod/users/verify-whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token || ''
        },
        body: JSON.stringify({ otp })
      });

      if (response.ok) {
        setMessage('✅ WhatsApp verificado correctamente');
        setIsLinked(true);
        setShowOtpInput(false);
      } else {
        const data = await response.json();
        setMessage(`❌ ${data.error || 'Código incorrecto'}`);
      }
    } catch (error) {
      setMessage('❌ Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkTelegram = async () => {
    setLoading(true);
    setTelegramMessage('');

    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      const fullNumber = telegramCountryCode + telegramNumber.replace(/\s/g, '');

      const response = await fetch('https://d5b928o88l.execute-api.us-east-2.amazonaws.com/prod/users/link-telegram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token || ''
        },
        body: JSON.stringify({ telegramNumber: fullNumber })
      });

      if (response.ok) {
        const data = await response.json();
        setTelegramOtp(data.otp);
        setTelegramMessage(`✅ ${data.message}`);
      } else {
        const data = await response.json();
        setTelegramMessage(`❌ ${data.error || 'Error al vincular'}`);
      }
    } catch (error) {
      setTelegramMessage('❌ Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
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
            <label>Número de WhatsApp</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select
                value={settings.countryCode}
                onChange={(e) => setSettings({...settings, countryCode: e.target.value})}
                disabled={isLinked}
                style={{ width: '150px' }}
              >
                {countryCodes.map(c => (
                  <option key={c.code} value={c.code}>{c.code} {c.country}</option>
                ))}
              </select>
              <input
                type="tel"
                value={settings.whatsappNumber}
                onChange={(e) => setSettings({...settings, whatsappNumber: e.target.value.replace(/\s/g, '')})}
                placeholder="3001234567"
                disabled={isLinked}
                style={{ flex: 1 }}
              />
            </div>
            <small style={{ color: '#666', marginTop: '0.5rem', display: 'block' }}>
              Ingresa solo números, sin espacios ni guiones
            </small>
          </div>

          {!isLinked && !showOtpInput && (
            <button 
              onClick={handleLinkWhatsApp}
              disabled={loading || !settings.whatsappNumber}
              className="btn-primary"
              style={{ marginBottom: '1rem' }}
            >
              {loading ? 'Enviando código...' : '🔗 Vincular WhatsApp'}
            </button>
          )}

          {showOtpInput && !isLinked && (
            <div style={{ marginTop: '1rem' }}>
              <div className="form-group">
                <label>Código de verificación</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  maxLength={6}
                  style={{ width: '200px' }}
                />
              </div>
              <button 
                onClick={handleVerifyOtp}
                disabled={loading || otp.length !== 6}
                className="btn-primary"
                style={{ marginBottom: '1rem' }}
              >
                {loading ? 'Verificando...' : '✓ Verificar Código'}
              </button>
            </div>
          )}

          {message && (
            <p style={{ 
              color: message.includes('✅') ? 'green' : 'red',
              marginBottom: '1rem'
            }}>
              {message}
            </p>
          )}
          
          {isLinked && (
            <>
              <div className="whatsapp-status">
                <span className="status-indicator connected">🟢</span>
                <span>Bot conectado y funcionando</span>
              </div>
              
              <a 
                href="https://wa.me/15551673074" 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn-primary"
                style={{ 
                  display: 'inline-block', 
                  marginTop: '1rem',
                  textDecoration: 'none',
                  textAlign: 'center'
                }}
              >
                💬 Abrir Chat con el Bot
              </a>
            </>
          )}
          
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

      {/* Configuración de Telegram */}
      <div className="settings-section">
        <h3>✈️ Telegram</h3>
        <div className="whatsapp-config">
          <div className="form-group">
            <label>Número de Telegram</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select 
                value={telegramCountryCode}
                onChange={(e) => setTelegramCountryCode(e.target.value)}
                disabled={isTelegramLinked}
                style={{ width: '120px' }}
              >
                {countryCodes.map(c => (
                  <option key={c.code} value={c.code}>{c.code} {c.country}</option>
                ))}
              </select>
              <input
                type="tel"
                value={telegramNumber}
                onChange={(e) => setTelegramNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="3001234567"
                disabled={isTelegramLinked}
                style={{ flex: 1 }}
              />
            </div>
          </div>

          {!isTelegramLinked && !telegramOtp && (
            <>
              <button 
                onClick={handleLinkTelegram}
                disabled={loading || !telegramNumber}
                className="btn-primary"
                style={{ marginBottom: '1rem' }}
              >
                {loading ? 'Registrando...' : '🔗 Vincular Telegram'}
              </button>
              <small style={{ color: '#666', display: 'block', marginBottom: '1rem' }}>
                Después de registrar, abre el bot para recibir tu código
              </small>
            </>
          )}

          {telegramOtp && !isTelegramLinked && (
            <div style={{ marginTop: '1rem' }}>
              <div style={{ 
                background: '#e8f5e9', 
                padding: '1.5rem', 
                borderRadius: '8px', 
                marginBottom: '1rem',
                border: '2px solid #4caf50'
              }}>
                <p style={{ margin: '0 0 1rem 0', fontWeight: 'bold', color: '#2e7d32', fontSize: '1.1rem' }}>
                  🔑 Tu código de verificación:
                </p>
                <div style={{ 
                  background: 'white', 
                  padding: '1rem', 
                  borderRadius: '4px',
                  textAlign: 'center',
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  letterSpacing: '0.5rem',
                  color: '#1976d2',
                  marginBottom: '1rem'
                }}>
                  {telegramOtp}
                </div>
                <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold', color: '#2e7d32' }}>
                  📱 Pasos para completar la vinculación:
                </p>
                <ol style={{ margin: 0, paddingLeft: '1.5rem', color: '#555' }}>
                  <li>Abre Telegram en tu teléfono</li>
                  <li>Busca <strong>@FinanzasAppBot</strong> o <a href="https://t.me/FinanzasAppBot" target="_blank" rel="noopener noreferrer" style={{ color: '#2196f3', fontWeight: 'bold' }}>haz clic aquí</a></li>
                  <li>Presiona "Iniciar" o envía <strong>/start</strong></li>
                  <li>Envía el código de 6 dígitos mostrado arriba</li>
                  <li>¡Listo! Tu cuenta quedará vinculada automáticamente</li>
                </ol>
              </div>
            </div>
          )}

          {telegramMessage && (
            <p style={{ 
              color: telegramMessage.includes('✅') ? 'green' : 'red',
              marginBottom: '1rem'
            }}>
              {telegramMessage}
            </p>
          )}
          
          {isTelegramLinked && (
            <>
              <div className="whatsapp-status">
                <span className="status-indicator connected">🟢</span>
                <span>Bot conectado y funcionando</span>
              </div>
              
              <a 
                href="https://t.me/FinanzasAppBot" 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn-primary"
                style={{ 
                  display: 'inline-block', 
                  marginTop: '1rem',
                  textDecoration: 'none',
                  textAlign: 'center'
                }}
              >
                💬 Abrir Chat con el Bot
              </a>
            </>
          )}
          
          <div className="whatsapp-help">
            <h4>Comandos disponibles:</h4>
            <ul>
              <li><code>Gasté [monto] en [descripción]</code> - Registrar gasto</li>
              <li><code>Recibí [monto] por [descripción]</code> - Registrar ingreso</li>
              <li><code>Reporte</code> - Generar reporte del mes</li>
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
