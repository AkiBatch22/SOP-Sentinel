from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.style import WD_STYLE_TYPE
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor
from pathlib import Path


OUTPUT = str(Path(__file__).resolve().parent / "SOP_Sentinel_Loom_Tutorial_Script.docx")

GREEN = RGBColor(28, 97, 72)
BLACK = RGBColor(0, 0, 0)
GRAY = RGBColor(91, 105, 99)
LIGHT_GRAY = RGBColor(217, 217, 217)


def set_cell_margins(cell, top=100, start=140, bottom=100, end=140):
    tc = cell._tc
    tc_pr = tc.get_or_add_tcPr()
    tc_mar = tc_pr.first_child_found_in("w:tcMar")
    if tc_mar is None:
        tc_mar = OxmlElement("w:tcMar")
        tc_pr.append(tc_mar)
    for margin, value in (("top", top), ("start", start), ("bottom", bottom), ("end", end)):
        node = tc_mar.find(qn(f"w:{margin}"))
        if node is None:
            node = OxmlElement(f"w:{margin}")
            tc_mar.append(node)
        node.set(qn("w:w"), str(value))
        node.set(qn("w:type"), "dxa")


def set_repeat_table_header(row):
    tr_pr = row._tr.get_or_add_trPr()
    tbl_header = OxmlElement("w:tblHeader")
    tbl_header.set(qn("w:val"), "true")
    tr_pr.append(tbl_header)


def set_run_font(run, name="Aptos", size=10.5, bold=False, color=BLACK):
    run.font.name = name
    run._element.get_or_add_rPr().rFonts.set(qn("w:ascii"), name)
    run._element.get_or_add_rPr().rFonts.set(qn("w:hAnsi"), name)
    run.font.size = Pt(size)
    run.bold = bold
    run.font.color.rgb = color


def add_page_number(paragraph):
    paragraph.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    run = paragraph.add_run("Page ")
    set_run_font(run, size=8.5, color=GRAY)
    fld_char1 = OxmlElement("w:fldChar")
    fld_char1.set(qn("w:fldCharType"), "begin")
    instr_text = OxmlElement("w:instrText")
    instr_text.set(qn("xml:space"), "preserve")
    instr_text.text = "PAGE"
    fld_char2 = OxmlElement("w:fldChar")
    fld_char2.set(qn("w:fldCharType"), "end")
    run._r.extend([fld_char1, instr_text, fld_char2])


