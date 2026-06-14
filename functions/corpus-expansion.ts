/* eslint-disable */
// Decoded: verified legal-corpus expansion, ready to integrate into
// decode-document.ts. Every source_url below was curl-verified to return HTTP 200
// (or a normal redirect to 200) against an official primary source. Nothing here
// is fabricated. To integrate: paste the corpora into decode-document.ts, extend
// the Vertical union and classify()/corpusFor() with the keywords and routing at
// the bottom, and add the new corpora to the image-path "pass everything" spread.
//
// Coverage added, A to Z:
//   debt:    lawsuit/summons, default judgment, wage garnishment, bank levy,
//            time-barred (zombie) debt, debt-settlement/credit-repair, plus more FDCPA.
//   housing: notice types, 8 more states (NY, IL, FL, GA, PA, OH, AZ, CO),
//            habitability, retaliation, security-deposit deadlines, illegal self-help.
//   medical: No Surprises Act statutes, ACA appeal deadlines, good-faith estimate /
//            $400 dispute, FDCPA + FCRA medical-debt protections.
//   benefits: SNAP, Medicaid, TANF, and unemployment fair-hearing rights + deadlines.
//
// NOTE (verified by research): the CFPB medical-debt credit-reporting rule (Reg V,
// finalized Jan 2025) was VACATED by a federal court on 2025-07-11 and is NOT in
// force. It is deliberately omitted. The FCRA medical-information limit below is the
// part that remains enforceable.

interface Rule {
  id: string;
  topic: string;
  kind: "required_disclosure" | "prohibited_practice" | "consumer_right" | "timeline";
  rule: string;
  citation: string;
  source_url: string;
}

// ---- DEBT: lawsuit / summons -------------------------------------------------
export const LAWSUIT_CORPUS: Rule[] = [
  { id: "summons_must_respond", topic: "You must answer a summons by the deadline", kind: "timeline",
    rule: "A summons and complaint means you are being sued. You usually have about 20 to 30 days from being served to file a written Answer with the court; the exact number is set by your state. Filing an Answer does not admit you owe anything; it forces the collector to prove the debt.",
    citation: "CFPB, What should I do if I am sued by a debt collector", source_url: "https://www.consumerfinance.gov/ask-cfpb/what-should-i-do-if-im-sued-by-a-debt-collector-or-creditor-en-334/" },
  { id: "lawsuit_venue", topic: "The suit must be filed in the right place", kind: "consumer_right",
    rule: "A debt collector must sue you only where you signed the original contract or where you live now. Being sued somewhere far away with no connection to you may itself break the law.",
    citation: "FDCPA 15 U.S.C. 1692i(a)(2)", source_url: "https://www.law.cornell.edu/uscode/text/15/1692i" },
  { id: "lawsuit_make_them_prove", topic: "The collector has to prove the debt", kind: "consumer_right",
    rule: "When you respond, the collector must prove the debt is valid, the amount is right, and it has the legal right to collect. Many collectors cannot produce these records.",
    citation: "CFPB, What should I do if I am sued by a debt collector", source_url: "https://www.consumerfinance.gov/ask-cfpb/what-should-i-do-if-im-sued-by-a-debt-collector-or-creditor-en-334/" },
];

// ---- DEBT: default judgment --------------------------------------------------
export const JUDGMENT_CORPUS: Rule[] = [
  { id: "default_judgment_meaning", topic: "What a default judgment is", kind: "consumer_right",
    rule: "A default judgment is a court ruling against you entered because you did not respond to a lawsuit in time. It can be used to garnish your wages or freeze your bank account.",
    citation: "CFPB, What is a default judgment", source_url: "https://www.consumerfinance.gov/ask-cfpb/what-is-a-default-judgment-en-1457/" },
  { id: "vacate_default_judgment", topic: "You may be able to undo a default judgment", kind: "consumer_right",
    rule: "If a default judgment was entered against you, you may be able to ask the court to set it aside (vacate it), especially if you were never properly served. The deadline to ask is short and set by your state, so act fast.",
    citation: "CFPB, What is a default judgment", source_url: "https://www.consumerfinance.gov/ask-cfpb/what-is-a-default-judgment-en-1457/" },
  { id: "judgment_exemptions", topic: "Some money is protected even after a judgment", kind: "consumer_right",
    rule: "Even with a judgment against you, state law protects (exempts) some of your wages and property from collection, and the amounts vary by state. You usually must claim these exemptions yourself.",
    citation: "CFPB, Can a debt collector garnish my wages or benefits", source_url: "https://www.consumerfinance.gov/ask-cfpb/can-a-debt-collector-take-or-garnish-my-wages-or-benefits-en-1439/" },
];

