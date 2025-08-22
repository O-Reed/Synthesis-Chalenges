export type TextStatsInput = { text: string; };
export type TextStatsOutput = { line_count: number; word_count: number; char_count: number; };

export async function text_stats(input: TextStatsInput): Promise<TextStatsOutput> {
  const line_count = input.text.split(/\r?\n/).length;
  const word_count = (input.text.trim().match(/\S+/g) || []).length;
  const char_count = input.text.length;
  return { line_count, word_count, char_count };
}
