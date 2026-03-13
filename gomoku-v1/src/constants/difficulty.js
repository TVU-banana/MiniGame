export const DIFFICULTIES = {
  beginner: {
    key: "beginner",
    label: "新手",
    description: "偏进攻，漏防较多，适合轻松体验。",
    candidateRadius: 1,
    maxCandidates: 36,
    attackWeight: 1.16,
    defenseWeight: 0.36,
    centerWeight: 14,
    dualWeight: 0.18,
    lookahead: false,
  },
  normal: {
    key: "normal",
    label: "普通",
    description: "攻守均衡，会优先处理直接威胁。",
    candidateRadius: 2,
    maxCandidates: 56,
    attackWeight: 1,
    defenseWeight: 0.96,
    centerWeight: 16,
    dualWeight: 0.36,
    lookahead: false,
  },
  expert: {
    key: "expert",
    label: "专家",
    description: "优先级更严格，并带有限定的局部两步推演。",
    candidateRadius: 2,
    maxCandidates: 72,
    attackWeight: 1.08,
    defenseWeight: 1.04,
    centerWeight: 18,
    dualWeight: 0.48,
    lookahead: true,
  },
};

export const DEFAULT_DIFFICULTY = DIFFICULTIES.normal.key;

export const DIFFICULTY_LIST = Object.values(DIFFICULTIES);
