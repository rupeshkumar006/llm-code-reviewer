package com.codereviewer.service;

import com.codereviewer.dto.ReviewResponse;
import com.codereviewer.model.Review;
import com.codereviewer.repository.ReviewRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.lowagie.text.pdf.PdfPageEventHelper;
import com.lowagie.text.pdf.PdfContentByte;
import com.lowagie.text.pdf.BaseFont;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Export Service — generates PDF and JSON exports for reviews.
 * Uses OpenPDF (LGPL) for PDF generation.
 */
@Service
public class ExportService {

    private final ReviewRepository reviewRepository;
    private final ObjectMapper objectMapper;

    // Color palette for the PDF
    private static final Color PRIMARY_COLOR = new Color(10, 10, 10);    // Charcoal
    private static final Color ACCENT_COLOR = new Color(59, 130, 246);   // Blue
    private static final Color SUCCESS_COLOR = new Color(16, 185, 129);  // Green
    private static final Color DANGER_COLOR = new Color(239, 68, 68);    // Red
    private static final Color WARNING_COLOR = new Color(245, 158, 11);  // Amber
    private static final Color LIGHT_BG = new Color(248, 250, 252);      // Subtle gray bg

    public ExportService(ReviewRepository reviewRepository, ObjectMapper objectMapper) {
        this.reviewRepository = reviewRepository;
        this.objectMapper = objectMapper;
    }

    /**
     * Page event handler for adding page numbers bottom-right.
     */
    private static class PageNumberEvent extends PdfPageEventHelper {
        @Override
        public void onEndPage(PdfWriter writer, Document document) {
            try {
                PdfContentByte cb = writer.getDirectContent();
                BaseFont baseFont = BaseFont.createFont(BaseFont.HELVETICA, BaseFont.CP1252, BaseFont.NOT_EMBEDDED);
                cb.setFontAndSize(baseFont, 8);
                cb.setColorFill(Color.GRAY);
                String pageText = "Page " + writer.getPageNumber();
                cb.beginText();
                cb.showTextAligned(PdfContentByte.ALIGN_RIGHT,
                        pageText,
                        document.right(),
                        document.bottom() - 20,
                        0);
                cb.endText();
            } catch (Exception e) {
                // Silently ignore font issues
            }
        }
    }

    /**
     * Export review as PDF — restructured format.
     */
    public byte[] exportAsPdf(Long reviewId, Long userId) {
        Review review = getReviewWithAuth(reviewId, userId);
        ReviewResponse response = parseReview(review);

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 40, 40, 50, 50);
            PdfWriter writer = PdfWriter.getInstance(document, baos);
            writer.setPageEvent(new PageNumberEvent());
            document.open();

            // Fonts
            Font titleFont = new Font(Font.HELVETICA, 20, Font.BOLD, ACCENT_COLOR);
            Font sectionFont = new Font(Font.HELVETICA, 14, Font.BOLD, PRIMARY_COLOR);
            Font bodyFont = new Font(Font.HELVETICA, 10, Font.NORMAL, Color.DARK_GRAY);
            Font labelFont = new Font(Font.HELVETICA, 9, Font.BOLD, Color.GRAY);
            Font codeFont = new Font(Font.COURIER, 11, Font.NORMAL, new Color(31, 41, 55));

