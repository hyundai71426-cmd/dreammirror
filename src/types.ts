export interface DreamAnalysis {
  people: string[];
  location: string[];
  theme: string[];
  emotion: string[];
  summary: string;
}

export interface Dream {
  id: string;
  title: string;
  content: string;
  sleepScore: number; // 1-5
  vividness: number; // 1-5
  nightmareScore: number; // 1-5
  createdAt: string; // YYYY-MM-DD
  emotions: string[];
  analysis: DreamAnalysis;
}

export interface ReportData {
  emotionRatios: { label: string; percentage: number; color: string }[];
  locationTop3: { name: string; count: number; icon: string }[];
  nightmareRate: { pattern: string; occurrences: number; percentage: number };
  relationshipCounts: { name: string; count: number }[];
  aiOverview: string;
}
