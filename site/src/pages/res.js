import '../styles/main.css';
import '../styles/inner.css';
import '../styles/pages/res.css';
import { boot } from '../core.js';

boot(() => import('../motion/pages/res.js'));
