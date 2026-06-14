/* =========================================================================
   Decoded - data layer.
   Languages, reading levels, the three pre-seeded demo documents (FR-37),
   their authored decode results, and the AI prompt + parser for live decoding.
   Exposes window.DECODED.
   ========================================================================= */
const LANGUAGES = [
    { code: 'en', name: 'English',         native: 'English',          tts: 'en-US', rtl: false },
    { code: 'es', name: 'Spanish',         native: 'Espanol',          tts: 'es-ES', rtl: false },
    { code: 'zh', name: 'Chinese',         native: '\u4e2d\u6587',     tts: 'zh-CN', rtl: false },
    { code: 'vi', name: 'Vietnamese',      native: 'Ti\u1ebfng Vi\u1ec7t', tts: 'vi-VN', rtl: false },
    { code: 'fr', name: 'French',          native: 'Fran\u00e7ais',    tts: 'fr-FR', rtl: false },
    { code: 'ar', name: 'Arabic',          native: '\u0627\u0644\u0639\u0631\u0628\u064a\u0629', tts: 'ar-SA', rtl: true },
    { code: 'ht', name: 'Haitian Creole',  native: 'Krey\u00f2l',      tts: 'fr-FR', rtl: false },
  ];

  const READING_LEVELS = [
    { id: 'simplest', label: 'Simplest', note: 'Short words, one idea per line' },
    { id: 'plain',    label: 'Plain',    note: 'Everyday language' },
    { id: 'standard', label: 'Standard', note: 'Clear and complete' },
  ];

  /* ---- The three example documents (raw text the user would paste) ----- */
  const EXAMPLES = [
    {
      id: 'eviction',
      label: 'Eviction notice',
      kind: 'Pay or quit',
      raw:
`NOTICE TO PAY RENT OR QUIT

TO: Maria Delgado, and all occupants of 4417 Cedar Street, Apt 2B

YOU ARE HEREBY NOTIFIED that rent is now due and payable on the property you occupy. The total amount of rent now due is $2,140.00, covering the period of April 1 through May 31.

WITHIN FIVE (5) DAYS after service of this notice, you must pay the full amount stated above OR deliver up possession of the premises and vacate. Payment must be made in cash to the property manager at the rental office. No personal checks accepted.

If you fail to pay or vacate within this period, legal proceedings will be initiated to recover possession of the premises, late charges, and court costs. This may affect your credit and your ability to rent in the future.

Greenfield Property Management
Dated this 14th day of June, 2026`,
    },
    {
      id: 'medical',
      label: 'Medical bill',
      kind: 'Balance due',
      raw:
`MERCY GENERAL HOSPITAL - STATEMENT OF ACCOUNT

Patient: J. Okafor       Account: 88-241907
Date of service: 05/02/2026
Statement date: 06/10/2026

Emergency department visit, level 4        $3,890.00
Diagnostic imaging (CT, abdomen)           $2,150.00
Laboratory panel                             $    640.00
Facility fee                                 $1,275.00
--------------------------------------------------
Total charges                                $7,955.00
Insurance adjustment                       - $4,010.00
Insurance paid                             - $1,890.00
--------------------------------------------------
PATIENT BALANCE DUE                          $2,055.00

Payment is due upon receipt. Accounts unpaid after 30 days may be referred to a collection agency.`,
    },
    {
      id: 'benefits',
      label: 'Benefits denial',
      kind: 'SNAP determination',
      raw:
`STATE DEPARTMENT OF HUMAN SERVICES
NOTICE OF DECISION - SUPPLEMENTAL NUTRITION ASSISTANCE (SNAP)

Case name: T. Nguyen        Case number: 5520148

We have reviewed your application dated 05/20/2026. Your household has been found INELIGIBLE for SNAP benefits.

Reason: The information needed to determine eligibility was not received by the due date. Specifically, proof of income for all household members was not provided.

If you believe this decision is wrong, you may request a fair hearing. Your request must be received within 90 days of the date of this notice. You may continue to receive benefits during the appeal if you request a hearing within 10 days.

Date of notice: 06/09/2026`,
    },
  ];

  /* ---- Authored decode results (the demo-safe fallback, FR-37) --------- */
  /* Base results are written at the "plain" level. Reading-level overrides
     below swap the lead text so changing level visibly re-renders.          */

  const SEED = {
    eviction: {
      en: {
        document_type: 'Eviction Notice (Pay or Quit)',
        confidence: 'high',
        language: 'en',
        reading_level: 'plain',
        summary: 'This is a notice from your landlord, not a court order. It says you are behind on rent and gives you a short time to pay the full amount or move out. If you do nothing, the landlord can start a court case to remove you.',
        meaning_for_you: 'You have not been evicted yet. This is the warning that comes before court. You still have choices, but the deadline is very short, so act today. Paying on time, or getting help to answer it, keeps your home and your options open.',
        deadlines: [
          { label: 'Pay $2,140 in full or move out', date: '2026-06-19', raw_text: 'WITHIN FIVE (5) DAYS after service of this notice', urgency: 'critical' },
          { label: 'If a court summons arrives later, respond to it right away', date: null, raw_text: 'legal proceedings will be initiated', urgency: 'soon' },
        ],
        actions: [
          { task: 'Call a local legal aid office today', why: 'Free lawyers can answer the notice for you and may be able to stop the eviction. Tenants with a lawyer do far better in court.', by: '2026-06-19' },
          { task: 'Gather every rent receipt and bank record you have', why: 'Proof of what you paid can lower the amount or show the notice is wrong.', by: '2026-06-19' },
          { task: 'Do not move out before you get advice', why: 'Leaving early can cost you rights and money you may not need to give up.', by: null },
          { task: 'Ask for a written payment plan, keep a copy', why: 'A written agreement, if the landlord accepts it, can pause the case.', by: null },
        ],
        rights: [
          { right: 'You have the right to a court hearing before anyone can force you to leave.', basis: null },
          { right: 'A landlord cannot change the locks or remove your belongings without a court order.', basis: null },
          { right: 'You can ask the court for more time or for a payment plan.', basis: null },
          { right: 'You can be represented by a lawyer, including free legal aid.', basis: null },
          { right: 'There is no federal right to a free, court-appointed lawyer in an eviction case, though some states and cities now provide one by their own law.', basis: null, citation: 'Lassiter v. Department of Social Services, 452 U.S. 18 (1981)', source_url: 'https://www.law.cornell.edu/supremecourt/text/452/18' },
        ],
        red_flags: [
          { flag: 'The 5 day deadline may be shorter than the law allows', severity: 'high', explanation: 'Many states require a longer notice period before an eviction case can start. A deadline that is too short can make the whole notice invalid. Ask legal aid to check the rule where you live.' },
          { flag: 'Cash only, no checks, paid in person', severity: 'medium', explanation: 'Being told to pay cash with no record leaves you no proof you paid. If you pay, always get a dated, signed receipt for the exact amount.' },
        ],
        draft_response:
`To: Greenfield Property Management
Re: Notice to Pay Rent or Quit, 4417 Cedar Street, Apt 2B

I am writing about the notice dated June 14, 2026. I want to resolve this and stay in my home.

I am asking for the following:
1. An itemized statement showing how the balance of [amount] was calculated, including any late fees.
2. A written payment plan that lets me pay the balance over [number] weeks.
3. A signed, dated receipt for any payment I make.

Please send your reply in writing to [your address] or [your email]. I do not agree to give up possession of the unit, and I am seeking advice about my rights.

Sincerely,
[Your full name]
[Date]`,
        uncertainties: [
          'The exact late-fee amount was not stated in the notice. Confirm it on your copy.',
          'The date the notice was actually delivered to you sets the real deadline. Check the date you received it.',
        ],
        get_help: [
          { resource: 'Local legal aid (free tenant lawyers)', type: 'legal_aid', note: 'Search "legal aid" plus your city, or use LawHelp.org to find the office near you.' },
          { resource: '211', type: 'hotline', note: 'Call 2-1-1 or visit 211.org for rent help and local services, free and confidential.' },
          { resource: 'Local tenant union or tenants rights group', type: 'tenant_union', note: 'They know your local eviction rules and can stand with you.' },
          { resource: 'The court clerk named on any summons', type: 'gov_agency', note: 'Ask how to file a written answer and whether fees can be waived.' },
        ],
        law_checked: ['State eviction law', 'Federal CARES Act (15 U.S.C. 9058)'],
        scam_risk: { level: 'low', signals: [], summary: 'This looks like a real notice from a landlord, not a scam. The serious problems are the very short deadline and the cash-only demand, flagged above. Verify the sender and keep proof of anything you pay.' },
        violations: [],
        procedure: [
          { step: 'Notice period', detail: 'You have the days stated in the notice to pay the full amount or move out. The exact number depends on your state.' },
          { step: 'Landlord files in court', detail: 'If you do not pay or leave, the landlord can file an eviction case. You cannot be removed without going through the court.' },
          { step: 'You are served and can answer', detail: 'You receive a court summons. Responding in writing by the deadline is what keeps you in the case.' },
          { step: 'Hearing', detail: 'A judge hears both sides. This is where having legal aid helps the most.' },
          { step: 'Judgment and writ of possession', detail: 'If the landlord wins, the court issues a judgment, and only a sheriff or marshal can carry out the removal.' },
        ],
        what_if_ignored: 'If you do nothing, the landlord can take you to court and a judge could enter a default judgment ordering you out, which a sheriff would enforce.',
      },
      es: {
        document_type: 'Aviso de Desalojo (Pagar o Desocupar)',
        confidence: 'high',
        language: 'es',
        reading_level: 'plain',
        summary: 'Esto es un aviso de su arrendador, no una orden de la corte. Dice que usted debe renta y le da poco tiempo para pagar todo o mudarse. Si no hace nada, el arrendador puede empezar un caso en la corte para sacarlo.',
        meaning_for_you: 'Todavia no lo han desalojado. Esta es la advertencia que llega antes de la corte. Usted todavia tiene opciones, pero el plazo es muy corto, asi que actue hoy. Pagar a tiempo, o conseguir ayuda para responder, protege su hogar y sus opciones.',
        deadlines: [
          { label: 'Pagar $2,140 completos o mudarse', date: '2026-06-19', raw_text: 'WITHIN FIVE (5) DAYS after service of this notice', urgency: 'critical' },
          { label: 'Si despues llega una citacion de la corte, responda de inmediato', date: null, raw_text: 'legal proceedings will be initiated', urgency: 'soon' },
        ],
        actions: [
          { task: 'Llame hoy a una oficina de ayuda legal gratuita', why: 'Los abogados gratuitos pueden responder el aviso por usted y a veces detener el desalojo. Los inquilinos con abogado tienen mejores resultados.', by: '2026-06-19' },
          { task: 'Reuna todos los recibos de renta y registros del banco', why: 'La prueba de lo que pago puede bajar la cantidad o mostrar que el aviso esta mal.', by: '2026-06-19' },
          { task: 'No se mude antes de recibir consejo', why: 'Irse temprano puede costarle derechos y dinero que quiza no tenga que entregar.', by: null },
          { task: 'Pida un plan de pago por escrito y guarde una copia', why: 'Un acuerdo por escrito, si el arrendador lo acepta, puede pausar el caso.', by: null },
        ],
        rights: [
          { right: 'Usted tiene derecho a una audiencia en la corte antes de que alguien pueda obligarlo a salir.', basis: null },
          { right: 'El arrendador no puede cambiar las cerraduras ni sacar sus cosas sin una orden de la corte.', basis: null },
          { right: 'Puede pedir a la corte mas tiempo o un plan de pago.', basis: null },
          { right: 'Puede tener un abogado, incluso ayuda legal gratuita.', basis: null },
        ],
        red_flags: [
          { flag: 'El plazo de 5 dias puede ser mas corto de lo que permite la ley', severity: 'high', explanation: 'Muchos estados exigen un aviso mas largo antes de iniciar un desalojo. Un plazo demasiado corto puede invalidar el aviso. Pida a ayuda legal que revise la regla donde usted vive.' },
          { flag: 'Solo efectivo, sin cheques, pagado en persona', severity: 'medium', explanation: 'Que le pidan efectivo sin registro lo deja sin prueba de pago. Si paga, exija siempre un recibo firmado y con fecha por la cantidad exacta.' },
        ],
        draft_response:
`Para: Greenfield Property Management
Asunto: Aviso de Pagar Renta o Desocupar, 4417 Cedar Street, Apt 2B

Escribo sobre el aviso con fecha del 14 de junio de 2026. Quiero resolver esto y quedarme en mi hogar.

Solicito lo siguiente:
1. Un estado de cuenta detallado que muestre como se calculo el saldo de [cantidad], incluyendo cargos por mora.
2. Un plan de pago por escrito para pagar el saldo en [numero] semanas.
3. Un recibo firmado y con fecha por cualquier pago que haga.

Por favor responda por escrito a [su direccion] o [su correo]. No acepto entregar la posesion de la unidad y estoy buscando consejo sobre mis derechos.

Atentamente,
[Su nombre completo]
[Fecha]`,
        uncertainties: [
          'El monto exacto del cargo por mora no aparece en el aviso. Confirmelo en su copia.',
          'La fecha en que de verdad le entregaron el aviso fija el plazo real. Revise la fecha en que lo recibio.',
        ],
        get_help: [
          { resource: 'Ayuda legal local (abogados gratuitos para inquilinos)', type: 'legal_aid', note: 'Busque "ayuda legal" con su ciudad, o use LawHelp.org para encontrar la oficina mas cercana.' },
          { resource: '211', type: 'hotline', note: 'Llame al 2-1-1 o visite 211.org para ayuda con la renta y servicios locales, gratis y confidencial.' },
          { resource: 'Union de inquilinos local', type: 'tenant_union', note: 'Conocen las reglas de desalojo de su zona y pueden acompanarlo.' },
          { resource: 'El secretario de la corte nombrado en la citacion', type: 'gov_agency', note: 'Pregunte como presentar una respuesta por escrito y si pueden exonerar las tarifas.' },
        ],
      },
    },

    medical: {
      en: {
        document_type: 'Hospital Bill (Balance Due)',
        confidence: 'high',
        language: 'en',
        reading_level: 'plain',
        summary: 'This is a bill from the hospital for an emergency visit. Your insurance already paid part and lowered the charges. The hospital says you still owe a balance of $2,055.',
        meaning_for_you: 'You do not have to pay this today, and the amount is not always final. Hospital bills often contain errors, and you can ask questions, request an itemized bill, and apply for financial help before you pay anything.',
        deadlines: [
          { label: 'Bill may go to collections if unpaid', date: '2026-07-10', raw_text: 'Accounts unpaid after 30 days may be referred to a collection agency', urgency: 'soon' },
        ],
        actions: [
          { task: 'Ask for a fully itemized bill', why: 'The line items here are summaries. An itemized bill shows every charge so you can spot errors and duplicate fees.', by: null },
          { task: 'Ask the hospital about financial assistance or charity care', why: 'Nonprofit hospitals must offer help to patients who qualify, which can cut or erase the balance.', by: null },
          { task: 'Compare the bill against your insurance Explanation of Benefits', why: 'The EOB shows what you actually owe. If the bill asks for more, it may be a billing error.', by: null },
          { task: 'Do not pay with a credit card before you check it', why: 'Paying first makes errors much harder to undo. Verify the amount, then pay.', by: null },
        ],
        rights: [
          { right: 'You have the right to an itemized bill that explains every charge.', basis: null },
          { right: 'You can ask about financial assistance, payment plans, and prompt-pay discounts.', basis: null },
          { right: 'You can dispute charges you believe are wrong before paying.', basis: null },
          { right: 'For emergency care, you generally cannot be charged more than your in-network cost-sharing.', basis: null, citation: 'No Surprises Act, 42 U.S.C. 300gg-111', source_url: 'https://www.cms.gov/newsroom/fact-sheets/no-surprises-understand-your-rights-against-surprise-medical-bills' },
        ],
        red_flags: [
          { flag: '"Payment due upon receipt" pressure', severity: 'low', explanation: 'This phrasing creates urgency, but you are allowed to review and dispute the bill first. It is not a same-day legal deadline.' },
        ],
        draft_response:
`To: Mercy General Hospital, Billing Department
Re: Account 88-241907, date of service 05/02/2026

I am writing about the balance of $2,055.00 on my statement. Before I pay, I am requesting the following:
1. A fully itemized bill listing every charge with its billing code.
2. Information about your financial assistance or charity care program and how to apply.
3. Confirmation of what my insurance was billed and paid.

Please hold this account from collections while my request is reviewed. You can reach me at [your phone] or [your email].

Sincerely,
[Your full name]
[Date]`,
        uncertainties: [
          'I could not confirm whether the imaging charge was billed in network. Check your insurance Explanation of Benefits.',
        ],
        get_help: [
          { resource: 'A hospital financial counselor', type: 'gov_agency', note: 'Ask the billing department to connect you. This is free and can lower the bill.' },
          { resource: 'A patient advocate or medical billing advocate', type: 'other', note: 'They review bills for errors. Some nonprofits help for free.' },
          { resource: '211', type: 'hotline', note: 'Call 2-1-1 for local programs that help with medical debt.' },
        ],
        law_checked: ['No Surprises Act (42 U.S.C. 300gg-111)', 'ACA appeal rights (45 CFR 147.136)'],
        scam_risk: { level: 'low', signals: [], summary: 'This looks like a real hospital bill, not a scam. The question is whether the amount is correct and whether part of it is limited by the No Surprises Act.' },
        violations: [
          { issue: 'Possible balance bill for emergency care', citation: 'No Surprises Act, 42 U.S.C. 300gg-111', source_url: 'https://www.cms.gov/newsroom/fact-sheets/no-surprises-understand-your-rights-against-surprise-medical-bills', severity: 'medium', explanation: 'This is an emergency department bill. For emergency care, the No Surprises Act generally limits you to your in-network cost-sharing, so part of this balance may be more than the law allows. Ask the hospital and your insurer to confirm before you pay.' },
        ],
        procedure: [
          { step: 'Request an itemized bill', detail: 'Ask for every charge with its code so you can check for errors and duplicate fees.' },
          { step: 'Compare it to your insurance Explanation of Benefits', detail: 'The EOB shows what you actually owe. If the bill asks for more, it may be a billing error.' },
          { step: 'Dispute or apply for financial help', detail: 'Challenge wrong charges, ask about charity care, and use the patient-provider dispute process if the bill is far above an estimate.' },
        ],
        what_if_ignored: 'If you ignore it, the bill could go to collections after 30 days and affect your credit, even though part of the amount may be wrong or limited by law.',
      },
    },

    benefits: {
      en: {
        document_type: 'SNAP Benefits Denial',
        confidence: 'high',
        language: 'en',
        reading_level: 'plain',
        summary: 'This is a decision letter about food benefits (SNAP). It says your household was found not eligible because proof of income was not received by the due date. This is about missing paperwork, not a final judgment that you do not qualify.',
        meaning_for_you: 'You can fix this. The denial is based on a missing document, so sending the proof and asking for a fair hearing can reopen your case. If you act within 10 days, you may keep benefits while it is reviewed.',
        deadlines: [
          { label: 'Request a hearing within 10 days to keep benefits during appeal', date: '2026-06-19', raw_text: 'continue to receive benefits during the appeal if you request a hearing within 10 days', urgency: 'critical' },
          { label: 'Final deadline to request a fair hearing', date: '2026-09-07', raw_text: 'Your request must be received within 90 days of the date of this notice', urgency: 'soon' },
        ],
        actions: [
          { task: 'Send proof of income for everyone in your household', why: 'The denial reason is the missing income proof. Sending it is the fastest path to approval.', by: '2026-06-19' },
          { task: 'Request a fair hearing in writing and keep a copy', why: 'A hearing forces a real review of your case. Asking within 10 days can protect your benefits in the meantime.', by: '2026-06-19' },
          { task: 'Call the case worker on the notice to confirm what is missing', why: 'Confirming the exact document avoids another denial for the wrong paperwork.', by: null },
        ],
        rights: [
          { right: 'You have the right to request a fair hearing if you disagree with the decision.', basis: null, citation: 'SNAP fair hearings, 7 CFR 273.15(a)', source_url: 'https://www.law.cornell.edu/cfr/text/7/273.15' },
          { right: 'You can keep your benefits during the appeal if you request the hearing in time.', basis: null, citation: 'SNAP fair hearings, 7 CFR 273.15(k)', source_url: 'https://www.law.cornell.edu/cfr/text/7/273.15' },
          { right: 'You can bring someone to help you, including a free representative.', basis: null },
        ],
        red_flags: [],
        draft_response:
`To: State Department of Human Services
Re: Case 5520148, Notice of Decision dated 06/09/2026

I am requesting a fair hearing to appeal the denial of my SNAP application. I believe the denial was based on missing proof of income, which I am providing with this letter.

Please note:
1. I am enclosing proof of income for all household members.
2. I am requesting that my benefits continue during the appeal.
3. Please confirm in writing that you received this request.

You can reach me at [your phone] or [your address].

Sincerely,
[Your full name]
[Date]`,
        uncertainties: [],
        get_help: [
          { resource: 'Local legal aid (public benefits unit)', type: 'legal_aid', note: 'Free help to file the appeal and prepare for the hearing. Search "legal aid" plus your city.' },
          { resource: 'The case worker named on the notice', type: 'gov_agency', note: 'Confirm exactly which document is missing and how to submit it.' },
          { resource: '211', type: 'hotline', note: 'Call 2-1-1 for food pantries and benefits help near you while your case is reviewed.' },
        ],
        law_checked: ['SNAP fair-hearing rules (7 CFR 273)'],
        scam_risk: { level: 'none', signals: [], summary: 'This is a real government benefits notice, not a scam. The point is that the denial is about missing paperwork and can be appealed.' },
        violations: [],
        procedure: [
          { step: 'Request a fair hearing within 10 days', detail: 'Asking within 10 days can keep your benefits going while the case is reviewed.' },
          { step: 'Send the missing proof of income', detail: 'The denial is for missing income proof, so providing it is the fastest path to approval.' },
          { step: 'Hearing', detail: 'An impartial officer reviews your case. You can bring a free representative.' },
          { step: 'Written decision', detail: 'You receive a decision in writing, which you can appeal further if needed.' },
        ],
        what_if_ignored: 'If you do nothing, the case stays denied and your benefits will not start, even though sending the missing proof and requesting a hearing could fix it.',
      },
    },
  };

  /* ---- Reading-level overrides: swap the lead text only ---------------- */
  const LEVEL_OVERRIDES = {
    eviction: {
      en: {
        simplest: {
          summary: 'Your landlord wants money you owe. You have a few days to pay it all or leave. This is not from a judge yet. If you wait, the landlord can take you to court.',
          meaning_for_you: 'You are not out yet. You still have time. But the time is short. Act today. Ask for help. Do not leave before you talk to someone.',
        },
        standard: {
          summary: 'This is a Notice to Pay Rent or Quit issued by your landlord. It states that you owe back rent and gives you a brief window to pay the full balance or vacate the unit. It is a pre-court demand, and ignoring it allows the landlord to file an eviction action.',
          meaning_for_you: 'No eviction has occurred yet. This notice is the formal step that precedes a court filing. Your options remain open, but the deadline is short, so respond promptly. Paying on time, or securing legal assistance to answer the notice, preserves both your tenancy and your legal position.',
        },
      },
      es: {
        simplest: {
          summary: 'Su arrendador quiere el dinero que usted debe. Tiene pocos dias para pagar todo o salir. Esto todavia no viene de un juez. Si espera, lo pueden llevar a la corte.',
          meaning_for_you: 'Todavia no esta afuera. Aun tiene tiempo. Pero es poco. Actue hoy. Pida ayuda. No salga antes de hablar con alguien.',
        },
        standard: {
          summary: 'Este es un Aviso de Pagar Renta o Desocupar emitido por su arrendador. Indica que usted debe renta atrasada y le da un plazo breve para pagar el saldo completo o desocupar la unidad. Es una demanda previa a la corte, e ignorarla permite que el arrendador inicie un desalojo.',
          meaning_for_you: 'Aun no ha ocurrido ningun desalojo. Este aviso es el paso formal antes de presentar el caso. Sus opciones siguen abiertas, pero el plazo es corto, asi que responda pronto. Pagar a tiempo, o conseguir ayuda legal para responder, protege su vivienda y su posicion legal.',
        },
      },
    },
  };

  function getSeed(exampleId, lang, level) {
    const byLang = SEED[exampleId];
    if (!byLang) return null;
    const base = byLang[lang] || byLang.en;
    if (!base) return null;
    const result = JSON.parse(JSON.stringify(base));
    result.reading_level = level;
    result.language = lang;
    const ov = LEVEL_OVERRIDES[exampleId] &&
      LEVEL_OVERRIDES[exampleId][lang] &&
      LEVEL_OVERRIDES[exampleId][lang][level];
    if (ov) Object.assign(result, ov);
    return result;
  }

  function hasSeed(exampleId, lang) {
    return !!(SEED[exampleId] && SEED[exampleId][lang]);
  }

  /* ---- The AI contract (used for live decoding of pasted text) --------- */
  function buildPrompt(text, level, lang) {
    const langName = (LANGUAGES.find((l) => l.code === lang) || {}).name || 'English';
    const levelLabel = (READING_LEVELS.find((l) => l.id === level) || {}).label || 'Plain';
    return [
      'You are Decoded. You explain confusing official documents in plain language. You are not a lawyer or a doctor and you never give advice. You never invent facts, dates, statute numbers, amounts, or rights. If something is unreadable or unclear, list it under uncertainties instead of guessing.',
      'Read the document below and return ONLY a single JSON object, no prose outside it, matching exactly this shape:',
      '{"document_type":string,"confidence":"high"|"medium"|"low","language":string,"reading_level":string,"summary":string,"meaning_for_you":string,"deadlines":[{"label":string,"date":string|null,"raw_text":string,"urgency":"critical"|"soon"|"info"}],"actions":[{"task":string,"why":string,"by":string|null}],"rights":[{"right":string,"basis":string|null}],"red_flags":[{"flag":string,"severity":"high"|"medium"|"low","explanation":string}],"draft_response":string,"uncertainties":[string],"get_help":[{"resource":string,"type":"legal_aid"|"hotline"|"gov_agency"|"tenant_union"|"other","note":string}]}',
      'Rules: write every field in ' + langName + ' at a ' + levelLabel + ' reading level, in short calm second-person sentences. Set rights.basis to null unless the document states a specific law. The draft_response must be courteous and firm, must never admit fault, and must use [bracketed] placeholders. get_help must name only real categories of help and must not invent phone numbers or web addresses. Arrays may be empty. Never use em-dashes.',
      'DOCUMENT:',
      text.slice(0, 6000),
    ].join('\n\n');
  }

  function parseResult(raw) {
    if (!raw) return null;
    let s = String(raw).trim();
    const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fence) s = fence[1].trim();
    const start = s.indexOf('{');
    const end = s.lastIndexOf('}');
    if (start === -1 || end === -1) return null;
    try {
      return JSON.parse(s.slice(start, end + 1));
    } catch (e) {
      return null;
    }
  }

  const LOADING_STEPS = [
    'Reading the document',
    'Finding the deadlines',
    'Checking your rights',
    'Scanning for scam signals',
    'Writing it in plain language',
  ];

export const DECODED = {
  LANGUAGES, READING_LEVELS, EXAMPLES, SEED, LOADING_STEPS,
  getSeed, hasSeed, buildPrompt, parseResult,
};
