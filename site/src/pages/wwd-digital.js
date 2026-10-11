import '../styles/main.css';
import '../styles/inner.css';
import '../styles/wwd.css';
import '../styles/pages/wwd-digital.css';
import { boot } from '../core.js';

boot(() => import('../motion/pages/wwd-digital.js'));
