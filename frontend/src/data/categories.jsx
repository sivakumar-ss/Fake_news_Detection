import {
  AlertTriangle,
  CircleHelp,
  ShieldCheck,
  ShieldX,
} from 'lucide-react'

export const CATEGORY_ORDER = [
  'likely_reliable',
  'potentially_misleading',
  'likely_false',
  'insufficient_evidence',
]

export const CATEGORY_META = {
  likely_reliable: {
    label: 'Likely reliable',
    tone: 'success',
    Icon: ShieldCheck,
    summary:
      'Reads like responsible reporting, with attribution, specifics and an internally consistent account.',
  },
  potentially_misleading: {
    label: 'Potentially misleading',
    tone: 'warning',
    Icon: AlertTriangle,
    summary:
      'Mixed signals, loaded language, missing context or unsupported claims that warrant caution.',
  },
  likely_false: {
    label: 'Likely false',
    tone: 'danger',
    Icon: ShieldX,
    summary:
      'Strongly resembles fabricated or manipulative content, such as sensational claims or invented authority.',
  },
  insufficient_evidence: {
    label: 'Insufficient evidence',
    tone: 'neutral',
    Icon: CircleHelp,
    summary:
      'There is not enough context to make even a cautious assessment from the submitted text.',
  },
}

export function categoryMeta(category) {
  return CATEGORY_META[category] || CATEGORY_META.insufficient_evidence
}