            // Format date
            String dateStr = review.getCreatedAt() != null
                    ? review.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"))
                    : LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));

            String langDisplay = review.getLanguage() != null
                    ? review.getLanguage().substring(0, 1).toUpperCase() + review.getLanguage().substring(1)
                    : "Unknown";

            // ═══════════════════════════════════════════
            // TITLE
            // ═══════════════════════════════════════════
            Paragraph title = new Paragraph(
                    "Code Review Report — " + langDisplay + " — " + dateStr, titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(20);
            document.add(title);

            addDivider(document);

            // ═══════════════════════════════════════════
            // SECTION 1: EXECUTIVE SUMMARY
            // ═══════════════════════════════════════════
            Paragraph summaryTitle = new Paragraph("1. Executive Summary", sectionFont);
            summaryTitle.setSpacingBefore(10);
            summaryTitle.setSpacingAfter(10);
            document.add(summaryTitle);

            String summaryText = response.getSummary() != null ? response.getSummary() : "No summary provided.";
            Paragraph summaryPara = new Paragraph(summaryText, bodyFont);
            summaryPara.setSpacingAfter(10);
            document.add(summaryPara);

            addDivider(document);

            // ═══════════════════════════════════════════
            // SECTION 2: QUALITY SCORE
            // ═══════════════════════════════════════════
            Paragraph scoreTitle = new Paragraph("2. Quality Score", sectionFont);
            scoreTitle.setSpacingBefore(10);
            scoreTitle.setSpacingAfter(10);
            document.add(scoreTitle);

            // Score + Grade
            int score = response.getScore() != null ? response.getScore() : 0;
            String grade;
            Color gradeColor;
            if (score >= 80) { grade = "EXCELLENT"; gradeColor = SUCCESS_COLOR; }
            else if (score >= 60) { grade = "GOOD"; gradeColor = new Color(59, 130, 246); }
            else if (score >= 40) { grade = "POOR"; gradeColor = WARNING_COLOR; }
            else { grade = "CRITICAL"; gradeColor = DANGER_COLOR; }

            // Summary box with background
            PdfPTable summaryBox = new PdfPTable(1);
            summaryBox.setWidthPercentage(100);

            // Score line
            Font scoreFont = new Font(Font.HELVETICA, 28, Font.BOLD, gradeColor);
            Font gradeFont = new Font(Font.HELVETICA, 12, Font.BOLD, gradeColor);
            Phrase scorePhrase = new Phrase();
            scorePhrase.add(new Chunk(String.valueOf(score) + " / 100", scoreFont));
            scorePhrase.add(new Chunk("   " + grade, gradeFont));

            PdfPCell scoreCell = new PdfPCell(scorePhrase);
            scoreCell.setPadding(12);
            scoreCell.setBorderWidth(0);
            scoreCell.setBackgroundColor(LIGHT_BG);
            summaryBox.addCell(scoreCell);

            document.add(summaryBox);
            document.add(new Paragraph(" "));

            // Collect bug descriptions for deduplication
            Set<String> bugDescriptions = new HashSet<>();
            if (response.getBugs() != null) {
                for (ReviewResponse.Bug bug : response.getBugs()) {
                    if (bug.getDescription() != null) {
                        bugDescriptions.add(bug.getDescription().toLowerCase().trim());
                    }
                }
            }

            // ═══════════════════════════════════════════
            // SECTION 3: BUGS & VULNERABILITIES
            // ═══════════════════════════════════════════
            if (response.getBugs() != null && !response.getBugs().isEmpty()) {
                addDivider(document);
                Paragraph bugsTitle = new Paragraph("3. Bugs & Vulnerabilities (" + response.getBugs().size() + ")", sectionFont);
                bugsTitle.setSpacingBefore(10);
                bugsTitle.setSpacingAfter(8);
                document.add(bugsTitle);

                PdfPTable bugsTable = new PdfPTable(5);
                bugsTable.setWidthPercentage(100);
                bugsTable.setWidths(new float[]{0.6f, 0.8f, 1.5f, 3f, 3f});

                addTableHeader(bugsTable, "No.");
                addTableHeader(bugsTable, "Line");
                addTableHeader(bugsTable, "Severity");
                addTableHeader(bugsTable, "Description");
                addTableHeader(bugsTable, "Suggested Fix");

                int bugIndex = 1;
                for (ReviewResponse.Bug bug : response.getBugs()) {
                    boolean isEven = (bugIndex % 2 == 0);
                    addTableCell(bugsTable, String.valueOf(bugIndex++), isEven);
                    addTableCell(bugsTable, String.valueOf(bug.getLine()), isEven);
                    addSeverityCell(bugsTable, bug.getSeverity(), isEven);
                    addTableCell(bugsTable, bug.getDescription(), isEven);
                    addTableCell(bugsTable, bug.getFix(), isEven);
                }

                document.add(bugsTable);
                document.add(new Paragraph(" "));
            }

            // ═══════════════════════════════════════════
            // SECTION 4: SECURITY ANALYSIS (deduplicated)
            // ═══════════════════════════════════════════
            if (response.getSecurity() != null && !response.getSecurity().isEmpty()) {
                // Filter out security issues that duplicate bug descriptions
                java.util.List<ReviewResponse.SecurityIssue> dedupedSecurity = response.getSecurity().stream()
                        .filter(issue -> {
                            String desc = issue.getDescription() != null ? issue.getDescription().toLowerCase().trim() : "";
                            return !bugDescriptions.contains(desc);
                        })
                        .collect(Collectors.toList());

                if (!dedupedSecurity.isEmpty()) {
                    addDivider(document);
                    Paragraph secTitle = new Paragraph("4. Security Analysis (" + dedupedSecurity.size() + ")", sectionFont);
                    secTitle.setSpacingBefore(10);
                    secTitle.setSpacingAfter(8);
                    document.add(secTitle);

                    PdfPTable secTable = new PdfPTable(6);
                    secTable.setWidthPercentage(100);
                    secTable.setWidths(new float[]{0.5f, 0.7f, 1.2f, 1.8f, 2.5f, 2.5f});

                    addTableHeader(secTable, "No.");
                    addTableHeader(secTable, "Line");
                    addTableHeader(secTable, "Severity");
                    addTableHeader(secTable, "OWASP Category");
                    addTableHeader(secTable, "Description");
                    addTableHeader(secTable, "Suggested Fix");

                    int secIndex = 1;
                    for (ReviewResponse.SecurityIssue issue : dedupedSecurity) {
                        boolean isEven = (secIndex % 2 == 0);
                        addTableCell(secTable, String.valueOf(secIndex++), isEven);
                        addTableCell(secTable, String.valueOf(issue.getLine()), isEven);
                        addSeverityCell(secTable, issue.getSeverity(), isEven);
                        addTableCell(secTable, issue.getVulnerability() != null ? issue.getVulnerability() : "N/A", isEven);
                        addTableCell(secTable, issue.getDescription(), isEven);
                        addTableCell(secTable, issue.getFix(), isEven);
                    }

                    document.add(secTable);
                    document.add(new Paragraph(" "));
                }
            }

            // ═══════════════════════════════════════════
            // SECTION 5: BEST PRACTICES (numbered list)
            // ═══════════════════════════════════════════
            if (response.getBestPractices() != null && !response.getBestPractices().isEmpty()) {
                addDivider(document);
                Paragraph bpTitle = new Paragraph("5. Best Practice Recommendations", sectionFont);
                bpTitle.setSpacingBefore(10);
                bpTitle.setSpacingAfter(8);
                document.add(bpTitle);

                // Numbered list instead of bullet points
                int bpIndex = 1;
                for (String bp : response.getBestPractices()) {
                    Paragraph bpItem = new Paragraph(bpIndex + ". " + bp, bodyFont);
                    bpItem.setSpacingAfter(4);
                    bpItem.setIndentationLeft(10);
                    document.add(bpItem);
                    bpIndex++;
                }
                document.add(new Paragraph(" "));
            }

            // ═══════════════════════════════════════════
            // SECTION 6: REFACTORED CODE
            // ═══════════════════════════════════════════
            if (response.getRefactoredCode() != null && !response.getRefactoredCode().isBlank()) {
                addDivider(document);
                Paragraph codeTitle = new Paragraph("6. Refactored Code", sectionFont);
                codeTitle.setSpacingBefore(10);
                codeTitle.setSpacingAfter(4);
                document.add(codeTitle);

                // Language label
                Paragraph langLabel = new Paragraph("Language: " + langDisplay, labelFont);
                langLabel.setSpacingAfter(6);
                document.add(langLabel);

                // Code block in monospace
                PdfPTable codeBox = new PdfPTable(1);
                codeBox.setWidthPercentage(100);

                PdfPCell codeCell = new PdfPCell(new Phrase(response.getRefactoredCode(), codeFont));
                codeCell.setPadding(16);
                codeCell.setBorderWidth(0);
                codeCell.setBorderWidthLeft(3f);
                codeCell.setBorderColorLeft(new Color(249, 115, 22));
                codeCell.setBackgroundColor(new Color(243, 244, 246));
                codeBox.addCell(codeCell);
                document.add(codeBox);
            }

            // ═══════════════════════════════════════════
            // FOOTER
            // ═══════════════════════════════════════════
            addDivider(document);
            Font footerFont = new Font(Font.HELVETICA, 8, Font.ITALIC, Color.GRAY);
            Paragraph footer = new Paragraph(
                    "Generated by CodeReviewer on " + dateStr, footerFont);
            footer.setAlignment(Element.ALIGN_CENTER);
            footer.setSpacingBefore(20);
            document.add(footer);

            document.close();
            return baos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate PDF: " + e.getMessage());
        }
    }

    /**
     * Export review as JSON.
     */
    public byte[] exportAsJson(Long reviewId, Long userId) {
        Review review = getReviewWithAuth(reviewId, userId);

        try {
            java.util.Map<String, Object> exportData = new java.util.LinkedHashMap<>();
            exportData.put("id", review.getId());
            exportData.put("language", review.getLanguage());
            exportData.put("code", review.getCode());
            exportData.put("review", objectMapper.readValue(review.getReviewResult(), Object.class));
            exportData.put("score", review.getScore());
            exportData.put("createdAt", review.getCreatedAt().toString());

            return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsBytes(exportData);
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate JSON export: " + e.getMessage());
        }
    }

    // --- Private helpers ---

    private Review getReviewWithAuth(Long reviewId, Long userId) {
        Review review = reviewRepository.findById(Objects.requireNonNull(reviewId))
                .orElseThrow(() -> new RuntimeException("Review not found"));
        if (!review.getUserId().equals(userId)) {
            throw new RuntimeException("Access denied");
        }
        return review;
    }

    private ReviewResponse parseReview(Review review) {
        try {
            return objectMapper.readValue(review.getReviewResult(), ReviewResponse.class);
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse review data");
        }
    }

    private void addDivider(Document document) throws DocumentException {
        Paragraph gap = new Paragraph(" ");
        gap.setSpacingBefore(20);
        gap.setSpacingAfter(0);
        document.add(gap);
        
        com.lowagie.text.pdf.draw.LineSeparator line = new com.lowagie.text.pdf.draw.LineSeparator();
        line.setLineColor(new Color(229, 229, 229));
        line.setLineWidth(1f);
        document.add(new Chunk(line));
    }

    private void addTableHeader(PdfPTable table, String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text,
                new Font(Font.HELVETICA, 9, Font.BOLD, Color.WHITE)));
        cell.setBackgroundColor(ACCENT_COLOR);
        cell.setPadding(6);
        // Using clear/transparent borders (not SOLID) per blueprint instruction
        cell.setBorderWidth(0);
        table.addCell(cell);
    }

    private void addTableCell(PdfPTable table, String text, boolean isEven) {
        PdfPCell cell = new PdfPCell(new Phrase(text != null ? text : "",
                new Font(Font.HELVETICA, 9, Font.NORMAL, Color.DARK_GRAY)));
        cell.setPadding(5);
        cell.setBorderWidth(0);
        cell.setBackgroundColor(isEven ? new Color(249, 250, 251) : Color.WHITE);
        table.addCell(cell);
    }

    private void addSeverityCell(PdfPTable table, String severity, boolean isEven) {
        Color color = switch (severity != null ? severity.toLowerCase() : "") {
            case "critical", "high" -> DANGER_COLOR;
            case "medium" -> WARNING_COLOR;
            case "low" -> SUCCESS_COLOR;
            default -> Color.GRAY;
        };

        PdfPCell cell = new PdfPCell(new Phrase(severity != null ? severity : "N/A",
                new Font(Font.HELVETICA, 9, Font.BOLD, color)));
        cell.setPadding(5);
        cell.setBorderWidth(0);
        cell.setBackgroundColor(isEven ? new Color(249, 250, 251) : Color.WHITE);
        table.addCell(cell);
    }
}
