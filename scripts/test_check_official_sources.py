import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import check_official_sources as checker  # noqa: E402

PAGE = b"""<html><head><script>var hidden = 'planned to start in May';</script></head><body>
<p>The first part is planned to start in&nbsp;November 2026.</p>
<h2>Latest updates</h2>
<p>21/09/2026 - Members of the Selection Board</p>
<p>18/09/2026 - AD5 graduates testing \xe2\x80\x93 more details</p>
<h2>Prepare for the online tests</h2><a href="/node/20693">Instructions</a>
</body></html>"""


def fake_fetcher(pages):
    def fetch(url):
        if url not in pages:
            raise ConnectionError(f"{url}: blocked")
        return pages[url]
    return fetch


def html_response(body, status=200):
    return checker.Response(status, "https://example.org", "text/html; charset=utf-8", body)


class ClaimTests(unittest.TestCase):
    claim = {
        "id": "competition-page",
        "url": "https://selection.eu-careers.europa.eu/page",
        "mustContain": ["planned to start in November 2026"],
        "mustLinkTo": ["/node/20693"],
        "latestUpdate": "21/09/2026 - Members of the Selection Board",
    }

    def test_unchanged_page_passes(self):
        findings = checker.check_claims([self.claim], fake_fetcher({self.claim["url"]: html_response(PAGE)}))
        self.assertEqual([finding.level for finding in findings], ["ok"])

    def test_missing_phrase_is_reported_as_change(self):
        claim = {**self.claim, "mustContain": ["planned to start in December 2026"]}
        findings = checker.check_claims([claim], fake_fetcher({claim["url"]: html_response(PAGE)}))
        self.assertEqual([finding.level for finding in findings], ["change"])
        self.assertIn("December 2026", findings[0].message)

    def test_script_text_does_not_satisfy_a_claim(self):
        claim = {**self.claim, "mustContain": ["planned to start in May"], "latestUpdate": None}
        findings = checker.check_claims([claim], fake_fetcher({claim["url"]: html_response(PAGE)}))
        self.assertEqual(findings[0].level, "change")

    def test_new_latest_update_is_reported(self):
        newer = PAGE.replace(b"<h2>Latest updates</h2>", b"<h2>Latest updates</h2><p>02/11/2026 - Part 1 testing dates</p>")
        findings = checker.check_claims([self.claim], fake_fetcher({self.claim["url"]: html_response(newer)}))
        self.assertEqual(findings[0].level, "change")
        self.assertIn("02/11/2026 - part 1 testing dates", findings[0].message)

    def test_missing_link_and_http_errors_fail(self):
        unlinked = PAGE.replace(b"/node/20693", b"/node/99999")
        findings = checker.check_claims([self.claim], fake_fetcher({self.claim["url"]: html_response(unlinked)}))
        self.assertTrue(any("link /node/20693" in finding.message for finding in findings))
        gone = checker.check_claims([self.claim], fake_fetcher({self.claim["url"]: html_response(b"", status=403)}))
        self.assertEqual(gone[0].level, "fail")

    def test_pdf_without_pdftotext_is_inconclusive(self):
        claim = {"id": "pdf", "url": "https://selection.eu-careers.europa.eu/doc.pdf", "mustContain": ["x"]}
        response = checker.Response(200, claim["url"], "application/pdf", b"%PDF-1.7")
        findings = checker.check_claims([claim], fake_fetcher({claim["url"]: response}), pdf_reader=lambda body: None)
        self.assertEqual(findings[0].level, "warn")


class LinkTests(unittest.TestCase):
    def test_retired_host_fails_without_a_request(self):
        findings = checker.check_links({"https://eu-careers.europa.eu/en/page": {"src/a.ts"}}, fake_fetcher({}))
        self.assertEqual(findings[0].level, "fail")
        self.assertIn("selection.eu-careers.europa.eu", findings[0].message)

    def test_status_classification(self):
        urls = {
            "https://selection.eu-careers.europa.eu/ok": {"a"},
            "https://selection.eu-careers.europa.eu/gone": {"b"},
            "https://eur-lex.europa.eu/eli/C/2026/711/oj/eng": {"c"},
            "https://www.ucat.ac.uk/": {"d"},
        }
        pages = {
            "https://selection.eu-careers.europa.eu/ok": html_response(b"", 200),
            "https://selection.eu-careers.europa.eu/gone": html_response(b"", 404),
            "https://eur-lex.europa.eu/eli/C/2026/711/oj/eng": html_response(b"", 202),
        }
        levels = {finding.subject: finding.level for finding in checker.check_links(urls, fake_fetcher(pages))}
        self.assertEqual(levels["https://selection.eu-careers.europa.eu/ok"], "ok")
        self.assertEqual(levels["https://selection.eu-careers.europa.eu/gone"], "fail")
        self.assertEqual(levels["https://eur-lex.europa.eu/eli/C/2026/711/oj/eng"], "warn")
        self.assertEqual(levels["https://www.ucat.ac.uk/"], "warn")

    def test_collect_urls_skips_tests_placeholders_and_templates(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "src").mkdir()
            (root / "content").mkdir()
            (root / "src" / "data.ts").write_text(
                "const a = 'https://selection.eu-careers.europa.eu/en/x.';\n"
                "const b = `https://example.org/${id}`;\n"
                "placeholder=\"https://…\"\n"
                "const c = 'https://study.example.com/app';\n",
                encoding="utf-8",
            )
            (root / "src" / "data.test.ts").write_text("'https://selection.eu-careers.europa.eu/test-only'", encoding="utf-8")
            (root / "README.md").write_text("[EUR-Lex](https://eur-lex.europa.eu/eli/C/2026/711/oj/eng).", encoding="utf-8")
            urls = checker.collect_urls(root)
        self.assertEqual(sorted(urls), ["https://eur-lex.europa.eu/eli/C/2026/711/oj/eng", "https://selection.eu-careers.europa.eu/en/x"])


class ReportTests(unittest.TestCase):
    def test_report_groups_findings(self):
        report = checker.render_report([
            checker.Finding("fail", "a", "HTTP 404"),
            checker.Finding("change", "b", "New EPSO update"),
            checker.Finding("ok", "c", "HTTP 200"),
        ], "2026-10-09 05:00 UTC")
        self.assertIn("1 failed, 1 changed, 0 inconclusive, 1 OK", report)
        self.assertIn("## Changed on the official site", report)
        self.assertNotIn("Everything the app cites", report)


if __name__ == "__main__":
    unittest.main()
