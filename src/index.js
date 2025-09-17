import ReactDOM from 'react-dom/client';
import reportWebVitals from './reportWebVitals.js';
import App from './App.js';
import { SettingsProvider } from './Settings.tsx';

const root = ReactDOM.createRoot(document.getElementById('explain_mplan'));

root.render(
  <SettingsProvider>
    <App/>
  </SettingsProvider>
    
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
