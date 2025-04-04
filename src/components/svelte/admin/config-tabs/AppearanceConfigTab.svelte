<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import { AUTO_MODE, DARK_MODE, LIGHT_MODE } from '@constants/constants.ts';

  
  // Props
  export let siteConfig;
  export let postCardConfig;
  
  // Local state
  let editingFavicon = null;
  let showFaviconEditor = false;
  let uploadingFavicon = false;
  let themePreview = '';
  
  // Event dispatcher
  const dispatch = createEventDispatcher();
  
  // Initialize theme preview and tab functionality
  onMount(() => {
    updateThemePreview();
    
    // Tab functionality
    // Get references to tabs and panels
    const localPostsTab = document.getElementById('local-posts-tab');
    const friendPostsTab = document.getElementById('friend-posts-tab');
    const localPostsPanel = document.getElementById('local-posts-panel');
    const friendPostsPanel = document.getElementById('friend-posts-panel');
    
    // Add click event listeners to tabs
    if (localPostsTab && friendPostsTab && localPostsPanel && friendPostsPanel) {
      localPostsTab.addEventListener('click', () => {
        // Activate local posts tab
        localPostsTab.classList.add('border-[var(--primary)]', 'text-[var(--primary)]');
        localPostsTab.classList.remove('border-transparent', 'text-neutral-500');
        friendPostsTab.classList.remove('border-[var(--primary)]', 'text-[var(--primary)]');
        friendPostsTab.classList.add('border-transparent', 'text-neutral-500');
        
        // Show local posts panel, hide friend posts panel
        localPostsPanel.classList.remove('hidden');
        friendPostsPanel.classList.add('hidden');
      });
      
      friendPostsTab.addEventListener('click', () => {
        // Activate friend posts tab
        friendPostsTab.classList.add('border-[var(--primary)]', 'text-[var(--primary)]');
        friendPostsTab.classList.remove('border-transparent', 'text-neutral-500');
        localPostsTab.classList.remove('border-[var(--primary)]', 'text-[var(--primary)]');
        localPostsTab.classList.add('border-transparent', 'text-neutral-500');
        
        // Show friend posts panel, hide local posts panel
        friendPostsPanel.classList.remove('hidden');
        localPostsPanel.classList.add('hidden');
      });
    }
  });
  
  // Function to update theme preview
  function updateThemePreview() {
    themePreview = `hsl(${siteConfig.themeColor.hue}, 65%, 50%)`;
  }
  
  // Function to handle hue change
  function handleHueChange() {
    updateThemePreview();
    dispatch('change', siteConfig);
  }
  
  // Function to add a favicon
  function addFavicon() {
    editingFavicon = {
      isNew: true,
      data: {
        src: '',
        theme: 'light',
        sizes: ''
      }
    };
    showFaviconEditor = true;
  }
  
  // Function to edit a favicon
  function editFavicon(index) {
    editingFavicon = {
      isNew: false,
      index: index,
      data: { ...siteConfig.favicon[index] }
    };
    showFaviconEditor = true;
  }
  
  // Function to save favicon
  function saveFavicon() {
    if (editingFavicon.isNew) {
      // Add new favicon
      if (!siteConfig.favicon) {
        siteConfig.favicon = [];
      }
      siteConfig.favicon = [...siteConfig.favicon, editingFavicon.data];
    } else {
      // Update existing favicon
      const newFavicons = [...siteConfig.favicon];
      newFavicons[editingFavicon.index] = editingFavicon.data;
      siteConfig.favicon = newFavicons;
    }
    
    showFaviconEditor = false;
    dispatch('change', siteConfig);
  }
  
  // Function to delete favicon
  function deleteFavicon(index) {
    if (confirm('Are you sure you want to delete this favicon?')) {
      siteConfig.favicon = siteConfig.favicon.filter((_, i) => i !== index);
      dispatch('change', siteConfig);
    }
  }
  
  // Function to handle favicon upload
  function handleFaviconUpload() {
    // In a real implementation, this would upload to a server
    // For demo purposes, we'll simulate a delay
    uploadingFavicon = true;
    
    setTimeout(() => {
      // Set a demo favicon URL
      editingFavicon.data.src = '/api/placeholder/32/32';
      uploadingFavicon = false;
    }, 1500);
  }
