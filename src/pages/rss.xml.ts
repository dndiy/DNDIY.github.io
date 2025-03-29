import rss from '@astrojs/rss';
import { getSortedPosts } from '@utils/content-utils';
import type { APIContext } from 'astro';
import { siteConfig } from '@/config';
import MarkdownIt from 'markdown-it';
import sanitizeHtml from 'sanitize-html';

const parser = new MarkdownIt({
  html: true,
  breaks: true,
  linkify: true,
});

export async function GET(context: APIContext) {
  const posts = await getSortedPosts();
  
  // Ensure we have a proper site URL
  const site = context.site || new URL('http://localhost:4322');
  const siteOrigin = site.origin;
  
  console.log('Generating RSS feed with base URL:', siteOrigin);

  return rss({
    title: siteConfig.title,
    description: siteConfig.subtitle || 'No description',
    site: siteOrigin,
    items: posts.map(post => {
      // Process content to ensure all image paths are absolute
      let processedContent = post.body;
      
      // Replace relative image paths in markdown with absolute URLs
      processedContent = processedContent.replace(
        /!\[(.*?)\]\((?!http|https)(.*?)\)/g, 
        (match, alt, src) => {
          if (!src.startsWith('/')) src = '/' + src;
          return `![${alt}](${siteOrigin}${src})`;
        }
      );
      
      // Replace relative image paths in HTML
      processedContent = processedContent.replace(
        /<img\s+[^>]*src=["'](?!http|https)(.*?)["'][^>]*>/g,
        (match, src) => {
          if (!src.startsWith('/')) src = '/' + src;
          return match.replace(src, `${siteOrigin}${src}`);
        }
      );

      // Render markdown to HTML with sanitization
      const content = sanitizeHtml(parser.render(processedContent), {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat([
          'img', 'video', 'audio', 'source', 'figure', 'figcaption', 'iframe'
        ]),
        allowedAttributes: {
          ...sanitizeHtml.defaults.allowedAttributes,
          img: ['src', 'alt', 'title', 'width', 'height', 'loading', 'class'],
          video: ['src', 'alt', 'width', 'height', 'controls', 'autoplay', 'muted', 'loop', 'class'],
          source: ['src', 'type'],
          audio: ['src', 'controls', 'autoplay', 'muted', 'loop', 'class'],
          iframe: ['src', 'width', 'height', 'frameborder', 'allowfullscreen', 'class']
        }
      });

      // Process featured image to ensure it's absolute
      let featuredImage = post.data.image || '';
      if (featuredImage && !featuredImage.startsWith('http')) {
        featuredImage = `${siteOrigin}${featuredImage.startsWith('/') ? '' : '/'}${featuredImage}`;
      }

      // Create custom frontmatter data block
      const frontmatterData = Object.entries(post.data)
        .filter(([key, value]) => 
          // Filter out function properties and complex objects
          typeof value !== 'function' && 
          !key.startsWith('_') && 
          value !== undefined
        )
        .map(([key, value]) => {
          // Format value based on type
          let formattedValue = '';
          if (Array.isArray(value)) {
            formattedValue = value.join(',');
          } else if (typeof value === 'object' && value !== null) {
            try {
              formattedValue = JSON.stringify(value);
            } catch (e) {
              formattedValue = String(value);
            }
          } else {
            formattedValue = String(value);
          }
          
          // Create XML element with CDATA if needed
          const needsCDATA = formattedValue.includes('<') || formattedValue.includes('&');
          return needsCDATA 
            ? `<${key}><![CDATA[${formattedValue}]]></${key}>`
            : `<${key}>${formattedValue}</${key}>`;
        })
        .join('\n');

      // Create the RSS item
      return {
        title: post.data.title,
        pubDate: new Date(post.data.published),
        description: post.data.description || '',
        link: `${siteOrigin}/posts/${post.slug}/`,
        content: content,
        customData: `<frontmatter>${frontmatterData}</frontmatter>`,
        // Add categories from tags
        categories: Array.isArray(post.data.tags) ? post.data.tags : [],
        // Add enclosure for featured image if present
        ...(featuredImage && {
          enclosure: {
            url: featuredImage,
            type: 'image/jpeg', // Adjust as needed
            length: 0
          }
        })
      };
    }),
    customData: `<language>${siteConfig.lang}</language>`,
  });
}