/* eslint-disable @typescript-eslint/no-explicit-any */
// Decoded: the decode-document edge function. Takes an official document (pasted
// text or an image) plus a target language and reading level, and returns strict
// JSON in plain language: what it means, deadlines, your rights, problems with the
// document, a scam check, a draft reply, and where to get real help.
//
// For the cited verticals it does more than explain. It classifies the document,
// runs a deterministic rules pass over it, and grounds the model on a curated,
// cited corpus of the actual law:
//   - debt-collection letters    -> Fair Debt Collection Practices Act + Reg F
//   - medical bills and denials  -> No Surprises Act + ACA appeal rights
//   - eviction and housing       -> state notice law (TX, CA, MA, WA) + CARES Act
//   - SNAP and Medicaid notices  -> federal fair-hearing rules (7 CFR, 42 CFR)
// The model may only cite by copying from the corpus it is given, so every right
// and violation on screen carries a real citation a person can open and check.
// It also returns a grounded "what happens next" legal-procedure timeline.
// It EXPLAINS and CHECKS documents. It does not give legal or medical advice.
//
// Runs on the InsForge Deno runtime; calls the AI gateway (OpenRouter) so the key
// never reaches the browser.
import OpenAI from "npm:openai";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function ai(): OpenAI {
  return new OpenAI({
    baseURL: Deno.env.get("AI_BASE_URL") || "https://openrouter.ai/api/v1",
    apiKey: Deno.env.get("OPENROUTER_API_KEY"),
    defaultHeaders: { "HTTP-Referer": "https://decoded.insforge.app", "X-Title": "Decoded" },
  });
}

const MODEL = (): string => Deno.env.get("DECODE_MODEL") || "openai/gpt-4o";

// ----- The cited ground truth ---------------------------------------------
// Every citation the model is allowed to use comes from one of these corpora.
// The model may not invent a citation that is not here, so anything that reaches
// the screen with a citation is real and checkable.
interface Rule {
  id: string;
  topic: string;
  kind: "required_disclosure" | "prohibited_practice" | "consumer_right" | "timeline";
  rule: string;
  citation: string;
  source_url: string;
}

const FDCPA_CORPUS: Rule[] = [
  {
    id: "validation_notice",
    topic: "Validation notice",
    kind: "required_disclosure",
    rule:
      "Within five days of first contacting you, a collector must send a written notice stating the amount of the debt, the name of the creditor you owe, and that you have 30 days to dispute it.",
    citation: "FDCPA 15 U.S.C. 1692g(a); Reg F 12 CFR 1006.34",
    source_url: "https://www.law.cornell.edu/uscode/text/15/1692g",
  },
  {
    id: "dispute_pause",
    topic: "Right to dispute and pause collection",
    kind: "consumer_right",
    rule:
      "If you dispute the debt in writing within 30 days, the collector must stop collecting until it mails you written verification of the debt.",
    citation: "FDCPA 15 U.S.C. 1692g(b)",
    source_url: "https://www.law.cornell.edu/uscode/text/15/1692g",
  },
  {
    id: "call_hours",
    topic: "Calls at inconvenient times",
    kind: "prohibited_practice",
    rule:
      "A collector may not contact you at a time it knows is inconvenient, which is presumed to be before 8 a.m. or after 9 p.m. your local time.",
    citation: "FDCPA 15 U.S.C. 1692c(a)(1)",
    source_url: "https://www.law.cornell.edu/uscode/text/15/1692c",
  },
  {
    id: "call_frequency",
    topic: "Repeated calls",
    kind: "prohibited_practice",
    rule:
      "A collector is presumed to be harassing you if it calls more than seven times in seven days, or calls again within seven days after speaking with you about the debt.",
    citation: "Reg F 12 CFR 1006.14(b)(2)(i)",
    source_url: "https://www.ecfr.gov/current/title-12/chapter-X/part-1006/subpart-B/section-1006.14",
  },
  {
    id: "cease_communication",
    topic: "Right to stop contact",
    kind: "consumer_right",
    rule:
      "If you tell a collector in writing to stop contacting you, it must stop, except to confirm there will be no more contact or to tell you about a specific legal action.",
    citation: "FDCPA 15 U.S.C. 1692c(c)",
    source_url: "https://www.law.cornell.edu/uscode/text/15/1692c",
  },
  {
    id: "contact_at_work",
    topic: "Contact at your workplace",
    kind: "prohibited_practice",
    rule: "A collector may not contact you at work if it knows your employer does not allow such calls.",
    citation: "FDCPA 15 U.S.C. 1692c(a)(3)",
    source_url: "https://www.law.cornell.edu/uscode/text/15/1692c",
  },
  {
    id: "represented_by_attorney",
    topic: "If you have a lawyer",
    kind: "consumer_right",
    rule: "If a collector knows you are represented by a lawyer for this debt, it must contact your lawyer, not you.",
    citation: "FDCPA 15 U.S.C. 1692c(a)(2)",
    source_url: "https://www.law.cornell.edu/uscode/text/15/1692c",
  },
  {
    id: "harassment",
    topic: "Harassment or abuse",
    kind: "prohibited_practice",
    rule:
      "A collector may not harass, oppress, or abuse you, including threats of violence, obscene language, or repeated calls meant to annoy.",
    citation: "FDCPA 15 U.S.C. 1692d",
    source_url: "https://www.law.cornell.edu/uscode/text/15/1692d",
  },
  {
    id: "false_threats",
    topic: "False or deceptive threats",
    kind: "prohibited_practice",
    rule:
      "A collector may not use false or misleading statements. It may not falsely threaten arrest, falsely claim to be a lawyer or a government agency, or threaten an action it cannot legally take or does not intend to take.",
    citation: "FDCPA 15 U.S.C. 1692e",
    source_url: "https://www.law.cornell.edu/uscode/text/15/1692e",
  },
  {
    id: "unfair_practices",
    topic: "Unfair practices",
    kind: "prohibited_practice",
    rule:
      "A collector may not use unfair means to collect, such as adding amounts the contract or law does not allow, or threatening to deposit a postdated check early to pressure you.",
    citation: "FDCPA 15 U.S.C. 1692f",
    source_url: "https://www.law.cornell.edu/uscode/text/15/1692f",
  },
  {
    id: "identify_self",
    topic: "Who the collector is",
    kind: "required_disclosure",
    rule:
      "A collector must identify itself and tell you the communication is from a debt collector trying to collect a debt, and that any information will be used for that purpose.",
    citation: "FDCPA 15 U.S.C. 1692e(11)",
    source_url: "https://www.law.cornell.edu/uscode/text/15/1692e",
  },
  {
    id: "third_party_disclosure",
    topic: "Telling other people about your debt",
    kind: "prohibited_practice",
    rule:
      "A collector generally may not discuss your debt with other people such as family, friends, neighbors, or your employer. It may contact others only to find your address or phone number, and even then it may not say you owe a debt.",
    citation: "FDCPA 15 U.S.C. 1692c(b)",
    source_url: "https://www.law.cornell.edu/uscode/text/15/1692c",
  },
  {
    id: "time_barred_suit",
    topic: "Lawsuits on very old debt",
    kind: "prohibited_practice",
    rule:
      "A collector may not sue you, or threaten to sue you, on a time-barred debt, meaning a debt so old that the legal deadline to sue has already passed.",
    citation: "Reg F 12 CFR 1006.26(b)",
    source_url: "https://www.ecfr.gov/current/title-12/chapter-X/part-1006/subpart-B/section-1006.26",
  },
  {
    id: "validation_itemization",
    topic: "Itemizing what you owe",
    kind: "required_disclosure",
    rule:
      "The validation notice must itemize the debt, including an itemization date and a breakdown of how the current balance adds up from the original amount, interest, fees, payments, and credits.",
    citation: "Reg F 12 CFR 1006.34(c)",
    source_url: "https://www.ecfr.gov/current/title-12/chapter-X/part-1006/subpart-C/section-1006.34",
  },
  {
    id: "civil_liability",
    topic: "Your right to sue a collector",
    kind: "consumer_right",
    rule:
      "If a collector breaks these rules, you can sue it, generally within one year, for your actual losses plus statutory damages of up to 1,000 dollars, and the collector may also have to pay your attorney fees.",
    citation: "FDCPA 15 U.S.C. 1692k",
    source_url: "https://www.law.cornell.edu/uscode/text/15/1692k",
  },
  {
    id: "ecomm_optout",
    topic: "Stopping emails and texts",
    kind: "consumer_right",
    rule:
      "When a collector emails or texts you, it must give you a clear and simple way to opt out, and it must honor your request to stop contacting you that way.",
    citation: "Reg F 12 CFR 1006.6(e)",
    source_url: "https://www.ecfr.gov/current/title-12/chapter-X/part-1006/subpart-A/section-1006.6",
  },
  {
    id: "venue_rule",
    topic: "Where a collector may sue you",
    kind: "prohibited_practice",
    rule:
      "If a collector sues you, it must file only in the judicial district where you signed the original contract or where you live now. It cannot drag you into a faraway court to make it hard to defend yourself.",
    citation: "FDCPA 15 U.S.C. 1692i(a)(2)",
    source_url: "https://www.law.cornell.edu/uscode/text/15/1692i",
  },
  {
    id: "dispute_credit_reporting",
    topic: "Disputed debt must be reported as disputed",
    kind: "prohibited_practice",
    rule:
      "A collector may not report a debt it knows is disputed to a credit bureau without noting that you dispute it. Communicating false credit information about you is prohibited.",
    citation: "FDCPA 15 U.S.C. 1692e(8)",
    source_url: "https://www.law.cornell.edu/uscode/text/15/1692e",
  },
  {
    id: "no_collect_unauthorized_amounts",
    topic: "Only the amount actually allowed",
    kind: "prohibited_practice",
    rule:
      "A collector may not collect any interest, fee, or charge on top of the debt unless your original contract or a law specifically allows it. Made-up fees are an unfair practice.",
    citation: "FDCPA 15 U.S.C. 1692f(1)",
    source_url: "https://www.law.cornell.edu/uscode/text/15/1692f",
  },
];