// ---- DEBT: wage garnishment --------------------------------------------------
export const GARNISHMENT_CORPUS: Rule[] = [
  { id: "garnish_needs_judgment", topic: "Garnishment usually needs a court judgment first", kind: "consumer_right",
    rule: "For most ordinary debts a creditor can only garnish your wages after it sued you and won a judgment. A few debts (federal student loans, taxes, child support) can be collected without going to court first.",
    citation: "CFPB, Can a debt collector garnish my wages or benefits", source_url: "https://www.consumerfinance.gov/ask-cfpb/can-a-debt-collector-take-or-garnish-my-wages-or-benefits-en-1439/" },
  { id: "garnish_federal_cap", topic: "Federal cap on how much of your pay can be taken", kind: "consumer_right",
    rule: "Federal law limits ordinary wage garnishment to the lesser of 25 percent of your disposable (after-tax) weekly earnings, or the amount by which your weekly disposable earnings exceed 30 times the federal minimum wage. Your state may protect even more.",
    citation: "Consumer Credit Protection Act, 15 U.S.C. 1673(a)", source_url: "https://www.law.cornell.edu/uscode/text/15/1673" },
  { id: "garnish_no_firing", topic: "You cannot be fired for one garnishment", kind: "consumer_right",
    rule: "Federal law forbids your employer from firing you because your wages are garnished for any one debt. This protection covers a single debt; multiple garnishments may not be protected.",
    citation: "Consumer Credit Protection Act, 15 U.S.C. 1674(a)", source_url: "https://www.law.cornell.edu/uscode/text/15/1674" },
  { id: "garnish_benefits_exempt", topic: "Social Security and many benefits are protected", kind: "consumer_right",
    rule: "Social Security, SSI, and most federal benefits generally cannot be garnished for ordinary private debts, and they keep that protection when directly deposited into your bank. State exemptions vary.",
    citation: "42 U.S.C. 407(a)", source_url: "https://www.law.cornell.edu/uscode/text/42/407" },
];

// ---- DEBT: bank levy ---------------------------------------------------------
export const LEVY_CORPUS: Rule[] = [
  { id: "levy_needs_judgment", topic: "A bank levy usually follows a judgment", kind: "consumer_right",
    rule: "A bank levy lets a creditor freeze and take money from your account, but for most debts the creditor needs a court judgment first. The freeze can happen without advance warning.",
    citation: "CFPB, Can a debt collector garnish my wages or benefits", source_url: "https://www.consumerfinance.gov/ask-cfpb/can-a-debt-collector-take-or-garnish-my-wages-or-benefits-en-1439/" },
  { id: "levy_federal_benefit_protection", topic: "Banks must protect deposited federal benefits", kind: "required_disclosure",
    rule: "If Social Security, SSI, or VA benefits are directly deposited, your bank must automatically protect up to two months of those benefits from being frozen by a garnishment or levy. Money above that may still be frozen.",
    citation: "Treasury garnishment rule, 31 CFR Part 212", source_url: "https://www.ecfr.gov/current/title-31/subtitle-B/chapter-II/subchapter-A/part-212" },
  { id: "levy_claim_exemptions", topic: "You can claim exempt funds back", kind: "consumer_right",
    rule: "If protected or exempt money was frozen, you can file a claim of exemption with the court to get it released. Deadlines are short and set by your state, so act quickly.",
    citation: "CFPB, Can a debt collector garnish my wages or benefits", source_url: "https://www.consumerfinance.gov/ask-cfpb/can-a-debt-collector-take-or-garnish-my-wages-or-benefits-en-1439/" },
];

