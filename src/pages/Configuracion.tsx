import { useState } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';

export default function Configuracion() {
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleLinkWhatsApp = async () => {
    setLoading(true);
    setMessage('');

    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();

      const response = await fetch('https://d5b928o88l.execute-api.us-east-2.amazonaws.com/prod/users/link-whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token || ''
        },
        body: JSON.stringify({ whatsappNumber })
      });

      if (response.ok) {
        setMessage('✅ WhatsApp vinculado correctamente');
        setWhatsappNumber('');
      } else {
        setMessage('❌ Error al vincular WhatsApp');
      }
    } catch (error) {
      setMessage('❌ Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">⚙️ Configuración</h1>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">📱 Bot de WhatsApp</h2>
        <p className="text-gray-600 mb-4">
          Vincula tu número de WhatsApp para registrar transacciones por mensaje.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Número de WhatsApp
            </label>
            <input
              type="tel"
              placeholder="+57 300 123 4567"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          <button
            onClick={handleLinkWhatsApp}
            disabled={loading || !whatsappNumber}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Vinculando...' : 'Vincular WhatsApp'}
          </button>

          {message && (
            <p className={`text-sm ${message.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>
              {message}
            </p>
          )}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold mb-2">💬 Comandos disponibles:</h3>
          <ul className="text-sm space-y-1 text-gray-700">
            <li>• Gasté 25000 en almuerzo</li>
            <li>• Recibí 1000000 de salario</li>
            <li>• Presupuesto 200000 para alimentación</li>
            <li>• Reporte</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
