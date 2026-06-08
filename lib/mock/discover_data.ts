/**
 * Mock discover content — insights and common questions.
 */

import type {
  discover_question_item,
  discover_quick_insight,
  dataset_summary,
} from "@/lib/types/discover";

export const DEFAULT_DATASET_SUMMARY: dataset_summary = {
  name: "Uploaded dataset",
  rows: 935_853,
  columns: 12,
  file_size_kb: 48_200,
};

export const DATASET_BLURB =
  "Each row is one payment line with agency, category, vendor, amount, and fiscal month. Use the sections below to explore patterns and select questions you want to answer.";

export const COMMON_QUESTIONS: discover_question_item[] = [
  {
    id: "where-money-goes-q1",
    text: "Who are the top vendors, and how much of total spend do they get?",
  },
  {
    id: "where-money-goes-q2",
    text: "Which agencies spend the most?",
  },
  {
    id: "where-money-goes-q3",
    text: "Did the biggest agencies spend more in 2023 than in 2022?",
  },
];

export const QUICK_INSIGHTS: discover_quick_insight[] = [
  {
    id: "1",
    fact: "~79% of spend is grants and client services — not regular goods or contracts.",
    suggested_question:
      "Which agencies and vendors account for most grants and client services spend?",
  },
  {
    id: "2",
    fact: "Health Care Authority spends the most (~$28B). With Social and Health Services, the top two agencies are about two-thirds of all spend.",
    suggested_question: "Which agencies spend the most?",
  },
  {
    id: "3",
    fact: "Molina Healthcare is the top vendor (~$9.8B).",
    suggested_question:
      "Who are the top vendors, and how much of total spend do they get?",
  },
  {
    id: "4",
    fact: "The top 10 vendors get about half of all spend, out of ~97K vendors total.",
    suggested_question:
      "Did the biggest vendors receive more in 2023 than in 2022?",
  },
];
