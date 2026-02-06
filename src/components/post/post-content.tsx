const URL_REGEX = /https?:\/\/[^\s<]+/g;
const MENTION_REGEX = /@(\w+)/g;

interface PostContentProps {
  content: string;
}

export function PostContent({ content }: PostContentProps) {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  const combined = new RegExp(
    `(${URL_REGEX.source})|(${MENTION_REGEX.source})`,
    "g"
  );

  let match;
  while ((match = combined.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }

    if (match[1]) {
      parts.push(
        <a
          key={match.index}
          href={match[1]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyan hover:underline"
        >
          {match[1]}
        </a>
      );
    } else if (match[2]) {
      const username = match[3];
      parts.push(
        <a
          key={match.index}
          href={`/${username}`}
          className="text-cyan hover:underline"
        >
          @{username}
        </a>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return <p className="whitespace-pre-wrap break-words">{parts}</p>;
}
