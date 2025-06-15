import axios from 'axios';
import * as cheerio from 'cheerio';

interface SearchResult {
  title: string;
  excerpt: string;
  votes: string;
}

export async function scrapeStackOverflow(query: string): Promise<SearchResult[]> {
  const searchUrl = `https://stackoverflow.com/search?q=${encodeURIComponent(query)}`;
  const response = await axios.get<string>(searchUrl);
  const $ = cheerio.load(response.data);
  
  const results: SearchResult[] = [];
  $('.s-post-summary').each((_: number, element: cheerio.Element) => {
    const title = $(element).find('.s-post-summary--content-title').text().trim();
    const excerpt = $(element).find('.s-post-summary--content-excerpt').text().trim();
    const votes = $(element).find('.s-post-summary--stats-item-number').first().text().trim();
    
    results.push({ title, excerpt, votes });
  });

  return results;
} 