import '../styles/main.css';
import '../styles/inner.css';
import '../styles/pages/about.css';
import { boot } from '../core.js';
import './about-tabs.js'; // Leadership tabs work with or without the motion layer

boot(() => import('../motion/pages/about.js'));