const MEDICAL_CORPUS: Rule[] = [
  {
    id: "nsa_emergency",
    topic: "Surprise bills for emergency care",
    kind: "consumer_right",
    rule:
      "For emergency care you cannot be billed more than your in-network cost-sharing, even if the hospital or provider is out of network. Balance billing for emergency services is banned.",
    citation: "No Surprises Act, 42 U.S.C. 300gg-111",
    source_url: "https://www.cms.gov/newsroom/fact-sheets/no-surprises-understand-your-rights-against-surprise-medical-bills",
  },
  {
    id: "nsa_in_network_facility",
    topic: "Out-of-network providers at an in-network hospital",
    kind: "consumer_right",
    rule:
      "If you are treated at an in-network hospital or facility, out-of-network providers there, such as an anesthesiologist or radiologist, generally cannot bill you beyond your in-network cost-sharing.",
    citation: "No Surprises Act, 42 U.S.C. 300gg-111",
    source_url: "https://www.cms.gov/newsroom/fact-sheets/no-surprises-understand-your-rights-against-surprise-medical-bills",
  },
  {
    id: "nsa_air_ambulance",
    topic: "Air ambulance bills",
    kind: "consumer_right",
    rule:
      "An out-of-network air ambulance cannot bill you beyond your in-network cost-sharing. Note this protection does not cover ground ambulances.",
    citation: "No Surprises Act, 42 U.S.C. 300gg-112",
    source_url: "https://www.cms.gov/newsroom/fact-sheets/no-surprises-understand-your-rights-against-surprise-medical-bills",
  },
  {
    id: "aca_internal_appeal",
    topic: "Right to appeal a denial",
    kind: "timeline",
    rule:
      "If your health plan denies a claim, you have at least 180 days from the date of the denial notice to file an internal appeal with the insurer.",
    citation: "ACA appeal rights, 45 CFR 147.136",
    source_url: "https://www.healthcare.gov/appeal-insurance-company-decision/internal-appeals/",
  },
  {
    id: "aca_external_review",
    topic: "Independent external review",
    kind: "consumer_right",
    rule:
      "If the insurer still denies after your internal appeal, you can ask for an independent external review, generally within four months, and that decision is binding on the insurer.",
    citation: "ACA external review, 45 CFR 147.136",
    source_url: "https://www.healthcare.gov/appeal-insurance-company-decision/external-review/",
  },
  {
    id: "aca_notice_content",
    topic: "What a denial must tell you",
    kind: "required_disclosure",
    rule:
      "A denial notice must give the specific reason for the denial and describe how to appeal it, including your right to an external review.",
    citation: "ACA claims and appeals rule, 45 CFR 147.136(b)",
    source_url: "https://www.ecfr.gov/current/title-45/section-147.136",
  },
  {
    id: "nsa_good_faith_estimate",
    topic: "Good faith estimate before care",
    kind: "consumer_right",
    rule:
      "If you are uninsured or paying on your own, you have the right to a good faith estimate of what your scheduled care will cost before you receive it.",
    citation: "No Surprises Act, 45 CFR 149.610",
    source_url: "https://www.ecfr.gov/current/title-45/section-149.610",
  },
  {
    id: "nsa_dispute_resolution",
    topic: "Disputing a bill far above the estimate",
    kind: "consumer_right",
    rule:
      "If your final bill is at least 400 dollars more than your good faith estimate, you can challenge it through the patient-provider dispute resolution process.",
    citation: "No Surprises Act, 45 CFR 149.620",
    source_url: "https://www.ecfr.gov/current/title-45/section-149.620",
  },
  {
    id: "aca_expedited_appeal",
    topic: "Fast appeal for urgent care",
    kind: "timeline",
    rule:
      "If your care is urgent, you can ask for an expedited appeal, and the plan must decide as fast as your medical situation requires and no later than 72 hours.",
    citation: "ACA appeal rights, 45 CFR 147.136(b)(2)(ii)(B)",
    source_url: "https://www.ecfr.gov/current/title-45/section-147.136",
  },
  {
    id: "nsa_gfe_uninsured_statute",
    topic: "Good faith estimate for the uninsured or self-pay",
    kind: "required_disclosure",
    rule:
      "If you are uninsured, or insured but choosing to pay yourself, the provider must give you a written good faith estimate of expected charges for scheduled care before you receive it.",
    citation: "No Surprises Act, 45 CFR 149.610",
    source_url: "https://www.ecfr.gov/current/title-45/section-149.610",
  },
  {
    id: "nsa_ppdr_400_threshold",
    topic: "Dispute a bill $400 or more over the estimate",
    kind: "consumer_right",
    rule:
      "If you are uninsured or self-pay and your final bill is at least 400 dollars more than the good faith estimate, you can use patient-provider dispute resolution to have a neutral third party review the charge.",
    citation: "No Surprises Act, 45 CFR 149.620(b)",
    source_url: "https://www.ecfr.gov/current/title-45/section-149.620",
  },
  {
    id: "fdcpa_medical_debt_covered",
    topic: "Debt collectors must follow the law on medical debt",
    kind: "consumer_right",
    rule:
      "Medical debt is a consumer debt, so a third-party collector chasing a medical bill must follow the Fair Debt Collection Practices Act, including the written validation notice and your 30-day right to dispute.",
    citation: "FDCPA 15 U.S.C. 1692a(5)",
    source_url: "https://www.law.cornell.edu/uscode/text/15/1692a",
  },
  {
    id: "fcra_medical_info_limit",
    topic: "Limits on medical information in credit decisions",
    kind: "consumer_right",
    rule:
      "Under the Fair Credit Reporting Act, a creditor generally may not use your medical information to decide whether to give you credit, and a credit report may show medical debts only in a coded form that does not reveal the provider or type of care.",
    citation: "FCRA 15 U.S.C. 1681b(g)",
    source_url: "https://www.law.cornell.edu/uscode/text/15/1681b",
  },
];

const HOUSING_CORPUS: Rule[] = [
  {
    id: "tx_notice_to_vacate",
    topic: "Texas: notice to vacate",
    kind: "timeline",
    rule:
      "In Texas, before filing an eviction suit a landlord must give at least 3 days written notice to vacate, unless your written lease sets a different period.",
    citation: "Tex. Prop. Code Sec. 24.005(a)",
    source_url: "https://statutes.capitol.texas.gov/Docs/PR/htm/PR.24.htm",
  },
  {
    id: "ca_pay_or_quit",
    topic: "California: 3-day notice to pay or quit",
    kind: "timeline",
    rule:
      "In California, a 3-day notice to pay rent or quit now excludes Saturdays, Sundays, and judicial holidays, so you effectively get 3 business days to pay before the landlord can move to evict.",
    citation: "Cal. Code Civ. Proc. Sec. 1161(2)",
    source_url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=1161",
  },
  {
    id: "ma_notice_to_quit",
    topic: "Massachusetts: 14-day notice to quit",
    kind: "timeline",
    rule:
      "In Massachusetts, a landlord must give 14 days written notice to quit before evicting you for nonpayment of rent, and you may be able to stop the eviction by paying what you owe.",
    citation: "M.G.L. c. 186, Secs. 11 and 12",
    source_url: "https://malegislature.gov/Laws/GeneralLaws/PartII/TitleI/Chapter186/Section11",
  },
  {
    id: "wa_pay_or_vacate",
    topic: "Washington: 14-day pay-or-vacate",
    kind: "timeline",
    rule:
      "In Washington, if you rent a home and fall behind on rent, the landlord must give you 14 days written notice to pay or vacate before starting an eviction.",
    citation: "RCW 59.12.030(3)",
    source_url: "https://app.leg.wa.gov/rcw/default.aspx?cite=59.12.030",
  },
  {
    id: "cares_30_day_notice",
    topic: "Federal: 30-day notice for covered dwellings",
    kind: "timeline",
    rule:
      "If you live in a federally backed or federally assisted rental, the landlord must give you a 30-day notice to vacate before requiring you to leave.",
    citation: "CARES Act Sec. 4024(c), 15 U.S.C. 9058(c)",
    source_url: "https://www.law.cornell.edu/uscode/text/15/9058",
  },
  {
    id: "no_federal_right_to_counsel",
    topic: "No federal right to a free lawyer in eviction",
    kind: "consumer_right",
    rule:
      "There is no federal right to a free, court-appointed lawyer in an eviction case, because that protection generally applies only when your physical liberty is at stake. Some states and cities have created a right to counsel by their own law.",
    citation: "Lassiter v. Department of Social Services, 452 U.S. 18 (1981)",
    source_url: "https://www.law.cornell.edu/supremecourt/text/452/18",
  },
  {
    id: "ny_rent_demand",
    topic: "New York: 14-day rent demand",
    kind: "timeline",
    rule:
      "In New York, before a nonpayment eviction the landlord must serve a written 14-day rent demand listing the months and amounts owed. The old 3-day notice is no longer allowed.",
    citation: "N.Y. RPAPL Sec. 711(2)",
    source_url: "https://www.nysenate.gov/legislation/laws/RPA/711",
  },
  {
    id: "il_rent_demand",
    topic: "Illinois: 5-day notice for unpaid rent",
    kind: "timeline",
    rule:
      "In Illinois, for unpaid rent the landlord must give a written demand allowing at least 5 days to pay. Paying the full amount due within those 5 days defeats the eviction.",
    citation: "735 ILCS 5/9-209",
    source_url: "https://www.ilga.gov/documents/legislation/ilcs/documents/073500050K9-209.htm",
  },
  {
    id: "fl_three_day_notice",
    topic: "Florida: 3-day notice to pay rent",
    kind: "timeline",
    rule:
      "In Florida, for unpaid rent the landlord must give a written 3-day notice to pay or leave, excluding Saturdays, Sundays, and legal holidays, so you get 3 business days.",
    citation: "Fla. Stat. Sec. 83.56(3)",
    source_url: "https://www.flsenate.gov/Laws/Statutes/2023/83.56",
  },
  {
    id: "ga_notice_to_vacate_or_pay",
    topic: "Georgia: 3-business-day notice to vacate or pay",
    kind: "timeline",
    rule:
      "In Georgia, under the 2024 Safe at Home Act, before filing a dispossessory for unpaid rent the landlord must give a written notice to vacate or pay within at least 3 business days. Applies to leases entered or renewed on or after July 1, 2024.",
    citation: "O.C.G.A. Sec. 44-7-50(a) (2024 HB 404)",
    source_url: "https://www.legis.ga.gov/api/legislation/document/20232024/214640",
  },
  {
    id: "pa_ten_day_notice",
    topic: "Pennsylvania: 10-day notice to quit for nonpayment",
    kind: "timeline",
    rule:
      "In Pennsylvania, for unpaid rent the landlord must give a written 10-day notice to quit before filing, unless a written lease validly shortens or waives it.",
    citation: "Landlord and Tenant Act of 1951, 68 P.S. Sec. 250.501(b)",
    source_url: "https://www.legis.state.pa.us/cfdocs/legis/LI/uconsCheck.cfm?txtType=HTM&yr=1951&sessInd=0&smthLwInd=0&act=20&chpt=5&sctn=1&subsctn=0",
  },
  {
    id: "oh_three_day_notice",
    topic: "Ohio: 3-day notice to leave the premises",
    kind: "timeline",
    rule:
      "In Ohio, the landlord must give a written 3-day notice to leave the premises before filing, and for a home it must include the specific tenant-rights language the statute requires.",
    citation: "Ohio Rev. Code Sec. 1923.04(A)",
    source_url: "https://codes.ohio.gov/ohio-revised-code/section-1923.04",
  },
  {
    id: "az_five_day_notice",
    topic: "Arizona: 5-day notice for unpaid rent",
    kind: "timeline",
    rule:
      "In Arizona, for unpaid rent the landlord must give a written 5-day notice. If you pay all past-due rent and any reasonable late fee before the landlord files, the lease is reinstated.",
    citation: "Ariz. Rev. Stat. Sec. 33-1368(B)",
    source_url: "https://www.azleg.gov/ars/33/01368.htm",
  },
  {
    id: "co_ten_day_demand",
    topic: "Colorado: 10-day demand for rent or possession",
    kind: "timeline",
    rule:
      "In Colorado, for unpaid rent the landlord must serve a written 10-day notice demanding the rent or the property before filing. Paying within the period stops the eviction.",
    citation: "Colo. Rev. Stat. Sec. 13-40-104(1)(d)",
    source_url: "https://colorado.public.law/statutes/crs_13-40-104",
  },
  {
    id: "self_help_eviction_banned",
    topic: "Self-help eviction is illegal",
    kind: "prohibited_practice",
    rule:
      "In nearly every state a landlord cannot force you out on their own. Changing the locks, shutting off utilities, removing your belongings, or otherwise making you leave without a court order is an illegal self-help eviction. Only a court can order it and only a sheriff, marshal, or constable can carry it out.",
    citation: "State anti-self-help statutes (e.g., Cal. Civ. Code 789.3; Tex. Prop. Code 92.008)",
    source_url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=789.3",
  },
  {
    id: "tx_utility_shutoff_penalty",
    topic: "Texas: penalty for shutting off utilities",
    kind: "prohibited_practice",
    rule:
      "In Texas a landlord generally may not cut off your water, gas, or electricity except for repairs or an emergency. If they do, you can recover actual damages plus one month's rent plus 1,000 dollars, attorney fees, and either get the home back or end the lease.",
    citation: "Tex. Prop. Code Sec. 92.008",
    source_url: "https://statutes.capitol.texas.gov/Docs/PR/htm/PR.92.htm",
  },
  {
    id: "retaliation_ban",
    topic: "Retaliation for asserting your rights is banned",
    kind: "consumer_right",
    rule:
      "Most states forbid a landlord from evicting you, raising rent, or cutting services to punish you for something legal, like asking for repairs or reporting a code violation. If an eviction closely follows such an act, many states presume it is retaliation.",
    citation: "State anti-retaliation statutes (e.g., Cal. Civ. Code 1942.5)",
    source_url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=1942.5",
  },
  {
    id: "warranty_of_habitability_defense",
    topic: "Warranty of habitability as a defense",
    kind: "consumer_right",
    rule:
      "Nearly every state reads an implied warranty of habitability into a residential lease: the landlord must keep the home safe and livable, and this duty cannot be waived. If serious problems went unfixed, you may be able to raise it as a defense to a nonpayment eviction.",
    citation: "Implied warranty of habitability (common law and state statutes)",
    source_url: "https://www.law.cornell.edu/wex/implied_warranty_of_habitability",
  },
  {
    id: "security_deposit_deadline",
    topic: "Deadline to return your security deposit",
    kind: "timeline",
    rule:
      "After you move out, your landlord must return your deposit, or send an itemized list of what was kept, within a state deadline. Common deadlines are 14 days (New York), 21 days (California), and 30 days (Texas and Florida). Missing it can cost the landlord the right to keep any of it.",
    citation: "State deposit statutes (e.g., N.Y. GOL 7-108; Cal. Civ. Code 1950.5; Tex. Prop. Code 92.103)",
    source_url: "https://www.nysenate.gov/legislation/laws/GOB/7-108",
  },
];

