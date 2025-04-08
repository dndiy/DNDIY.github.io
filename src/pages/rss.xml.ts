import { siteConfig } from '@/config/config'
import rss from '@astrojs/rss'
import { getSortedPosts } from '@utils/content-utils'
import type { APIContext } from 'astro'
import MarkdownIt from 'markdown-it'
import sanitizeHtml from 'sanitize-html'
import { createCORSResponse, handleCORS } from '../middleware/cors'

const parser = new MarkdownIt()

export async function GET(context: APIContext) {
  // Handle preflight requests
  const corsResponse = handleCORS(context);
  if (corsResponse) return corsResponse;
  
  // Get posts
  const blog = await getSortedPosts()
  
  // Generate RSS feed
  const response = await rss({
    title: siteConfig.title,
    description: siteConfig.subtitle || 'No description',
    site: context.site ?? (context.url ? context.url.origin : 'https://dndiy.org'),
    items: blog.map(post => {
      return {
        title: post.data.title,
        pubDate: post.data.published,
        description: post.data.description || '',
        link: `/posts/${post.slug}/`,
        content: sanitizeHtml(parser.render(post.body), {
          allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
        }),
      }
    }),
    customData: `<language>${siteConfig.lang}</language>`,
  })
  
  // Add CORS headers to the response
  return createCORSResponse(response);
}