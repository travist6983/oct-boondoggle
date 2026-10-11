import './styles/main.css';
import './styles/inner.css'; // shared with the inner pages, so it lands in the common stylesheet ahead of page CSS
import { boot } from './core.js';

boot(() => import('./motion/index.js'));