const BENEFITS_CORPUS: Rule[] = [
  {
    id: "snap_fair_hearing",
    topic: "SNAP: right to a fair hearing",
    kind: "consumer_right",
    rule:
      "If your SNAP (food stamp) benefits are denied, reduced, or stopped, you have the right to ask for a fair hearing to challenge the decision.",
    citation: "SNAP fair hearings, 7 CFR 273.15(a)",
    source_url: "https://www.law.cornell.edu/cfr/text/7/273.15",
  },
  {
    id: "snap_hearing_deadline",
    topic: "SNAP: 90 days to request a hearing",
    kind: "timeline",
    rule:
      "You generally have 90 days from the date of the notice to ask for a SNAP fair hearing.",
    citation: "SNAP fair hearings, 7 CFR 273.15(g)",
    source_url: "https://www.law.cornell.edu/cfr/text/7/273.15",
  },
  {
    id: "snap_continued_benefits",
    topic: "SNAP: benefits continue if you appeal in time",
    kind: "consumer_right",
    rule:
      "If you request a hearing before the change takes effect and your certification period has not ended, your SNAP benefits continue at the current level until the hearing decision, unless you ask to stop them.",
    citation: "SNAP fair hearings, 7 CFR 273.15(k)",
    source_url: "https://www.law.cornell.edu/cfr/text/7/273.15",
  },
  {
    id: "snap_notice_content",
    topic: "SNAP: what your notice must say",
    kind: "required_disclosure",
    rule:
      "A SNAP notice of adverse action must explain what the agency is doing, the reason for it, and your right to request a fair hearing.",
    citation: "SNAP notice of adverse action, 7 CFR 273.13(a)(2)",
    source_url: "https://www.law.cornell.edu/cfr/text/7/273.13",
  },
  {
    id: "medicaid_fair_hearing",
    topic: "Medicaid: right to a fair hearing",
    kind: "consumer_right",
    rule:
      "If Medicaid is denied, reduced, or terminated, you have the right to ask the state for a fair hearing.",
    citation: "Medicaid fair hearings, 42 CFR 431.220(a)(1)",
    source_url: "https://www.law.cornell.edu/cfr/text/42/431.220",
  },
  {
    id: "medicaid_hearing_deadline",
    topic: "Medicaid: time to request a hearing",
    kind: "timeline",
    rule:
      "For Medicaid, the state must give you a reasonable time to ask for a hearing, and by federal rule that time cannot be more than 90 days from the date your notice was mailed.",
    citation: "Medicaid request for hearing, 42 CFR 431.221(d)",
    source_url: "https://www.law.cornell.edu/cfr/text/42/431.221",
  },
  {
    id: "medicaid_notice_content",
    topic: "Medicaid: what your notice must say",
    kind: "required_disclosure",
    rule:
      "A Medicaid notice must state the action and its date, the specific reason, the rule that supports it, and your right to a hearing.",
    citation: "Medicaid content of notice, 42 CFR 431.210",
    source_url: "https://www.law.cornell.edu/cfr/text/42/431.210",
  },
  {
    id: "medicaid_continued_benefits",
    topic: "Medicaid: services continue if you appeal in time",
    kind: "consumer_right",
    rule:
      "If you ask for a Medicaid hearing before the change takes effect, the state must keep your services going until the hearing decision is made.",
    citation: "Medicaid maintaining services, 42 CFR 431.230(a)",
    source_url: "https://www.law.cornell.edu/cfr/text/42/431.230",
  },
  {
    id: "unemployment_fair_hearing",
    topic: "Unemployment: right to appeal a denial",
    kind: "consumer_right",
    rule:
      "If your unemployment claim is denied, federal law guarantees you an opportunity for a fair hearing before an impartial tribunal. The hearing runs under your state's unemployment law.",
    citation: "Social Security Act, 42 U.S.C. 503(a)(3)",
    source_url: "https://www.law.cornell.edu/uscode/text/42/503",
  },
  {
    id: "unemployment_appeal_deadline_state",
    topic: "Unemployment: a short, state-set appeal deadline",
    kind: "timeline",
    rule:
      "The deadline to appeal an unemployment decision is set by your state and is usually short, often about 10 to 30 days from the date on the determination. File before it passes; a late appeal can be rejected.",
    citation: "Social Security Act, 42 U.S.C. 503(a)(3)",
    source_url: "https://www.law.cornell.edu/uscode/text/42/503",
  },
  {
    id: "tanf_fair_hearing",
    topic: "TANF / cash assistance: right to a fair hearing",
    kind: "consumer_right",
    rule:
      "If your TANF cash assistance is denied, reduced, or stopped, you have the right to a fair hearing before an impartial official, with a chance to present your case and see the evidence against you.",
    citation: "Public assistance hearings, 45 CFR 205.10(a)",
    source_url: "https://www.law.cornell.edu/cfr/text/45/205.10",
  },
  {
    id: "tanf_aid_paid_pending",
    topic: "TANF: keep assistance if you appeal in time",
    kind: "consumer_right",
    rule:
      "If you request a TANF hearing within the timely-notice period, your assistance may not be suspended, reduced, or stopped until a decision is made after the hearing.",
    citation: "Public assistance hearings, 45 CFR 205.10(a)(6)",
    source_url: "https://www.law.cornell.edu/cfr/text/45/205.10",
  },
];

// DEBT: lawsuit / summons. A summons and complaint means a real lawsuit, with a
// hard answer deadline. Paired with FDCPA_CORPUS in corpusFor so the model keeps
// the underlying collector rules.
const LAWSUIT_CORPUS: Rule[] = [
  {
    id: "summons_must_respond",
    topic: "You must answer a summons by the deadline",
    kind: "timeline",
    rule:
      "A summons and complaint means you are being sued. You usually have about 20 to 30 days from being served to file a written Answer with the court; the exact number is set by your state. Filing an Answer does not admit you owe anything; it forces the collector to prove the debt.",
    citation: "CFPB, What should I do if I am sued by a debt collector",
    source_url: "https://www.consumerfinance.gov/ask-cfpb/what-should-i-do-if-im-sued-by-a-debt-collector-or-creditor-en-334/",
  },
  {
    id: "lawsuit_venue",
    topic: "The suit must be filed in the right place",
    kind: "consumer_right",
    rule:
      "A debt collector must sue you only where you signed the original contract or where you live now. Being sued somewhere far away with no connection to you may itself break the law.",
    citation: "FDCPA 15 U.S.C. 1692i(a)(2)",
    source_url: "https://www.law.cornell.edu/uscode/text/15/1692i",
  },
  {
    id: "lawsuit_make_them_prove",
    topic: "The collector has to prove the debt",
    kind: "consumer_right",
    rule:
      "When you respond, the collector must prove the debt is valid, the amount is right, and it has the legal right to collect. Many collectors cannot produce these records.",
    citation: "CFPB, What should I do if I am sued by a debt collector",
    source_url: "https://www.consumerfinance.gov/ask-cfpb/what-should-i-do-if-im-sued-by-a-debt-collector-or-creditor-en-334/",
  },
];

