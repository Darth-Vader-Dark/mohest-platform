const fs = require('fs');
const path = require('path');

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

// Clean and create dist directory
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  fs.rmSync(distPath, { recursive: true, force: true });
}
fs.mkdirSync(distPath, { recursive: true });

// Copy directories
console.log('Copying public-site...');
copyRecursiveSync(path.join(__dirname, 'public-site'), path.join(distPath, 'public-site'));

console.log('Copying enterprise-portal...');
copyRecursiveSync(path.join(__dirname, 'enterprise-portal'), path.join(distPath, 'enterprise-portal'));

// Copy root flag
const flagSrc = path.join(__dirname, 'SouthSudanFlag.svg');
if (fs.existsSync(flagSrc)) {
  console.log('Copying SouthSudanFlag.svg...');
  fs.copyFileSync(flagSrc, path.join(distPath, 'SouthSudanFlag.svg'));
}

// Create redirect index.html
console.log('Creating redirect index.html...');
const redirectHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Redirecting...</title>
  <meta http-equiv="refresh" content="0; url=/public-site/index.html">
  <script>
    window.location.replace("/public-site/index.html");
  </script>
</head>
<body>
  <p>Redirecting to <a href="/public-site/index.html">MoHEST homepage</a>...</p>
</body>
</html>
`;
fs.writeFileSync(path.join(distPath, 'index.html'), redirectHtml, 'utf8');

console.log('Build completed successfully!');
