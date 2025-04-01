<!-- FriendContentIntegrator.svelte -->
<script>
  import { onMount } from 'svelte';
  import { getFriendContent, isFriendContentEnabled } from '../../../stores/friendStore';
  
  // State
  let isAuthenticated = false;
  let friendContentEnabled = false;
  let friendPosts = [];
  
  // Function to create friend post container
  function createFriendPostContainer(post) {
    // Create the container element
    const container = document.createElement('div');
    container.classList.add('friend-post', 'onload-animation');
    container.setAttribute('data-post-type', 'friend');
    container.setAttribute('data-post-id', post.id);
    container.setAttribute('data-post-date', new Date(post.published).toISOString().split('T')[0]);
    container.setAttribute('data-post-timestamp', new Date(post.published).getTime());
    
    // Fetch and render the FriendPostCard component via fetch
    fetch(`/api/render-friend-post?post=${encodeURIComponent(JSON.stringify(post))}`)
      .then(response => response.text())
      .then(html => {
        container.innerHTML = html;
      })
      .catch(error => {
        console.error('Error rendering friend post:', error);
        // Fallback simple rendering
        container.innerHTML = `
          <div class="card-base p-4 rounded-lg border-l-4 border-l-[var(--primary)]">
            <div class="flex items-center mb-2">
              <span class="text-sm">From ${post.friendName || 'Friend'}: ${post.title}</span>
            </div>
          </div>
        `;
      });
    
    return container;
  }
  
  // Function to integrate friend posts with local posts
  function integrateFriendPosts() {
    const postsContainer = document.getElementById('posts-container');
    if (!postsContainer) {
      console.error('Posts container not found');
      return;
    }
    
    // Remove any existing friend posts to avoid duplicates
    const existingFriendPosts = postsContainer.querySelectorAll('.friend-post');
    existingFriendPosts.forEach(post => post.remove());
    
    // Create a temporary hidden container for all friend posts
    const tempContainer = document.createElement('div');
    tempContainer.style.display = 'none';
    document.body.appendChild(tempContainer);
    
    // Get the relative URL to the FriendPostCard component
    const basePath = '/components/FriendPostCard.astro';
    
    // Process each friend post
    friendPosts.forEach(post => {
      // Create a wrapper to hold each friend post
      const friendPostWrapper = document.createElement('div');
      friendPostWrapper.classList.add('friend-post-wrapper', 'mb-4');
      friendPostWrapper.setAttribute('data-post-timestamp', new Date(post.published).getTime());
      
      // Add the server-rendered FriendPostCard
      friendPostWrapper.innerHTML = `
        <div class="friend-post onload-animation" 
            data-post-type="friend"
            data-post-date="${new Date(post.published).toISOString().split('T')[0]}"
            data-post-timestamp="${new Date(post.published).getTime()}"
        >
            <!-- Include FriendPostCard directly -->
            <div class="card-base p-4 rounded-lg hover:shadow-md transition-shadow border-l-4 border-l-[var(--primary)]">
              <!-- Friend Attribution -->
              <div class="flex items-center mb-2">
                <div class="w-6 h-6 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden mr-2 flex-shrink-0">
                  <img 
                    src="${post.friendAvatar || '/assets/avatar/avatar.png'}" 
                    alt="${post.friendName || 'Friend'}'s avatar"
                    class="w-full h-full object-cover"
                    onerror="this.src='/assets/avatar/avatar.png'"
                  />
                </div>
                <span class="text-xs text-neutral-500 dark:text-neutral-400">
                  Shared from <a href="${post.friendUrl || '#'}" target="_blank" rel="noopener noreferrer" class="text-[var(--primary)] hover:underline">${post.friendName || 'Friend'}</a>
                </span>
              </div>
              
              <!-- Post Title -->
              <h3 class="text-lg font-bold mb-2 text-black/80 dark:text-white/80 line-clamp-2">
                <a href="${post.sourceUrl || `/friend-${post.slug || post.id}`}" class="hover:text-[var(--primary)] transition">
                  ${post.title || 'Untitled Post'}
                </a>
              </h3>
              
              <!-- Post Description -->
              ${post.description ? `
                <p class="text-neutral-600 dark:text-neutral-300 text-sm mb-3 line-clamp-3">
                  ${post.description}
                </p>
              ` : ''}
              
              <!-- Post Metadata -->
              <div class="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                <div class="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  <span>${new Date(post.published).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</span>
                </div>
                
                <!-- Tags (if available) -->
                ${post.tags && post.tags.length > 0 ? `
                  <div class="flex flex-wrap gap-1">
                    ${post.tags.slice(0, 2).map(tag => `
                      <span class="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-full">
                        ${tag}
                      </span>
                    `).join('')}
                    ${post.tags.length > 2 ? `
                      <span class="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-full">
                        +${post.tags.length - 2}
                      </span>
                    ` : ''}
                  </div>
                ` : ''}
              </div>
            </div>
        </div>
      `;
      
      postsContainer.appendChild(friendPostWrapper);
    });
    
    // Remove the temporary container
    document.body.removeChild(tempContainer);
    
    // Get all posts and sort them
    const allPosts = Array.from(postsContainer.children);
    
    // Sort all posts by timestamp
    const sortedPosts = allPosts.sort((a, b) => {
      const aTime = parseInt(a.getAttribute('data-post-timestamp') || 
                             a.querySelector('[data-post-timestamp]')?.getAttribute('data-post-timestamp') || 0);
      const bTime = parseInt(b.getAttribute('data-post-timestamp') || 
                             b.querySelector('[data-post-timestamp]')?.getAttribute('data-post-timestamp') || 0);
      return bTime - aTime; // Descending order (newest first)
    });
    
    // Reinsert posts in the correct order
    sortedPosts.forEach(post => {
      postsContainer.appendChild(post);
    });
  }
  
  onMount(() => {
    // Check authentication status
    isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    
    // Check if friend content is enabled
    friendContentEnabled = isFriendContentEnabled();
    
    // If authenticated and enabled, load friend content
    if (isAuthenticated && friendContentEnabled) {
      // Get friend content
      const rawFriendPosts = getFriendContent();
      
      if (rawFriendPosts.length > 0) {
        // Store friend posts for integration
        friendPosts = rawFriendPosts;
        
        // Give time for the local posts to render before integrating
        setTimeout(() => {
          try {
            integrateFriendPosts();
          } catch (error) {
            console.error('Error integrating friend posts:', error);
          }
        }, 300);
      }
    }
    
    // Set up for Swup page transitions
    if (typeof window !== 'undefined') {
      // Function to handle Swup page transitions
      const handlePageTransition = () => {
        if (isAuthenticated && friendContentEnabled && friendPosts.length > 0) {
          setTimeout(() => {
            try {
              integrateFriendPosts();
            } catch (error) {
              console.error('Error integrating friend posts after page transition:', error);
            }
          }, 500);
        }
      };
      
      // Check if Swup is available
      if (window.swup?.hooks) {
        window.swup.hooks.on('page:view', handlePageTransition);
      } else {
        document.addEventListener('swup:enable', () => {
          window.swup.hooks.on('page:view', handlePageTransition);
        });
      }
    }
  });
</script>

<!-- This component doesn't render anything visible -->