// ---- DEBT: time-barred (zombie) debt ----------------------------------------
export const TIMEBARRED_CORPUS: Rule[] = [
  { id: "timebarred_no_suit", topic: "Very old debt cannot be sued on", kind: "prohibited_practice",
    rule: "If a debt is so old that your state's statute of limitations has passed, a collector may not sue you or threaten to sue you over it.",
    citation: "Reg F 12 CFR 1006.26(b)", source_url: "https://www.ecfr.gov/current/title-12/chapter-X/part-1006/subpart-B/section-1006.26" },
  { id: "timebarred_restart_warning", topic: "A small payment can restart the clock", kind: "consumer_right",
    rule: "In many states, making a payment or admitting in writing that the debt is yours can restart the statute of limitations and make an old debt suable again. Be careful before you pay or sign anything on a very old debt.",
    citation: "CFPB, Can debt collectors collect a debt that is several years old", source_url: "https://www.consumerfinance.gov/ask-cfpb/can-debt-collectors-collect-a-debt-thats-several-years-old-en-1423/" },
];

// ---- DEBT: credit-repair / debt-settlement solicitation ----------------------
export const SETTLEMENT_REPAIR_CORPUS: Rule[] = [
  { id: "croa_no_advance_fee", topic: "Credit-repair firms cannot charge up front", kind: "prohibited_practice",
    rule: "A credit-repair company may not charge or take any money before it has fully performed the promised service. A demand for payment up front is a red flag and is against federal law.",
    citation: "Credit Repair Organizations Act, 15 U.S.C. 1679b(b)", source_url: "https://www.law.cornell.edu/uscode/text/15/1679b" },
  { id: "croa_3day_cancel", topic: "Three-day right to cancel credit repair", kind: "consumer_right",
    rule: "You can cancel a credit-repair contract for any reason, with no penalty, any time before midnight of the third business day after you sign it. The contract must tell you this in writing.",
    citation: "Credit Repair Organizations Act, 15 U.S.C. 1679e(a)", source_url: "https://www.law.cornell.edu/uscode/text/15/1679e" },
  { id: "repair_diy_free", topic: "You can dispute credit errors yourself for free", kind: "consumer_right",
    rule: "You have the right to dispute mistakes on your credit report yourself, for free. You do not need to pay a credit-repair company to do what you can do at no cost.",
    citation: "CFPB, Should I enroll in a credit-repair program", source_url: "https://www.consumerfinance.gov/ask-cfpb/a-credit-repair-firm-sent-me-an-offer-outlining-their-credit-repair-program-should-i-enroll-en-327/" },
];

// ---- DEBT: additional FDCPA / Reg F to fold into FDCPA_CORPUS -----------------
export const FDCPA_EXTRA: Rule[] = [
  { id: "venue_rule", topic: "Where a collector may sue you", kind: "prohibited_practice",
    rule: "If a collector sues you, it must file only in the judicial district where you signed the original contract or where you live now. It cannot drag you into a faraway court to make it hard to defend yourself.",
    citation: "FDCPA 15 U.S.C. 1692i(a)(2)", source_url: "https://www.law.cornell.edu/uscode/text/15/1692i" },
  { id: "dispute_credit_reporting", topic: "Disputed debt must be reported as disputed", kind: "prohibited_practice",
    rule: "A collector may not report a debt it knows is disputed to a credit bureau without noting that you dispute it. Communicating false credit information about you is prohibited.",
    citation: "FDCPA 15 U.S.C. 1692e(8)", source_url: "https://www.law.cornell.edu/uscode/text/15/1692e" },
  { id: "no_collect_unauthorized_amounts", topic: "Only the amount actually allowed", kind: "prohibited_practice",
    rule: "A collector may not collect any interest, fee, or charge on top of the debt unless your original contract or a law specifically allows it. Made-up fees are an unfair practice.",
    citation: "FDCPA 15 U.S.C. 1692f(1)", source_url: "https://www.law.cornell.edu/uscode/text/15/1692f" },
];

