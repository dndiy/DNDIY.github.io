// src/stores/friendStore.ts
import { writable, derived, get } from 'svelte/store';

// Type definitions
export interface FriendPost {
  id: string;
  title: string;
  slug?: string;
  description?: string;
  published: string;
  updated?: string;
  content?: string;
  sourceUrl?: string;
  url?: string;
  tags?: string[];
  friendName?: string;
  friendUrl?: string;
  friendAvatar?: string | null;
  isFriendContent?: boolean;
  image?: string;
  category?: string;
  wordCount?: number;
  readingTime?: number;
  timelineYear?: number;
  timelineEra?: string;
  isKeyEvent?: boolean;
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
  isPermanent?: boolean; // Flag to differentiate permanent vs temporary friends
}

// Constants for localStorage keys
const FRIENDS_STORAGE_KEY = 'blogFriends';
const FRIEND_CONTENT_ENABLED_KEY = 'friendContentEnabled';

// Create a single unified store for all friends
export const friends = writable<Friend[]>([]);

// Initialize from localStorage if in browser
if (typeof window !== 'undefined') {
  try {
    const storedFriends = localStorage.getItem(FRIENDS_STORAGE_KEY);
    if (storedFriends) {
      // Mark these as temporary (not permanent) when loading from localStorage
      const tempFriends = JSON.parse(storedFriends).map((friend: Friend) => ({
        ...friend,
        isPermanent: false
      }));
      friends.set(tempFriends);
    }
  } catch (error) {
    console.error('Error loading friends from localStorage:', error);
  }
}

// Save temporary friends to localStorage when the store changes
friends.subscribe(allFriends => {
  if (typeof window !== 'undefined') {
    // Only save temporary friends to localStorage
    const tempFriends = allFriends.filter(friend => !friend.isPermanent);
    localStorage.setItem(FRIENDS_STORAGE_KEY, JSON.stringify(tempFriends));
  }
});

// Helper functions
export function getFriends(includePermanent = true, includeTemporary = true): Friend[] {
  const allFriends = get(friends);
  return allFriends.filter(friend => 
    (includePermanent && friend.isPermanent) || 
    (includeTemporary && !friend.isPermanent)
  );
}

export function addFriend(friend: Friend): void {
  friend.isPermanent = friend.isPermanent || false; // Default to temporary
  friends.update(currentFriends => [...currentFriends, friend]);
}

export function removeFriend(id: string): void {
  friends.update(currentFriends => currentFriends.filter(f => f.id !== id));
}

export function updateFriend(updatedFriend: Friend): void {
  friends.update(currentFriends => 
    currentFriends.map(f => f.id === updatedFriend.id ? 
      { ...updatedFriend, isPermanent: f.isPermanent } : f)
  );
}

