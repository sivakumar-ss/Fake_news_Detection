/**
 * Sample data for interface preview only.
 *
 * Nothing in this file is a real fact-check. Every entry is explicitly marked
 * as demo data, contains placeholder text instead of a real-world claim, and
 * links to no real evidence or sources.
 */

export const DEMO_NOTE =
  'Sample data for interface preview only. This is not a real fact-check, ' +
  'no real article was assessed, and no external sources were checked.'

const demoBase = {
  is_demo: true,
  model: 'demo-sample',
  sources: [],
}

export const demoAnalyses = [
  {
    ...demoBase,
    id: 1004,
    title: 'Demo · Sample result — likely reliable',
    content:
      'Demo placeholder content. This entry shows how a likely reliable result ' +
      'is laid out. It is not a real article and was not assessed by AI.',
    source_url: null,
    input_type: 'text',
    category: 'likely_reliable',
    assessment_score: 78,
    explanation:
      DEMO_NOTE +
      ' In a live analysis, this area would explain which writing-level signals ' +
      'supported the category.',
    suspicious_claims: [],
    supporting_evidence: [
      'Demo placeholder: a reliability signal found in the writing would appear here.',
    ],
    contradicting_evidence: [],
    created_at: '2026-11-05T09:15:00Z',
  },
  {
    ...demoBase,
    id: 1003,
    title: 'Demo · Sample result — potentially misleading',
    content:
      'Demo placeholder content. This entry shows how a potentially misleading ' +
      'result is laid out. It is not a real article and was not assessed by AI.',
    source_url: 'https://example.com/demo-sample',
    input_type: 'url',
    category: 'potentially_misleading',
    assessment_score: 56,
    explanation:
      DEMO_NOTE +
      ' In a live analysis, this area would explain the missing context or ' +
      'loaded language that prompted caution.',
    suspicious_claims: [
      'Demo placeholder: a claim that needs independent verification would appear here.',
    ],
    supporting_evidence: [
      'Demo placeholder: a reliability signal found in the writing would appear here.',
    ],
    contradicting_evidence: [
      'Demo placeholder: a missing-context or wording concern would appear here.',
    ],
    created_at: '2026-11-04T16:40:00Z',
  },
  {
    ...demoBase,
    id: 1002,
    title: 'Demo · Sample result — likely false',
    content:
      'Demo placeholder content. This entry shows how a likely false result is ' +
      'laid out. It is not a real article and was not assessed by AI.',
    source_url: null,
    input_type: 'text',
    category: 'likely_false',
    assessment_score: 22,
    explanation:
      DEMO_NOTE +
      ' In a live analysis, this area would explain the sensational wording or ' +
      'internal contradictions behind the category.',
    suspicious_claims: [
      'Demo placeholder: a claim that needs independent verification would appear here.',
    ],
    supporting_evidence: [],
    contradicting_evidence: [
      'Demo placeholder: an internal contradiction or manipulation signal would appear here.',
    ],
    created_at: '2026-11-03T11:05:00Z',
  },
  {
    ...demoBase,
    id: 1001,
    title: 'Demo · Sample result — insufficient evidence',
    content:
      'Demo placeholder content. This entry shows how an insufficient evidence ' +
      'result is laid out. It is not a real article and was not assessed by AI.',
    source_url: null,
    input_type: 'text',
    category: 'insufficient_evidence',
    assessment_score: 50,
    explanation:
      DEMO_NOTE +
      ' In a live analysis, this area would explain why the text did not provide ' +
      'enough context for a cautious assessment.',
    suspicious_claims: [],
    supporting_evidence: [],
    contradicting_evidence: [],
    created_at: '2026-11-02T08:30:00Z',
  },
]
