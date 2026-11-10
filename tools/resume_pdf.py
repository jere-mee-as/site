"""resume.pdf: the résumé sheet on one Letter page, in Geist, in the sheet's order.

Run through `python tools/make_assets.py resume` (needs reportlab). Reads the "resume" part
of site.json, so the sheet on the page and the PDF never disagree. Email only: no phone.
"""
from io import BytesIO
from xml.sax.saxutils import escape

INK, INK2, MUTE, LINE = "#1b2129", "#333c47", "#56606b", "#d9dee4"


def _story(r, size, styles):
    from reportlab.platypus import Paragraph, Spacer, Table, TableStyle, KeepTogether
    from reportlab.lib.units import inch
    P = lambda text, st: Paragraph(text, styles[st])
    s = []
    s.append(P(escape(r["name"]), "name"))
    email = escape(r["email"])
    s.append(P(f'{escape(r["headline"])} · {escape(r["location"])} · <a href="mailto:{email}" color="{MUTE}">{email}</a>', "meta"))
    s.append(Spacer(1, size * .8))
    s.append(P(escape(r["summary"]), "summary"))

    def dated(left, right, st_left, st_right):
        t = Table([[P(left, st_left), P(right, st_right)]], colWidths=[None, 1.6 * inch])
        t.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "BOTTOM"), ("LEFTPADDING", (0, 0), (-1, -1), 0),
                               ("RIGHTPADDING", (0, 0), (-1, -1), 0), ("TOPPADDING", (0, 0), (-1, -1), 0),
                               ("BOTTOMPADDING", (0, 0), (-1, -1), 0)]))
        return t

    for sec in r["sections"]:
        s.append(P(escape(sec["title"]), "sec"))
        for j in sec.get("jobs", []):
            block = [P(f'{escape(j["org"])} <font name="Geist" size="{size * .92:.2f}" color="{MUTE}">· {escape(j["where"])}</font>', "org")]
            for role in j["roles"]:
                block.append(dated(escape(role["title"]), escape(role["dates"]), "role", "dates"))
                for b in role.get("bullets", []):
                    block.append(Paragraph(escape(b), styles["li"], bulletText="–"))
                if role.get("note"):
                    block.append(P(escape(role["note"]), "note"))
            s.append(KeepTogether(block[:3]))
            s.extend(block[3:])
            s.append(Spacer(1, size * .3))
        if sec.get("skills"):
            rows = [[P(escape(a), "dt"), P(escape(b), "dd")] for a, b in sec["skills"]]
            t = Table(rows, colWidths=[1.05 * inch, None])
            t.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0),
                                   ("RIGHTPADDING", (0, 0), (-1, -1), 0), ("TOPPADDING", (0, 0), (-1, -1), size * .12),
                                   ("BOTTOMPADDING", (0, 0), (-1, -1), size * .12)]))
            s.append(t)
        for b in sec.get("bullets", []):
            s.append(Paragraph(escape(b), styles["li"], bulletText="–"))
    return s


def _styles(size):
    from reportlab.lib.styles import ParagraphStyle
    lead = size * 1.3
    base = dict(fontName="Geist", fontSize=size, leading=lead, textColor=INK2)
    return {
        "name": ParagraphStyle("name", fontName="Geist-Medium", fontSize=size * 2.15, leading=size * 2.5, textColor=INK),
        "meta": ParagraphStyle("meta", **{**base, "textColor": MUTE, "spaceBefore": size * .2}),
        "summary": ParagraphStyle("summary", **base),
        "sec": ParagraphStyle("sec", fontName="Geist-Medium", fontSize=size * .95, leading=lead, textColor=MUTE,
                              spaceBefore=size * 1.0, spaceAfter=size * .2),
        "org": ParagraphStyle("org", fontName="Geist-Medium", fontSize=size * 1.08, leading=lead, textColor=INK, leftIndent=size),
        "role": ParagraphStyle("role", **{**base, "textColor": INK, "leftIndent": size, "spaceBefore": size * .3}),
        "dates": ParagraphStyle("dates", **{**base, "textColor": MUTE, "alignment": 2, "fontSize": size * .92}),
        "li": ParagraphStyle("li", **{**base, "leftIndent": size * 2.6, "bulletIndent": size * 1.25, "bulletFontSize": size * .8,
                                      "bulletColor": MUTE, "spaceBefore": size * .06}),
        "note": ParagraphStyle("note", **{**base, "textColor": MUTE, "leftIndent": size, "fontSize": size * .92}),
        "dt": ParagraphStyle("dt", **{**base, "textColor": MUTE, "leftIndent": size, "fontSize": size * .92}),
        "dd": ParagraphStyle("dd", **base),
    }


def build(data, out, font_dir):
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.units import inch
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    from reportlab.platypus import SimpleDocTemplate
    from reportlab.lib.styles import ParagraphStyle  # noqa: F401  (imported for _styles)

    for name, f in (("Geist", "Geist-Regular.ttf"), ("Geist-Medium", "Geist-Medium.ttf"), ("Geist-Light", "Geist-Light.ttf")):
        pdfmetrics.registerFont(TTFont(name, str(font_dir / f)))
    pdfmetrics.registerFontFamily("Geist", normal="Geist", bold="Geist-Medium", italic="Geist", boldItalic="Geist-Medium")

    r = data["resume"]

    def footer(c, doc):
        c.saveState()
        c.setFont("Geist", 7.5)
        c.setFillColor(MUTE)
        c.drawRightString(letter[0] - doc.rightMargin, 0.36 * inch, f"jere.ing · Résumé · {r['updated']}")
        c.linkURL("https://jere.ing/#resume", (letter[0] - doc.rightMargin - 1.6 * inch, 0.3 * inch, letter[0] - doc.rightMargin, 0.46 * inch))
        c.restoreState()

    # The largest type that still fits on one page.
    size = 10.2
    while True:
        buf = BytesIO()
        doc = SimpleDocTemplate(buf, pagesize=letter, leftMargin=0.6 * inch, rightMargin=0.6 * inch,
                                topMargin=0.55 * inch, bottomMargin=0.6 * inch,
                                title=f"{r['name']} · Résumé", author="Jeremias", subject=r["headline"], creator="jere.ing")
        doc.build(_story(r, size, _styles(size)), onFirstPage=footer, onLaterPages=footer)
        if doc.page == 1 or size <= 7.6:
            break
        size = round(size - 0.1, 2)
    out.write_bytes(buf.getvalue())
    print(f"{out.name}: {doc.page} page, body {size}pt, {out.stat().st_size / 1024:.1f} KB")
