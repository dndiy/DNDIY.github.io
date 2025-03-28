<script>
  import { onMount } from 'svelte';
  import { getFriendContent, isFriendContentEnabled } from '../../../stores/friendStore';
  
  // Props for local posts
  export let localPosts = [];
  
  // State
  let isAuthenticated = false;
  let friendContentEnabled = false;
  let friendPosts = [];
  let combinedPosts = [];
  let loading = true;
  
  // Function to convert friend posts to format compatible with PostCard.astro
  function formatFriendPost(post) {
    return {
      isFriendContent: true,
      entry: {
        id: post.id || 'friend-post',
        render: () => ({ remarkPluginFrontmatter: { words: 0, minutes: 0, excerpt: post.description || '' }}),
        data: {
          title: post.title || 'Untitled Post',
          published: new Date(post.published) || new Date(),
          updated: post.updated ? new Date(post.updated) : null,
          tags: post.tags || [],
          category: post.category || 'Friend Content',
          image: post.image || null,
          description: post.description || '',
          draft: false
        }
      },
      title: post.title || 'Untitled Post',
      url: post.sourceUrl || `/friend-${post.slug || post.id}`,
      published: new Date(post.published) || new Date(),
      updated: post.updated ? new Date(post.updated) : null,
      tags: post.tags || [],
      category: post.category || 'Friend Content',
      image: post.image || null,
      description: post.description || '',
      draft: false,
      style: 'border-left: 3px solid var(--primary);' // Visual indicator it's friend content
    };
  }
  
  onMount(() => {
    console.log('FriendPostIntegrator: Component mounted');
    
    // Check authentication status
    isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    console.log('Authentication status:', isAuthenticated);
    
    // Check if friend content is enabled
    friendContentEnabled = isFriendContentEnabled();
    console.log('Friend content enabled:', friendContentEnabled);
    
    // If authenticated and enabled, load friend content
    if (isAuthenticated && friendContentEnabled) {
      console.log('Getting friend content');
      
      // Get friend content
      const rawFriendPosts = getFriendContent();
      console.log('Retrieved friend posts:', rawFriendPosts);
      
      // Format friend posts to be compatible with PostCard
      friendPosts = rawFriendPosts.map(formatFriendPost);
      
      // Combine and sort posts by date (newest first)
      combinedPosts = [...localPosts, ...friendPosts].sort((a, b) => 
        new Date(b.published).getTime() - new Date(a.published).getTime()
      );
      
      console.log('Combined posts:', combinedPosts.length);
    } else {
      // Just use local posts
      combinedPosts = localPosts;
    }
    
    loading = false;
  });
</script>

<div>
  {#if loading}
    <div class="flex justify-center items-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
    </div>
  {:else}
    <slot {combinedPosts}></slot>
  {/if}
</div>