export function addPermanentFriends(permanentFriends: any[]): void {
  friends.update(currentFriends => {
    // Convert permanent friends to the Friend interface format
    const formattedPermanentFriends = permanentFriends.map(pf => ({
      id: pf.id || `perm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: pf.data?.name || 'Unknown Friend',
      url: pf.data?.url || '#',
      bio: pf.data?.bio || '',
      avatar: pf.data?.avatar || '',
      lastSynced: pf.data?.lastSynced || new Date().toISOString(),
      postCount: pf.posts?.length || 0,
      posts: pf.posts || [],
      isPermanent: true // Mark as permanent
    }));
    
    // Filter out any existing permanent friends to avoid duplicates
    const tempFriends = currentFriends.filter(f => !f.isPermanent);
    
    // Combine temporary and permanent friends
    return [...tempFriends, ...formattedPermanentFriends];
  });
}

export function isFriendContentEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  // Log this to help debug
  const isEnabled = localStorage.getItem(FRIEND_CONTENT_ENABLED_KEY) !== 'false';
  console.log('Friend content enabled status:', isEnabled);
  return isEnabled;
}

export function getFriendContent(): FriendPost[] {
  const allFriends = get(friends);
  let allPosts: FriendPost[] = [];
  
  console.log('getFriendContent called, found', allFriends.length, 'friends');
  
  // Process all friends, both temporary and permanent
  allFriends.forEach(friend => {
    console.log(`Friend "${friend.name}" has ${friend.posts?.length || 0} posts (${friend.isPermanent ? 'permanent' : 'temporary'})`);
    if (friend.posts && friend.posts.length > 0) {
      const posts = friend.posts.map(post => {
        // Calculate word count and reading time if not already provided
        const wordCount = post.wordCount || (post.content ? Math.ceil(post.content.split(/\s+/).length) : 100);
        const readingTime = post.readingTime || Math.max(1, Math.ceil(wordCount / 200));
        
        return {
          ...post,
          friendName: friend.name,
          friendUrl: friend.url,
          friendAvatar: friend.avatar,
          isFriendContent: true,
          wordCount,
          readingTime
        };
      });
      allPosts = [...allPosts, ...posts];
    }
  });
  
  // Create sample friend post if needed for debugging
  if (allPosts.length === 0 && allFriends.length > 0) {
    console.log('Creating sample friend post for debugging');
    allPosts = [{
      id: `sample-post-${Date.now()}`,
      title: 'Sample Friend Post',
      slug: 'sample-post',
      description: 'This is a sample friend post for debugging purposes.',
      published: new Date().toISOString(),
      friendName: 'Debug Friend',
      friendUrl: '#',
      friendAvatar: null,
      isFriendContent: true,
      sourceUrl: '#',
      wordCount: 100,
      readingTime: 1
    }];
  }
  
  console.log('Total friend posts found:', allPosts.length);
  
  // Sort by date (newest first)
  return allPosts.sort((a, b) => 
    new Date(b.published).getTime() - new Date(a.published).getTime()
  );
}

/**
 * Converts friend posts to a format compatible with local post entries
 * @returns Array of objects that mimic Astro content collection entries
 */
export function getFriendPostsAsEntries() {
  const friendPosts = getFriendContent();
  
  // Transform each friend post into a format that matches Astro content entries
  return friendPosts.map(post => {
    // Create a structure that matches your local post entries
    return {
      id: post.id || `friend-${Date.now()}`,
      slug: post.slug || post.id,
      // Astro entry body (will be generated)
      body: post.content || post.description || '',
      // Data object that matches your frontmatter structure
      data: {
        title: post.title,
        published: new Date(post.published),
        updated: post.updated ? new Date(post.updated) : undefined,
        tags: post.tags || [],
        category: post.category || 'Uncategorized',
        image: post.image || '',
        description: post.description || '',
        draft: false,
        // Add friend-specific data
        isFriendContent: true,
        friendName: post.friendName,
        friendUrl: post.friendUrl,
        friendAvatar: post.friendAvatar,
        sourceUrl: post.sourceUrl
      },
      render: () => ({
        // This mimics the remarkPluginFrontmatter 
        remarkPluginFrontmatter: {
          words: post.wordCount || 100,
          minutes: post.readingTime || 1,
          excerpt: post.description || ''
        }
      })
    };
  });
}

/**
 * Converts friend posts to timeline events format
 * @returns Array of timeline event objects
 */
export function getFriendPostsAsTimelineEvents() {
  // Get friend posts
  const friendPosts = getFriendContent();
  
  // Filter posts that have timeline data
  return friendPosts
    .filter(post => {
      // Only include posts with a timelineYear or that have a published date
      return post.timelineYear || post.published;
    })
    .map(post => {
      // Return a timeline event object
      return {
        slug: post.slug || post.id,
        title: post.title,
        year: post.timelineYear || new Date(post.published).getFullYear(),
        era: post.timelineEra,
        isKeyEvent: post.isKeyEvent || false,
        description: post.description,
        image: post.image,
        // Add friend-specific data
        isFriendContent: true,
        friendName: post.friendName,
        friendUrl: post.friendUrl
      };
    });
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
  // The implementation of this function remains unchanged
  // as it doesn't directly interact with the friend store structure
  try {
    const formattedUrl = formatUrl(friendUrl);
    console.log(`Fetching content from ${formattedUrl}`);
    
    // Method 1: Try RSS feed first (common in blogs)
    try {
      // Try multiple common RSS feed paths
      const rssPaths = [
        '/rss.xml',
        '/feed.xml',
        '/feed',
        '/rss',
        '/atom.xml'
      ];
      
      for (const path of rssPaths) {
        const rssUrl = `${formattedUrl}${path}`;
        console.log('Checking for RSS feed at:', rssUrl);
        
        try {
          const response = await fetch(rssUrl, { 
            method: 'GET',
            headers: { 
              'Accept': 'application/xml, text/xml, application/rss+xml',
              // Add cache control to prevent caching issues
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            },
            mode: 'cors'
          });
          
          if (response.ok) {
            const rssText = await response.text();
            console.log(`Found RSS feed at ${rssUrl}, size: ${rssText.length} bytes`);
            
            // Parse RSS XML
            const parser = new DOMParser();
            const rssDoc = parser.parseFromString(rssText, 'application/xml');
            
            // Check for parsing errors
            const parseError = rssDoc.querySelector('parsererror');
            if (parseError) {
              console.error('XML parsing error:', parseError.textContent);
              continue; // Try next path
            }
            
            // Extract posts from RSS items
            const items = Array.from(rssDoc.querySelectorAll('item, entry'));
            
            if (items.length > 0) {
              console.log(`Found ${items.length} posts in RSS feed`);
              
              return items.map((item, index) => {
                const title = item.querySelector('title')?.textContent || `Post ${index + 1}`;
                
                // Get link - handle both RSS and Atom formats
                let link = '';
                const linkEl = item.querySelector('link');
                if (linkEl) {
                  // Check if it's an Atom link with href attribute
                  link = linkEl.getAttribute('href') || linkEl.textContent || `${formattedUrl}/post-${index}`;
                } else {
                  link = `${formattedUrl}/post-${index}`;
                }
                
                const description = item.querySelector('description, summary')?.textContent || '';
                
                // Handle different date elements in RSS vs Atom
                const pubDate = item.querySelector('pubDate, published, date')?.textContent;
                let published: Date;
                
                if (pubDate) {
                  try {
                    published = new Date(pubDate);
                    if (isNaN(published.getTime())) {
                      // Handle alternative date formats
                      published = new Date();
                    }
                  } catch (e) {
                    published = new Date(); // Fallback to current date
                  }
                } else {
                  published = new Date();
                }
                
                // Get content from different possible elements
                const content = item.querySelector('content\\:encoded, content')?.textContent || description;
                
                // Try to get image from enclosure
                let image = '';
                const enclosure = item.querySelector('enclosure[type^="image"]');
                if (enclosure && enclosure.getAttribute('url')) {
                  image = enclosure.getAttribute('url') || '';
                } else {
                  // Try to extract first image from content
                  const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
                  if (imgMatch && imgMatch[1]) {
                    // Make sure image is absolute URL
                    image = imgMatch[1].startsWith('http') ? 
                      imgMatch[1] : 
                      new URL(imgMatch[1], formattedUrl).href;
                  }
                }
                
                // Extract frontmatter if available
                let category = '';
                let tags: string[] = [];
                let timelineYear = null;
                let timelineEra = null;
                let isKeyEvent = false;
                
                // Try to get frontmatter data
                const frontmatter = item.querySelector('frontmatter');
                if (frontmatter) {
                  // Process all child elements as frontmatter fields
                  const categoryEl = frontmatter.querySelector('category');
                  if (categoryEl) {
                    category = categoryEl.textContent || '';
                  }
                  
                  // Check for tags in frontmatter
                  const tagsEl = frontmatter.querySelector('tags');
                  if (tagsEl && tagsEl.textContent) {
                    try {
                      tags = tagsEl.textContent.split(',').map(t => t.trim()).filter(Boolean);
                    } catch (e) {
                      console.log('Error parsing tags:', e);
                    }
                  }
                  
                  // Check for timeline data
                  const timelineYearEl = frontmatter.querySelector('timelineYear');
                  if (timelineYearEl && timelineYearEl.textContent) {
                    timelineYear = parseInt(timelineYearEl.textContent.trim());
                  }
                  
                  const timelineEraEl = frontmatter.querySelector('timelineEra');
                  if (timelineEraEl && timelineEraEl.textContent) {
                    timelineEra = timelineEraEl.textContent.trim();
                  }
                  
                  const isKeyEventEl = frontmatter.querySelector('isKeyEvent');
                  if (isKeyEventEl && isKeyEventEl.textContent) {
                    isKeyEvent = isKeyEventEl.textContent.trim().toLowerCase() === 'true';
                  }
                  
                  // Also check if there's a dedicated image field
                  if (!image) {
                    const imageEl = frontmatter.querySelector('image');
                    if (imageEl && imageEl.textContent) {
                      // Ensure image is absolute URL
                      const imgSrc = imageEl.textContent;
                      image = imgSrc.startsWith('http') ? 
                        imgSrc : 
                        `${formattedUrl}${imgSrc.startsWith('/') ? '' : '/'}${imgSrc}`;
                    }
                  }
                }
                
                // Fallback to standard category elements if not found in frontmatter
                if (!category) {
                  const categoryEl = item.querySelector('category');
                  if (categoryEl) {
                    category = categoryEl.textContent || '';
                  }
                }
                
                // Fallback to standard item categories if tags not found in frontmatter
                if (tags.length === 0) {
                  const categories = item.querySelectorAll('category');
                  if (categories.length > 0) {
                    tags = Array.from(categories)
                      .map(cat => cat.textContent)
                      .filter(Boolean) as string[];
                  }
                }
                
                // Extract slug from link
                let slug = '';
                try {
                  const postUrl = new URL(link);
                  const pathParts = postUrl.pathname.split('/').filter(Boolean);
                  slug = pathParts[pathParts.length - 1] || `post-${index}`;
                } catch (e) {
                  // If URL parsing fails, extract from link string
                  const pathParts = link.split('/').filter(Boolean);
                  slug = pathParts[pathParts.length - 1] || `post-${index}`;
                }
                
                // Calculate word count and reading time
                const wordCount = content ? Math.ceil(content.split(/\s+/).length) : 100;
                const readingTime = Math.max(1, Math.ceil(wordCount / 200));
                
                return {
                  id: `rss-${slug}`,
                  title,
                  slug,
                  description: description?.substring(0, 150) || '',
                  published: published.toISOString(),
                  content,
                  sourceUrl: link,
                  tags: tags.length > 0 ? tags : [],
                  category: category || '',
                  image,
                  wordCount,
                  readingTime,
                  timelineYear,
                  timelineEra,
                  isKeyEvent
                };
              });
            }
          }
        } catch (e) {
          console.log(`Error checking RSS at ${rssUrl}:`, e);
        }
      }
      
      console.log('No working RSS feeds found');
    } catch (error) {
      console.log('Error in RSS feed checking process:', error);
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
          
          return data.posts.map(post => {
            const wordCount = post.wordCount || 100;
            const readingTime = post.readingTime || Math.max(1, Math.ceil(wordCount / 200));
            
            return {
              id: post.id || post.slug || `post-${Date.now()}-${Math.random().toString(36).substring(2,7)}`,
              title: post.title || 'Untitled',
              slug: post.slug || '',
              description: post.description || post.excerpt || '',
              published: post.published || post.date || new Date().toISOString(),
              content: post.content || post.body || '',
              sourceUrl: post.url || `${formattedUrl}/${post.slug || ''}`,
              tags: post.tags || [],
              category: post.category || '',
              image: post.image || '',
              wordCount,
              readingTime,
              timelineYear: post.timelineYear,
              timelineEra: post.timelineEra,
              isKeyEvent: post.isKeyEvent
            };
          });
        }
      }
    } catch (error) {
      console.log('Error fetching posts API:', error);
    }
    
    // Method 3: HTML scraping for Astro/MDX sites
    try {
      console.log('Scraping HTML for blog posts with improved Astro/MDX selectors');
      
      const response = await fetch(formattedUrl, { 
        method: 'GET',
        headers: { 'Accept': 'text/html' },
        mode: 'cors'
      });
      
      if (response.ok) {
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Try to extract frontmatter from the HTML for date info
        let frontmatterPublishDates: {[slug: string]: Date} = {};
        let frontmatterTimelineData: {[slug: string]: {year?: number, era?: string, isKeyEvent?: boolean}} = {};
        
        // Try to find frontmatter sections in the HTML
        const frontmatterRegex = /---\s*([\s\S]*?)\s*---/g;
        let match;
        while ((match = frontmatterRegex.exec(html)) !== null) {
          const frontmatter = match[1];
          
          // Extract title to match with slugs
          const titleMatch = frontmatter.match(/title\s*:\s*"?([^"\n]+)"?/);
          const title = titleMatch ? titleMatch[1].trim() : '';
          
          // Extract published date
          const publishedMatch = frontmatter.match(/published\s*:\s*"?([^"\n]+)"?/);
          if (publishedMatch) {
            try {
              const dateStr = publishedMatch[1].trim();
              const slugMatch = frontmatter.match(/slug\s*:\s*"?([^"\n]+)"?/);
              const slug = slugMatch ? slugMatch[1].trim() : title.toLowerCase().replace(/\s+/g, '-');
              
              const parsedDate = new Date(dateStr);
              if (!isNaN(parsedDate.getTime())) {
                frontmatterPublishDates[slug] = parsedDate;
                console.log(`Found frontmatter date for "${title}": ${dateStr}`);
              }
            } catch (e) {
              console.log('Failed to parse frontmatter date');
            }
          }
          
          // Extract timeline data
          const timelineYearMatch = frontmatter.match(/timelineYear\s*:\s*(\d+)/);
          const timelineEraMatch = frontmatter.match(/timelineEra\s*:\s*"?([^"\n]+)"?/);
          const isKeyEventMatch = frontmatter.match(/isKeyEvent\s*:\s*(true|false)/i);
          
          // If any timeline data is found, associate it with the slug
          if (timelineYearMatch || timelineEraMatch || isKeyEventMatch) {
            const slugMatch = frontmatter.match(/slug\s*:\s*"?([^"\n]+)"?/);
            const slug = slugMatch ? slugMatch[1].trim() : title.toLowerCase().replace(/\s+/g, '-');
            
            frontmatterTimelineData[slug] = {
              year: timelineYearMatch ? parseInt(timelineYearMatch[1]) : undefined,
              era: timelineEraMatch ? timelineEraMatch[1].trim() : undefined,
              isKeyEvent: isKeyEventMatch ? isKeyEventMatch[1].toLowerCase() === 'true' : undefined
            };
            
            console.log(`Found timeline data for "${title}":`, frontmatterTimelineData[slug]);
          }
        }
        
        // Target the post container - specific to your Astro site structure
        let postContainer = doc.getElementById('posts-container');
        if (!postContainer) {
          // Fallback to common selectors
          postContainer = doc.querySelector('main, .content, [id*="content"], [class*="posts"]');
        }
        
        if (!postContainer) {
          console.log('Could not find post container, trying whole document');
          postContainer = doc.body;
        }
        
        // Find posts with specific Astro structure
        let postElements = Array.from(postContainer.querySelectorAll('.card-base, .local-post, [class*="post-card"]'));
        
        // Fallback to generic article selectors if needed
        if (postElements.length === 0) {
          postElements = Array.from(postContainer.querySelectorAll('article, .post, a[href*="/posts/"]'));
        }
        
        console.log(`Found ${postElements.length} potential post elements`);
        
        // Track slugs to avoid duplicates
        const processedSlugs = new Set<string>();
        const posts: FriendPost[] = [];
        
        for (const element of postElements) {
          try {
            // Extract post link
            const linkEl = element.tagName === 'A' ? 
              element : 
              element.querySelector('a[href*="/posts/"], a[href*="/blog/"], h1 a, h2 a, h3 a, .title a, [class*="title"] a');
              
            if (!linkEl) continue;
            
            const href = linkEl.getAttribute('href');
            if (!href) continue;
            
            // Format URL and extract slug
            const fullUrl = href.startsWith('http') ? 
              href : 
              (href.startsWith('/') ? `${formattedUrl}${href}` : `${formattedUrl}/${href}`);
              
            let slug = '';
            try {
              const url = new URL(fullUrl);
              const pathParts = url.pathname.split('/').filter(Boolean);
              slug = pathParts[pathParts.length - 1] || '';
            } catch (e) {
              const pathParts = href.split('/').filter(Boolean);
              slug = pathParts[pathParts.length - 1] || '';
            }
            
            // Skip if we've already processed this slug
            if (!slug || processedSlugs.has(slug)) continue;
            processedSlugs.add(slug);
            
            // Extract title - try multiple possible selectors
            let title = '';
            const titleEl = element.querySelector('h1, h2, h3, .title, [class*="title"]');
            if (titleEl) {
              title = titleEl.textContent?.trim() || '';
            } else {
              title = linkEl.getAttribute('title') || linkEl.textContent?.trim() || '';
            }
            
            // Skip posts with generic titles
            if (title.startsWith('Post ') && /^\d+$/.test(title.substring(5))) continue;
            if (!title) continue;
            
            // Extract description - try multiple selectors
            let description = '';
            const descEl = element.querySelector('.text-75, p, .description, [class*="description"], [class*="excerpt"]');
            if (descEl) {
              description = descEl.textContent?.trim() || '';
            }
            
            // PUBLISH DATE with improved approach
            let published: Date;
            let foundDate = false;
            
            // Try using frontmatter date if available
            if (frontmatterPublishDates[slug]) {
              published = frontmatterPublishDates[slug];
              foundDate = true;
              console.log(`Using frontmatter date for "${title}": ${published.toISOString()}`);
            } else {
              // Check meta tags
              const metaDates = Array.from(doc.querySelectorAll('meta[property="article:published_time"], meta[name="date"], meta[name="publish-date"]'));
              for (const meta of metaDates) {
                const content = meta.getAttribute('content');
                if (content) {
                  try {
                    const parsedDate = new Date(content);
                    if (!isNaN(parsedDate.getTime())) {
                      published = parsedDate;
                      foundDate = true;
                      console.log(`Using meta tag date for "${title}": ${content}`);
                      break;
                    }
                  } catch (e) { /* Continue if this fails */ }
                }
              }
              
              // Look for visible date elements if meta tags didn't work
              if (!foundDate) {
                const dateEls = element.querySelectorAll('time, .date, [datetime], [data-post-date]');
                for (const dateEl of dateEls) {
                  const dateStr = dateEl.getAttribute('datetime') || 
                                dateEl.getAttribute('data-post-date') || 
                                dateEl.textContent?.trim();
                  if (dateStr) {
                    try {
                      const parsedDate = new Date(dateStr);
                      if (!isNaN(parsedDate.getTime())) {
                        published = parsedDate;
                        foundDate = true;
                        console.log(`Using visible date for "${title}": ${dateStr}`);
                        break;
                      }
                    } catch (e) { /* Continue if this fails */ }
                  }
                }
              }
              
              // Fallback to current date if all attempts failed
              if (!foundDate) {
                published = new Date();
                console.log(`Using current date for "${title}" as fallback`);
              }
            }
            
            // Extract metadata - categories and tags
            let category = '';
            let tags: string[] = [];
            
            // Look for category and tag links
            const categoryEl = element.querySelector('a[href*="/category/"]');
            if (categoryEl) {
              category = categoryEl.textContent?.trim() || '';
            } else {
              // Try to extract from slug
              const slugParts = slug.split('-');
              if (slugParts.length > 1) {
                category = slugParts[0].toUpperCase();
              }
            }
            
            // Look for tags
            const tagLinks = element.querySelectorAll('a[href*="/tag/"]');
            if (tagLinks.length > 0) {
              tags = Array.from(tagLinks).map(el => el.textContent?.trim() || '').filter(Boolean) as string[];
            }
            
            // Extract image
            let image = '';
            const imgEl = element.querySelector('img');
            if (imgEl) {
              const src = imgEl.getAttribute('src');
              if (src) {
                image = src.startsWith('http') ? src : (
                  src.startsWith('/') ? `${formattedUrl}${src}` : `${formattedUrl}/${src}`
                );
              }
            }
            
            // Calculate word count and reading time
            const wordCount = element.querySelector('[data-post-words]')?.getAttribute('data-post-words') ? 
                             parseInt(element.querySelector('[data-post-words]')?.getAttribute('data-post-words') || '100') : 
                             (description ? Math.ceil(description.split(/\s+/).length) * 3 : 100); // Multiply by 3 to estimate full content length
                             
            const readingTime = element.querySelector('[data-post-minutes]')?.getAttribute('data-post-minutes') ? 
                               parseInt(element.querySelector('[data-post-minutes]')?.getAttribute('data-post-minutes') || '1') : 
                               Math.max(1, Math.ceil(wordCount / 200));
            
            // Check for timeline data
            const timelineData = frontmatterTimelineData[slug] || {};
            
            // Create post object with enhanced metadata
            posts.push({
              id: `scraped-${slug}`,
              title,
              slug,
              description: description?.substring(0, 150) || '',
              published: published.toISOString(),
              content: '',  // We don't fetch full content at list level
              sourceUrl: fullUrl,
              tags,
              category,
              image,
              wordCount,
              readingTime,
              timelineYear: timelineData.year,
              timelineEra: timelineData.era,
              isKeyEvent: timelineData.isKeyEvent
            });
          } catch (err) {
            console.error('Error processing post element:', err);
          }
        }
        
        console.log(`Successfully extracted ${posts.length} posts with metadata`);
        
        // Return posts with metadata
        return posts.length > 0 ? posts : [{
          id: `sample-post-${Date.now()}`,
          title: `Content from ${new URL(formattedUrl).hostname}`,
          description: 'This site exists, but we could not extract detailed post information',
          published: new Date().toISOString(),
          sourceUrl: formattedUrl,
          tags: ['sample'],
          slug: 'sample',
          wordCount: 100,
          readingTime: 1
        }];
      }
    } catch (error) {
      console.log('Error with enhanced HTML scraping:', error);
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
      tags: ['sample'],
      wordCount: 100,
      readingTime: 1
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

// For backwards compatibility - these functions call the unified store functions
export const temporaryFriends = {
  set: (tempFriends: Friend[]) => {
    const currentFriends = get(friends);
    const permanentFriends = currentFriends.filter(f => f.isPermanent);
    friends.set([...permanentFriends, ...tempFriends.map(f => ({ ...f, isPermanent: false }))]);
  },
  update: (updateFn: (tempFriends: Friend[]) => Friend[]) => {
    friends.update(allFriends => {
      const tempFriends = allFriends.filter(f => !f.isPermanent);
      const permanentFriends = allFriends.filter(f => f.isPermanent);
      const updatedTempFriends = updateFn(tempFriends).map(f => ({ ...f, isPermanent: false }));
      return [...permanentFriends, ...updatedTempFriends];
    });
  },
  subscribe: (callback: (value: Friend[]) => void) => {
    return friends.subscribe(allFriends => {
      callback(allFriends.filter(f => !f.isPermanent));
    });
  }
};

export const permanentFriends = {
  set: (permFriends: any[]) => {
    addPermanentFriends(permFriends);
  },
  update: (updateFn: (permFriends: any[]) => any[]) => {
    // This is more complex with the new system, but maintaining for compatibility
    friends.update(allFriends => {
      const tempFriends = allFriends.filter(f => !f.isPermanent);
      const permFriends = allFriends.filter(f => f.isPermanent);
      
      // Convert to old format for the update function
      const oldFormat = permFriends.map(pf => ({
        id: pf.id,
        data: {
          name: pf.name,
          url: pf.url,
          bio: pf.bio || '',
          avatar: pf.avatar || '',
          lastSynced: pf.lastSynced
        },
        posts: pf.posts || []
      }));
      
      // Update using the provided function
      const updatedPermFriendsOldFormat = updateFn(oldFormat);
      
      // Convert back to new format
      const updatedPermFriends = updatedPermFriendsOldFormat.map(pf => ({
        id: pf.id,
        name: pf.data?.name || 'Unknown',
        url: pf.data?.url || '#',
        bio: pf.data?.bio || '',
        avatar: pf.data?.avatar || '',
        lastSynced: pf.data?.lastSynced || new Date().toISOString(),
        postCount: pf.posts?.length || 0,
        posts: pf.posts || [],
        isPermanent: true
      }));
      
      return [...tempFriends, ...updatedPermFriends];
    });
  },
  subscribe: (callback: (value: any[]) => void) => {
    return friends.subscribe(allFriends => {
      // Convert to old format for the callback
      const permFriends = allFriends
        .filter(f => f.isPermanent)
        .map(pf => ({
          id: pf.id,
          data: {
            name: pf.name,
            url: pf.url,
            bio: pf.bio || '',
            avatar: pf.avatar || '',
            lastSynced: pf.lastSynced
          },
          posts: pf.posts || []
        }));
      
      callback(permFriends);
    });
  }
};