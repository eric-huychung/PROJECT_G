/**
 * Report page types — story segments and cached report story.
 */

export type story_text_segment = {
  type: "text";
  value: string;
};

export type story_cite_segment = {
  type: "cite";
  insight_id: string;
  label: string;
  row: number;
  col: number;
};

export type story_segment = story_text_segment | story_cite_segment;

export type report_story = {
  title: string;
  segments: story_segment[];
  generated_at: string;
  tracked_insight_ids: string[];
};

export type story_response = {
  title: string;
  segments: story_segment[];
};
