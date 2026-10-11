import '../styles/main.css';
import '../styles/inner.css';
import '../styles/wwd.css';
import '../styles/pages/wwd-print.css';
import { boot } from '../core.js';

boot(() => import('../motion/pages/wwd-print.js'));