def add_label_paragraph(doc, label, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.keep_with_next = True
    label_run = p.add_run(f"{label}  ")
    set_run_font(label_run, size=9, bold=True, color=GREEN)
    text_run = p.add_run(text)
    set_run_font(text_run, size=10.5, color=GRAY)
    return p


def add_narration(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.left_indent = Inches(0.22)
    p.paragraph_format.right_indent = Inches(0.08)
    p.paragraph_format.space_after = Pt(10)
    p.paragraph_format.line_spacing = 1.12
    run = p.add_run(f'“{text}”')
    set_run_font(run, size=10.5, color=BLACK)
    return p


def add_segment(doc, timestamp, heading, on_screen, point_to, action, narration_parts):
    p = doc.add_paragraph(style="Heading 2")
    p.paragraph_format.keep_with_next = True
    time_run = p.add_run(f"{timestamp}  ")
    set_run_font(time_run, size=13, bold=True, color=GREEN)
    title_run = p.add_run(heading)
    set_run_font(title_run, size=13, bold=True, color=BLACK)
    add_label_paragraph(doc, "SCREEN", on_screen)
    add_label_paragraph(doc, "POINT TO", point_to)
    if action:
        add_label_paragraph(doc, "ACTION", action)
    for part in narration_parts:
        add_narration(doc, part)


def add_code_step(doc, file_name, point_to, explanation, code_lines):
    p = doc.add_paragraph(style="Heading 2")
    p.paragraph_format.keep_with_next = True
    run = p.add_run(file_name)
    set_run_font(run, size=13, bold=True, color=BLACK)
    add_label_paragraph(doc, "POINT TO", point_to)
    add_narration(doc, explanation)
    for line in code_lines:
        p = doc.add_paragraph()
        p.paragraph_format.left_indent = Inches(0.28)
        p.paragraph_format.space_after = Pt(2)
        run = p.add_run(line)
        set_run_font(run, name="Consolas", size=9.2, color=GREEN)


doc = Document()
section = doc.sections[0]
section.top_margin = Inches(0.72)
section.bottom_margin = Inches(0.68)
section.left_margin = Inches(0.78)
section.right_margin = Inches(0.78)

styles = doc.styles
normal = styles["Normal"]
normal.font.name = "Aptos"
normal._element.rPr.rFonts.set(qn("w:ascii"), "Aptos")
normal._element.rPr.rFonts.set(qn("w:hAnsi"), "Aptos")
normal.font.size = Pt(10.5)
normal.font.color.rgb = BLACK
normal.paragraph_format.space_after = Pt(6)
normal.paragraph_format.line_spacing = 1.12

title_style = styles["Title"]
title_style.font.name = "Aptos Display"
title_style._element.rPr.rFonts.set(qn("w:ascii"), "Aptos Display")
title_style._element.rPr.rFonts.set(qn("w:hAnsi"), "Aptos Display")
title_style.font.size = Pt(27)
title_style.font.bold = True
title_style.font.color.rgb = BLACK

for style_name, size in (("Heading 1", 17), ("Heading 2", 13)):
    style = styles[style_name]
    style.font.name = "Aptos Display"
    style._element.rPr.rFonts.set(qn("w:ascii"), "Aptos Display")
    style._element.rPr.rFonts.set(qn("w:hAnsi"), "Aptos Display")
    style.font.size = Pt(size)
    style.font.bold = True
    style.font.color.rgb = BLACK
    style.paragraph_format.space_before = Pt(12)
    style.paragraph_format.space_after = Pt(6)
    style.paragraph_format.keep_with_next = True

if "Small Label" not in styles:
    label_style = styles.add_style("Small Label", WD_STYLE_TYPE.PARAGRAPH)
else:
    label_style = styles["Small Label"]
label_style.font.name = "Aptos"
label_style.font.size = Pt(8.5)
label_style.font.bold = True
label_style.font.color.rgb = GREEN
label_style.paragraph_format.space_after = Pt(5)

p = doc.add_paragraph(style="Small Label")
p.add_run("LOOM RECORDING GUIDE")

title = doc.add_paragraph(style="Title")
title.add_run("SOP Sentinel Loom Tutorial Script")
title.paragraph_format.space_after = Pt(4)

subtitle = doc.add_paragraph()
subtitle.paragraph_format.space_after = Pt(13)
run = subtitle.add_run("A guided five minute walkthrough with cursor directions and code explanations")
set_run_font(run, size=12, color=GRAY)

intro = doc.add_paragraph()
intro.paragraph_format.space_after = Pt(13)
intro.add_run(
    "This guide provides the exact narration and screen sequence for presenting SOP Sentinel. "
    "The goal is to demonstrate product judgment, technical reasoning, honest validation, and a practical next step without presenting the prototype as production ready."
)

table = doc.add_table(rows=2, cols=4)
table.autofit = False
widths = [Inches(1.15), Inches(1.85), Inches(1.75), Inches(1.95)]
headers = ["Target length", "Demo case", "Current evidence", "Closing request"]
values = ["5 to 6 minutes", "Changed minutes", "24 cases and 86 percent recall", "Two week validation pilot"]
for idx, width in enumerate(widths):
    for cell in table.columns[idx].cells:
        cell.width = width
for idx, text in enumerate(headers):
    cell = table.rows[0].cells[idx]
    cell.text = text
    cell.vertical_alignment = 1
    cell._tc.get_or_add_tcPr().append(OxmlElement("w:shd"))
    cell._tc.tcPr[-1].set(qn("w:fill"), "1C6148")
    set_cell_margins(cell)
    for run in cell.paragraphs[0].runs:
        set_run_font(run, size=8.5, bold=True, color=RGBColor(255, 255, 255))
for idx, text in enumerate(values):
    cell = table.rows[1].cells[idx]
    cell.text = text
    cell.vertical_alignment = 1
    set_cell_margins(cell, top=130, bottom=130)
    for run in cell.paragraphs[0].runs:
        set_run_font(run, size=9.2)
for row in table.rows:
    for cell in row.cells:
        tc_pr = cell._tc.get_or_add_tcPr()
        borders = tc_pr.first_child_found_in("w:tcBorders")
        if borders is None:
            borders = OxmlElement("w:tcBorders")
            tc_pr.append(borders)
        for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
            tag = borders.find(qn(f"w:{edge}"))
            if tag is None:
                tag = OxmlElement(f"w:{edge}")
                borders.append(tag)
            tag.set(qn("w:val"), "single")
            tag.set(qn("w:sz"), "4")
            tag.set(qn("w:color"), "D9D9D9")
set_repeat_table_header(table.rows[0])

doc.add_paragraph(style="Heading 1").add_run("Before recording")
prep = [
    "Open the project at the top of the page and keep the browser at a readable zoom level.",
    "Leave the Validation Lab selector on Case 01 Changed minutes, but do not load it before recording.",
    "Open engine.js, app.js, route.ts, and pilot.js in your editor before recording the code section.",
    "Use the cursor as a guide: point, pause for one second, then explain. Avoid circling or moving continuously.",
    "Keep the delivery conversational. Use the script as a guide instead of reading every sentence mechanically.",
    "Do not describe the prototype as production ready or claim that automated checks certify translation quality.",
]
for item in prep:
    p = doc.add_paragraph(style="List Bullet")
    p.paragraph_format.space_after = Pt(3)
    p.add_run(item)

doc.add_paragraph(style="Heading 1").add_run("Live test case sequence")
test_steps = [
    "Scroll to the Validation Lab and point to 01 Pharma Changed minutes.",
    "Point to Expected signal Duration mismatch so the viewer knows what the labeled case should detect.",
    "Click Load into auditor and let the page return to the comparison form.",
    "Point to 15 minutes in the original and 5 minutes in the Hindi translation.",
    "Click Audit translation once and keep the cursor still while the audit runs.",
    "Point to Publication blocked, the critical issue count, both highlighted values, and the suggested correction.",
    "Do not submit a reviewer verdict; explain that this decision belongs to a qualified bilingual reviewer.",
]
for item in test_steps:
    p = doc.add_paragraph(style="List Number")
    p.paragraph_format.space_after = Pt(2)
    p.add_run(item)

doc.add_page_break()
doc.add_paragraph(style="Heading 1").add_run("Guided narration")

add_segment(doc, "0:00 to 0:25", "Introduction", "Top of the product page", "The SOP Sentinel name, then the Catch what gets lost in translation heading", "Move the cursor slowly from the product name to the main heading and stop", [
    "Hi, I’m Akshat. I built SOP Sentinel around a simple question: after content is translated, how can we catch small changes that may create real operational risk before they reach frontline workers?"
])

add_segment(doc, "0:25 to 0:55", "The problem", "The original SOP and Hindi translation fields", "First point to 15 minutes in the original, then point to 5 minutes in the translation", "Do not click yet; let the viewer compare the two values", [
    "A translation may look fluent while changing a duration, removing a warning, reversing an instruction, or weakening an identity check. These errors are difficult to catch at scale, but they can materially change how work is performed."
])

add_segment(doc, "0:55 to 1:25", "How the system works", "The input area and Audit translation button", "The source field, translation field, then the Audit translation button", "Pause over each element while naming it", [
    "The system uses two complementary layers. A deterministic JavaScript engine checks exact facts such as numbers, units, percentages, negations, protected terms, and step counts.",
    "A server-side Groq model reviews meaning-level problems such as omissions, reversed meaning, unsafe simplification, and reordered dependencies. Both layers return the same structured finding format, but publication decisions remain with a human reviewer."
])

add_segment(doc, "1:25 to 2:15", "Run the demonstration", "Validation case selector followed by the audit form", "Case 01 Changed minutes, Expected signal Duration mismatch, Load into auditor, the two durations, then Audit translation", "Follow the seven-step live test case sequence from the preparation page", [
    "I’ll run one representative labeled test case. Case 01 expects a duration mismatch. I’ll load it into the auditor so we can see whether the system detects the expected problem.",
    "The original instruction requires power to be disconnected for 15 minutes, while the Hindi translation says 5 minutes. The translation is readable, but the operational requirement has changed.",
    "I’ll run the audit now."
])

doc.add_page_break()
doc.add_paragraph(style="Heading 1").add_run("Guided narration continued")

add_segment(doc, "2:15 to 2:50", "Explain the result", "Completed audit result", "Publication blocked, safety score, critical issue count, highlighted 15 minutes and 5 minutes, then the suggested action", "Move from the summary metrics down to the highlighted evidence in that order", [
    "The expected duration mismatch was detected. At the top, publication is blocked and the score reflects one critical issue. Here the tool highlights the exact source and target values, explains why the change matters, and suggests restoring 15 minutes.",
    "This focuses the reviewer on the risky part instead of asking them to inspect the entire document from scratch."
])

add_segment(doc, "2:50 to 3:15", "Failure handling and security", "AI status line above the audit evidence", "The Groq provider and model status, then the audit evidence message", "Keep the cursor away from the Download report button", [
    "The Groq key stays in a server-side environment variable and is never exposed in the browser. If the free AI service is unavailable or rate-limited, the application fails safely: deterministic findings are still displayed instead of treating the translation as approved."
])

add_segment(doc, "3:15 to 3:40", "Audit history and human review", "Recent audits and bilingual review controls", "One history record, its Report button, and the Correct finding, False positive, and Unsure choices", "Scroll steadily; do not click a reviewer verdict because it represents a human judgment", [
    "Each audit is saved locally with its score, findings, evidence, and latency. A reviewer can classify findings as correct, false positives, or uncertain. Reports can also be downloaded for discussion or audit evidence.",
    "For this prototype, history stays in the browser. A production version would use authenticated storage, organizational access controls, and consented customer data."
])

doc.add_page_break()
doc.add_paragraph(style="Heading 1").add_run("Evidence and architecture")

add_segment(doc, "3:40 to 4:15", "Validation results", "Phase 5 Validation Lab", "The 24 of 24 badge, 86 percent recall, 626 millisecond latency, zero dollar cost, then progress dots 21, 23, and 24", "Pause on the three missed dots after showing the headline metrics", [
    "I also created a 24-case pilot-style validation set across pharma, manufacturing, cold chain, warehousing, field service, and delivery.",
    "All 24 cases have been audited. The current run achieved 86 percent observed recall, with an average latency of 626 milliseconds and zero observed AI cost on the free tier.",
    "Three semantic categories were missed. I’m showing those failures deliberately because they reveal where the prompt, classification logic, or evaluation method needs improvement.",
    "Precision is not displayed yet because that requires verdicts from qualified bilingual reviewers. The system should not use its own output as ground truth."
])

add_segment(doc, "4:15 to 4:35", "Technical overview", "System architecture section near the bottom of the page", "Each stage from SOP pair to Rule engine to Semantic API to Human review", "Trace the arrows from left to right", [
    "Technically, this is a Next.js application deployed on Cloudflare. The deterministic engine runs in the browser, semantic review runs through a server-side API route, and Groq provides the free language model.",
    "My strongest language is Python, but I chose this stack to build and deploy the interactive prototype quickly. I understand the complete request flow, and the same backend architecture could be implemented with FastAPI."
])

doc.add_page_break()
doc.add_paragraph(style="Heading 1").add_run("Code walkthrough")

add_label_paragraph(doc, "SCREEN SETUP", "Switch to the editor with engine.js, app.js, route.ts, and pilot.js already open. Increase the editor font so three to five lines are readable.")

add_code_step(doc, "engine.js", "auditSop, parseSteps, extractQuantities, and compareQuantities", "This is the deterministic layer behind the live test case. It converts the two SOPs into steps, normalizes minutes and Hindi मिनट to the same unit, and compares 15 against 5. This logic is ordinary functions and regular expressions, so I could implement the same approach directly in Python.", [
    "const sourceSteps = parseSteps(sourceText);",
    "const targetSteps = parseSteps(targetText);",
    "compareQuantities(sourceSteps[index], targetSteps[index], index)",
])

add_code_step(doc, "app.js", "The audit button handler and mergeAuditFindings", "This is the request flow. The browser runs the deterministic checks first, calls the semantic API second, and merges both sets of findings into one result. If the API fails, the catch block preserves the deterministic result.", [
    "const deterministicAudit = GuardrailEngine.auditSop(...);",
    "const response = await fetch('/api/semantic-audit', ...);",
    "const mergedAudit = mergeAuditFindings(deterministicAudit, semanticFindings);",
])

add_code_step(doc, "route.ts", "process.env.GROQ_API_KEY, the Groq fetch call, and response_format", "The model call stays on the server so the key is never shipped to the browser. The route limits input size, times out slow requests, and requires structured JSON so the UI receives predictable finding objects.", [
    "const apiKey = process.env.GROQ_API_KEY;",
    "const groqResponse = await fetch('https://api.groq.com/...', ...);",
    "response_format: { type: 'json_schema', ... }",
])

add_code_step(doc, "pilot.js", "calculateMetrics and the recall calculation", "The dashboard does not invent its own success metric. It compares detected finding types against labeled expected outcomes. Precision remains blank until independent reviewers label findings as correct or false positives.", [
    "const detected = positiveCases.filter(...).length;",
    "const recall = Math.round((detected / positiveCases.length) * 100);",
    "const precision = labeled.length ? ... : null;",
])

doc.add_page_break()
doc.add_paragraph(style="Heading 1").add_run("Closing segment")

add_segment(doc, "5:25 to 5:50", "Close", "Return to the browser and show the architecture or hiring outreach section", "The deliberate limitation statement, then the two week pilot proposal", "Keep the cursor still for the final sentence", [
    "This is intentionally a decision-support tool, not an autonomous translation-certification system.",
    "My proposal would be a small validation using consented SOP pairs, one target language, and qualified bilingual reviewers. We would measure critical-error recall, finding precision, reviewer time saved, latency, and failure modes.",
    "I built this to demonstrate how I approach product engineering: start with a concrete risk, build a testable prototype, measure it honestly, and keep humans in control. Thank you for watching."
])

doc.add_paragraph(style="Heading 1").add_run("Recording checklist")
checklist = [
    "Keep the recording between five and six minutes.",
    "Run only one live audit.",
    "Make the source and target evidence readable.",
    "Point, pause, and explain; do not wave the cursor continuously.",
    "Show only the four prepared code locations instead of scrolling through entire files.",
    "State the 86 percent recall and the three misses without hiding them.",
    "Explain that precision requires bilingual reviewer labels.",
    "Mention the server-side API key and safe deterministic fallback.",
    "Acknowledge that Python is your strongest language without apologizing for it.",
    "End with a specific two-week validation proposal.",
]
for item in checklist:
    p = doc.add_paragraph(style="List Bullet")
    p.paragraph_format.space_after = Pt(1)
    p.add_run(item)

doc.core_properties.title = "SOP Sentinel Loom Tutorial Script"
doc.core_properties.subject = "Guided product demonstration script"
doc.core_properties.author = "Akshat"
doc.save(OUTPUT)
print(OUTPUT)