// DEBT: default judgment. A judgment is the court ruling that unlocks garnishment
// and levy. Paired with GARNISHMENT_CORPUS in corpusFor.
const JUDGMENT_CORPUS: Rule[] = [
  {
    id: "default_judgment_meaning",
    topic: "What a default judgment is",
    kind: "consumer_right",
    rule:
      "A default judgment is a court ruling against you entered because you did not respond to a lawsuit in time. It can be used to garnish your wages or freeze your bank account.",
    citation: "CFPB, What is a default judgment",
    source_url: "https://www.consumerfinance.gov/ask-cfpb/what-is-a-default-judgment-en-1457/",
  },
  {
    id: "vacate_default_judgment",
    topic: "You may be able to undo a default judgment",
    kind: "consumer_right",
    rule:
      "If a default judgment was entered against you, you may be able to ask the court to set it aside (vacate it), especially if you were never properly served. The deadline to ask is short and set by your state, so act fast.",
    citation: "CFPB, What is a default judgment",
    source_url: "https://www.consumerfinance.gov/ask-cfpb/what-is-a-default-judgment-en-1457/",
  },
  {
    id: "judgment_exemptions",
    topic: "Some money is protected even after a judgment",
    kind: "consumer_right",
    rule:
      "Even with a judgment against you, state law protects (exempts) some of your wages and property from collection, and the amounts vary by state. You usually must claim these exemptions yourself.",
    citation: "CFPB, Can a debt collector garnish my wages or benefits",
    source_url: "https://www.consumerfinance.gov/ask-cfpb/can-a-debt-collector-take-or-garnish-my-wages-or-benefits-en-1439/",
  },
];

// DEBT: wage garnishment. Federal caps plus the no-firing and benefits-exempt
// protections. Paired with JUDGMENT_CORPUS in corpusFor.
const GARNISHMENT_CORPUS: Rule[] = [
  {
    id: "garnish_needs_judgment",
    topic: "Garnishment usually needs a court judgment first",
    kind: "consumer_right",
    rule:
      "For most ordinary debts a creditor can only garnish your wages after it sued you and won a judgment. A few debts (federal student loans, taxes, child support) can be collected without going to court first.",
    citation: "CFPB, Can a debt collector garnish my wages or benefits",
    source_url: "https://www.consumerfinance.gov/ask-cfpb/can-a-debt-collector-take-or-garnish-my-wages-or-benefits-en-1439/",
  },
  {
    id: "garnish_federal_cap",
    topic: "Federal cap on how much of your pay can be taken",
    kind: "consumer_right",
    rule:
      "Federal law limits ordinary wage garnishment to the lesser of 25 percent of your disposable (after-tax) weekly earnings, or the amount by which your weekly disposable earnings exceed 30 times the federal minimum wage. Your state may protect even more.",
    citation: "Consumer Credit Protection Act, 15 U.S.C. 1673(a)",
    source_url: "https://www.law.cornell.edu/uscode/text/15/1673",
  },
  {
    id: "garnish_no_firing",
    topic: "You cannot be fired for one garnishment",
    kind: "consumer_right",
    rule:
      "Federal law forbids your employer from firing you because your wages are garnished for any one debt. This protection covers a single debt; multiple garnishments may not be protected.",
    citation: "Consumer Credit Protection Act, 15 U.S.C. 1674(a)",
    source_url: "https://www.law.cornell.edu/uscode/text/15/1674",
  },
  {
    id: "garnish_benefits_exempt",
    topic: "Social Security and many benefits are protected",
    kind: "consumer_right",
    rule:
      "Social Security, SSI, and most federal benefits generally cannot be garnished for ordinary private debts, and they keep that protection when directly deposited into your bank. State exemptions vary.",
    citation: "42 U.S.C. 407(a)",
    source_url: "https://www.law.cornell.edu/uscode/text/42/407",
  },
];

// DEBT: bank levy. The account-freeze cousin of garnishment, with the Treasury
// auto-protection for deposited federal benefits. Paired with GARNISHMENT_CORPUS.
const LEVY_CORPUS: Rule[] = [
  {
    id: "levy_needs_judgment",
    topic: "A bank levy usually follows a judgment",
    kind: "consumer_right",
    rule:
      "A bank levy lets a creditor freeze and take money from your account, but for most debts the creditor needs a court judgment first. The freeze can happen without advance warning.",
    citation: "CFPB, Can a debt collector garnish my wages or benefits",
    source_url: "https://www.consumerfinance.gov/ask-cfpb/can-a-debt-collector-take-or-garnish-my-wages-or-benefits-en-1439/",
  },
  {
    id: "levy_federal_benefit_protection",
    topic: "Banks must protect deposited federal benefits",
    kind: "required_disclosure",
    rule:
      "If Social Security, SSI, or VA benefits are directly deposited, your bank must automatically protect up to two months of those benefits from being frozen by a garnishment or levy. Money above that may still be frozen.",
    citation: "Treasury garnishment rule, 31 CFR Part 212",
    source_url: "https://www.ecfr.gov/current/title-31/subtitle-B/chapter-II/subchapter-A/part-212",
  },
  {
    id: "levy_claim_exemptions",
    topic: "You can claim exempt funds back",
    kind: "consumer_right",
    rule:
      "If protected or exempt money was frozen, you can file a claim of exemption with the court to get it released. Deadlines are short and set by your state, so act quickly.",
    citation: "CFPB, Can a debt collector garnish my wages or benefits",
    source_url: "https://www.consumerfinance.gov/ask-cfpb/can-a-debt-collector-take-or-garnish-my-wages-or-benefits-en-1439/",
  },
];

// DEBT: time-barred (zombie) debt. Old debt past the statute of limitations
// cannot be sued on, and a small payment can dangerously restart the clock.
// Paired with FDCPA_CORPUS in corpusFor.
const TIMEBARRED_CORPUS: Rule[] = [
  {
    id: "timebarred_no_suit",
    topic: "Very old debt cannot be sued on",
    kind: "prohibited_practice",
    rule:
      "If a debt is so old that your state's statute of limitations has passed, a collector may not sue you or threaten to sue you over it.",
    citation: "Reg F 12 CFR 1006.26(b)",
    source_url: "https://www.ecfr.gov/current/title-12/chapter-X/part-1006/subpart-B/section-1006.26",
  },
  {
    id: "timebarred_restart_warning",
    topic: "A small payment can restart the clock",
    kind: "consumer_right",
    rule:
      "In many states, making a payment or admitting in writing that the debt is yours can restart the statute of limitations and make an old debt suable again. Be careful before you pay or sign anything on a very old debt.",
    citation: "CFPB, Can debt collectors collect a debt that is several years old",
    source_url: "https://www.consumerfinance.gov/ask-cfpb/can-debt-collectors-collect-a-debt-thats-several-years-old-en-1423/",
  },
];

// DEBT: credit-repair / debt-settlement solicitation. CROA bans up-front fees and
// gives a three-day cancel right; you can dispute credit errors yourself for free.
// Paired with FDCPA_CORPUS in corpusFor.
const SETTLEMENT_REPAIR_CORPUS: Rule[] = [
  {
    id: "croa_no_advance_fee",
    topic: "Credit-repair firms cannot charge up front",
    kind: "prohibited_practice",
    rule:
      "A credit-repair company may not charge or take any money before it has fully performed the promised service. A demand for payment up front is a red flag and is against federal law.",
    citation: "Credit Repair Organizations Act, 15 U.S.C. 1679b(b)",
    source_url: "https://www.law.cornell.edu/uscode/text/15/1679b",
  },
  {
    id: "croa_3day_cancel",
    topic: "Three-day right to cancel credit repair",
    kind: "consumer_right",
    rule:
      "You can cancel a credit-repair contract for any reason, with no penalty, any time before midnight of the third business day after you sign it. The contract must tell you this in writing.",
    citation: "Credit Repair Organizations Act, 15 U.S.C. 1679e(a)",
    source_url: "https://www.law.cornell.edu/uscode/text/15/1679e",
  },
  {
    id: "repair_diy_free",
    topic: "You can dispute credit errors yourself for free",
    kind: "consumer_right",
    rule:
      "You have the right to dispute mistakes on your credit report yourself, for free. You do not need to pay a credit-repair company to do what you can do at no cost.",
    citation: "CFPB, Should I enroll in a credit-repair program",
    source_url: "https://www.consumerfinance.gov/ask-cfpb/a-credit-repair-firm-sent-me-an-offer-outlining-their-credit-repair-program-should-i-enroll-en-327/",
  },
];

