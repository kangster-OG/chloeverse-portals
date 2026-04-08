const SHEET_NAME = "Waitlist";
const NOTIFY_EMAIL = "replace-me@example.com";

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || "{}");
    const email = String(payload.email || "").trim();
    const source = String(payload.source || "startup").trim();
    const submittedAt = String(payload.submittedAt || new Date().toISOString()).trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return jsonResponse({ ok: false, error: "Invalid email." });
    }

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["timestamp", "email", "source"]);
    }

    sheet.appendRow([submittedAt, email, source]);

    MailApp.sendEmail({
      to: NOTIFY_EMAIL,
      subject: "New startup waitlist signup",
      htmlBody: "<p>A new waitlist email was captured.</p>" +
        "<p><strong>Email:</strong> " + sanitize(email) + "</p>" +
        "<p><strong>Source:</strong> " + sanitize(source) + "</p>" +
        "<p><strong>Submitted:</strong> " + sanitize(submittedAt) + "</p>",
    });

    return jsonResponse({ ok: true });
  } catch (error) {
    return jsonResponse({ ok: false, error: String(error) });
  }
}

function jsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}

function sanitize(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
}
