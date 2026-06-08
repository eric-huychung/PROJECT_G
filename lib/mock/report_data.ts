/**
 * Mock report content — story copy and chart aggregates from vendor payments.
 */

import type {
  report_chart_data_bundle,
  report_chart_spec,
  report_content,
} from "@/lib/types/report";

export const DEFAULT_REPORT_TITLE = "Where Does the Money Go?";

export const DEFAULT_REPORT_STORY =
  "Washington sends out a lot of vendor payments, but most of the money goes to the same place: health and social programs. Two agencies and a handful of health vendors — led by Molina — account for a huge share. The dataset looks big, but the story is simple: most dollars flow to a small group.";

export const REPORT_CHART_SPECS: report_chart_spec[] = [
  {
    id: "spend-by-category",
    title: "Spend by category",
    subtitle:
      "Most vendor dollars are grants and client services — not regular goods or contracts.",
    kind: "pie",
  },
  {
    id: "top-vendors",
    title: "Top vendors by spend",
    subtitle:
      "Who are the top vendors, and how much of total spend do they get?",
    kind: "bar",
  },
  {
    id: "top-agencies",
    title: "Top agencies by spend",
    subtitle: "Which agencies spend the most?",
    kind: "bar",
  },
  {
    id: "spend-by-fy",
    title: "Spend by fiscal year",
    subtitle:
      "Did the biggest agencies spend more in 2023 than in 2022? Statewide spend rose ~14% from FY 2022 to FY 2023.",
    kind: "fy_bar",
  },
];

export const DEFAULT_REPORT_CONTENT: report_content = {
  title: DEFAULT_REPORT_TITLE,
  story: DEFAULT_REPORT_STORY,
  charts: REPORT_CHART_SPECS,
};

/** Chart-ready aggregates from vendor payments analysis. */
export const REPORT_CHART_DATA: report_chart_data_bundle = {
  top_vendors: [
    { name: "MOLINA HEALTHCARE OF WASHINGTON", total: 9_806_781_735.15 },
    { name: "UNITED HEALTH CARE OF WASHINGTON", total: 2_765_346_881.65 },
    { name: "AMERIGROUP WASHINGTON INC", total: 2_741_138_066.6 },
    { name: "CONSUMER DIRECT CARE NETWORK WAS", total: 2_534_449_682.06 },
    { name: "COMMUNITY HEALTH PLAN OF WASHING", total: 2_505_301_809.62 },
    { name: "COORDINATED CARE OF WASHINGTON I", total: 2_211_444_869.34 },
    { name: "PUBLIC PARTNERSHIPS LLC", total: 1_453_189_092.52 },
    { name: "US BANK PURCHASING CARD PROGRAM", total: 477_720_255.0 },
  ],
  top_agencies: [
    { name: "Health Care Authority", total: 28_071_754_707.3 },
    { name: "Social and Health Services", total: 13_466_617_580.39 },
    { name: "Transportation", total: 4_065_040_672.21 },
    { name: "Commerce", total: 3_258_742_444.98 },
    { name: "Children, Youth, and Families", total: 2_639_976_344.59 },
    { name: "Health", total: 2_369_463_504.56 },
    { name: "Public Schools", total: 1_626_764_374.45 },
    { name: "Military Department", total: 915_126_832.84 },
  ],
  spend_by_category: [
    { name: "Grants, Benefits & Client Services", total: 49_911_140_962.16 },
    { name: "Goods and Services", total: 7_355_277_513.85 },
    { name: "Capital Outlays", total: 3_690_157_617.05 },
    { name: "Personal Service Contracts", total: 2_030_497_821.81 },
    { name: "Travel", total: 153_675_241.76 },
    { name: "Debt Service", total: 46_643_523.92 },
  ],
  spend_by_fy: [
    { fy: 2022, total: 29_535_369_459.65, payments: 451_029 },
    { fy: 2023, total: 33_711_812_451.38, payments: 484_824 },
  ],
};
