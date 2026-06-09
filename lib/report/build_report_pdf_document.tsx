/**
 * react-pdf document layout for the downloadable report export.
 */

import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

import { REPORT_PDF_COLORS } from "@/lib/report/report_pdf_colors";
import { chart_image_max_height } from "@/lib/report/report_pdf_layout";
import type { query_result, workspace_insight } from "@/lib/types/insights";
import type { story_segment } from "@/lib/types/report";

export type report_pdf_document_props = {
  title: string;
  segments: story_segment[];
  dataset_name: string;
  generated_label: string | null;
  insights: workspace_insight[];
  chart_images: Record<string, string>;
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 48,
    paddingHorizontal: 48,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: REPORT_PDF_COLORS.ink,
    backgroundColor: REPORT_PDF_COLORS.white,
  },
  header_band: {
    backgroundColor: REPORT_PDF_COLORS.navy,
    marginHorizontal: -48,
    marginTop: -40,
    paddingHorizontal: 48,
    paddingVertical: 18,
    marginBottom: 28,
  },
  header_title: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: REPORT_PDF_COLORS.white,
  },
  story_block: {
    borderLeftWidth: 3,
    borderLeftColor: REPORT_PDF_COLORS.navy,
    paddingLeft: 14,
    marginBottom: 32,
    maxWidth: "92%",
    alignSelf: "center",
  },
  story_text: {
    fontSize: 11,
    lineHeight: 1.6,
    color: REPORT_PDF_COLORS.ink,
  },
  cite: {
    fontFamily: "Helvetica-Bold",
    color: REPORT_PDF_COLORS.navy,
  },
  charts_section: {
    alignItems: "center",
  },
  chart_block: {
    width: "88%",
    marginBottom: 32,
    paddingVertical: 18,
    paddingHorizontal: 20,
    backgroundColor: REPORT_PDF_COLORS.fill,
    borderRadius: 8,
    alignItems: "center",
  },
  chart_label: {
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: REPORT_PDF_COLORS.gray,
    marginBottom: 6,
    textAlign: "center",
  },
  chart_title: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: REPORT_PDF_COLORS.ink,
    marginBottom: 6,
    textAlign: "center",
    lineHeight: 1.35,
  },
  chart_narrative: {
    fontSize: 10,
    lineHeight: 1.5,
    color: REPORT_PDF_COLORS.gray,
    marginBottom: 14,
    textAlign: "center",
    maxWidth: "95%",
  },
  chart_image: {
    width: "100%",
    objectFit: "contain",
  },
  table: {
    marginTop: 4,
    width: "100%",
  },
  table_header_row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: REPORT_PDF_COLORS.gray,
    paddingBottom: 4,
    marginBottom: 4,
  },
  table_row: {
    flexDirection: "row",
    paddingVertical: 2,
  },
  table_cell: {
    flex: 1,
    fontSize: 8,
    paddingRight: 6,
  },
  table_header_cell: {
    flex: 1,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: REPORT_PDF_COLORS.gray,
    paddingRight: 6,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 48,
    right: 48,
    borderTopWidth: 1,
    borderTopColor: REPORT_PDF_COLORS.fill,
    paddingTop: 8,
    fontSize: 8,
    color: REPORT_PDF_COLORS.gray,
    textAlign: "center",
  },
});

/** Read-only PDF layout: story, centered chart blocks, footer metadata. */
export function ReportPdfDocument({
  title,
  segments,
  dataset_name,
  generated_label,
  insights,
  chart_images,
}: report_pdf_document_props) {
  const image_max_height = chart_image_max_height(insights.length);
  const chart_image_style = {
    ...styles.chart_image,
    maxHeight: image_max_height,
  };

  return (
    <Document title={title} author="Project G">
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header_band}>
          <Text style={styles.header_title}>{title}</Text>
        </View>

        {segments.length > 0 ? (
          <View style={styles.story_block}>
            <Text style={styles.story_text}>
              {segments.map((segment, index) =>
                segment.type === "text" ? (
                  <Text key={`text-${index}`}>{segment.value}</Text>
                ) : (
                  <Text key={`cite-${index}`} style={styles.cite}>
                    {segment.label}
                  </Text>
                ),
              )}
            </Text>
          </View>
        ) : null}

        <View style={styles.charts_section}>
          {insights.map((insight, index) => (
            <View key={insight.id} style={styles.chart_block} wrap={false}>
              <Text style={styles.chart_label}>
                Chart {index + 1} of {insights.length}
              </Text>
              <Text style={styles.chart_title}>{insight.question}</Text>
              <Text style={styles.chart_narrative}>{insight.narrative}</Text>
              {chart_images[insight.id] ? (
                // react-pdf Image has no alt prop; chart question is in text above.
                // eslint-disable-next-line jsx-a11y/alt-text -- PDF export image
                <Image src={chart_images[insight.id]} style={chart_image_style} />
              ) : (
                <QueryResultTable result={insight.query_result} />
              )}
            </View>
          ))}
        </View>

        <Text style={styles.footer} fixed>
          Generated from {dataset_name}
          {generated_label ? ` · ${generated_label}` : ""}
        </Text>
      </Page>
    </Document>
  );
}

type query_result_table_props = {
  result: query_result;
};

function QueryResultTable({ result }: query_result_table_props) {
  const preview_rows = result.rows.slice(0, 8);

  if (result.columns.length === 0) {
    return <Text style={styles.chart_narrative}>No chart data available.</Text>;
  }

  return (
    <View style={styles.table}>
      <View style={styles.table_header_row}>
        {result.columns.map((column) => (
          <Text key={column} style={styles.table_header_cell}>
            {column}
          </Text>
        ))}
      </View>
      {preview_rows.map((row, row_index) => (
        <View key={`row-${row_index}`} style={styles.table_row}>
          {row.map((cell, col_index) => (
            <Text
              key={`cell-${row_index}-${col_index}`}
              style={styles.table_cell}
            >
              {cell}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}
