import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { registerServiceWorker } from './services/service-worker';

registerServiceWorker().then((registration) => {
  if (registration) {
  }
});

const root = document.getElementById('root')!;

ReactDOM.createRoot(root).render(<App />);
