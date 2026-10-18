import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { PlayerOverlay } from './PlayerOverlay';
import './index.css';

const isPlayerWindow = new URLSearchParams(window.location.search).has('player');
const root = ReactDOM.createRoot(document.getElementById('root')!);

if (isPlayerWindow) {
  document.documentElement.classList.add('player-window');
  // No StrictMode here: double-mounting would cause listener glitches
  root.render(<PlayerOverlay />);
} else {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
