/**
 * Mock value-trace payloads for quick insights (table + SQL).
 */

import type { insight_trace } from "@/lib/types/discover";

export const INSIGHT_TRACES: Record<string, insight_trace> = {
  "1": {
    insight_id: "1",
    label: "Value trace",
    primary_value: "$49.9B",
    last_updated: "Apr 17",
    table: {
      columns: ["category", "total_spend", "pct_of_total"],
      rows: [
        ["Grants, Benefits & Client Services", "$49,911,140,962", "78.9%"],
        ["Goods and Services", "$7,355,277,514", "11.6%"],
        ["Capital Outlays", "$3,690,157,617", "5.8%"],
        ["Personal Service Contracts", "$2,030,497,822", "3.2%"],
        ["Travel", "$153,675,242", "0.2%"],
      ],
      highlight: { row: 0, col: 2 },
    },
    sql: `SELECT
  category,
  SUM(amount) AS total_spend,
  ROUND(100.0 * SUM(amount) / SUM(SUM(amount)) OVER (), 1) AS pct_of_total
FROM vendor_payments
WHERE fiscal_year IN (2022, 2023)
GROUP BY category
ORDER BY total_spend DESC`,
  },
  "2": {
    insight_id: "2",
    label: "Value trace",
    primary_value: "$28.1B",
    last_updated: "Apr 17",
    table: {
      columns: ["agency", "fy_2022", "fy_2023", "total_spend"],
      rows: [
        [
          "Health Care Authority",
          "$12,842,000,000",
          "$15,229,754,707",
          "$28,071,754,707",
        ],
        [
          "Social and Health Services",
          "$6,201,000,000",
          "$7,265,617,580",
          "$13,466,617,580",
        ],
        ["Transportation", "$1,890,000,000", "$2,175,040,672", "$4,065,040,672"],
        ["Commerce", "$1,520,000,000", "$1,738,742,445", "$3,258,742,445"],
        [
          "Children, Youth, and Families",
          "$1,210,000,000",
          "$1,429,976,345",
          "$2,639,976,345",
        ],
      ],
      highlight: { row: 0, col: 3 },
    },
    sql: `SELECT
  agency,
  SUM(CASE WHEN fiscal_year = 2022 THEN amount ELSE 0 END) AS fy_2022,
  SUM(CASE WHEN fiscal_year = 2023 THEN amount ELSE 0 END) AS fy_2023,
  SUM(amount) AS total_spend
FROM vendor_payments
WHERE fiscal_year IN (2022, 2023)
GROUP BY agency
ORDER BY total_spend DESC
LIMIT 10`,
  },
  "3": {
    insight_id: "3",
    label: "Value trace",
    primary_value: "$9.8B",
    last_updated: "Apr 17",
    table: {
      columns: ["vendor", "total_spend", "pct_of_total"],
      rows: [
        ["MOLINA HEALTHCARE OF WASHINGTON", "$9,806,781,735", "15.5%"],
        ["UNITED HEALTH CARE OF WASHINGTON", "$2,765,346,882", "4.4%"],
        ["AMERIGROUP WASHINGTON INC", "$2,741,138,067", "4.3%"],
        ["CONSUMER DIRECT CARE NETWORK WAS", "$2,534,449,682", "4.0%"],
        [
          "COMMUNITY HEALTH PLAN OF WASHING",
          "$2,505,301,810",
          "4.0%",
        ],
      ],
      highlight: { row: 0, col: 1 },
    },
    sql: `SELECT
  vendor,
  SUM(amount) AS total_spend,
  ROUND(100.0 * SUM(amount) / (SELECT SUM(amount) FROM vendor_payments), 1) AS pct_of_total
FROM vendor_payments
WHERE fiscal_year IN (2022, 2023)
GROUP BY vendor
ORDER BY total_spend DESC
LIMIT 10`,
  },
  "4": {
    insight_id: "4",
    label: "Value trace",
    primary_value: "56.2%",
    last_updated: "Apr 17",
    table: {
      columns: ["rank", "vendor", "total_spend", "cumulative_pct"],
      rows: [
        ["1", "MOLINA HEALTHCARE OF WASHINGTON", "$9,806,781,735", "15.5%"],
        ["2", "UNITED HEALTH CARE OF WASHINGTON", "$2,765,346,882", "19.9%"],
        ["3", "AMERIGROUP WASHINGTON INC", "$2,741,138,067", "24.2%"],
        ["4", "CONSUMER DIRECT CARE NETWORK WAS", "$2,534,449,682", "28.2%"],
        [
          "5",
          "COMMUNITY HEALTH PLAN OF WASHING",
          "$2,505,301,810",
          "32.2%",
        ],
      ],
      highlight: { row: 4, col: 3 },
    },
    sql: `WITH ranked AS (
  SELECT
    vendor,
    SUM(amount) AS total_spend,
    ROW_NUMBER() OVER (ORDER BY SUM(amount) DESC) AS rank
  FROM vendor_payments
  WHERE fiscal_year IN (2022, 2023)
  GROUP BY vendor
),
totals AS (
  SELECT SUM(total_spend) AS grand_total FROM ranked
)
SELECT
  r.rank,
  r.vendor,
  r.total_spend,
  ROUND(100.0 * SUM(r.total_spend) OVER (ORDER BY r.rank) / t.grand_total, 1) AS cumulative_pct
FROM ranked r
CROSS JOIN totals t
WHERE r.rank <= 10
ORDER BY r.rank`,
  },
};

/**
 * @param insight_id - Quick insight id
 * @returns Trace payload or undefined if not found
 */
export function get_insight_trace(insight_id: string): insight_trace | undefined {
  return INSIGHT_TRACES[insight_id];
}