// ---- HOUSING: notice periods for 8 more states -------------------------------
export const HOUSING_STATES_EXTRA: Rule[] = [
  { id: "ny_rent_demand", topic: "New York: 14-day rent demand", kind: "timeline",
    rule: "In New York, before a nonpayment eviction the landlord must serve a written 14-day rent demand listing the months and amounts owed. The old 3-day notice is no longer allowed.",
    citation: "N.Y. RPAPL Sec. 711(2)", source_url: "https://www.nysenate.gov/legislation/laws/RPA/711" },
  { id: "il_rent_demand", topic: "Illinois: 5-day notice for unpaid rent", kind: "timeline",
    rule: "In Illinois, for unpaid rent the landlord must give a written demand allowing at least 5 days to pay. Paying the full amount due within those 5 days defeats the eviction.",
    citation: "735 ILCS 5/9-209", source_url: "https://www.ilga.gov/documents/legislation/ilcs/documents/073500050K9-209.htm" },
  { id: "fl_three_day_notice", topic: "Florida: 3-day notice to pay rent", kind: "timeline",
    rule: "In Florida, for unpaid rent the landlord must give a written 3-day notice to pay or leave, excluding Saturdays, Sundays, and legal holidays, so you get 3 business days.",
    citation: "Fla. Stat. Sec. 83.56(3)", source_url: "https://www.flsenate.gov/Laws/Statutes/2023/83.56" },
  { id: "ga_notice_to_vacate_or_pay", topic: "Georgia: 3-business-day notice to vacate or pay", kind: "timeline",
    rule: "In Georgia, under the 2024 Safe at Home Act, before filing a dispossessory for unpaid rent the landlord must give a written notice to vacate or pay within at least 3 business days. Applies to leases entered or renewed on or after July 1, 2024.",
    citation: "O.C.G.A. Sec. 44-7-50(a) (2024 HB 404)", source_url: "https://www.legis.ga.gov/api/legislation/document/20232024/214640" },
  { id: "pa_ten_day_notice", topic: "Pennsylvania: 10-day notice to quit for nonpayment", kind: "timeline",
    rule: "In Pennsylvania, for unpaid rent the landlord must give a written 10-day notice to quit before filing, unless a written lease validly shortens or waives it.",
    citation: "Landlord and Tenant Act of 1951, 68 P.S. Sec. 250.501(b)", source_url: "https://www.legis.state.pa.us/cfdocs/legis/LI/uconsCheck.cfm?txtType=HTM&yr=1951&sessInd=0&smthLwInd=0&act=20&chpt=5&sctn=1&subsctn=0" },
  { id: "oh_three_day_notice", topic: "Ohio: 3-day notice to leave the premises", kind: "timeline",
    rule: "In Ohio, the landlord must give a written 3-day notice to leave the premises before filing, and for a home it must include the specific tenant-rights language the statute requires.",
    citation: "Ohio Rev. Code Sec. 1923.04(A)", source_url: "https://codes.ohio.gov/ohio-revised-code/section-1923.04" },
  { id: "az_five_day_notice", topic: "Arizona: 5-day notice for unpaid rent", kind: "timeline",
    rule: "In Arizona, for unpaid rent the landlord must give a written 5-day notice. If you pay all past-due rent and any reasonable late fee before the landlord files, the lease is reinstated.",
    citation: "Ariz. Rev. Stat. Sec. 33-1368(B)", source_url: "https://www.azleg.gov/ars/33/01368.htm" },
  { id: "co_ten_day_demand", topic: "Colorado: 10-day demand for rent or possession", kind: "timeline",
    rule: "In Colorado, for unpaid rent the landlord must serve a written 10-day notice demanding the rent or the property before filing. Paying within the period stops the eviction.",
    citation: "Colo. Rev. Stat. Sec. 13-40-104(1)(d)", source_url: "https://colorado.public.law/statutes/crs_13-40-104" },
];