const TAX_CORPUS: Rule[] = [
  {
    id: "irs_cdp_levy_hearing",
    topic: "Collection Due Process hearing (levy)",
    kind: "consumer_right",
    rule:
      "Before the IRS takes your property by levy, it must send you written notice of your right to a Collection Due Process hearing, an impartial review of the proposed levy by the IRS Independent Office of Appeals where you can raise issues like collection alternatives or whether you owe the tax.",
    citation: "26 U.S.C. 6330",
    source_url: "https://www.law.cornell.edu/uscode/text/26/6330",
  },
  {
    id: "irs_cdp_levy_30_day_deadline",
    topic: "30-day deadline to request CDP hearing (levy)",
    kind: "timeline",
    rule:
      "You have a 30-day period, beginning with the levy notice, to request a Collection Due Process hearing; the notice must be given at least 30 days before the first levy. After a hearing determination, you have another 30 days to petition the Tax Court for review.",
    citation: "26 U.S.C. 6330",
    source_url: "https://www.law.cornell.edu/uscode/text/26/6330",
  },
  {
    id: "irs_cdp_lien_30_day_deadline",
    topic: "30-day deadline to request CDP hearing (lien)",
    kind: "timeline",
    rule:
      "After the IRS files a Notice of Federal Tax Lien (a public claim against your property for unpaid tax), it must notify you within 5 business days, and you have a 30-day period beginning the day after that 5-day window to request a Collection Due Process hearing about the lien.",
    citation: "26 U.S.C. 6320",
    source_url: "https://www.law.cornell.edu/uscode/text/26/6320",
  },
  {
    id: "irs_installment_agreement",
    topic: "Installment agreement",
    kind: "consumer_right",
    rule:
      "The IRS is authorized to enter into a written installment agreement letting you pay your tax liability over time in installments if it determines the agreement will facilitate full or partial collection of what you owe.",
    citation: "26 U.S.C. 6159",
    source_url: "https://www.law.cornell.edu/uscode/text/26/6159",
  },
  {
    id: "irs_offer_in_compromise",
    topic: "Offer in compromise",
    kind: "consumer_right",
    rule:
      "The IRS may compromise (settle) your tax liability for less than the full amount through an offer in compromise; if your offer is rejected you are entitled to an administrative review and may appeal the rejection to the IRS Independent Office of Appeals.",
    citation: "26 U.S.C. 7122",
    source_url: "https://www.law.cornell.edu/uscode/text/26/7122",
  },
  {
    id: "irs_taxpayer_bill_of_rights",
    topic: "Taxpayer Bill of Rights",
    kind: "consumer_right",
    rule:
      "You hold ten fundamental rights that IRS employees must act in accord with, including the right to be informed, to quality service, to challenge the IRS's position and be heard, to appeal in an independent forum, to finality, to privacy, to confidentiality, and to retain representation.",
    citation: "26 U.S.C. 7803(a)(3)",
    source_url: "https://www.law.cornell.edu/uscode/text/26/7803",
  },
  {
    id: "irs_10_year_collection_limit",
    topic: "10-year collection statute of limitations",
    kind: "timeline",
    rule:
      "The IRS generally has 10 years from the date a tax is assessed to collect it by levy or court proceeding; this period can be extended only in limited situations, such as a written agreement you sign or a pending installment agreement.",
    citation: "26 U.S.C. 6502",
    source_url: "https://www.law.cornell.edu/uscode/text/26/6502",
  },
  {
    id: "irs_innocent_spouse_relief",
    topic: "Innocent spouse relief",
    kind: "consumer_right",
    rule:
      "If you filed a joint return, you may elect innocent spouse relief from joint and several liability for an understatement of tax you did not know about; for the basic and separate-liability elections, you generally must request relief no later than 2 years after the IRS begins collection activity against you.",
    citation: "26 U.S.C. 6015",
    source_url: "https://www.law.cornell.edu/uscode/text/26/6015",
  },
  {
    id: "irs_cp2000_dispute_proposed_change",
    topic: "Dispute a CP2000 proposed change",
    kind: "consumer_right",
    rule:
      "A CP2000 notice is a proposal to change your tax (because income reported to the IRS by third parties does not match your return), not a final bill. You have the right to disagree, and should respond by the date on the notice (generally within 30 days, or 60 days if you live outside the U.S.) stating whether you agree or disagree and including supporting documents.",
    citation: "IRS, Understanding Your CP2000 Series Notice",
    source_url: "https://www.irs.gov/individuals/understanding-your-cp2000-series-notice",
  },
  {
    id: "irs_tax_court_petition_90_days",
    topic: "Petition the Tax Court after a deficiency notice",
    kind: "timeline",
    rule:
      "If the IRS mails you a statutory notice of deficiency (a formal letter proposing additional tax, sometimes called a 90-day letter), you have 90 days (150 days if the notice is addressed to you outside the United States) to file a petition with the U.S. Tax Court. During that period and until the Tax Court decides, the IRS generally cannot assess the deficiency or levy to collect it.",
    citation: "26 U.S.C. § 6213(a)",
    source_url: "https://www.law.cornell.edu/uscode/text/26/6213",
  },
  {
    id: "irs_currently_not_collectible_hardship",
    topic: "Currently not collectible (hardship) status",
    kind: "consumer_right",
    rule:
      "If paying your tax debt would cause financial hardship, you can ask the IRS to place your account in Currently Not Collectible (CNC) status, which temporarily suspends most collection activity until your finances improve. The debt is not forgiven, penalties and interest keep accruing, and the IRS may still file a tax lien or keep your refunds.",
    citation: "IRS, Temporarily Delay the Collection Process",
    source_url: "https://www.irs.gov/businesses/small-businesses-self-employed/temporarily-delay-the-collection-process",
  },
  {
    id: "irs_first_time_penalty_abatement",
    topic: "First Time Abate penalty relief",
    kind: "consumer_right",
    rule:
      "You may qualify for First Time Abate relief from failure-to-file, failure-to-pay, or failure-to-deposit penalties if you have a clean history: you filed (or filed an extension for) all currently required returns, and you did not receive penalties for the prior three tax years. You can request it even if you have not yet fully paid the underlying tax.",
    citation: "IRS, Penalty Relief Due to First Time Abate or Other Administrative Waiver",
    source_url: "https://www.irs.gov/payments/penalty-relief-due-to-first-time-abate-or-other-administrative-waiver",
  },
  {
    id: "irs_reasonable_cause_penalty_relief",
    topic: "Reasonable cause penalty relief",
    kind: "consumer_right",
    rule:
      "The failure-to-file and failure-to-pay penalties do not apply if you can show that the failure was due to reasonable cause and not due to willful neglect (for example, circumstances beyond your control despite ordinary business care). You can request this relief by explaining your situation to the IRS.",
    citation: "26 U.S.C. § 6651(a)",
    source_url: "https://www.law.cornell.edu/uscode/text/26/6651",
  },
  {
    id: "irs_refund_claim_3_year_deadline",
    topic: "Deadline to claim a tax refund",
    kind: "timeline",
    rule:
      "To get a refund or credit of overpaid tax, you must file your claim (usually a return or amended return) within 3 years from the time the original return was filed or 2 years from the time the tax was paid, whichever period is later. If you miss this deadline, the refund is generally lost.",
    citation: "26 U.S.C. § 6511(a)",
    source_url: "https://www.law.cornell.edu/uscode/text/26/6511",
  },
];

const STUDENT_LOAN_CORPUS: Rule[] = [
  {
    id: "sl_idr_payment_cap",
    topic: "Income-driven repayment",
    kind: "consumer_right",
    rule:
      "On a federal Direct Loan income-driven repayment plan, your required monthly payment is calculated as a set percentage of your discretionary income (the amount your income exceeds a poverty-line threshold), so your payment can be far lower than the standard 10-year amount and can be $0 if your income is low enough.",
    citation: "34 CFR 685.209",
    source_url: "https://www.law.cornell.edu/cfr/text/34/685.209",
  },
  {
    id: "sl_borrower_defense_school_misconduct",
    topic: "Borrower defense to repayment",
    kind: "consumer_right",
    rule:
      "You may assert a borrower defense to seek discharge of a federal Direct Loan if your school engaged in misconduct (such as a misrepresentation of material fact about the program) related to the loan or the educational services it paid for; the available grounds depend on when your loan was first disbursed.",
    citation: "34 CFR 685.206",
    source_url: "https://www.law.cornell.edu/cfr/text/34/685.206",
  },
  {
    id: "sl_borrower_defense_forbearance",
    topic: "Borrower defense pending review",
    kind: "consumer_right",
    rule:
      "When you submit a borrower defense application and are current on your loan, the Department places your loan in forbearance while it reviews your application, and you must be told you can decline that forbearance and keep making payments; you only need to prove your defense by a preponderance of the evidence (more likely than not).",
    citation: "34 CFR 685.222",
    source_url: "https://www.law.cornell.edu/cfr/text/34/685.222",
  },
  {
    id: "sl_closed_school_discharge",
    topic: "Closed school discharge",
    kind: "consumer_right",
    rule:
      "If your school closed while you were enrolled or within 180 days after you withdrew, you may qualify to have your federal Direct Loan discharged; if the Department determines from its records that you qualify and you did not finish the program elsewhere, the discharge can happen automatically one year after the closure date.",
    citation: "34 CFR 685.214",
    source_url: "https://www.law.cornell.edu/cfr/text/34/685.214",
  },
  {
    id: "sl_tpd_discharge_reinstatement",
    topic: "Total and permanent disability discharge",
    kind: "consumer_right",
    rule:
      "If you are totally and permanently disabled, you may have your federal Direct Loan discharged after submitting qualifying medical or Social Security Administration documentation; be aware that if you take out a new Direct Loan or TEACH Grant within 3 years of the discharge, the discharged obligation can be reinstated.",
    citation: "34 CFR 685.213",
    source_url: "https://www.law.cornell.edu/cfr/text/34/685.213",
  },
  {
    id: "sl_loan_rehabilitation",
    topic: "Default rehabilitation",
    kind: "consumer_right",
    rule:
      "You can rehabilitate a defaulted federal Direct Loan by making 9 voluntary, reasonable and affordable monthly payments (each within 20 days of the due date) over 10 consecutive months, after which the Department instructs credit reporting agencies to remove the default from your credit history; a given loan can generally be rehabilitated this way only once.",
    citation: "34 CFR 685.211(f)",
    source_url: "https://www.law.cornell.edu/cfr/text/34/685.211",
  },
  {
    id: "sl_garnishment_15_percent_cap",
    topic: "Administrative wage garnishment",
    kind: "consumer_right",
    rule:
      "For a defaulted federal student loan, the amount garnished from your wages in any pay period cannot exceed 15 percent of your disposable pay unless you give written consent to more, and you must receive written notice mailed to your last known address at least 30 days before garnishment proceedings begin.",
    citation: "20 U.S.C. 1095a(a)",
    source_url: "https://www.law.cornell.edu/uscode/text/20/1095a",
  },
  {
    id: "sl_pslf_120_payments_forgiveness",
    topic: "Public Service Loan Forgiveness",
    kind: "consumer_right",
    rule:
      "If you make 120 separate qualifying monthly payments on your Direct Loans (loans made directly by the U.S. Department of Education) while working full-time for a qualifying public-service employer such as a government agency or a 501(c)(3) nonprofit, the government forgives the remaining principal and accrued interest on those loans.",
    citation: "34 CFR 685.219",
    source_url: "https://www.law.cornell.edu/cfr/text/34/685.219",
  },
  {
    id: "sl_unemployment_deferment",
    topic: "Unemployment deferment",
    kind: "consumer_right",
    rule:
      "If you are unemployed, you can get an unemployment deferment that pauses your Direct Loan payments for up to three years total, by showing you are eligible for unemployment benefits or that you are diligently seeking but unable to find full-time employment.",
    citation: "34 CFR 685.204(f)",
    source_url: "https://www.law.cornell.edu/cfr/text/34/685.204",
  },
  {
    id: "sl_economic_hardship_deferment",
    topic: "Economic hardship deferment",
    kind: "consumer_right",
    rule:
      "If your income is low enough to meet the regulation's economic-hardship test (for example, you receive federal or state public assistance, or your income falls at or below set poverty-based limits), you can get an economic hardship deferment that pauses your Direct Loan payments, granted up to one year at a time for up to three years total.",
    citation: "34 CFR 685.204(g)",
    source_url: "https://www.law.cornell.edu/cfr/text/34/685.204",
  },
  {
    id: "sl_deferment_subsidized_interest",
    topic: "Interest during deferment",
    kind: "consumer_right",
    rule:
      "During an approved deferment (an authorized pause on payments), interest does not accrue on your Direct Subsidized Loans, but interest does continue to accrue on your unsubsidized loans and may be added to your balance.",
    citation: "34 CFR 685.204(a)",
    source_url: "https://www.law.cornell.edu/cfr/text/34/685.204",
  },
  {
    id: "sl_tax_offset_notice_review",
    topic: "Tax refund offset review",
    kind: "consumer_right",
    rule:
      "Before your federal tax refund can be seized (offset) to collect a defaulted federal student loan, the agency must send you notice and give you at least 60 days to present evidence that all or part of the debt is not past-due or not legally enforceable, and the agency must consider that evidence.",
    citation: "31 U.S.C. 3720A(b)",
    source_url: "https://www.law.cornell.edu/uscode/text/31/3720A",
  },
  {
    id: "sl_false_certification_discharge",
    topic: "False-certification discharge",
    kind: "consumer_right",
    rule:
      "You can have your Direct Loan discharged (canceled) if the school falsely certified your eligibility to borrow, including signing the loan documents without your authorization, enrolling you despite a status that legally disqualified you from the job the program trained you for, or certifying the loan as a result of identity theft committed against you.",
    citation: "34 CFR 685.215",
    source_url: "https://www.law.cornell.edu/cfr/text/34/685.215",
  },
];

