/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const content = fs.readFileSync('stitch.html', 'utf8');

// Extract body contents
const bodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
if (!bodyMatch) {
  console.error("No body found");
  process.exit(1);
}

let bodyContent = bodyMatch[1];
// Remove scripts at end if any
bodyContent = bodyContent.replace(/<script[\s\S]*?<\/script>/gi, '');

// Convert to JSX
bodyContent = bodyContent
  .replace(/class=/g, 'className=')
  .replace(/<!--([\s\S]*?)-->/g, '') // strip comments
  .replace(/<img(.*?)>/g, (m, attrs) => {
    // ensure self closing
    if (!attrs.trim().endsWith('/')) {
      return `<img${attrs} />`;
    }
    return m;
  })
  .replace(/<input(.*?)>/g, (m, attrs) => {
    // ensure self closing
    if (!attrs.trim().endsWith('/')) {
      return `<input${attrs} />`;
    }
    return m;
  })
  // fix typical style attributes if any (there is one style="background-image:...")
  .replace(/style="background-image:\s*radial-gradient\((.*?)\);\s*background-size:\s*(.*?);"/g, 'style={{ backgroundImage: "radial-gradient($1)", backgroundSize: "$2" }}');

const pageTsx = `export default function Home() {
  return (
    <>
${bodyContent}
    </>
  );
}
`;

fs.writeFileSync('app/page.tsx', pageTsx);
console.log("Converted successfully!");
