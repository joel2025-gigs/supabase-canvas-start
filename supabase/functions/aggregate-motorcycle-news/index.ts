import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RSSItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  imageUrl?: string;
}

// Function to extract image from HTML description
function extractImageUrl(description: string): string | undefined {
  const imgRegex = /<img[^>]+src="([^">]+)"/;
  const match = description.match(imgRegex);
  return match ? match[1] : undefined;
}

// Function to parse RSS feed
async function parseRSSFeed(url: string): Promise<RSSItem[]> {
  try {
    const response = await fetch(url);
    const text = await response.text();
    
    const items: RSSItem[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const matches = text.matchAll(itemRegex);
    
    for (const match of matches) {
      const itemXml = match[1];
      
      const titleMatch = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/);
      const linkMatch = itemXml.match(/<link>(.*?)<\/link>/);
      const descMatch = itemXml.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>|<description>(.*?)<\/description>/);
      const dateMatch = itemXml.match(/<pubDate>(.*?)<\/pubDate>/);
      
      if (titleMatch && linkMatch) {
        const description = descMatch?.[1] || descMatch?.[2] || '';
        const imageUrl = extractImageUrl(description);
        
        items.push({
          title: titleMatch[1] || titleMatch[2] || '',
          link: linkMatch[1] || '',
          description: description,
          pubDate: dateMatch?.[1] || new Date().toISOString(),
          imageUrl: imageUrl,
        });
      }
    }
    
    return items;
  } catch (error) {
    console.error(`Error parsing RSS feed ${url}:`, error);
    return [];
  }
}

// Function to create a slug from title
function createSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// Function to strip HTML tags
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting boda boda financing news aggregation...');

    // RSS feeds focused on boda boda financing in Uganda
    const feeds = [
      'https://news.google.com/rss/search?q=boda+boda+financing+Uganda&hl=en-UG&gl=UG&ceid=UG:en',
      'https://news.google.com/rss/search?q=boda+boda+loan+Uganda&hl=en-UG&gl=UG&ceid=UG:en',
      'https://news.google.com/rss/search?q=motorcycle+finance+Uganda&hl=en-UG&gl=UG&ceid=UG:en',
      'https://news.google.com/rss/search?q=boda+boda+credit+Uganda&hl=en-UG&gl=UG&ceid=UG:en',
      'https://news.google.com/rss/search?q=boda+boda+investment+Uganda&hl=en-UG&gl=UG&ceid=UG:en',
    ];

    let totalAdded = 0;
    const allItems: RSSItem[] = [];

    // Fetch all feeds
    for (const feedUrl of feeds) {
      console.log(`Fetching feed: ${feedUrl}`);
      const items = await parseRSSFeed(feedUrl);
      allItems.push(...items);
    }

    console.log(`Total items fetched: ${allItems.length}`);

    // Remove duplicates based on title
    const uniqueItems = allItems.filter((item, index, self) =>
      index === self.findIndex((t) => t.title === item.title)
    );

    console.log(`Unique items: ${uniqueItems.length}`);

    // Process each item
    for (const item of uniqueItems) {
      const slug = createSlug(item.title);
      
      // Check if article already exists
      const { data: existing } = await supabase
        .from('blog_posts')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();

      if (existing) {
        console.log(`Article already exists: ${item.title}`);
        continue;
      }

      // Create excerpt from description
      const excerpt = stripHtml(item.description).substring(0, 200) + '...';
      
      // Create content with link to original article
      const content = `
${stripHtml(item.description)}

**Read the full article here:** [${item.title}](${item.link})

*This article was automatically aggregated from external news sources.*
      `.trim();

      // Insert new blog post with image
      const { error: insertError } = await supabase
        .from('blog_posts')
        .insert({
          title: item.title,
          slug: slug,
          excerpt: excerpt,
          content: content,
          published: true,
          published_at: new Date(item.pubDate).toISOString(),
          featured_image: item.imageUrl || null,
        });

      if (insertError) {
        console.error(`Error inserting article: ${item.title}`, insertError);
      } else {
        console.log(`Added article: ${item.title}`);
        totalAdded++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully processed ${uniqueItems.length} articles, added ${totalAdded} new posts`,
        totalProcessed: uniqueItems.length,
        totalAdded: totalAdded,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in aggregate-motorcycle-news function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