type Vertical =
  | "debt"
  | "medical"
  | "housing"
  | "benefits"
  | "lawsuit"
  | "judgment"
  | "garnishment"
  | "levy"
  | "timebarred"
  | "settlement"
  | "tax"
  | "student_loan"
  | "other";

function classify(text: string): Vertical {
  const t = (text || "").toLowerCase();
  const count = (terms: string[]) => terms.reduce((n, w) => (t.includes(w) ? n + 1 : n), 0);
  const debt = count([
    "debt collector",
    "collect a debt",
    "collection agency",
    "this is an attempt to collect",
    "creditor",
    "validation",
    "past due",
    "amount owed",
    "outstanding balance",
    "this communication is from a debt collector",
  ]);
  const medical = count([
    "explanation of benefits",
    "eob",
    "deductible",
    "coinsurance",
    "copay",
    "in-network",
    "out-of-network",
    "insurer",
    "health plan",
    "date of service",
    "prior authorization",
    "medically necessary",
    "patient responsibility",
    "your claim",
    "claim was denied",
    "denied",
    "no surprises act",
    "balance bill",
    "good faith estimate",
    "air ambulance",
    "internal appeal",
    "external review",
    "adverse benefit determination",
    "not medically necessary",
  ]);
  const housing = count([
    "notice to vacate",
    "notice to quit",
    "pay or quit",
    "pay rent or quit",
    "unlawful detainer",
    "eviction",
    "evict you",
    "evicted",
    "writ of possession",
    "forcible entry",
    "summary process",
    "landlord",
    "tenant",
    "tenancy",
    "lease",
    "rental agreement",
    "vacate the premises",
    "vacate the property",
    "cure or quit",
    "past due rent",
    "pay or vacate",
    "unconditional quit",
    "no-cause",
    "termination of tenancy",
    "dispossessory",
    "forcible detainer",
    "rent demand",
    "writ of restitution",
    "self-help eviction",
    "warranty of habitability",
    "security deposit",
    "holdover",
  ]);
  const benefits = count([
    "snap",
    "food stamps",
    "ebt",
    "calfresh",
    "supplemental nutrition",
    "food assistance",
    "medicaid",
    "tanf",
    "cash assistance",
    "public assistance",
    "fair hearing",
    "caseworker",
    "notice of adverse action",
    "recertification",
    "redetermination",
    "your benefits will",
    "benefits will be",
    "work requirement",
    "able-bodied adults",
    "unemployment",
    "ui claim",
    "overpayment",
    "fair hearing request",
    "aid paid pending",
    "notice of action",
    "intend to terminate",
    "temporary assistance",
  ]);
  // Debt sub-verticals. These are distinctive, mostly multi-word keyword clusters
  // that identify a specific stage or kind of debt action. When any are present
  // they should win over the generic "debt" bucket so the reader gets the right
  // cited corpus (a summons gets lawsuit law, a garnishment notice gets the wage
  // caps, and so on).
  const lawsuit = count([
    "summons",
    "you are being sued",
    "file an answer",
    "plaintiff",
    "defendant",
    "case number",
    "complaint and summons",
    "service of process",
    "you were served",
  ]);
  const judgment = count([
    "default judgment",
    "judgment against you",
    "judgment creditor",
    "writ of execution",
  ]);
  const garnishment = count([
    "garnish",
    "garnishment",
    "wage garnishment",
    "earnings withholding",
    "writ of garnishment",
  ]);
  const levy = count([
    "bank levy",
    "levy",
    "account freeze",
    "frozen account",
    "lien",
  ]);
  const timebarred = count([
    "statute of limitations",
    "time-barred",
    "out of statute",
    "old debt",
  ]);
  const settlement = count([
    "debt settlement",
    "settle your debt",
    "credit repair",
    "remove negative items",
    "debt relief",
  ]);
  // Highest signal count wins among the base buckets. Ties resolve in the order
  // debt, medical, housing, benefits, which preserves the prior behavior that a
  // debt letter beats a medical tie. Zero matches across all falls back to
  // "other".
  const tax = count([
    "irs",
    "internal revenue service",
    "tax return",
    "notice of deficiency",
    "cp2000",
    "cp14",
    "cp501",
    "cp503",
    "cp504",
    "federal tax",
    "back taxes",
    "tax lien",
    "notice of federal tax lien",
    "notice of levy",
    "intent to levy",
    "collection due process",
    "installment agreement",
    "offer in compromise",
    "unpaid taxes",
    "form 1040",
    "internal revenue code",
  ]);
  const studentLoan = count([
    "student loan",
    "federal student aid",
    "department of education",
    "loan servicer",
    "income-driven repayment",
    "income driven repayment",
    "idr plan",
    "public service loan forgiveness",
    "pslf",
    "forbearance",
    "deferment",
    "loan default",
    "defaulted loan",
    "loan rehabilitation",
    "borrower defense",
    "total and permanent disability discharge",
    "closed school discharge",
    "nelnet",
    "mohela",
    "aidvantage",
    "direct loan",
  ]);
  const ranked: Array<[Vertical, number]> = [
    ["debt", debt],
    ["medical", medical],
    ["housing", housing],
    ["benefits", benefits],
    ["tax", tax],
    ["student_loan", studentLoan],
  ];
  let best: Vertical = "other";
  let bestN = 0;
  for (const [v, n] of ranked) {
    if (n > bestN) {
      best = v;
      bestN = n;
    }
  }
  // When the document reads as debt (the generic bucket won, or a debt sub-vertical
  // signal is at least as strong as the leading non-debt bucket), let the most
  // specific debt sub-vertical take over. Distinctive sub-vertical keywords win
  // over generic "debt" so the reader gets the precise corpus. Ties among the
  // sub-verticals resolve lawsuit, judgment, garnishment, levy, timebarred,
  // settlement.
  const subRanked: Array<[Vertical, number]> = [
    ["lawsuit", lawsuit],
    ["judgment", judgment],
    ["garnishment", garnishment],
    ["levy", levy],
    ["timebarred", timebarred],
    ["settlement", settlement],
  ];
  let bestSub: Vertical = "other";
  let bestSubN = 0;
  for (const [v, n] of subRanked) {
    if (n > bestSubN) {
      bestSub = v;
      bestSubN = n;
    }
  }
  if (bestSubN > 0 && (best === "debt" || best === "other" || bestSubN >= bestN)) {
    return bestSub;
  }
  return bestN > 0 ? best : "other";
}

function corpusFor(v: Vertical): Rule[] {
  if (v === "debt") return FDCPA_CORPUS;
  if (v === "medical") return MEDICAL_CORPUS;
  if (v === "housing") return HOUSING_CORPUS;
  if (v === "benefits") return BENEFITS_CORPUS;
  if (v === "lawsuit") return [...LAWSUIT_CORPUS, ...FDCPA_CORPUS];
  if (v === "judgment") return [...JUDGMENT_CORPUS, ...GARNISHMENT_CORPUS];
  if (v === "garnishment") return [...GARNISHMENT_CORPUS, ...JUDGMENT_CORPUS];
  if (v === "levy") return [...LEVY_CORPUS, ...GARNISHMENT_CORPUS];
  if (v === "timebarred") return [...TIMEBARRED_CORPUS, ...FDCPA_CORPUS];
  if (v === "settlement") return [...SETTLEMENT_REPAIR_CORPUS, ...FDCPA_CORPUS];
  if (v === "tax") return TAX_CORPUS;
  if (v === "student_loan") return STUDENT_LOAN_CORPUS;
  return [];
}

function corpusForPrompt(rules: Rule[]): string {
  return rules
    .map((r) => `- [${r.id}] ${r.topic} (${r.kind}). ${r.rule} CITATION: "${r.citation}" SOURCE_URL: "${r.source_url}"`)
    .join("\n");
}

// ----- Deterministic pre-scan ---------------------------------------------
// High precision on purpose: only flag what is clearly present. Universal scam
// signals run on any letter; FDCPA-specific checks run only on debt letters
// (the validation-notice duty applies to third-party collectors, not to a
// hospital billing you directly).
// A signal is either a "scam" signal (it raises the scam meter) or a "conduct"
// signal (a likely illegal practice or a missing required disclosure, which is
// surfaced as a concern but must NOT make a real bill read as a scam). Only high
// "scam" signals force the scam meter up in reconcile().
interface Signal {
  id: string;
  label: string;
  severity: "high" | "medium" | "low";
  channel: "scam" | "conduct";
  detail: string;
}

function scanUniversal(text: string): Signal[] {
  const t = (text || "").toLowerCase();
  const out: Signal[] = [];
  const has = (...words: string[]) => words.some((w) => t.includes(w));

  if (has("arrest", "warrant", "jail", "prison", "criminal charges", "have you arrested", "police"))
    out.push({
      id: "arrest_threat",
      label: "Threat of arrest or jail",
      severity: "high",
      channel: "scam",
      detail:
        "The letter appears to threaten arrest, jail, or criminal charges over a bill or debt. This cannot happen over a private debt, and it is a common scam signal.",
    });

  if (has("gift card", "google play", "itunes", "wire transfer", "moneygram", "prepaid card", "bitcoin", "crypto", "cash app", "venmo", "zelle"))
    out.push({
      id: "scam_payment",
      label: "Demand for an untraceable payment method",
      severity: "high",
      channel: "scam",
      detail:
        "The letter asks for payment by gift card, wire, prepaid card, or crypto. Legitimate billers and collectors do not demand these. This is a strong scam signal.",
    });

  if (has("social security number", "ssn", "your password", "bank login", "pin number", "mother's maiden"))
    out.push({
      id: "identity_request",
      label: "Request for sensitive personal information",
      severity: "high",
      channel: "scam",
      detail:
        "The letter asks for a Social Security number, password, or bank login. A real biller does not need these by reply, and this is a phishing signal.",
    });

  if (has("processing fee", "activation fee", "release fee", "clearance fee", "advance fee", "fee to release", "fee to receive", "fee to claim", "pay a fee to"))
    out.push({
      id: "advance_fee",
      label: "Up-front fee to release money or a benefit",
      severity: "medium",
      channel: "scam",
      detail:
        "The letter asks for an up-front fee to release funds, a prize, or a benefit. Legitimate creditors and agencies do not make you pay a fee to receive money. This is a common advance-fee scam signal.",
    });

  if (has("24 hours", "48 hours", "72 hours", "immediately or", "final notice", "act now", "within the hour"))
    out.push({
      id: "false_urgency",
      label: "Artificial urgency",
      severity: "medium",
      channel: "scam",
      detail: "The letter uses a very short deadline to pressure a fast payment. Real rights and timelines are usually longer.",
    });

  return out;
}

