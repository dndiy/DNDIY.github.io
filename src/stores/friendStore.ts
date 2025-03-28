// src/stores/friendStore.ts
import { writable, derived, get } from 'svelte/store';

// Type definitions
export interface FriendPost {
  id: string;
  title: string;
  slug?: string;
  description?: string;
  published: string;
  content?: string;
  sourceUrl?: string;
  tags?: string[];
  friendName?: string;
  friendUrl?: string;
  friendAvatar?: string | null;
  isFriendContent?: boolean;
}

export interface Friend {
  id: string;
  name: string;
  url: string;
  bio?: string;
  avatar?: string;
  lastSynced?: string;
  postCount: number;
  posts: FriendPost[];
}

// Constants for localStorage keys
const FRIENDS_STORAGE_KEY = 'blogFriends';
const FRIEND_CONTENT_ENABLED_KEY = 'friendContentEnabled';

// Create stores
export const temporaryFriends = writable<Friend[]>([]);
export const permanentFriends = writable<any[]>([]);

// Initialize from localStorage if in browser
if (typeof window !== 'undefined') {
  try {
    const storedFriends = localStorage.getItem(FRIENDS_STORAGE_KEY);
    if (storedFriends) {
      temporaryFriends.set(JSON.parse(storedFriends));
    }
  } catch (error) {
    console.error('Error loading friends from localStorage:', error);
  }
}

// Save to localStorage when the store changes
temporaryFriends.subscribe(friends => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(FRIENDS_STORAGE_KEY, JSON.stringify(friends));
  }
});

// Helper functions
export function getFriends(): Friend[] {
  return get(temporaryFriends);
}

export function addFriend(friend: Friend): void {
  temporaryFriends.update(friends => [...friends, friend]);
}

export function removeFriend(id: string): void {
  temporaryFriends.update(friends => friends.filter(f => f.id !== id));
}

export function updateFriend(updatedFriend: Friend): void {
  temporaryFriends.update(friends => 
    friends.map(f => f.id === updatedFriend.id ? updatedFriend : f)
  );
}

export function isFriendContentEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(FRIEND_CONTENT_ENABLED_KEY) !== 'false';
}

export function getFriendContent(): FriendPost[] {
  const friends = get(temporaryFriends);
  let allPosts: FriendPost[] = [];
  
  friends.forEach(friend => {
    if (friend.posts && friend.posts.length > 0) {
      const posts = friend.posts.map(post => ({
        ...post,
        friendName: friend.name,
        friendUrl: friend.url,
        friendAvatar: friend.avatar,
        isFriendContent: true
      }));
      allPosts = [...allPosts, ...posts];
    }
  });
  
  // Sort by date (newest first)
  return allPosts.sort((a, b) => 
    new Date(b.published).getTime() - new Date(a.published).getTime()
  );
}

// Format URL for consistency
export function formatUrl(url: string): string {
  let cleanUrl = url;
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    cleanUrl = 'https://' + url;
  }
  if (cleanUrl.endsWith('/')) {
    cleanUrl = cleanUrl.slice(0, -1);
  }
  return cleanUrl;
}

// Validate site and extract author info from HTML
export async function validateSite(url: string): Promise<{
  valid: boolean;
  message: string;
  siteInfo?: {
    name?: string;
    description?: string;
    avatar?: string;
    url?: string;
  }
}> {
  try {
    const formattedUrl = formatUrl(url);
    console.log('Validating site:', formattedUrl);
    
    // Fetch the homepage HTML
    try {
      const response = await fetch(formattedUrl, { 
        method: 'GET',
        headers: { 'Accept': 'text/html' },
        mode: 'cors'
      });
      
      if (response.ok) {
        console.log('Site exists, fetched HTML successfully');
        const html = await response.text();
        
        // Create a DOM parser to extract info from HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Extract site info from meta tags and other common elements
        const siteName = doc.querySelector('meta[property="og:site_name"]')?.getAttribute('content') || 
                         doc.querySelector('title')?.textContent?.split('|')[0]?.trim() ||
                         doc.querySelector('h1')?.textContent?.trim();
                         
        const siteDescription = doc.querySelector('meta[name="description"]')?.getAttribute('content') ||
                               doc.querySelector('meta[property="og:description"]')?.getAttribute('content');
        
        const siteLogo = doc.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
                        doc.querySelector('link[rel="icon"]')?.getAttribute('href');
                        
        // Try to find author info
        const authorName = doc.querySelector('.author-name, [class*="author"], [id*="author"]')?.textContent?.trim() ||
                          doc.querySelector('meta[name="author"]')?.getAttribute('content');
                          
        // Build site info from what we found
        const siteInfo = {
          name: siteName || new URL(formattedUrl).hostname.replace('www.', ''),
          description: siteDescription || '',
          avatar: siteLogo ? new URL(siteLogo, formattedUrl).href : '',
          url: formattedUrl
        };
        
        console.log('Extracted site info from HTML:', siteInfo);
        
        return {
          valid: true,
          message: 'Site exists and information extracted',
          siteInfo
        };
      } else {
        console.log(`Failed to fetch site HTML: ${response.status}`);
      }
    } catch (error) {
      console.log('Error fetching site HTML:', error);
    }
    
    // Fallback to just using the hostname
    const hostname = new URL(formattedUrl).hostname;
    const siteName = hostname.replace('www.', '');
    
    return { 
      valid: true, 
      message: 'Could not extract site info, using defaults',
      siteInfo: {
        name: siteName,
        description: 'No description available',
        avatar: '',
        url: formattedUrl
      }
    };
  } catch (error) {
    console.error('Error in validateSite:', error);
    return {
      valid: true,
      message: 'Error validating site, but we will try to add it anyway',
      siteInfo: {
        name: new URL(formatUrl(url)).hostname.replace('www.', ''),
        description: 'No description available',
        avatar: '',
        url: formatUrl(url)
      }
    };
  }
}

