/* Decoded entry. Loads the HIVE design tokens and component styles, then the
   Decoded app styles, the warm empathetic theme (which overrides the dark HIVE
   tokens), the cinematic landing layer, and the cited-verifier extensions, then
   mounts the app. Order matters: theme.css must win over decoded.css. */
import React from 'react';
import { createRoot } from 'react-dom/client';

// HIVE design system tokens
import './decoded/styles/ds/tokens/fonts.css';
import './decoded/styles/ds/tokens/colors.css';
import './decoded/styles/ds/tokens/typography.css';
import './decoded/styles/ds/tokens/spacing.css';
import './decoded/styles/ds/tokens/elevation.css';
import './decoded/styles/ds/tokens/motion.css';
import './decoded/styles/ds/tokens/base.css';
// HIVE component styles
import './decoded/styles/ds/components/brand.css';
import './decoded/styles/ds/components/buttons.css';
import './decoded/styles/ds/components/indicators.css';
import './decoded/styles/ds/components/surfaces.css';
import './decoded/styles/ds/components/instruments.css';
import './decoded/styles/ds/components/swarm.css';
import './decoded/styles/ds/components/feedback.css';
// Decoded application styles, warm theme override, cinematic landing
import './decoded/styles/decoded.css';
import './decoded/styles/theme.css';
import './decoded/styles/landing.css';
// Cited-verifier sections (scam verdict, violations, citations, procedure)
import './decoded/styles/extend.css';

import { DecodedApp } from './decoded/app.jsx';

createRoot(document.getElementById('root')).render(React.createElement(DecodedApp));