function scanDebt(text: string): Signal[] {
  const t = (text || "").toLowerCase();
  const out: Signal[] = [];
  const has = (...words: string[]) => words.some((w) => t.includes(w));

  if (has("garnish", "lawsuit", "sue you", "seize", "lien") && has("24 hours", "48 hours", "72 hours", "today", "immediately"))
    out.push({
      id: "process_threat",
      label: "Threat of legal action on an impossible timeline",
      severity: "medium",
      channel: "scam",
      detail:
        "The letter threatens garnishment or a lawsuit on a timeline too short to be real. A collector may not threaten action it cannot or does not intend to take.",
    });

  const mentionsValidation = has("30 days", "thirty days", "dispute", "validation", "verify", "verification");
  if (!mentionsValidation)
    out.push({
      id: "missing_validation",
      label: "No mention of your right to dispute",
      severity: "medium",
      channel: "conduct",
      detail:
        "This letter demands payment but does not mention your 30-day right to dispute or to ask for verification. A collector must give you that notice within five days.",
    });

  return out;
}

// Housing: the strong, high-precision signal is an attempt at self-help eviction
// (locking out, shutting off utilities, removing belongings), which most states
// forbid. It is illegal landlord conduct, not a scam, so it routes to red_flags.
function scanHousing(text: string): Signal[] {
  const t = (text || "").toLowerCase();
  const out: Signal[] = [];
  const has = (...words: string[]) => words.some((w) => t.includes(w));

  if (
    has(
      "change the locks",
      "changed the locks",
      "lock you out",
      "locked you out",
      "shut off your utilities",
      "shut off the utilities",
      "turn off your utilities",
      "turn off the utilities",
      "remove your belongings",
      "remove your possessions",
      "throw out your belongings",
      "put your belongings on the curb",
    )
  )
    out.push({
      id: "self_help_eviction",
      label: "Possible illegal self-help eviction",
      severity: "high",
      channel: "conduct",
      detail:
        "The letter threatens to change the locks, cut utilities, or remove your belongings. In most states a landlord cannot do this and must go through a court, where only a sheriff or marshal can remove a tenant.",
    });

  return out;
}

// Benefits: a notice that cuts or denies aid but never mentions the appeal or
// fair-hearing right is missing a required disclosure. High precision because
// the notice is legally required to state that right.
function scanBenefits(text: string): Signal[] {
  const t = (text || "").toLowerCase();
  const out: Signal[] = [];
  const has = (...words: string[]) => words.some((w) => t.includes(w));

  const adverse = has("denied", "denial", "terminated", "reduce", "reduced", "discontinue", "ineligible", "closed", "stop");
  const mentionsHearing = has("fair hearing", "appeal", "hearing", "review");
  if (adverse && !mentionsHearing)
    out.push({
      id: "missing_hearing_notice",
      label: "No mention of your right to a fair hearing",
      severity: "medium",
      channel: "conduct",
      detail:
        "This notice changes or denies your benefits but does not mention your right to a fair hearing or appeal. The notice is required to tell you about that right and the deadline to use it.",
    });

  return out;
}

// Medical: a conservative nudge. If an emergency or in-network-facility bill
// looks like it is balance billing you, flag it so the model checks the No
// Surprises Act. This is a compliance concern, never a scam banner.
function scanMedical(text: string): Signal[] {
  const t = (text || "").toLowerCase();
  const out: Signal[] = [];
  const has = (...words: string[]) => words.some((w) => t.includes(w));

  const emergencyContext = has("emergency", "emergency room", " er ", "ambulance");
  const oonContext = has("out-of-network", "out of network", "nonparticipating", "non-participating");
  const balanceContext = has("balance", "you owe", "patient responsibility", "remaining balance", "amount you owe");
  if ((emergencyContext || oonContext) && balanceContext)
    out.push({
      id: "possible_balance_bill",
      label: "Possible surprise or balance bill",
      severity: "medium",
      channel: "conduct",
      detail:
        "This bill charges you a balance for emergency or out-of-network care. The No Surprises Act may limit you to your in-network cost-sharing, so this is worth checking against that law.",
    });

  return out;
}

function scanLetter(text: string, v: Vertical): Signal[] {
  const sig = scanUniversal(text);
  if (v === "debt") sig.push(...scanDebt(text));
  if (v === "housing") sig.push(...scanHousing(text));
  if (v === "benefits") sig.push(...scanBenefits(text));
  if (v === "medical") sig.push(...scanMedical(text));
  return sig;
}

const SYSTEM = `You are Decoded. You read ONE confusing official document that a stressed, non-expert person received, and you return STRICT JSON that makes them feel "this read MY exact document and caught things I would never have noticed." You are NOT a generic summarizer. You are a close reader of THIS document: its exact amounts, dates, names, and account numbers, the math behind its deadlines, what the sender is implying without saying, and what the sender is likely to do next.

You receive a document (as text or an image), a target reading level, a target language, and sometimes a RIGHTS CORPUS and DETECTED SIGNALS. A document may be a debt-collection letter, a medical bill or insurance denial/EOB, an eviction or housing notice, a public-benefits notice (SNAP or Medicaid), an IRS or tax notice, a federal student-loan notice, or something else.

HOW TO THINK (do this silently and NEVER reveal it; output only the JSON object):
1. CLASSIFY FIRST. Pin the exact document type and sub-type before anything else. The wrong frame produces a confident wrong answer: an EOB is NOT a bill; a pay-or-quit notice is NOT a move-out order; the original creditor is NOT the same as a third-party collector.
2. EXTRACT THE FACTS. Pull every concrete particular the document actually contains: who sent it (name, role, whether it calls itself a debt collector), the original creditor/insurer/landlord/agency, the recipient, account/claim/case/policy numbers, every dollar amount (original balance, interest, fees, "patient responsibility", rent owed, totals), every date (letter date, service date, due date, "respond by", notice-period start), and the exact demand or decision. Reuse these EXACT values later. If a value is not in the document, it does not exist — never supply one.
3. DO THE DEADLINE MATH. For each date or window, compute the real timeline from the document's own dates: when the window ends and roughly how much time is left. Note the caveats (a clock that runs from receipt rather than the letter date; short notices that may exclude weekends and holidays; mailing lag). If a date is missing or you cannot compute it safely, say so in "uncertainties" — never guess a date.
4. TREAT OMISSIONS AS FINDINGS. For the document's type, check what the law requires it to contain and whether it is actually there. A missing required disclosure (a debt validation / 30-day dispute notice, an itemization, an appeal-rights notice, cure language in an eviction notice) is itself a finding, not a neutral. Silence is data.
5. READ THE SUBTEXT. What does the sender WANT (fast payment, to discourage a dispute, to scare a move-out, to close a claim)? What are they NOT saying (your right to dispute / appeal / a hearing; that they must verify the debt; that a number is an estimate, not a final amount; that emergency care cannot be balance-billed)? What is unusual about THIS document?
6. CHECK AGAINST THE CORPUS. Match what the document does or fails to do against the RIGHTS CORPUS entries you were given. Treat DETECTED SIGNALS as leads, not verdicts: confirm each against the text before relying on it, and silently drop any the document does not support.
7. ANTICIPATE THE NEXT MOVE. What does this kind of document lead to next, legally, and what is the sender most likely to do?

HIGH-VALUE INSIGHT to watch for by document type (surface it plainly, in the right field, when it is actually present):
- Debt letters: the statute-of-limitations / "zombie debt" trap — if the debt looks old, a lawsuit may be time-barred AND making any payment or written acknowledgment can RESTART the clock. The limitations period is state-specific; say "check the limit for your state," never assert a number.
- Medical bills / EOBs: the No Surprises Act balance-bill check — for emergency care, or an out-of-network provider at an in-network facility, you generally CANNOT be billed beyond your in-network cost-sharing; such a charge may be unlawful, so dispute it rather than pay. Only raise this when the corpus supports it.
- Eviction / housing notices: a notice is NOT an eviction and NOT a court order — the reader does not have to move out by that date; removal is lawful only after a court judgment and a sheriff, and lockouts or utility shut-offs are illegal self-help.
- Government / benefits letters: almost every adverse decision is appealable on a hard, short clock; verify the agency through its official published contact, never the phone number or link printed in the letter.
- IRS / tax notices: the IRS must give you appeal rights and generally a 30-day window before it can levy, the right to seek a payment plan or settlement, and a roughly 10-year limit on collecting a tax. Verify the IRS through its official .gov contact, never a number or link in a suspicious notice.
- Federal student-loan notices: borrowers have strong, often-unmentioned rights — income-driven repayment that can lower a payment, getting out of default through rehabilitation, discharge if a school closed or for total and permanent disability, and a lower 15% cap on wage garnishment for defaulted federal loans.

VOICE: Write EVERY field in the target language, at the target reading level. Short sentences. Second person ("you", "your"). Calm, warm, direct. Reduce panic, increase agency. Define any unavoidable legal or medical term inline. Do not pad — specific beats verbose. Name the actual party, quote the actual amount, cite the actual date.

HARD RULES (non-negotiable):
1. You are NOT a lawyer or doctor and you do not give legal or medical advice. You EXPLAIN what a document says, CHECK it against any rules you are given, and lay out general options.
2. NEVER invent facts, dates, statute numbers, case numbers, dollar amounts, parties, or rights. If something is not in the document, leave the field null or empty, or list it under "uncertainties". A fabricated right or citation is the worst possible failure.
3. CITATIONS: you may ONLY use a "citation" and "source_url" by copying them VERBATIM from a RIGHTS CORPUS entry you were given. If no corpus entry supports a statement, set citation and source_url to null. Never write a citation that is not in the corpus.
4. If text is unreadable or ambiguous, say so in "uncertainties". Do not fill gaps with plausible guesses.
5. "violations" are concrete problems with THIS document measured against the corpus: a missing required disclosure, a prohibited practice, an unlawful threat, or a bill the law says you should not owe. Each must map to a corpus citation. Do not list a violation you cannot ground in the corpus; describe softer concerns in "red_flags" instead.
6. SCAM-RISK IS A SEPARATE AXIS FROM LEGAL-RISK. "scam_risk" judges whether the document itself looks like a scam or predatory fake. Weigh the DETECTED SIGNALS and the document. Untraceable payment demands (gift cards, wire, crypto), arrest or jail threats over a debt, and requests for sensitive personal information (SSN, passwords, bank logins) all raise it. A real bill, notice, or denial from a genuine provider, insurer, landlord, or agency is usually "low" or "none" even when it contains a violation — an unlawful charge by a real biller is a violation, not a scam.
7. "draft_response" is a courteous, firm, factual reply the reader could send, grounded in THIS document's facts (reference the actual account or claim number and amount where present). For a debt letter, default to a written request to verify the debt. For a denied medical claim, default to a request to start an internal appeal. Use [BRACKETS] for anything the user must fill in. Never admit fault or liability.
8. "get_help" names REAL categories of help only (legal aid, the CFPB, a state attorney general, a state insurance regulator, a tenant union or housing legal aid, a state SNAP or Medicaid office, 211). Do not invent phone numbers or URLs.
9. "procedure" is a short ordered timeline, in plain language, of what legally happens NEXT for this kind of document. Ground every step in the corpus and the document; do not invent steps, deadlines, or court names. Each item is { "step": short label, "detail": one or two plain sentences }. For a debt letter the path is typically: you can request verification, then the 30-day dispute window, then the collector may sue, then a judgment could lead to wage garnishment. For an eviction the path is typically: the notice period, then the landlord files in court, then you are served, then a hearing, then a judgment, then a writ of possession enforced by a sheriff. For a benefits denial the path is typically: you can request a fair hearing, then benefits may continue if you ask in time, then the hearing, then a written decision. For an IRS notice the path is typically: the notice of tax due or of intent to levy, then your 30-day window to request a Collection Due Process hearing or to set up a payment plan or offer in compromise, then Appeals, then collection by levy or lien if unresolved. For a federal student-loan notice the path is typically: the notice (such as default or garnishment), then options to lower the payment through income-driven repayment, to cure default through rehabilitation, or to seek a discharge, then administrative wage garnishment capped at 15% if the default is not resolved. Eviction and benefits steps and deadlines vary by state, so say that in the relevant step and keep numbers general unless the document or corpus gives them. Use an empty array if you cannot ground any steps.
10. "what_if_ignored" is ONE honest sentence about the realistic consequence of doing nothing, such as a default judgment, wage garnishment, removal by a sheriff, or loss of benefits. If the consequence varies by state or you are unsure, say so plainly. If you cannot ground a consequence, set it to null. Never exaggerate to frighten the reader.

WHERE THE DEPTH LIVES:
- "summary": 2 to 3 sentences naming the SENDER, the original creditor/insurer/landlord/agency, the exact key amount, and the core demand or decision, as they appear in THIS document.
- "meaning_for_you": direct second person — what it means for you, what the sender wants, what they are NOT telling you, and the deadline math (when the clock runs out and how much time is left). This field must feel read-to-them, not generic.
- "deadlines": one entry per real date or window; "raw_text" quotes the document; "date" is ISO only if the document states it or you computed it safely, else null.
- "rights": prefer rights supported by the corpus (copy citation and source_url verbatim); a right with no corpus support carries null citation and source_url.
- "red_flags": anything off that is not a cited violation — pressure tactics, vague or missing itemization, a "total" with no breakdown, a number presented as final that reads like an estimate.

Return ONLY a JSON object with EXACTLY these fields:
{
  "document_type": "string",
  "is_debt_collection": true,
  "confidence": "high | medium | low",
  "language": "string (BCP-47 of the output, e.g. en, es)",
  "reading_level": "string (echoes the requested level)",
  "summary": "string (2 to 3 plain sentences: what this document is)",
  "meaning_for_you": "string (direct second person: what it means for the reader)",
  "law_checked": [ "string (name a body of law from the corpus you actually used, e.g. Fair Debt Collection Practices Act (15 U.S.C. 1692), No Surprises Act, state eviction law, or SNAP and Medicaid fair-hearing rules)" ],
  "deadlines": [ { "label": "string", "date": "string|null", "raw_text": "string", "urgency": "critical | soon | info" } ],
  "actions": [ { "task": "string", "why": "string", "by": "string|null" } ],
  "rights": [ { "right": "string", "basis": "string|null", "citation": "string|null", "source_url": "string|null" } ],
  "violations": [ { "issue": "string", "citation": "string|null", "source_url": "string|null", "severity": "high | medium | low", "explanation": "string" } ],
  "scam_risk": { "level": "high | medium | low | none", "signals": [ "string" ], "summary": "string" },
  "red_flags": [ { "flag": "string", "severity": "high | medium | low", "explanation": "string" } ],
  "draft_response": "string",
  "procedure": [ { "step": "string", "detail": "string" } ],
  "what_if_ignored": "string|null",
  "uncertainties": [ "string" ],
  "get_help": [ { "resource": "string", "type": "legal_aid | hotline | gov_agency | tenant_union | benefits_office | cfpb | insurance_regulator | other", "note": "string" } ]
}
Set "is_debt_collection" to true only for a debt-collection letter; otherwise false. When you were given no corpus, "law_checked" and "violations" may be empty and "rights" carry null citations. Every array may be empty. Empty means none were found, which is valid. Output JSON only, with no prose outside the JSON.`;

