/**
 * Suggested prompts for the landing page — short chip label + full input text.
 */

export type suggested_prompt = {
  label: string;
  text: string;
};

export const SUGGESTED_PROMPTS: suggested_prompt[] = [
  {
    label: "Revenue by month",
    text: "I'm a CFO working on a financial report — help me analyze revenue month by month.",
  },
  {
    label: "Top customers",
    text: "I'm a sales ops lead reviewing our accounts — help me find my top customers.",
  },
];
