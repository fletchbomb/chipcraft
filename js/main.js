import { createInitialAppState } from './app/state.js';
import { renderApp } from './ui/render.js';

const root = document.getElementById('app');

if (!root) {
  throw new Error('App root element #app was not found.');
}

const appState = createInitialAppState();
renderApp(root, appState);