function extractJson(text: string): string {
  const t = (text ?? "").trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  const s = t.indexOf("{");
  const e = t.lastIndexOf("}");
  return s !== -1 && e > s ? t.slice(s, e + 1) : t;
}

interface DecodeBody {
  text?: string;
  imageUrl?: string; // a data: URL or https URL of the document image
  readingLevel?: string; // "grade5" | "grade8" | "plain"
  language?: string; // BCP-47, default "en"
}

// Reconcile the model output with the deterministic findings: force the most
// serious signals to survive, keep a real bill from reading as a scam, and drop
// any violation the model failed to ground in a citation.
function reconcile(result: any, signals: Signal[], vertical: Vertical): any {
  const r = result ?? {};
  const order: Record<string, number> = { none: 0, low: 1, medium: 2, high: 3 };
  // Only "scam" signals move the scam meter. A high "conduct" signal (an illegal
  // landlord lockout, a missing required disclosure) is a serious problem but it
  // is not a scam, so it must not turn a real notice into a scam banner.
  const highScam = signals.some((s) => s.severity === "high" && s.channel === "scam");
  r.scam_risk = r.scam_risk ?? { level: "none", signals: [], summary: "" };

  if (highScam) {
    if ((order[r.scam_risk.level] ?? 0) < order["high"]) r.scam_risk.level = "high";
    const have = new Set((r.scam_risk.signals ?? []).map((x: string) => String(x).toLowerCase()));
    for (const s of signals.filter((x) => x.severity === "high" && x.channel === "scam")) {
      if (![...have].some((h) => h.includes(s.label.toLowerCase().slice(0, 12)))) {
        r.scam_risk.signals = [...(r.scam_risk.signals ?? []), s.label];
      }
    }
    if (!r.scam_risk.summary) r.scam_risk.summary = "Several strong scam signals are present in this letter. Be very careful.";
  } else if (vertical === "medical" || vertical === "housing" || vertical === "benefits") {
    // A bill from a real provider, a real eviction notice, or a real benefits
    // notice is rarely a scam. An unlawful charge or practice is a violation
    // (cited to the law) or a red flag, not a scam banner.
    if ((order[r.scam_risk.level] ?? 0) > order["low"]) {
      r.scam_risk.level = "low";
      r.scam_risk.signals = [];
    }
  }

  // Surface high "conduct" signals as red flags so a likely illegal practice is
  // never lost. These are observations about the document, not cited legal
  // violations, so they belong in red_flags rather than violations.
  const highConduct = signals.filter((s) => s.severity === "high" && s.channel === "conduct");
  if (highConduct.length) {
    r.red_flags = Array.isArray(r.red_flags) ? r.red_flags : [];
    const have = new Set(r.red_flags.map((f: any) => String(f?.flag ?? "").toLowerCase()));
    for (const s of highConduct) {
      if (![...have].some((h) => h.includes(s.label.toLowerCase().slice(0, 12)))) {
        r.red_flags.push({ flag: s.label, severity: s.severity, explanation: s.detail });
      }
    }
  }

  // No citation, no claim: a violation that is not grounded in the corpus does
  // not belong in the violations list.
  if (Array.isArray(r.violations)) r.violations = r.violations.filter((v: any) => v && v.citation);

  // Normalize the optional procedure timeline so the client always gets clean
  // shapes. We never invent steps here; we only tidy what the model returned.
  if (!Array.isArray(r.procedure)) {
    r.procedure = [];
  } else {
    r.procedure = r.procedure
      .filter((p: any) => p && (p.step || p.detail))
      .map((p: any) => ({ step: String(p.step ?? ""), detail: String(p.detail ?? "") }));
  }
  if (r.what_if_ignored === undefined) r.what_if_ignored = null;
  return r;
}

async function decode(body: DecodeBody): Promise<unknown> {
  const language = body.language || "en";
  const readingLevel = body.readingLevel || "grade8";

  // Classification needs the text; for an image we let the model classify and
  // pass both corpora so it can pick. Text path is precise.
  const vertical = body.text ? classify(body.text) : "other";
  const rules = body.imageUrl
    ? [
        ...FDCPA_CORPUS,
        ...MEDICAL_CORPUS,
        ...HOUSING_CORPUS,
        ...BENEFITS_CORPUS,
        ...LAWSUIT_CORPUS,
        ...JUDGMENT_CORPUS,
        ...GARNISHMENT_CORPUS,
        ...LEVY_CORPUS,
        ...TIMEBARRED_CORPUS,
        ...SETTLEMENT_REPAIR_CORPUS,
      ]
    : corpusFor(vertical);
  const signals = body.text ? scanLetter(body.text, vertical) : [];

  const corpusBlock = rules.length
    ? `RIGHTS CORPUS (the only citations you may use; copy citation and source_url verbatim, and pick the entries that fit this document):\n${corpusForPrompt(rules)}\n\n`
    : "";
  const signalBlock = signals.length
    ? `DETECTED SIGNALS (a deterministic pre-scan found these; verify each against the document and incorporate the real ones):\n` +
      signals.map((s) => `- ${s.label} [${s.severity}]: ${s.detail}`).join("\n") +
      `\n\n`
    : "";

  const preamble =
    `Target language: ${language}. Target reading level: ${readingLevel}.\n\n` +
    corpusBlock +
    signalBlock +
    `Be brief: one or two short sentences per field, a short draft_response, and only the few most important items in each array. Read the document carefully and return the JSON object.`;

  let content: any;
  if (body.imageUrl) {
    content = [
      { type: "text", text: preamble },
      { type: "image_url", image_url: { url: body.imageUrl } },
    ];
  } else {
    content = `${preamble}\n\nDOCUMENT:\n${(body.text || "").slice(0, 16000)}`;
  }

  const client = ai();
  const run = (extra = "") =>
    client.chat.completions.create({
      model: MODEL(),
      messages: [
        { role: "system", content: SYSTEM + extra },
        { role: "user", content },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 2000,
    });

  let parsed: any;
  try {
    const c = await run();
    parsed = JSON.parse(extractJson(c.choices?.[0]?.message?.content ?? ""));
  } catch {
    const c = await run("\n\nReturn ONLY valid minified JSON matching the schema. No prose, no code fences.");
    parsed = JSON.parse(extractJson(c.choices?.[0]?.message?.content ?? ""));
  }
  return reconcile(parsed, signals, vertical);
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "POST only" }, 405);
  try {
    const body = (await req.json()) as DecodeBody;
    if (!body.text && !body.imageUrl) return json({ ok: false, error: "Provide text or imageUrl" }, 400);
    const result = await decode(body);
    return json({ ok: true, result });
  } catch (e) {
    return json({ ok: false, error: String((e as Error)?.message ?? e) }, 500);
  }
}
