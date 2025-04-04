<script>
  import { onMount } from 'svelte';
  import { isFriendContentEnabled, getFriendPostsAsEntries } from '../../../stores/friendStore';
  import { postCardConfig } from '../../../config/postcard.config';
  
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
        
        // Add a visual indicator for friend content based on config
        const friendConfig = postCardConfig.friendPosts;
        
        // Apply the configured indicator style
        if (friendConfig.friendStyling.indicatorType === 'border') {
          friendPostElement.style.borderLeft = `3px solid ${friendConfig.friendStyling.indicatorColor}`;
        } else if (friendConfig.friendStyling.indicatorType === 'background') {
          friendPostElement.style.backgroundColor = `${friendConfig.friendStyling.indicatorColor}20`; // Add 20% opacity
        } else if (friendConfig.friendStyling.indicatorType === 'badge') {
          // We'll add a badge later
          friendPostElement.setAttribute('data-needs-badge', 'true');
        }
        
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
        
        // Check if we need to add a badge (indicator type)
        if (friendConfig.friendStyling.indicatorType === 'badge' && friendPostElement.getAttribute('data-needs-badge') === 'true') {
          const badge = document.createElement('div');
          badge.className = 'absolute right-3 top-3 py-1 px-2 rounded-md text-xs font-medium';
          badge.style.backgroundColor = friendConfig.friendStyling.indicatorColor;
          badge.style.color = 'white';
          badge.textContent = 'Friend';
          
          // Append badge to post element
          friendPostElement.appendChild(badge);
        }
        
        // Add friend attribution if enabled
        if (metadataSection && friendConfig.attribution.showAttribution) {
          // Create friend attribution element
          const attribution = document.createElement('div');
          attribution.className = 'flex items-center mb-3';
          
          // Build attribution HTML with avatar if enabled
          let attributionHTML = '';
          
          // Add avatar if enabled
          if (friendConfig.friendStyling.showFriendAvatar) {
            attributionHTML += `
              <div class="${friendConfig.friendStyling.avatarSize} bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden mr-2 flex-shrink-0">
                ${entry.data.friendAvatar ? `
                  <img 
                    src="${entry.data.friendAvatar}" 
                    alt="${entry.data.friendName || 'Friend'}'s avatar"
                    class="w-full h-full object-cover"
                    onerror="this.src='/assets/avatar/avatar.png'"
                  />
                ` : `
                  <img 
                    src="/assets/avatar/avatar.png" 
                    alt="${entry.data.friendName || 'Friend'}'s avatar"
                    class="w-full h-full object-cover"
                  />
                `}
              </div>
            `;
          }
          
          // Add attribution text with friend name
          const attributionText = friendConfig.attribution.attributionText.replace('[friendName]', entry.data.friendName || 'Friend');
          
          // Add link if enabled
          if (friendConfig.attribution.linkToFriendSite) {
            attributionHTML += `
              <span class="text-sm text-neutral-500 dark:text-neutral-400">
                ${attributionText.replace(entry.data.friendName || 'Friend', `<a href="${entry.data.friendUrl || '#'}" target="_blank" rel="noopener noreferrer" class="text-[var(--primary)] hover:underline">${entry.data.friendName || 'Friend'}</a>`)}
              </span>
            `;
          } else {
            attributionHTML += `
              <span class="text-sm text-neutral-500 dark:text-neutral-400">
                ${attributionText}
              </span>
            `;
          }
          
          attribution.innerHTML = attributionHTML;
          
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
      
      // Handle sorting based on configuration
      const allPosts = Array.from(postsContainer.children);
      let sortedPosts = [];
      
      // Check sorting method from config
      const sortingMethod = friendConfig.behavior.sortingMethod;
      
      if (sortingMethod === 'date') {
        // Sort by date (timestamp)
        sortedPosts = allPosts.sort((a, b) => {
          const aTime = parseInt(a.getAttribute('data-post-timestamp') || '0');
          const bTime = parseInt(b.getAttribute('data-post-timestamp') || '0');
          return bTime - aTime; // Descending order (newest first)
        });
      } else if (sortingMethod === 'source') {
        // First local posts, then friend posts grouped by source
        const localPosts = allPosts.filter(post => post.getAttribute('data-post-type') === 'local');
        const friendPosts = allPosts.filter(post => post.getAttribute('data-post-type') === 'friend');
        
        // Sort each group by date internally
        localPosts.sort((a, b) => {
          const aTime = parseInt(a.getAttribute('data-post-timestamp') || '0');
          const bTime = parseInt(b.getAttribute('data-post-timestamp') || '0');
          return bTime - aTime;
        });
        
        // Group friend posts by friend name if available
        const friendGroups = {};
        friendPosts.forEach(post => {
          const friendName = post.querySelector('.text-[var(--primary)].hover\\:underline')?.textContent || 'Unknown';
          if (!friendGroups[friendName]) {
            friendGroups[friendName] = [];
          }
          friendGroups[friendName].push(post);
        });
        
        // Sort each friend group internally by date
        Object.values(friendGroups).forEach(group => {
          group.sort((a, b) => {
            const aTime = parseInt(a.getAttribute('data-post-timestamp') || '0');
            const bTime = parseInt(b.getAttribute('data-post-timestamp') || '0');
            return bTime - aTime;
          });
        });
        
        // Combine all posts in order: local posts first, then friend groups
        sortedPosts = [
          ...localPosts,
          ...Object.values(friendGroups).flat()
        ];
      }
      
      // Check if we should merge with local posts
      if (friendConfig.behavior.mergeWithLocalPosts) {
        // Clear and reinsert in sorted order
        while (postsContainer.firstChild) {
          postsContainer.removeChild(postsContainer.firstChild);
        }
        
        sortedPosts.forEach(post => {
          postsContainer.appendChild(post);
        });
      } else {
        // Separate friend posts from local posts
        // First remove friend posts
        const friendPostElements = document.querySelectorAll('[data-friend-content="true"]');
        friendPostElements.forEach(el => el.remove());
        
        // Create a container for friend posts
        const friendPostsContainer = document.createElement('div');
        friendPostsContainer.className = 'friend-posts-container mt-8';
        friendPostsContainer.innerHTML = `
          <h2 class="text-2xl font-bold mb-4 text-black/90 dark:text-white/90">Friend Posts</h2>
        `;
        
        // Get all friend posts
        const friendPosts = sortedPosts.filter(post => post.getAttribute('data-post-type') === 'friend');
        
        // Add friend posts to the friend container
        friendPosts.forEach(post => {
          friendPostsContainer.appendChild(post);
        });
        
        // Add the friend container after the main posts container
        postsContainer.parentNode.insertBefore(friendPostsContainer, postsContainer.nextSibling);
      }
      
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