// Fetch blog posts by checking common Astro endpoints and HTML scraping
export async function fetchFriendContent(friendUrl: string): Promise<FriendPost[]> {
  try {
    const formattedUrl = formatUrl(friendUrl);
    console.log(`Fetching content from ${formattedUrl}`);
    
    // Method 1: Try RSS feed first (common in blogs)
    try {
      const rssUrl = `${formattedUrl}/rss.xml`;
      console.log('Checking for RSS feed:', rssUrl);
      
      const response = await fetch(rssUrl, { 
        method: 'GET',
        headers: { 'Accept': 'application/xml, text/xml' },
        mode: 'cors'
      });
      
      if (response.ok) {
        const rssText = await response.text();
        console.log('Found RSS feed, parsing...');
        
        // Parse RSS XML
        const parser = new DOMParser();
        const rssDoc = parser.parseFromString(rssText, 'application/xml');
        
        // Extract posts from RSS items
        const items = Array.from(rssDoc.querySelectorAll('item, entry'));
        
        if (items.length > 0) {
          console.log(`Found ${items.length} posts in RSS feed`);
          
          return items.map((item, index) => {
            const title = item.querySelector('title')?.textContent || `Post ${index + 1}`;
            const link = item.querySelector('link')?.textContent || `${formattedUrl}/post-${index}`;
            const description = item.querySelector('description, summary')?.textContent || '';
            const pubDate = item.querySelector('pubDate, published')?.textContent;
            const published = pubDate ? new Date(pubDate).toISOString() : new Date().toISOString();
            const content = item.querySelector('content\\:encoded, content')?.textContent || description;
            
            // Create URL object to extract slug
            const postUrl = new URL(link);
            const pathParts = postUrl.pathname.split('/').filter(Boolean);
            const slug = pathParts[pathParts.length - 1] || `post-${index}`;
            
            return {
              id: `rss-${slug}`,
              title,
              slug,
              description: description?.substring(0, 150) || '',
              published,
              content,
              sourceUrl: link,
              tags: []
            };
          });
        }
      }
    } catch (error) {
      console.log('Error fetching RSS feed:', error);
    }
    
    // Method 2: Check for common Astro API endpoints
    try {
      const apiUrl = `${formattedUrl}/api/posts.json`;
      console.log('Checking for posts API:', apiUrl);
      
      const response = await fetch(apiUrl, { 
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        mode: 'cors'
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Found posts API, parsing data');
        
        if (data.posts && Array.isArray(data.posts) && data.posts.length > 0) {
          console.log(`Found ${data.posts.length} posts in API response`);
          
          return data.posts.map(post => ({
            id: post.id || post.slug || `post-${Date.now()}-${Math.random().toString(36).substring(2,7)}`,
            title: post.title || 'Untitled',
            slug: post.slug || '',
            description: post.description || post.excerpt || '',
            published: post.published || post.date || new Date().toISOString(),
            content: post.content || post.body || '',
            sourceUrl: post.url || `${formattedUrl}/${post.slug || ''}`,
            tags: post.tags || []
          }));
        }
      }
    } catch (error) {
      console.log('Error fetching posts API:', error);
    }
    
    // Method 3: Scrape HTML for blog posts
    try {
      console.log('Scraping HTML for blog posts');
      
      const response = await fetch(formattedUrl, { 
        method: 'GET',
        headers: { 'Accept': 'text/html' },
        mode: 'cors'
      });
      
      if (response.ok) {
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Look for common blog post containers
        const possibleContainers = [
          'main', '.posts', '.blog-posts', '.post-list', 
          '[class*="post"]', '[class*="blog"]', 'article', 
          '[class*="article"]', '.content'
        ];
        
        let articles = [];
        
        // Try to find articles with different container selectors
        for (const selector of possibleContainers) {
          const container = doc.querySelector(selector);
          if (container) {
            // Look for article elements or links that might be posts
            const found = Array.from(container.querySelectorAll('article, .post, .article, a[href*="/post"], a[href*="/blog"]'));
            if (found.length > 0) {
              articles = found;
              console.log(`Found ${articles.length} potential posts with selector "${selector}"`);
              break;
            }
          }
        }
        
        // If we still don't have posts, look for any links that might be posts
        if (articles.length === 0) {
          // Look for links with patterns that suggest blog posts
          const allLinks = Array.from(doc.querySelectorAll('a[href]'));
          articles = allLinks.filter(link => {
            const href = link.getAttribute('href');
            return href && (
              href.includes('/post/') || 
              href.includes('/blog/') || 
              href.includes('/article/') || 
              /\/[0-9]{4}\/[0-9]{2}\//.test(href) ||  // Date-based URLs
              /\/[a-z0-9-]{5,}/.test(href)  // Long slug-like paths
            );
          });
          
          console.log(`Found ${articles.length} potential post links by URL pattern`);
        }
        
        if (articles.length > 0) {
          // Limit to a reasonable number of posts
          const postElements = articles.slice(0, 10);
          
          return postElements.map((element, index) => {
            // Extract post information
            let title, link, description, published;
            
            // Extract link - might be the element itself or a child
            if (element.tagName === 'A') {
              link = element.getAttribute('href');
              title = element.textContent?.trim() || element.getAttribute('title') || `Post ${index + 1}`;
            } else {
              // Try to find link and title within the element
              const linkEl = element.querySelector('a[href]');
              link = linkEl?.getAttribute('href') || '';
              
              const titleEl = element.querySelector('h1, h2, h3, h4, .title, [class*="title"]');
              title = titleEl?.textContent?.trim() || `Post ${index + 1}`;
            }
            
            // Format the link as absolute URL
            if (link && !link.startsWith('http')) {
              link = link.startsWith('/') ? `${formattedUrl}${link}` : `${formattedUrl}/${link}`;
            }
            
            // Try to extract description
            const descEl = element.querySelector('p, .description, .excerpt, [class*="excerpt"], [class*="summary"]');
            description = descEl?.textContent?.trim() || '';
            
            // Try to find date
            const dateEl = element.querySelector('time, .date, [datetime], [class*="date"], [class*="time"]');
            let dateStr = null;
            
            if (dateEl) {
              dateStr = dateEl.getAttribute('datetime') || dateEl.textContent;
            }
            
            try {
              published = dateStr ? new Date(dateStr).toISOString() : new Date().toISOString();
            } catch (e) {
              published = new Date().toISOString();
            }
            
            // Extract unique ID from link if possible
            let slug = '';
            if (link) {
              try {
                const url = new URL(link);
                const pathParts = url.pathname.split('/').filter(Boolean);
                slug = pathParts[pathParts.length - 1] || `post-${index}`;
              } catch (e) {
                slug = `post-${index}`;
              }
            } else {
              slug = `post-${index}`;
            }
            
            return {
              id: `scraped-${slug}`,
              title: title || `Post ${index + 1}`,
              slug,
              description: description?.substring(0, 150) || '',
              published,
              content: '',  // We don't have the full content from the list page
              sourceUrl: link || formattedUrl,
              tags: []
            };
          });
        }
      }
    } catch (error) {
      console.log('Error scraping HTML:', error);
    }
    
    // If we get here, we couldn't find any posts
    console.log('Could not find any posts, creating a sample post');
    
    // Create a sample post
    return [{
      id: `sample-post-${Date.now()}`,
      title: `Sample Post from ${new URL(formattedUrl).hostname}`,
      description: 'This site appears to exist, but we could not find any posts',
      published: new Date().toISOString(),
      sourceUrl: formattedUrl,
      tags: ['sample']
    }];
  } catch (error) {
    console.error('Unexpected error in fetchFriendContent:', error);
    
    // Return empty array in case of error
    return [];
  }
}

// Generate markdown content for a friend
export function generateFriendMarkdown(friend: Friend): string {
  return `---
name: "${friend.name}"
url: "${friend.url}"
bio: "${friend.bio || ''}"
avatar: "${friend.avatar || ''}"
lastSynced: "${friend.lastSynced || new Date().toISOString()}"
---

# ${friend.name}

Friend site: [${friend.url}](${friend.url})

${friend.bio ? `Bio: ${friend.bio}` : ''}

Last synced: ${friend.lastSynced ? new Date(friend.lastSynced).toLocaleString() : 'Never'}
`;
}

// Download a friend as a markdown file
export function downloadFriendAsMarkdown(friend: Friend) {
  // Create filename
  const sanitizedName = friend.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const filename = `${sanitizedName}.md`;
  
  // Generate markdown content
  const markdown = generateFriendMarkdown(friend);
  
  // Create download
  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  return { filename };
}