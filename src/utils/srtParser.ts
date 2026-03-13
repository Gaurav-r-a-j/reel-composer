import { SRTItem } from '../../types';

const timeToSeconds = (timeString: string): number => {
  const parts = timeString.trim().split(':');
  if (parts.length < 3) return 0;
  const [hours, minutes, secsPart] = parts;
  const separator = secsPart?.includes(',') ? ',' : '.';
  const [secs, ms] = (secsPart ?? '0').split(separator);
  const h = parseInt(hours ?? '0', 10) || 0;
  const m = parseInt(minutes ?? '0', 10) || 0;
  const s = parseInt(secs ?? '0', 10) || 0;
  const millis = parseInt(ms ?? '0', 10) || 0;
  return h * 3600 + m * 60 + s + millis / 1000;
};

export const parseSRT = (data: string): SRTItem[] => {
  const normalizedData = data.replace(/\r\n/g, '\n');
  const blocks = normalizedData.split('\n\n');
  const items: SRTItem[] = [];

  blocks.forEach((block) => {
    const lines = block.split('\n').filter(line => line.trim() !== '');
    // Some blocks might just be index and time, no text, or just text.
    // Robust parsing: Look for the arrow '-->'

    if (lines.length >= 2) {
      let timeLineIndex = -1;

      // Find the line with the timestamp arrow
      for(let i=0; i<lines.length; i++) {
        if (lines[i].includes('-->')) {
           timeLineIndex = i;
           break;
        }
      }

      if (timeLineIndex !== -1) {
        // ID is usually the line before time, or inferred
        const id = timeLineIndex > 0 ? parseInt(lines[timeLineIndex - 1], 10) : items.length + 1;
        const timeLine = lines[timeLineIndex];
        const textLines = lines.slice(timeLineIndex + 1);

        const [start, end] = timeLine.split(' --> ');

        if (start && end) {
          items.push({
            id: isNaN(id) ? items.length + 1 : id,
            startTime: timeToSeconds(start.trim()),
            endTime: timeToSeconds(end.trim()),
            text: textLines.join('\n').trim(),
          });
        }
      }
    }
  });

  return items;
};
