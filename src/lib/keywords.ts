const STOP_WORDS = new Set([
  "a","about","above","after","again","against","all","am","an","and","any","are",
  "aren","arent","as","at","be","because","been","before","being","below","between",
  "both","but","by","can","cannot","could","couldn","couldnt","d","did","didn","didnt",
  "do","does","doesn","doesnt","doing","don","dont","down","during","each","few","for",
  "from","further","get","gets","got","had","hadn","hadnt","has","hasn","hasnt","have",
  "haven","havent","having","he","her","here","hers","herself","him","himself","his",
  "how","i","if","in","into","is","isn","isnt","it","its","itself","just","know","let",
  "ll","m","ma","me","might","mightn","more","most","much","must","mustn","my","myself",
  "need","no","nor","not","now","o","of","off","on","once","only","or","other","our",
  "ours","ourselves","out","over","own","re","really","s","same","say","says","she",
  "should","shouldn","shouldnt","so","some","such","t","than","that","the","their",
  "theirs","them","themselves","then","there","these","they","this","those","through",
  "to","too","under","until","up","us","ve","very","want","was","wasn","wasnt","we",
  "were","weren","werent","what","when","where","which","while","who","whom","why",
  "will","with","won","wont","would","wouldn","wouldnt","you","your","yours","yourself",
  "yourselves","also","like","think","make","right","look","come","good","new","well",
  "way","use","going","back","still","see","thing","things","time","take","people",
  "one","two","three","even","give","day","most","us","ok","okay","yes","yeah","hey",
  "hi","hello","thanks","thank","please","lol","lmao","omg","wow","haha","gonna",
  "wanna","gotta","kinda","sorta","maybe","idk","imo","imho","tbh","irl","btw","fyi",
]);

export function simpleStem(word: string): string {
  if (word.length < 5) return word;
  if (word.endsWith("ying") || word.endsWith("eing")) return word;
  if (word.endsWith("ness")) return word.slice(0, -4);
  if (word.endsWith("ment")) return word.slice(0, -4);
  if (word.endsWith("tion")) return word.slice(0, -4);
  if (word.endsWith("sion")) return word.slice(0, -4);
  if (word.endsWith("able")) return word.slice(0, -4);
  if (word.endsWith("ible")) return word.slice(0, -4);
  if (word.endsWith("ally")) return word.slice(0, -4);
  if (word.endsWith("ing")) return word.slice(0, -3);
  if (word.endsWith("ily")) return word.slice(0, -3);
  if (word.endsWith("ies")) return word.slice(0, -3) + "y";
  if (word.endsWith("ous")) return word.slice(0, -3);
  if (word.endsWith("ful")) return word.slice(0, -3);
  if (word.endsWith("ed") && word.length > 4) return word.slice(0, -2);
  if (word.endsWith("er") && word.length > 4) return word.slice(0, -2);
  if (word.endsWith("ly") && word.length > 4) return word.slice(0, -2);
  if (word.endsWith("es") && word.length > 4) return word.slice(0, -2);
  if (word.endsWith("s") && !word.endsWith("ss") && word.length > 4) return word.slice(0, -1);
  return word;
}

export interface KeywordEntry {
  keyword: string;
  weight: number;
}

export function extractKeywords(content: string | null | undefined): KeywordEntry[] {
  if (!content) return [];

  const keywords = new Map<string, number>();

  // Extract hashtags (weight 3.0)
  const hashtagRegex = /#(\w{2,})/g;
  let match;
  while ((match = hashtagRegex.exec(content)) !== null) {
    const tag = match[1].toLowerCase();
    keywords.set(`#${tag}`, Math.max(keywords.get(`#${tag}`) ?? 0, 3.0));
  }

  // Extract mentions (weight 2.0)
  const mentionRegex = /@(\w{2,})/g;
  while ((match = mentionRegex.exec(content)) !== null) {
    const mention = match[1].toLowerCase();
    keywords.set(`@${mention}`, Math.max(keywords.get(`@${mention}`) ?? 0, 2.0));
  }

  // Extract URL domains (weight 2.0)
  const urlRegex = /https?:\/\/([^\s/]+)/g;
  while ((match = urlRegex.exec(content)) !== null) {
    const domain = match[1].toLowerCase().replace(/^www\./, "");
    if (domain.length >= 3) {
      keywords.set(domain, Math.max(keywords.get(domain) ?? 0, 2.0));
    }
  }

  // Extract content words (weight 1.0)
  // Remove URLs, mentions, hashtags first
  const cleaned = content
    .replace(/https?:\/\/\S+/g, "")
    .replace(/@\w+/g, "")
    .replace(/#\w+/g, "");

  const words = cleaned.toLowerCase().match(/[a-z]{3,}/g) ?? [];
  for (const word of words) {
    if (STOP_WORDS.has(word)) continue;
    const stemmed = simpleStem(word);
    if (stemmed.length < 3) continue;
    if (STOP_WORDS.has(stemmed)) continue;
    if (!keywords.has(stemmed)) {
      keywords.set(stemmed, 1.0);
    }
  }

  return Array.from(keywords, ([keyword, weight]) => ({ keyword, weight }));
}
