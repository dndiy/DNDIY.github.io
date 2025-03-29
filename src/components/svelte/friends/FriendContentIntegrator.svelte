<script>
  import { onMount } from 'svelte';
  import { isFriendContentEnabled, getFriendPostsAsEntries } from '../../../stores/friendStore';
  
  // Using onMount to ensure browser APIs are only accessed client-side
  onMount(() => {
    // Check authentication status
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    
    // Check if friend content is enabled
    const friendContentEnabled = isFriendContentEnabled();
    
    // Only proceed if authenticated and enabled
    if (!isAuthenticated || !friendContentEnabled) return;
    
    // Integration function that reuses your PostCard component
    function integrateFriendPosts() {
      // Get the posts container
      const postsContainer = document.getElementById('posts-container');
      if (!postsContainer) {
        console.error('Posts container not found');
        return;
      }
      
      // Remove any existing friend posts to avoid duplicates
      const existingFriendPosts = document.querySelectorAll('[data-friend-content="true"]');
      existingFriendPosts.forEach(post => post.remove());
      
      // Get friend posts as entry-compatible objects
      const friendEntries = getFriendPostsAsEntries();
      if (friendEntries.length === 0) return;
      
      console.log(`Integrating ${friendEntries.length} friend posts`);
      
      // Find a local PostCard to clone its structure
      const localPostCard = postsContainer.querySelector('.card-base');
      if (!localPostCard) {
        console.error('No local post card found to use as template');
        return;
      }
      
      // For each friend post, clone and modify a local post card
      friendEntries.forEach(entry => {
        // Clone the structure of a local post card
        const friendPostElement = localPostCard.cloneNode(true);
        
        // Add friend-specific attributes and classes
        friendPostElement.setAttribute('data-friend-content', 'true');
        friendPostElement.setAttribute('data-post-id', entry.id);
        friendPostElement.setAttribute('data-post-type', 'friend');
        friendPostElement.setAttribute('data-post-timestamp', entry.data.published.getTime());
        friendPostElement.setAttribute('data-post-date', entry.data.published.toISOString().split('T')[0]);
        friendPostElement.setAttribute('data-post-category', entry.data.category.toLowerCase());
        friendPostElement.setAttribute('data-post-tags', (entry.data.tags || []).join(',').toLowerCase());
        
        // Add a visual indicator for friend content
        friendPostElement.style.borderLeft = '3px solid var(--primary)';
        
        // Update the title link
        const titleLink = friendPostElement.querySelector('a');
        if (titleLink) {
          titleLink.href = entry.data.sourceUrl || `/friend/${entry.slug}`;
          titleLink.textContent = entry.data.title;
        }
        
        // Update the publication date
        const dateElement = friendPostElement.querySelector('.text-sm.font-medium');
        if (dateElement) {
          dateElement.textContent = entry.data.published.toISOString().split('T')[0];
        }
        
        // Update category
        const categoryLink = friendPostElement.querySelector('a[href*="/category/"]');
        if (categoryLink) {
          categoryLink.href = `/archive/category/${entry.data.category.toLowerCase()}/`;
          categoryLink.textContent = entry.data.category;
        }
        
        // Update tags
        const tagsContainer = friendPostElement.querySelector('.hidden.md\\:flex.items-center');
        if (tagsContainer && entry.data.tags.length > 0) {
          const tagsWrapper = tagsContainer.querySelector('div:last-child');
          if (tagsWrapper) {
            // Clear existing tags
            tagsWrapper.innerHTML = '';
            
            // Add each tag
            entry.data.tags.forEach((tag, i) => {
              // Add separator for all but first tag
              if (i > 0) {
                const separator = document.createElement('div');
                separator.className = 'mx-1.5 text-[var(--meta-divider)] text-sm';
                separator.textContent = '/';
                tagsWrapper.appendChild(separator);
              }
              
              // Create tag link
              const tagLink = document.createElement('a');
              tagLink.href = `/archive/tag/${tag.toLowerCase()}/`;
              tagLink.className = 'link-lg transition text-50 text-sm font-medium hover:text-[var(--primary)] dark:hover:text-[var(--primary)] whitespace-nowrap';
              tagLink.textContent = tag;
              tagsWrapper.appendChild(tagLink);
            });
          }
        }
        
        // Update description
        const descriptionEl = friendPostElement.querySelector('.transition.text-75');
        if (descriptionEl && entry.data.description) {
          descriptionEl.textContent = entry.data.description;
        }
        
        // Update word count and reading time
        const statsElements = friendPostElement.querySelectorAll('.text-sm.text-black\\/30 > div');
        if (statsElements.length >= 3) {
          statsElements[0].textContent = `${entry.render().remarkPluginFrontmatter.words} words`;
          statsElements[2].textContent = `${entry.render().remarkPluginFrontmatter.minutes} min read`;
        }
        
        // Find the metadata section to place attribution after it
        const metadataSection = friendPostElement.querySelector('.mb-4');
        if (metadataSection) {
          // Create friend attribution element
          const attribution = document.createElement('div');
          attribution.className = 'flex items-center mb-3';
          attribution.innerHTML = `
            <div class="w-5 h-5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden mr-2 flex-shrink-0">
              ${entry.data.friendAvatar ? `
                <img 
                  src="${entry.data.friendAvatar}" 
                  alt="${entry.data.friendName || 'Friend'}'s avatar"
                  class="w-full h-full object-cover"
                  onerror="this.src='/placeholder.png'"
                />
              ` : ''}
            </div>
            <span class="text-sm text-neutral-500 dark:text-neutral-400">
              Shared from <a href="${entry.data.friendUrl || '#'}" target="_blank" rel="noopener noreferrer" class="text-[var(--primary)] hover:underline">${entry.data.friendName || 'Friend'}</a>
            </span>
          `;
          
          // Insert after the metadata section
          metadataSection.after(attribution);
        }
        
        // Update cover image if present
        const coverImageWrapper = friendPostElement.querySelector('a.group');
        const imageElement = coverImageWrapper ? coverImageWrapper.querySelector('img') : null;
        
        if (imageElement && entry.data.image) {
          // Ensure the image is visible and using the post's image
          imageElement.src = entry.data.image;
          imageElement.alt = `Cover image for ${entry.data.title}`;
          
          if (coverImageWrapper) {
            coverImageWrapper.classList.remove('!hidden');
          }
        }
        
        // Add the friend post to the container
        postsContainer.appendChild(friendPostElement);
      });
      
      // Sort all posts by timestamp
      const allPosts = Array.from(postsContainer.children);
      const sortedPosts = allPosts.sort((a, b) => {
        const aTime = parseInt(a.getAttribute('data-post-timestamp') || '0');
        const bTime = parseInt(b.getAttribute('data-post-timestamp') || '0');
        return bTime - aTime; // Descending order (newest first)
      });
      
      // Clear and reinsert in sorted order
      while (postsContainer.firstChild) {
        postsContainer.removeChild(postsContainer.firstChild);
      }
      
      sortedPosts.forEach(post => {
        postsContainer.appendChild(post);
      });
      
      console.log(`Successfully integrated ${friendEntries.length} friend posts`);
    }
    
    // Set up Swup integration to handle page transitions
    function setupSwupIntegration() {
      // Function to handle Swup page transitions
      const handlePageTransition = () => {
        if (isAuthenticated && friendContentEnabled) {
          // Use a small delay to ensure DOM is ready
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
        // Register with Swup hooks for page transitions
        window.swup.hooks.on('page:view', handlePageTransition);
      } else {
        // Set up a listener for when Swup becomes available
        document.addEventListener('swup:enable', () => {
          window.swup.hooks.on('page:view', handlePageTransition);
        });
      }
    }
    
    // Handle friend content toggle events
    function handleFriendContentToggle(e) {
      const enabled = e.detail?.enabled ?? false;
      
      if (enabled && isAuthenticated) {
        integrateFriendPosts();
      } else {
        // Remove friend posts if disabled
        const friendPostElements = document.querySelectorAll('[data-friend-content="true"]');
        friendPostElements.forEach(el => el.remove());
      }
    }
    
    // Listen for content toggle events
    window.addEventListener('friend-content-toggled', handleFriendContentToggle);
    
    // Initial integration after a delay to ensure local posts are rendered
    setTimeout(() => {
      try {
        integrateFriendPosts();
      } catch (error) {
        console.error('Error integrating friend posts:', error);
      }
    }, 300);
    
    // Set up for Swup page transitions
    setupSwupIntegration();
    
    // Cleanup function for when component is destroyed
    return () => {
      window.removeEventListener('friend-content-toggled', handleFriendContentToggle);
    };
  });
</script>

<!-- This component doesn't render anything visible -->