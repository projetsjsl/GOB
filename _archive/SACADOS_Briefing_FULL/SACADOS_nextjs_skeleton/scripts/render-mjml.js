
const mjml = require('mjml');
const fs = require('fs');
const input = fs.readFileSync('templates/email.mjml', 'utf8');
const { html, errors } = mjml(input, { minify: false });
if (errors && errors.length) console.error(errors);
fs.writeFileSync('templates/email.html', html, 'utf8');
console.log('Rendered templates/email.html');