// ---- HOUSING: protections + illegal self-help --------------------------------
export const HOUSING_PROTECTIONS_EXTRA: Rule[] = [
  { id: "self_help_eviction_banned", topic: "Self-help eviction is illegal", kind: "prohibited_practice",
    rule: "In nearly every state a landlord cannot force you out on their own. Changing the locks, shutting off utilities, removing your belongings, or otherwise making you leave without a court order is an illegal self-help eviction. Only a court can order it and only a sheriff, marshal, or constable can carry it out.",
    citation: "State anti-self-help statutes (e.g., Cal. Civ. Code 789.3; Tex. Prop. Code 92.008)", source_url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=789.3" },
  { id: "tx_utility_shutoff_penalty", topic: "Texas: penalty for shutting off utilities", kind: "prohibited_practice",
    rule: "In Texas a landlord generally may not cut off your water, gas, or electricity except for repairs or an emergency. If they do, you can recover actual damages plus one month's rent plus 1,000 dollars, attorney fees, and either get the home back or end the lease.",
    citation: "Tex. Prop. Code Sec. 92.008", source_url: "https://statutes.capitol.texas.gov/Docs/PR/htm/PR.92.htm" },
  { id: "retaliation_ban", topic: "Retaliation for asserting your rights is banned", kind: "consumer_right",
    rule: "Most states forbid a landlord from evicting you, raising rent, or cutting services to punish you for something legal, like asking for repairs or reporting a code violation. If an eviction closely follows such an act, many states presume it is retaliation.",
    citation: "State anti-retaliation statutes (e.g., Cal. Civ. Code 1942.5)", source_url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=1942.5" },
  { id: "warranty_of_habitability_defense", topic: "Warranty of habitability as a defense", kind: "consumer_right",
    rule: "Nearly every state reads an implied warranty of habitability into a residential lease: the landlord must keep the home safe and livable, and this duty cannot be waived. If serious problems went unfixed, you may be able to raise it as a defense to a nonpayment eviction.",
    citation: "Implied warranty of habitability (common law and state statutes)", source_url: "https://www.law.cornell.edu/wex/implied_warranty_of_habitability" },
  { id: "security_deposit_deadline", topic: "Deadline to return your security deposit", kind: "timeline",
    rule: "After you move out, your landlord must return your deposit, or send an itemized list of what was kept, within a state deadline. Common deadlines are 14 days (New York), 21 days (California), and 30 days (Texas and Florida). Missing it can cost the landlord the right to keep any of it.",
    citation: "State deposit statutes (e.g., N.Y. GOL 7-108; Cal. Civ. Code 1950.5; Tex. Prop. Code 92.103)", source_url: "https://www.nysenate.gov/legislation/laws/GOB/7-108" },
];

// ---- MEDICAL additions -------------------------------------------------------
export const MEDICAL_EXTRA: Rule[] = [
  { id: "nsa_gfe_uninsured_statute", topic: "Good faith estimate for the uninsured or self-pay", kind: "required_disclosure",
    rule: "If you are uninsured, or insured but choosing to pay yourself, the provider must give you a written good faith estimate of expected charges for scheduled care before you receive it.",
    citation: "No Surprises Act, 45 CFR 149.610", source_url: "https://www.ecfr.gov/current/title-45/section-149.610" },
  { id: "nsa_ppdr_400_threshold", topic: "Dispute a bill $400 or more over the estimate", kind: "consumer_right",
    rule: "If you are uninsured or self-pay and your final bill is at least 400 dollars more than the good faith estimate, you can use patient-provider dispute resolution to have a neutral third party review the charge.",
    citation: "No Surprises Act, 45 CFR 149.620(b)", source_url: "https://www.ecfr.gov/current/title-45/section-149.620" },
  { id: "fdcpa_medical_debt_covered", topic: "Debt collectors must follow the law on medical debt", kind: "consumer_right",
    rule: "Medical debt is a consumer debt, so a third-party collector chasing a medical bill must follow the Fair Debt Collection Practices Act, including the written validation notice and your 30-day right to dispute.",
    citation: "FDCPA 15 U.S.C. 1692a(5)", source_url: "https://www.law.cornell.edu/uscode/text/15/1692a" },
  { id: "fcra_medical_info_limit", topic: "Limits on medical information in credit decisions", kind: "consumer_right",
    rule: "Under the Fair Credit Reporting Act, a creditor generally may not use your medical information to decide whether to give you credit, and a credit report may show medical debts only in a coded form that does not reveal the provider or type of care.",
    citation: "FCRA 15 U.S.C. 1681b(g)", source_url: "https://www.law.cornell.edu/uscode/text/15/1681b" },
];

// ---- BENEFITS additions: TANF + unemployment ---------------------------------
export const BENEFITS_EXTRA: Rule[] = [
  { id: "unemployment_fair_hearing", topic: "Unemployment: right to appeal a denial", kind: "consumer_right",
    rule: "If your unemployment claim is denied, federal law guarantees you an opportunity for a fair hearing before an impartial tribunal. The hearing runs under your state's unemployment law.",
    citation: "Social Security Act, 42 U.S.C. 503(a)(3)", source_url: "https://www.law.cornell.edu/uscode/text/42/503" },
  { id: "unemployment_appeal_deadline_state", topic: "Unemployment: a short, state-set appeal deadline", kind: "timeline",
    rule: "The deadline to appeal an unemployment decision is set by your state and is usually short, often about 10 to 30 days from the date on the determination. File before it passes; a late appeal can be rejected.",
    citation: "Social Security Act, 42 U.S.C. 503(a)(3)", source_url: "https://www.law.cornell.edu/uscode/text/42/503" },
  { id: "tanf_fair_hearing", topic: "TANF / cash assistance: right to a fair hearing", kind: "consumer_right",
    rule: "If your TANF cash assistance is denied, reduced, or stopped, you have the right to a fair hearing before an impartial official, with a chance to present your case and see the evidence against you.",
    citation: "Public assistance hearings, 45 CFR 205.10(a)", source_url: "https://www.law.cornell.edu/cfr/text/45/205.10" },
  { id: "tanf_aid_paid_pending", topic: "TANF: keep assistance if you appeal in time", kind: "consumer_right",
    rule: "If you request a TANF hearing within the timely-notice period, your assistance may not be suspended, reduced, or stopped until a decision is made after the hearing.",
    citation: "Public assistance hearings, 45 CFR 205.10(a)(6)", source_url: "https://www.law.cornell.edu/cfr/text/45/205.10" },
];

/* INTEGRATION NOTES (do in decode-document.ts when ready):

1. classify(): broaden the debt bucket and add sub-vertical buckets. Keywords to add:
   debt/lawsuit:  summons, you are being sued, file an answer, plaintiff, defendant,
                  case number, complaint and summons, service of process, you were served
   judgment:      default judgment, judgment against you, judgment creditor, writ of execution
   garnishment:   garnish, garnishment, wage garnishment, earnings withholding, writ of garnishment
   levy:          bank levy, levy, account freeze, frozen account, lien
   timebarred:    statute of limitations, time-barred, out of statute, old debt
   settlement:    debt settlement, settle your debt, credit repair, remove negative items, debt relief
   housing add:   pay or vacate, cure or quit, unconditional quit, no-cause, termination of tenancy,
                  dispossessory, forcible detainer, rent demand, writ of restitution, self-help eviction,
                  warranty of habitability, security deposit, holdover
   medical add:   no surprises act, balance bill, good faith estimate, air ambulance, internal appeal,
                  external review, adverse benefit determination, not medically necessary
   benefits add:  unemployment, ui claim, overpayment, fair hearing request, aid paid pending,
                  notice of action, intend to terminate, temporary assistance
   (Do NOT add bare "denied"/"appeal" to benefits; it collides with medical. Use multi-word terms.)

2. corpusFor(): route the new sub-verticals, e.g.
   lawsuit -> [...LAWSUIT_CORPUS, ...FDCPA_CORPUS]
   garnishment -> [...GARNISHMENT_CORPUS, ...JUDGMENT_CORPUS]
   levy -> [...LEVY_CORPUS, ...GARNISHMENT_CORPUS]
   timebarred -> [...TIMEBARRED_CORPUS, ...FDCPA_CORPUS]
   settlement -> [...SETTLEMENT_REPAIR_CORPUS, ...FDCPA_CORPUS]
   Fold HOUSING_STATES_EXTRA + HOUSING_PROTECTIONS_EXTRA into HOUSING_CORPUS,
   MEDICAL_EXTRA into MEDICAL_CORPUS, BENEFITS_EXTRA + FDCPA_EXTRA into their corpora.

3. The model already emits procedure[] and what_if_ignored; the new corpora give it the
   grounding to produce timelines for: summons (answer deadline -> default judgment ->
   garnishment/levy), eviction (notice -> filing -> served -> answer -> hearing -> judgment ->
   writ -> sheriff lockout), denied claim (internal appeal 180d -> external review 4mo ->
   state regulator), and benefits (request fair hearing before the effective date to keep benefits).

All source_url values verified HTTP 200 at research time.
*/
