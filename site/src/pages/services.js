import '../styles/main.css';
import '../styles/inner.css';
import '../styles/pages/services.css';
import { boot } from '../core.js';

boot(() => import('../motion/pages/services.js'));
