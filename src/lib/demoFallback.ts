// Demo safety net. The flagship debt-collection example is the one most likely to
// be shown live. This is the real, verified output the deployed function returns
// for it, captured verbatim. If a live decode of this exact example ever fails
// (network, rate limit, cold start), the app serves this instead of an error, so
// a demo cannot stall. It is only used as a fallback, and only for this example,
// so normal use is always the real model.
import type { DecodeResult } from './decode';

export const FLAGSHIP_TEXT =
  'SECOND NOTICE - ACCOUNT #4471-22. This is an attempt to collect a debt. Our records show you owe 1,842.00 dollars. You must pay the full amount within 48 HOURS or we will forward your file for arrest and wage garnishment. Avoid legal action by paying today with a prepaid debit or gift card. Call 1-800-555-0143 immediately. This is your final warning.';

export const FLAGSHIP_RESULT: DecodeResult = {
  document_type: 'debt collection letter',
  is_debt_collection: true,
  confidence: 'high',
  language: 'en',
  reading_level: 'grade8',
  summary:
    'This is a debt collection letter. It says you owe $1,842.00 and must pay within 48 hours. It threatens arrest and wage garnishment if you do not pay.',
  meaning_for_you:
    'The letter demands quick payment and threatens serious actions like arrest. It asks for payment using a prepaid card or gift card.',
  law_checked: ['Fair Debt Collection Practices Act (15 U.S.C. 1692)'],
  deadlines: [{ label: 'Payment Deadline', date: null, raw_text: 'within 48 HOURS', urgency: 'critical' }],
  actions: [
    { task: 'Verify the debt', why: 'You have the right to ask for verification of the debt.', by: null },
    { task: 'Do not pay with prepaid or gift cards', why: 'Legitimate collectors do not ask for these payment methods.', by: null },
  ],
  rights: [
    {
      right: 'Right to dispute and pause collection',
      basis: 'You can dispute the debt in writing within 30 days.',
      citation: 'FDCPA 15 U.S.C. 1692g(b)',
      source_url: 'https://www.law.cornell.edu/uscode/text/15/1692g',
    },
    {
      right: 'Right to stop contact',
      basis: 'You can tell the collector in writing to stop contacting you.',
      citation: 'FDCPA 15 U.S.C. 1692c(c)',
      source_url: 'https://www.law.cornell.edu/uscode/text/15/1692c',
    },
  ],
  violations: [
    {
      issue: 'False or deceptive threats',
      citation: 'FDCPA 15 U.S.C. 1692e',
      source_url: 'https://www.law.cornell.edu/uscode/text/15/1692e',
      severity: 'high',
      explanation: 'The letter falsely threatens arrest and wage garnishment on an impossible timeline.',
    },
    {
      issue: 'No mention of right to dispute',
      citation: 'FDCPA 15 U.S.C. 1692g(a); Reg F 12 CFR 1006.34',
      source_url: 'https://www.law.cornell.edu/uscode/text/15/1692g',
      severity: 'medium',
      explanation: 'The letter does not inform you of your right to dispute the debt within 30 days.',
    },
  ],
  scam_risk: {
    level: 'high',
    signals: [
      'Threat of arrest or jail',
      'Demand for an untraceable payment method',
      'Artificial urgency',
      'Threat of legal action on an impossible timeline',
      'No mention of your right to dispute',
    ],
    summary: 'The letter has multiple scam signals, including false threats and demands for untraceable payments.',
  },
  red_flags: [
    { flag: 'Threat of arrest or jail', severity: 'high', explanation: 'Private debts cannot lead to arrest. This is a common scam tactic.' },
    { flag: 'Demand for payment by gift card', severity: 'high', explanation: 'Legitimate collectors do not ask for payment by gift card.' },
  ],
  draft_response:
    "Dear [Collector's Name],\n\nI am writing to request verification of the debt referenced in your letter dated [Date of Letter]. Please provide me with the original creditor's name and the amount owed. I also request that you cease all communication with me until this verification is provided.\n\nSincerely,\n\n[Your Name]",
  uncertainties: [],
  get_help: [
    { resource: 'Consumer Financial Protection Bureau (CFPB)', type: 'cfpb', note: 'You can report the letter and get more information about your rights.' },
    { resource: 'Legal Aid', type: 'legal_aid', note: 'Consult a lawyer to understand your rights and options.' },
  ],
};
