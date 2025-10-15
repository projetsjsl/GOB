
export function mdToHtml(md: string) {
  return `<!doctype html><meta charset="utf-8">
  <body style="font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; line-height:1.55; padding:16px;">
    <div>${md.replace(/\n/g, "<br/>")}</div>
  </body>`;
}
