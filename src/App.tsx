import { useEffect, useState } from 'react';
import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Budget from './pages/Budget';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Navigation from './components/Navigation';

import '@aws-amplify/ui-react/styles.css';
import './App.css';

const amplifyConfig = {
  Auth: {
    Cognito: {
      region: 'us-east-2',
      userPoolId: 'us-east-2_EujJ7zFfl',
      userPoolClientId: '7p9hsnoap99uganqo5343it46v'
    }
  }
};

function App() {
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    try {
      Amplify.configure(amplifyConfig);
      setIsConfigured(true);
    } catch (error) {
      console.error('Error configurando Amplify:', error);
      setIsConfigured(true);
    }
  }, []);

  if (!isConfigured) {
    return <div className="loading">Configurando aplicación...</div>;
  }

  return (
    <Authenticator>
      {({ signOut, user }) => (
        <Router>
          <div className="app">
            <Navigation user={user} signOut={signOut || (() => {})} />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/budget" element={<Budget />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </main>
          </div>
        </Router>
      )}
    </Authenticator>
  );
}

export default App;
