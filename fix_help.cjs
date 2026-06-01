const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf8');

// Remove duplicate useState
c = c.replace(
  "  const [showHelp, setShowHelp] = useState(false);\n  const [showHelp, setShowHelp] = useState(false);",
  "  const [showHelp, setShowHelp] = useState(false);"
);

// Find the second help button block and remove it
const firstHelp = c.indexOf("        <div className='flex justify-end mb-1'>");
const secondHelp = c.indexOf("        <div className='flex justify-end mb-1'>", firstHelp + 1);
if(secondHelp !== -1) {
  // Find the end of second block - the closing of the second showHelp conditional
  const endMarker = "        {inputMode === 'type' ? (<KeyboardMode";
  const secondEnd = c.indexOf(endMarker, secondHelp);
  c = c.slice(0, secondHelp) + c.slice(secondEnd);
  console.log('Removed duplicate help block');
} else {
  console.log('No duplicate found');
}

fs.writeFileSync('src/App.tsx', c);
console.log('Done');
