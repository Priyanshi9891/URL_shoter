function parseUA(ua = "") {
  const device = /bot|crawl|spider/i.test(ua) ? "Bot"
    : /ipad|tablet/i.test(ua) ? "Tablet"
    : /mobi|android|iphone/i.test(ua) ? "Mobile" : "Desktop";
  const browser = /edg\//i.test(ua) ? "Edge"
    : /opr\/|opera/i.test(ua) ? "Opera"
    : /firefox|fxios/i.test(ua) ? "Firefox"
    : /chrome|crios/i.test(ua) ? "Chrome"
    : /safari/i.test(ua) ? "Safari" : "Other";
  return { device, browser };
}
module.exports = { parseUA };
