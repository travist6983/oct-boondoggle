import '../styles/main.css';
import '../styles/inner.css';
import '../styles/pages/industries.css';
import { boot } from '../core.js';

boot(() => import('../motion/pages/industries.js'));
