export default function FrameworkEmphasis({ text }) {
  return text.split(/(<strong>.*?<\/strong>|division-wide implementation)/gi).map((part, index) => {
    if (part.toLowerCase().startsWith('<strong>')) {
      return <strong key={index}>{part.slice(8, -9)}</strong>;
    }

    if (part.toLowerCase() === 'division-wide implementation') {
      return <strong key={index}>{part}</strong>;
    }

    return part;
  });
}