</script>

<div class="appearance-config-tab">
  <div class="mb-6">
    <h2 class="text-xl font-semibold text-black/80 dark:text-white/80 mb-4">Appearance Settings</h2>
    <p class="text-neutral-600 dark:text-neutral-400 mb-4">
      Configure visual aspects of your site, including theme colors and icons.
    </p>
  </div>

  <!-- Default LIGHT_DARK_AUTO Theme Settings -->
  <div class="bg-neutral-50 dark:bg-neutral-800/50 p-5 rounded-lg border border-neutral-200 dark:border-neutral-700 mb-8">
    <h3 class="text-lg font-medium text-black/80 dark:text-white/80 mb-3">Default Theme Mode</h3>
    
    <div class="space-y-4">
      <p class="text-sm text-neutral-600 dark:text-neutral-400">
        Choose the default theme mode for new visitors. Users can still change this preference through the theme switcher.
      </p>
      
      <div class="flex flex-col space-y-2">
        <label class="inline-flex items-center">
          <input 
            type="radio" 
            name="defaultTheme" 
            value={LIGHT_MODE} 
            checked={siteConfig.defaultTheme === LIGHT_MODE} 
            on:change={() => {
              siteConfig.defaultTheme = LIGHT_MODE;
              dispatch('change', siteConfig);
            }}
            class="h-4 w-4 text-[var(--primary)] border-neutral-300 dark:border-neutral-600 focus:ring-[var(--primary)]" 
          />
          <span class="ml-2 flex items-center text-neutral-700 dark:text-neutral-300">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
            Light Mode
          </span>
        </label>
        
        <label class="inline-flex items-center">
          <input 
            type="radio" 
            name="defaultTheme" 
            value={DARK_MODE} 
            checked={siteConfig.defaultTheme === DARK_MODE}
            on:change={() => {
              siteConfig.defaultTheme = DARK_MODE;
              dispatch('change', siteConfig);
            }}
            class="h-4 w-4 text-[var(--primary)] border-neutral-300 dark:border-neutral-600 focus:ring-[var(--primary)]" 
          />
          <span class="ml-2 flex items-center text-neutral-700 dark:text-neutral-300">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
            Dark Mode
          </span>
        </label>
        
        <label class="inline-flex items-center">
          <input 
            type="radio" 
            name="defaultTheme" 
            value={AUTO_MODE} 
            checked={siteConfig.defaultTheme === AUTO_MODE}
            on:change={() => {
              siteConfig.defaultTheme = AUTO_MODE;
              dispatch('change', siteConfig);
            }}
            class="h-4 w-4 text-[var(--primary)] border-neutral-300 dark:border-neutral-600 focus:ring-[var(--primary)]" 
          />
          <span class="ml-2 flex items-center text-neutral-700 dark:text-neutral-300">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 8c-1.654 0-3 1.346-3 3v0c0 1.654 1.346 3 3 3h0c1.654 0 3-1.346 3-3v0c0-1.654-1.346-3-3-3z"></path>
            </svg>
            System/Auto Mode
          </span>
        </label>
      </div>
    </div>
  </div>
  
  <!-- Theme Color Settings -->
  <div class="bg-neutral-50 dark:bg-neutral-800/50 p-5 rounded-lg border border-neutral-200 dark:border-neutral-700 mb-8">
    <h3 class="text-lg font-medium text-black/80 dark:text-white/80 mb-3">Theme Color</h3>
    
    <div class="space-y-4">
      <div class="flex items-center">
        <input 
          type="checkbox" 
          id="theme-fixed" 
          bind:checked={siteConfig.themeColor.fixed}
          on:change={() => dispatch('change', siteConfig)}
          class="h-4 w-4 text-[var(--primary)] border-neutral-300 dark:border-neutral-600 rounded" 
        />
        <label for="theme-fixed" class="ml-2 block text-sm text-neutral-700 dark:text-neutral-300">
          Use fixed theme color (don't allow user customization)
        </label>
      </div>
      
      <div>
        <label for="theme-hue" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
          Base Hue (0-360)
        </label>
        <div class="flex items-center space-x-4">
          <input 
            type="range" 
            id="theme-hue" 
            min="0" 
            max="360" 
            step="1"
            bind:value={siteConfig.themeColor.hue}
            on:input={handleHueChange}
            class="flex-grow h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer" 
          />
          <input 
            type="number" 
            bind:value={siteConfig.themeColor.hue}
            on:input={handleHueChange}
            min="0" 
            max="360" 
            class="w-16 px-2 py-1 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-md text-sm transition text-center" 
          />
        </div>
      </div>
      
      <!-- Color Preview -->
      <div class="pt-2">
        <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
          Preview
        </label>
        <div class="flex flex-wrap gap-3">
          <div class="w-16 h-16 rounded-lg shadow-sm" style="background-color: {themePreview};"></div>
          <div class="flex flex-col justify-between">
            <div class="text-sm font-medium" style="color: {themePreview};">Text Color Sample</div>
            <button class="px-3 py-1 text-white text-sm rounded" style="background-color: {themePreview};">
              Button Example
            </button>
          </div>
        </div>
      </div>
      
      <!-- Common Colors Quick Select -->
      <div class="pt-4 border-t border-neutral-200 dark:border-neutral-700">
        <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
          Quick Select
        </label>
        <div class="flex flex-wrap gap-2">
          {#each [0, 30, 60, 120, 180, 210, 240, 270, 300, 330] as hue}
            <button 
              class="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 focus:scale-110"
              style="background-color: hsl({hue}, 65%, 50%); border-color: {siteConfig.themeColor.hue === hue ? 'white' : 'transparent'};"
              on:click={() => {
                siteConfig.themeColor.hue = hue;
                handleHueChange();
              }}
              title={`Hue: ${hue}°`}
            ></button>
          {/each}
        </div>
      </div>
    </div>
  </div>
  
  <!-- PostCard Settings -->
  <div class="bg-neutral-50 dark:bg-neutral-800/50 p-5 rounded-lg border border-neutral-200 dark:border-neutral-700 mb-8">
    <h3 class="text-lg font-medium text-black/80 dark:text-white/80 mb-3">Post Card Settings</h3>
    
    <div class="space-y-6">
      <!-- Local Post Card Tabs -->
      <div class="border-b border-neutral-200 dark:border-neutral-700 mb-4">
        <nav class="flex space-x-8" aria-label="PostCard Tabs">
          <button 
            class="py-2 px-1 border-b-2 border-[var(--primary)] text-[var(--primary)] font-medium"
            id="local-posts-tab"
          >
            Local Posts
          </button>
          <button 
            class="py-2 px-1 border-b-2 border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 font-medium"
            id="friend-posts-tab"
          >
            Friend Posts
          </button>
        </nav>
      </div>
      
      <!-- Local Posts Settings -->
      <div id="local-posts-panel">
        <div class="space-y-6">
          <!-- Layout Settings -->
          <div>
            <h4 class="text-md font-medium text-black/80 dark:text-white/80 mb-3">Layout Options</h4>
            
            <div class="space-y-4">
              <div class="flex flex-col space-y-2">
                <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Image Position
                </label>
                <div class="flex space-x-4">
                  <label class="inline-flex items-center">
                    <input 
                      type="radio" 
                      name="localImagePosition" 
                      value="right" 
                      checked={postCardConfig.localPosts.layout.imagePosition === 'right'}
                      on:change={() => {
                        postCardConfig.localPosts.layout.imagePosition = 'right';
                        dispatch('change', postCardConfig);
                      }}
                      class="h-4 w-4 text-[var(--primary)] border-neutral-300 dark:border-neutral-600 focus:ring-[var(--primary)]" 
                    />
                    <span class="ml-2 text-neutral-700 dark:text-neutral-300">Right</span>
                  </label>
                  
                  <label class="inline-flex items-center">
                    <input 
                      type="radio" 
                      name="localImagePosition" 
                      value="top" 
                      checked={postCardConfig.localPosts.layout.imagePosition === 'top'}
                      on:change={() => {
                        postCardConfig.localPosts.layout.imagePosition = 'top';
                        dispatch('change', postCardConfig);
                      }}
                      class="h-4 w-4 text-[var(--primary)] border-neutral-300 dark:border-neutral-600 focus:ring-[var(--primary)]" 
                    />
                    <span class="ml-2 text-neutral-700 dark:text-neutral-300">Top</span>
                  </label>
                </div>
              </div>
              
              <div>
                <label for="localImageSize" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Image Size (%)
                </label>
                <div class="flex items-center space-x-4">
                  <input 
                    type="range" 
                    id="localImageSize" 
                    min="10" 
                    max="50" 
                    step="1"
                    bind:value={postCardConfig.localPosts.layout.imageSizePercentage}
                    on:input={() => dispatch('change', postCardConfig)}
                    class="flex-grow h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer" 
                  />
                  <input 
                    type="number" 
                    bind:value={postCardConfig.localPosts.layout.imageSizePercentage}
                    on:input={() => dispatch('change', postCardConfig)}
                    min="10" 
                    max="50" 
                    class="w-16 px-2 py-1 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-md text-sm transition text-center" 
                  />
                </div>
              </div>
              
              <div class="flex items-center">
                <input 
                  type="checkbox" 
                  id="local-show-enter-button" 
                  bind:checked={postCardConfig.localPosts.layout.showEnterButton}
                  on:change={() => dispatch('change', postCardConfig)}
                  class="h-4 w-4 text-[var(--primary)] border-neutral-300 dark:border-neutral-600 rounded" 
                />
                <label for="local-show-enter-button" class="ml-2 block text-sm text-neutral-700 dark:text-neutral-300">
                  Show Enter Button
                </label>
              </div>
            </div>
          </div>
          
          <!-- Styling Settings -->
          <div>
            <h4 class="text-md font-medium text-black/80 dark:text-white/80 mb-3">Styling Options</h4>
            
            <div class="space-y-4">
              <div>
                <label for="localTitleSize" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Title Size
                </label>
                <select 
                  id="localTitleSize" 
                  bind:value={postCardConfig.localPosts.styling.titleSize}
                  on:change={() => dispatch('change', postCardConfig)}
                  class="w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-md text-sm transition"
                >
                  <option value="text-xl">Small</option>
                  <option value="text-2xl">Medium</option>
                  <option value="text-3xl">Large</option>
                  <option value="text-4xl">Extra Large</option>
                </select>
              </div>
              
              <div>
                <label for="localDescriptionLines" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Description Lines
                </label>
                <select 
                  id="localDescriptionLines" 
                  bind:value={postCardConfig.localPosts.styling.descriptionLines}
                  on:change={() => dispatch('change', postCardConfig)}
                  class="w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-md text-sm transition"
                >
                  <option value={1}>1 Line</option>
                  <option value={2}>2 Lines</option>
                  <option value={3}>3 Lines</option>
                  <option value={4}>4 Lines</option>
                </select>
              </div>
              
              <div class="flex items-center">
                <input 
                  type="checkbox" 
                  id="local-animation-enabled" 
                  bind:checked={postCardConfig.localPosts.styling.animationEnabled}
                  on:change={() => dispatch('change', postCardConfig)}
                  class="h-4 w-4 text-[var(--primary)] border-neutral-300 dark:border-neutral-600 rounded" 
                />
                <label for="local-animation-enabled" class="ml-2 block text-sm text-neutral-700 dark:text-neutral-300">
                  Enable Load Animations
                </label>
              </div>
            </div>
          </div>
          
          <!-- Content Display Options -->
          <div>
            <h4 class="text-md font-medium text-black/80 dark:text-white/80 mb-3">Content Display</h4>
            
            <div class="space-y-3">
              <div class="flex items-center">
                <input 
                  type="checkbox" 
                  id="local-show-category" 
                  bind:checked={postCardConfig.localPosts.content.showCategory}
                  on:change={() => dispatch('change', postCardConfig)}
                  class="h-4 w-4 text-[var(--primary)] border-neutral-300 dark:border-neutral-600 rounded" 
                />
                <label for="local-show-category" class="ml-2 block text-sm text-neutral-700 dark:text-neutral-300">
                  Show Category
                </label>
              </div>
              
              <div class="flex items-center">
                <input 
                  type="checkbox" 
                  id="local-show-tags" 
                  bind:checked={postCardConfig.localPosts.content.showTags}
                  on:change={() => dispatch('change', postCardConfig)}
                  class="h-4 w-4 text-[var(--primary)] border-neutral-300 dark:border-neutral-600 rounded" 
                />
                <label for="local-show-tags" class="ml-2 block text-sm text-neutral-700 dark:text-neutral-300">
                  Show Tags
                </label>
              </div>
              
              <div class="flex items-center">
                <input 
                  type="checkbox" 
                  id="local-hide-tags-mobile" 
                  bind:checked={postCardConfig.localPosts.content.hideTagsOnMobile}
                  on:change={() => dispatch('change', postCardConfig)}
                  class="h-4 w-4 text-[var(--primary)] border-neutral-300 dark:border-neutral-600 rounded" 
                />
                <label for="local-hide-tags-mobile" class="ml-2 block text-sm text-neutral-700 dark:text-neutral-300">
                  Hide Tags on Mobile
                </label>
              </div>
              
              <div class="flex items-center">
                <input 
                  type="checkbox" 
                  id="local-show-update-date" 
                  bind:checked={postCardConfig.localPosts.content.showUpdateDate}
                  on:change={() => dispatch('change', postCardConfig)}
                  class="h-4 w-4 text-[var(--primary)] border-neutral-300 dark:border-neutral-600 rounded" 
                />
                <label for="local-show-update-date" class="ml-2 block text-sm text-neutral-700 dark:text-neutral-300">
                  Show Update Date
                </label>
              </div>
              
              <div class="flex items-center">
                <input 
                  type="checkbox" 
                  id="local-show-word-count" 
                  bind:checked={postCardConfig.localPosts.content.showWordCount}
                  on:change={() => dispatch('change', postCardConfig)}
                  class="h-4 w-4 text-[var(--primary)] border-neutral-300 dark:border-neutral-600 rounded" 
                />
                <label for="local-show-word-count" class="ml-2 block text-sm text-neutral-700 dark:text-neutral-300">
                  Show Word Count
                </label>
              </div>
              
              <div class="flex items-center">
                <input 
                  type="checkbox" 
                  id="local-show-read-time" 
                  bind:checked={postCardConfig.localPosts.content.showReadTime}
                  on:change={() => dispatch('change', postCardConfig)}
                  class="h-4 w-4 text-[var(--primary)] border-neutral-300 dark:border-neutral-600 rounded" 
                />
                <label for="local-show-read-time" class="ml-2 block text-sm text-neutral-700 dark:text-neutral-300">
                  Show Read Time
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Friend Posts Settings (initially hidden, would be shown via JavaScript) -->
      <div id="friend-posts-panel" class="hidden">
        <!-- Friend Post Layout Options -->
        <div class="space-y-6">
          <!-- Layout Settings -->
          <div>
            <h4 class="text-md font-medium text-black/80 dark:text-white/80 mb-3">Layout Options</h4>
            
            <div class="space-y-4">
              <div class="flex flex-col space-y-2">
                <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Image Position
                </label>
                <div class="flex space-x-4">
                  <label class="inline-flex items-center">
                    <input 
                      type="radio" 
                      name="friendImagePosition" 
                      value="right" 
                      checked={postCardConfig.friendPosts.layout.imagePosition === 'right'}
                      on:change={() => {
                        postCardConfig.friendPosts.layout.imagePosition = 'right';
                        dispatch('change', postCardConfig);
                      }}
                      class="h-4 w-4 text-[var(--primary)] border-neutral-300 dark:border-neutral-600 focus:ring-[var(--primary)]" 
                    />
                    <span class="ml-2 text-neutral-700 dark:text-neutral-300">Right</span>
                  </label>
                  
                  <label class="inline-flex items-center">
                    <input 
                      type="radio" 
                      name="friendImagePosition" 
                      value="top" 
                      checked={postCardConfig.friendPosts.layout.imagePosition === 'top'}
                      on:change={() => {
                        postCardConfig.friendPosts.layout.imagePosition = 'top';
                        dispatch('change', postCardConfig);
                      }}
                      class="h-4 w-4 text-[var(--primary)] border-neutral-300 dark:border-neutral-600 focus:ring-[var(--primary)]" 
                    />
                    <span class="ml-2 text-neutral-700 dark:text-neutral-300">Top</span>
                  </label>
                </div>
              </div>
              
              <div>
                <label for="friendImageSize" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Image Size (%)
                </label>
                <div class="flex items-center space-x-4">
                  <input 
                    type="range" 
                    id="friendImageSize" 
                    min="10" 
                    max="50" 
                    step="1"
                    bind:value={postCardConfig.friendPosts.layout.imageSizePercentage}
                    on:input={() => dispatch('change', postCardConfig)}
                    class="flex-grow h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer" 
                  />
                  <input 
                    type="number" 
                    bind:value={postCardConfig.friendPosts.layout.imageSizePercentage}
                    on:input={() => dispatch('change', postCardConfig)}
                    min="10" 
                    max="50" 
                    class="w-16 px-2 py-1 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-md text-sm transition text-center" 
                  />
                </div>
              </div>
            </div>
          </div>
          
          <!-- Friend Specific Options -->
          <div>
            <h4 class="text-md font-medium text-black/80 dark:text-white/80 mb-3">Friend Post Styling</h4>
            
            <div class="space-y-4">
              <div>
                <label for="friendIndicatorType" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Visual Indicator
                </label>
                <select 
                  id="friendIndicatorType" 
                  bind:value={postCardConfig.friendPosts.friendStyling.indicatorType}
                  on:change={() => dispatch('change', postCardConfig)}
                  class="w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-md text-sm transition"
                >
                  <option value="border">Border</option>
                  <option value="badge">Badge</option>
                  <option value="background">Background</option>
                </select>
              </div>
              
              <div>
                <label for="friendIndicatorColor" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Indicator Color
                </label>
                <input 
                  type="text" 
                  id="friendIndicatorColor" 
                  bind:value={postCardConfig.friendPosts.friendStyling.indicatorColor}
                  on:input={() => dispatch('change', postCardConfig)}
                  class="w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-md text-sm"
                  placeholder="var(--primary)"
                />
              </div>
              
              <div class="flex items-center">
                <input 
                  type="checkbox" 
                  id="friend-show-avatar" 
                  bind:checked={postCardConfig.friendPosts.friendStyling.showFriendAvatar}
                  on:change={() => dispatch('change', postCardConfig)}
                  class="h-4 w-4 text-[var(--primary)] border-neutral-300 dark:border-neutral-600 rounded" 
                />
                <label for="friend-show-avatar" class="ml-2 block text-sm text-neutral-700 dark:text-neutral-300">
                  Show Friend Avatar
                </label>
              </div>
            </div>
          </div>
          
          <!-- Attribution Options -->
          <div>
            <h4 class="text-md font-medium text-black/80 dark:text-white/80 mb-3">Friend Attribution</h4>
            
            <div class="space-y-4">
              <div class="flex items-center">
                <input 
                  type="checkbox" 
                  id="friend-show-attribution" 
                  bind:checked={postCardConfig.friendPosts.attribution.showAttribution}
                  on:change={() => dispatch('change', postCardConfig)}
                  class="h-4 w-4 text-[var(--primary)] border-neutral-300 dark:border-neutral-600 rounded" 
                />
                <label for="friend-show-attribution" class="ml-2 block text-sm text-neutral-700 dark:text-neutral-300">
                  Show Attribution
                </label>
              </div>
              
              <div>
                <label for="friendAttributionText" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Attribution Text
                </label>
                <input 
                  type="text" 
                  id="friendAttributionText" 
                  bind:value={postCardConfig.friendPosts.attribution.attributionText}
                  on:input={() => dispatch('change', postCardConfig)}
                  class="w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-md text-sm"
                  placeholder="Shared from [friendName]"
                />
                <p class="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  Use [friendName] as a placeholder for the friend's name
                </p>
              </div>
              
              <div class="flex items-center">
                <input 
                  type="checkbox" 
                  id="friend-link-to-site" 
                  bind:checked={postCardConfig.friendPosts.attribution.linkToFriendSite}
                  on:change={() => dispatch('change', postCardConfig)}
                  class="h-4 w-4 text-[var(--primary)] border-neutral-300 dark:border-neutral-600 rounded" 
                />
                <label for="friend-link-to-site" class="ml-2 block text-sm text-neutral-700 dark:text-neutral-300">
                  Link to Friend's Site
                </label>
              </div>
            </div>
          </div>
          
          <!-- Integration Behavior -->
          <div>
            <h4 class="text-md font-medium text-black/80 dark:text-white/80 mb-3">Integration Behavior</h4>
            
            <div class="space-y-4">
              <div>
                <label for="friendSortingMethod" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Sorting Method
                </label>
                <select 
                  id="friendSortingMethod" 
                  bind:value={postCardConfig.friendPosts.behavior.sortingMethod}
                  on:change={() => dispatch('change', postCardConfig)}
                  class="w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-md text-sm transition"
                >
                  <option value="date">By Date (newest first)</option>
                  <option value="source">Group by Source</option>
                </select>
              </div>
              
              <div class="flex items-center">
                <input 
                  type="checkbox" 
                  id="friend-merge-posts" 
                  bind:checked={postCardConfig.friendPosts.behavior.mergeWithLocalPosts}
                  on:change={() => dispatch('change', postCardConfig)}
                  class="h-4 w-4 text-[var(--primary)] border-neutral-300 dark:border-neutral-600 rounded" 
                />
                <label for="friend-merge-posts" class="ml-2 block text-sm text-neutral-700 dark:text-neutral-300">
                  Merge with Local Posts
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Favicon Settings -->
  <div class="bg-neutral-50 dark:bg-neutral-800/50 p-5 rounded-lg border border-neutral-200 dark:border-neutral-700">
    <div class="flex justify-between items-start mb-4">
      <div>
        <h3 class="text-lg font-medium text-black/80 dark:text-white/80">Favicon</h3>
        <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          The small icon shown in browser tabs and bookmarks
        </p>
      </div>
      <button 
        class="py-1.5 px-3 bg-[var(--primary)] hover:opacity-90 text-white font-medium rounded-md transition-opacity text-sm flex items-center"
        on:click={addFavicon}
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" />
        </svg>
        Add Favicon
      </button>
    </div>
    
    <div class="favicons-grid flex flex-wrap gap-3 mb-4">
      {#if !siteConfig.favicon || siteConfig.favicon.length === 0}
        <div class="w-full bg-neutral-100 dark:bg-neutral-700/30 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 text-center">
          <p class="text-neutral-500 dark:text-neutral-400">No custom favicons configured. Using default favicon.</p>
        </div>
      {:else}
        {#each siteConfig.favicon as favicon, index}
          <div class="favicon-item relative bg-white dark:bg-neutral-700 p-3 rounded-lg border border-neutral-200 dark:border-neutral-600 hover:border-[var(--primary)] transition-colors">
            <div class="w-16 h-16 flex items-center justify-center">
              <img src={favicon.src} alt="Favicon" class="max-w-full max-h-full" />
            </div>
            
            <div class="mt-2 text-center">
              <div class="text-xs font-medium text-neutral-900 dark:text-neutral-100">
                {favicon.sizes || 'Default'}
              </div>
              <div class="text-xs text-neutral-500 dark:text-neutral-400">
                {favicon.theme || 'All themes'}
              </div>
            </div>
            
            <div class="absolute top-1 right-1 flex space-x-1">
              <button 
                class="text-neutral-400 hover:text-[var(--primary)] bg-white dark:bg-neutral-700 rounded-full p-1 w-6 h-6 flex items-center justify-center shadow-sm"
                title="Edit Favicon"
                on:click={() => editFavicon(index)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button 
                class="text-neutral-400 hover:text-red-500 bg-white dark:bg-neutral-700 rounded-full p-1 w-6 h-6 flex items-center justify-center shadow-sm"
                title="Delete Favicon"
                on:click={() => deleteFavicon(index)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        {/each}
      {/if}
    </div>
    
    <div class="text-sm bg-neutral-100 dark:bg-neutral-700/30 p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 mb-2">
      <h4 class="font-medium text-black/80 dark:text-white/80 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Tips for favicons:
      </h4>
      <ul class="mt-2 space-y-1 list-disc pl-5 text-neutral-600 dark:text-neutral-400 text-xs">
        <li>Create square images (recommended sizes: 16x16, 32x32, 180x180)</li>
        <li>Use PNG format for best compatibility</li>
        <li>You can add different favicons for light and dark themes</li>
        <li>If no favicons are added, the default site favicon will be used</li>
      </ul>
    </div>
  </div>

{#if showFaviconEditor}
    <div class="fixed inset-0 bg-black/50 dark:bg-black/60 z-50 flex items-center justify-center">
      <div class="bg-white dark:bg-neutral-800 rounded-lg max-w-lg w-full overflow-auto shadow-lg">
        <div class="p-5">
          <h3 class="text-xl font-semibold text-black/80 dark:text-white/80 mb-4">
            {editingFavicon.isNew ? 'Add Favicon' : 'Edit Favicon'}
          </h3>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Favicon Image
              </label>
              <div class="flex items-center space-x-3">
                <div class="w-16 h-16 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded flex items-center justify-center overflow-hidden">
                  {#if editingFavicon.data.src}
                    <img src={editingFavicon.data.src} alt="Favicon Preview" class="max-w-full max-h-full" />
                  {:else}
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  {/if}
                </div>
                
                <div class="flex-1">
                  <button 
                    class="w-full py-2 px-3 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-300 rounded text-sm transition-colors flex items-center justify-center"
                    on:click={handleFaviconUpload}
                    disabled={uploadingFavicon}
                  >
                    {#if uploadingFavicon}
                      <svg class="animate-spin mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Uploading...
                    {:else}
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Upload Image
                    {/if}
                  </button>
                </div>
              </div>
            </div>
            
            <div>
              <label for="favicon-src" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Favicon Path
              </label>
              <input 
                type="text" 
                id="favicon-src" 
                bind:value={editingFavicon.data.src}
                class="w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-md text-sm transition" 
                placeholder="/favicon/icon-32x32.png"
              />
              <p class="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                Path to the favicon, relative to the /public directory
              </p>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label for="favicon-theme" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Theme
                </label>
                <select 
                  id="favicon-theme" 
                  bind:value={editingFavicon.data.theme}
                  class="w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-md text-sm transition"
                >
                  <option value="">All Themes</option>
                  <option value="light">Light Mode Only</option>
                  <option value="dark">Dark Mode Only</option>
                </select>
              </div>
              
              <div>
                <label for="favicon-sizes" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Size
                </label>
                <input 
                  type="text" 
                  id="favicon-sizes" 
                  bind:value={editingFavicon.data.sizes}
                  class="w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-md text-sm transition" 
                  placeholder="e.g. 32x32"
                />
              </div>
            </div>
          </div>
          
          <div class="flex justify-end space-x-3 mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-700">
            <button 
              type="button"
              class="px-4 py-2 border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
              on:click={() => showFaviconEditor = false}
            >
              Cancel
            </button>
            
            <button 
              type="button"
              class="px-4 py-2 bg-[var(--primary)] hover:opacity-90 text-white font-medium rounded-md transition-opacity"
              on:click={saveFavicon}
              disabled={!editingFavicon.data.src}
            >
              {editingFavicon.isNew ? 'Add Favicon' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>