/* Decoded - icon layer. Lucide line icons via lucide-react, wrapped so the rest
   of the app keeps the friendly { name, size, stroke, className, style } API.
   Named imports so only the icons we use are bundled. No emoji, ever. */
import React from 'react';
import {
  ScanLine, Clipboard, Camera, Upload, FileText, Sparkles, ArrowRight, ArrowLeft,
  Clock, AlarmClock, ListChecks, Check, Scale, ShieldAlert, ShieldCheck, TriangleAlert,
  PenLine, Copy, HeartHandshake, Phone, Landmark, Users, Volume2, Square, Play, Type,
  Languages, Gauge, CalendarPlus, Printer, RotateCcw, X, CircleHelp, ChevronDown, Eye,
  Lock, History, Image as ImageIcon, CircleAlert, Info, Quote, Workflow, Boxes, Gavel,
  Milestone, ExternalLink, Link as LinkIcon,
} from 'lucide-react';

// Friendly name (used across the app) -> lucide-react component.
const COMPONENTS = {
  ScanLine, Clipboard, Camera, Upload, FileText, Sparkles, ArrowRight, ArrowLeft,
  Clock, AlarmClock, ListChecks, Check, Scale, ShieldAlert, ShieldCheck, TriangleAlert,
  PenLine, Copy, HelpingHand: HeartHandshake, Phone, Landmark, Users, Volume2, Square, Play, Type,
  Languages, Gauge, CalendarPlus, Printer, RotateCcw, X, CircleHelp, ChevronDown, Eye,
  Lock, History, Image: ImageIcon, CircleAlert, Info, Quote, Workflow, Boxes, Gavel,
  Milestone, ExternalLink, Link: LinkIcon,
};

function wrap(C) {
  return function LucideIcon({ size = 18, stroke = 2, className = '', style }) {
    if (!C) {
      return React.createElement('svg', { width: size, height: size, viewBox: '0 0 24 24', 'aria-hidden': 'true' });
    }
    return React.createElement(C, {
      size, strokeWidth: stroke, className, style, 'aria-hidden': true, focusable: 'false',
    });
  };
}

const DecodedIcons = {
  Icon: function Icon({ name, ...rest }) {
    return React.createElement(wrap(COMPONENTS[name]), rest);
  },
};
for (const key of Object.keys(COMPONENTS)) DecodedIcons[key] = wrap(COMPONENTS[key]);

export { DecodedIcons };
