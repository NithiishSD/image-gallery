// Unsplash API Configuration
const UNSPLASH_ACCESS_KEY = 'GidKijc13BRZnzT3ZhNVXz1GVv5ER9IM147T5DoYTmk'; // Replace with your actual API key

const UNSPLASH_API_URL = 'https://api.unsplash.com';

// DOM Elements
const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');
const gallerySection = document.querySelector('.gallery');
const suggestionButtons = document.querySelectorAll('.suggestion-button');
const themeSuggestions = document.querySelectorAll('.theme-suggestions span[data-query]');

// Global management
let currentPage = 1;
let currentQuery = '';
let currentImages = [];
let currentImageIndex = 0;
let isLoading = false;

// Initialize the gallery
document.addEventListener('DOMContentLoaded', function() {
    // Load featured images on page load
    loadFeaturedImages();
    
    // Add search form event listener
    if (searchForm) {
        searchForm.addEventListener('submit', handleSearch);
    }
    
    // Add suggestion button listeners
    suggestionButtons.forEach(button => {
        button.addEventListener('click', () => {
            const query = button.getAttribute('data-query');
            performSearch(query);
        });
    });
    
    // Add theme suggestion listeners
    themeSuggestions.forEach(span => {
        span.addEventListener('click', () => {
            const query = span.getAttribute('data-query');
            performSearch(query);
        });
    });
    
    // Add infinite scroll
    window.addEventListener('scroll', handleScroll);
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', handleKeyboard);
    
    
    //setupSearchSuggestions();
});


// Handle search form submission
function handleSearch(event) {
    event.preventDefault();
    const query = searchInput.value.trim();
    if (!query) return;
    performSearch(query);
}

// Unified search function with auto-scroll
function performSearch(query) {
    currentQuery = query;
    currentPage = 1;
    currentImages = [];
    
    // Update search input
    searchInput.value = query;
    
    // Hide suggestions
    // const suggestions = document.querySelector('.search-suggestions');
    // if (suggestions) suggestions.style.display = 'none';
    
    // Clear existing gallery
    clearGallery();
    // Auto-scroll to gallery section

    setTimeout(() => {
        gallerySection.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    }, 100);


    // Show skeleton loading
    showSkeletonGrid();
    // Search for images
    searchImages(query, currentPage);
}

// Create skeleton loading grid
function showSkeletonGrid() {
    const gallery = getOrCreateGallery();
    gallery.innerHTML = '';
    
    // Create skeleton items
    for (let i = 0; i < 20; i++) {
        const skeletonItem = document.createElement('div');
        skeletonItem.className = 'gallery-item skeleton-item';
        
        // Vary skeleton heights for realistic masonry effect
        const heights = [200, 250, 300, 350, 400, 180, 220];
        const randomHeight = heights[Math.floor(Math.random() * heights.length)];
        
        skeletonItem.innerHTML = `
            <div class="skeleton-wrapper" style="height: ${randomHeight}px;">
                <div class="skeleton-shimmer">
                    <div class="skeleton-content"></div>
                </div>
            </div>
        `;
        
        gallery.appendChild(skeletonItem);
        
        // Add staggered animation delay
        setTimeout(() => {
            skeletonItem.classList.add('skeleton-animate');
        }, i * 100);
    }
}

// Search and gety  images from Unsplash
async function searchImages(query, page = 1) {
    if (isLoading) return;
    
    isLoading = true;
    
    try {
        const response = await fetch(
            `${UNSPLASH_API_URL}/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=30&order_by=relevant`,
            {
                headers: {
                    'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
                }
            }
        );
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
            if (page === 1) {
                currentImages = [...data.results];
                showSearchResults(query, data.total);
            } else {
                currentImages = [...currentImages, ...data.results];
            }
            
            displayImages(data.results, page === 1);
            
            if (data.total_pages > page) {
                showLoadMoreButton();
            } else {
                hideLoadMoreButton();
            }
        } else if (page === 1) {
            showNoResults(query);
        }
        
    } catch (error) {
        console.error('Error fetching images:', error);
        showError('Failed to load images. Please try again.');
    } finally {
        isLoading = false;
    }
}

// Load featured images for initial page load
async function loadFeaturedImages() {
    if (isLoading) return;
    
    isLoading = true;
    showSearchResults('Featured', 30);
    showSkeletonGrid();
    
    try {
        const response = await fetch(
            `${UNSPLASH_API_URL}/photos?page=1&per_page=30&order_by=latest`,
            {
                headers: {
                    'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
                }
            }
        );
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        currentImages = [...data];
        displayImages(data, true);
        
    } catch (error) {
        console.error('Error fetching featured images:', error);
        showError('Failed to load images. Please try again.');
    } finally {
        isLoading = false;
    }
}

// Show search results header
function showSearchResults(query, totalResults) {
    const resultsHeader = document.createElement('div');
    resultsHeader.className = 'search-results-header';
    resultsHeader.innerHTML = `
        <h2>Results for "${query}"</h2>
        <p>${totalResults.toLocaleString()} images found</p>
    `;
    
    // Remove existing header
    const existingHeader = document.querySelector('.search-results-header');
    if (existingHeader) {
        existingHeader.remove();
    }
    
    // Insert before gallery
    gallerySection.parentNode.insertBefore(resultsHeader, gallerySection);
}

// Display images with improved masonry layout and loading effects
function displayImages(images, clearExisting = false) {
    const gallery = getOrCreateGallery();
    
    if (clearExisting) {
        // Remove skeleton items with fade out effect
        const skeletonItems = gallery.querySelectorAll('.skeleton-item');
        skeletonItems.forEach((item, index) => {
            setTimeout(() => {
                item.style.opacity = '0';
                item.style.transform = 'scale(0.9)';
                setTimeout(() => {
                    if (item.parentNode) item.parentNode.removeChild(item);
                }, 300);
            }, index * 20);
        });
        
        // Clear after skeleton animation
        setTimeout(() => {
            gallery.innerHTML = '';
            renderImages(images);
        }, skeletonItems.length * 20 + 300);
    } else {
        renderImages(images);
    }
}

function renderImages(images) {
    const gallery = getOrCreateGallery();
    
    images.forEach((image, index) => {
        const imageElement = createImageElement(image, currentImages.length - images.length + index);
        gallery.appendChild(imageElement);
        
        // Add entrance animation with delay
        setTimeout(() => {
            imageElement.classList.add('image-loaded');
        }, index * 100);
        
        // Setup intersection observer for lazy loading effects
        setupImageObserver(imageElement);
    });
}

// Create image element with fixed grid calculations
function createImageElement(image, globalIndex) {
    const imageContainer = document.createElement('div');
    imageContainer.className = 'gallery-item image-loading';
    
    // Fixed aspect ratio calculation for better grid layout
    const aspectRatio = image.height / image.width;
    
    // Base width matches CSS grid column width (approximately 280px with gaps)
    const baseWidth = 280;
    
    
    let calculatedHeight;
    
    if (aspectRatio <= 0.5) {
        // Very wide images (panoramic)
        calculatedHeight = Math.max(baseWidth * aspectRatio, 160);
    } else if (aspectRatio <= 0.75) {
        // Wide images (landscape)
        calculatedHeight = baseWidth * aspectRatio;
    } else if (aspectRatio <= 1.33) {
        // Square to mildly portrait
        calculatedHeight = Math.min(baseWidth * aspectRatio, 374);
    } else if (aspectRatio <= 2) {
        // Portrait images
        calculatedHeight = Math.min(baseWidth * aspectRatio, 450);
    } else {
        // Very tall images
        calculatedHeight = Math.min(baseWidth * aspectRatio, 500);
    }
    
    // Ensure minimum height and round to avoid sub-pixel issues
    calculatedHeight = Math.max(Math.round(calculatedHeight), 180);
    
    // Calculate grid row span (CSS grid-auto-rows should be 10px)
    const rowHeight = 30;
    const gap = 20; // Match CSS gap
    const rowSpan = Math.ceil((calculatedHeight + gap) / rowHeight);
    
    imageContainer.style.gridRowEnd = `span ${rowSpan}`;
    
    imageContainer.innerHTML = `
        <div class="image-wrapper" style="height:${calculatedHeight+20}px;">
            <img 
                src="${image.urls.small}" 
                alt="${image.alt_description || 'Unsplash image'}"
                loading="lazy"
                data-index="${globalIndex}"
                data-full-src="${image.urls.regular}"
                onclick="openImageModal(${globalIndex})"
                onload="handleImageLoad(this)"
                onerror="handleImageError(this)"
            />
            
    `;
    
    return imageContainer;
}

// Handle image load with smooth reveal effect
function handleImageLoad(img) {
    const container = img.closest('.gallery-item');
    const wrapper = img.parentElement;
    
    // Remove loading state
    container.classList.remove('image-loading');
    container.classList.add('image-loaded');
    
    // Add loaded class for CSS transitions
    img.classList.add('loaded');
    wrapper.classList.add('loaded');
}

// Handle image load error
function handleImageError(img) {
    const container = img.closest('.gallery-item');
    container.classList.add('image-error');
    
    img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0iY2VudHJhbCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzk5OTk5OSIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSIgZm9udC1zaXplPSIxNHB4Ij5JbWFnZSBub3QgZm91bmQ8L3RleHQ+PC9zdmc+';
    img.alt = 'Image failed to load';
}

// Setup intersection observer for advanced loading effects
function setupImageObserver(imageElement) {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const img = entry.target.querySelector('img');
            
            if (entry.isIntersecting) {
                // Image is in view - trigger advanced loading effect
                entry.target.classList.add('in-viewport');
                
                // Preload high-res version
                const highResSrc = img.getAttribute('data-full-src');
                if (highResSrc && !img.classList.contains('high-res-loaded')) {
                    const highResImg = new Image();
                    highResImg.onload = () => {
                        img.src = highResSrc;
                        img.classList.add('high-res-loaded');
                    };
                    highResImg.src = highResSrc;
                }
            } else {
                // Image is out of view
                entry.target.classList.remove('in-viewport');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '100px'
    });
    
    observer.observe(imageElement);
}

// Open image modal with full functionality
function openImageModal(imageIndex) {
    currentImageIndex = imageIndex;
    const image = currentImages[imageIndex];
    
    if (!image) return;
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'image-modal';
    modal.innerHTML = `
        <div class="modal-backdrop"></div>
        <div class="modal-content">
            <div class="modal-controls-left">
                <button class="modal-btn close-btn" onclick="closeImageModal()">×</button>
            </div>
            
            <div class="modal-controls">
                <button class="modal-btn save-btn" onclick="saveToCollection()">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                    </svg>
                </button>
                <button class="modal-btn download-btn" onclick="downloadCurrentImage()">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7,10 12,15 17,10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                </button>
                <button class="modal-btn enlarge-btn" onclick="toggleEnlarge()">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="15,3 21,3 21,9"/>
                        <polyline points="9,21 3,21 3,15"/>
                        <line x1="21" y1="3" x2="14" y2="10"/>
                        <line x1="3" y1="21" x2="10" y2="14"/>
                    </svg>
                </button>
                <button class="modal-btn menu-btn" onclick="toggleMetadata()">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="3" y1="12" x2="21" y2="12"/>
                        <line x1="3" y1="6" x2="21" y2="6"/>
                        <line x1="3" y1="18" x2="21" y2="18"/>
                    </svg>
                </button>
            </div>
            
            <button class="nav-btn prev-btn" onclick="navigateImage(-1)">‹</button>
            <button class="nav-btn next-btn" onclick="navigateImage(1)">›</button>
            
            <div class="modal-main">
                <div class="image-container ${currentImages.length <= 1 ? 'single-image' : ''}">
                    <img 
                        id="modal-image" 
                        src="${image.urls.regular}" 
                        alt="${image.alt_description || 'Unsplash image'}"
                        class="modal-image"
                    />
                </div>
                
                <div class="metadata-panel" id="metadata-panel">
                    <h3>Image Details</h3>
                    <div class="metadata-content">
                        <p><strong>Photographer:</strong> ${image.user.name}</p>
                        <p><strong>Description:</strong> ${image.alt_description || 'No description available'}</p>
                        <p><strong>Dimensions:</strong> ${image.width} × ${image.height}</p>
                        <p><strong>Likes:</strong> ${image.likes}</p>
                        <p><strong>Downloads:</strong> ${image.downloads || 'N/A'}</p>
                        <p><strong>Camera:</strong> ${image.exif?.make || 'Unknown'} ${image.exif?.model || ''}</p>
                        <p><strong>Settings:</strong> ${image.exif?.aperture || 'N/A'} • ${image.exif?.focal_length || 'N/A'}mm • ISO ${image.exif?.iso || 'N/A'}</p>
                        <p><strong>Location:</strong> ${image.location?.name || 'Unknown'}</p>
                        <div class="tags">
                            ${image.tags ? image.tags.map(tag => `<span class="tag">${tag.title}</span>`).join('') : ''}
                        </div>
                        <a href="${image.user.links.html}" target="_blank" class="photographer-link">
                            View photographer's profile
                        </a>
                    </div>
                </div>
            </div>
            
            <div class="similar-images-section">
                <button class="scroll-down-btn" onclick="toggleSimilarImages()">⬇️ Similar Images</button>
                <div class="similar-images-container" id="similar-images-container">
                    <div class="similar-images-scroll">
                        <!-- Similar images will be loaded here -->
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';//to temporarily disable scrolling
    
    // Load similar images
    loadSimilarImages(image.id);
    
    // Add water blur transition class
    setTimeout(() => {
        modal.classList.add('modal-active');
    }, 10);
}

// Navigate between images with water blur effect
function navigateImage(direction) {
    const newIndex = currentImageIndex + direction;
    
    // Rotate index if out of bounds
    if (newIndex < 0) {
        currentImageIndex = currentImages.length - 1;
    } else if (newIndex >= currentImages.length) {
        currentImageIndex = 0;
    } else {
        currentImageIndex = newIndex;
    }
    
    const modalImage = document.getElementById('modal-image');
    const metadataPanel = document.getElementById('metadata-panel');
    
    // Apply water blur effect
    modalImage.classList.add('water-blur-transition');
    
    setTimeout(() => {
        const newImage = currentImages[currentImageIndex];
        
        // Update image
        modalImage.src = newImage.urls.regular;
        modalImage.alt = newImage.alt_description || 'Unsplash image';
        
        // Update metadata
        updateMetadata(newImage);
        
        // Remove blur effect
        modalImage.classList.remove('water-blur-transition');
        
        // Load new similar images
        //loadSimilarImages(newImage.id);
    }, 300);
}

// Update metadata panel
function updateMetadata(image) {
    const metadataContent = document.querySelector('.metadata-content');
    if (metadataContent) {
        metadataContent.innerHTML = `
            <p><strong>Photographer:</strong> ${image.user.name}</p>
            <p><strong>Description:</strong> ${image.alt_description || 'No description available'}</p>
            <p><strong>Dimensions:</strong> ${image.width} × ${image.height}</p>
            <p><strong>Likes:</strong> ${image.likes}</p>
            <p><strong>Downloads:</strong> ${image.downloads || 'N/A'}</p>
            <p><strong>Camera:</strong> ${image.exif?.make || 'Unknown'} ${image.exif?.model || ''}</p>
            <p><strong>Settings:</strong> ${image.exif?.aperture || 'N/A'} • ${image.exif?.focal_length || 'N/A'}mm • ISO ${image.exif?.iso || 'N/A'}</p>
            <p><strong>Location:</strong> ${image.location?.name || 'Unknown'}</p>
            <div class="tags">
                ${image.tags ? image.tags.map(tag => `<span class="tag">${tag.title}</span>`).join('') : ''}
            </div>
            <a href="${image.user.links.html}" target="_blank" class="photographer-link">
                View photographer's profile
            </a>
        `;
    }
}

// Load similar images
async function loadSimilarImages(imageId) {
    try {
        const response = await fetch(
            `${UNSPLASH_API_URL}/photos/${imageId}/related?per_page=10`,
            {
                headers: {
                    'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
                }
            }
        );
        
        if (response.ok) {
            const similarImages = await response.json();
            displaySimilarImages(similarImages.results || similarImages);
        }
    } catch (error) {
        console.error('Error loading similar images:', error);
    }
}

// Display similar images in horizontal scroll
function displaySimilarImages(images) {
    const container = document.querySelector('.similar-images-scroll');
    if (!container || !images) return;
    
    container.innerHTML = images.map((image, index) => `
        <div class="similar-image-item" onclick="selectSimilarImage(${index})">
            <img src="${image.urls.thumb}" alt="${image.alt_description || 'Similar image'}" />
        </div>
    `).join('');
    
    // Store similar images for selection
    window.currentSimilarImages = images;
    currentImages=images;
}

// Select similar image with innovative transition
function selectSimilarImage(index) {
    if (!window.currentSimilarImages) return;
    
    const selectedImage = window.currentSimilarImages[index];
    const similarImageElement = document.querySelectorAll('.similar-image-item')[index];
    
    // Create transition overlay
    const transitionOverlay = document.createElement('div');
    transitionOverlay.className = 'image-transition-overlay';
    
    // Get position of clicked similar image
    const rect = similarImageElement.getBoundingClientRect();
    const clonedImg = similarImageElement.querySelector('img').cloneNode(true);
    
    transitionOverlay.innerHTML = `
        <div class="transition-image" style="
            position: fixed;
            left: ${rect.left}px;
            top: ${rect.top}px;
            width: ${rect.width}px;
            height: ${rect.height}px;
            z-index: 10002;
            border-radius: 8px;
            overflow: hidden;
            transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        ">
            <img src="${selectedImage.urls.small}" style="width: 100%; height: 100%; object-fit: cover;" />
        </div>
    `;
    
    document.body.appendChild(transitionOverlay);
    
    // Animate to center
    setTimeout(() => {
        const transitionImg = transitionOverlay.querySelector('.transition-image');
        const modalImage = document.getElementById('modal-image');
        const modalRect = modalImage.getBoundingClientRect();
        
        // Scale and move to center with floating effect
        transitionImg.style.left = `${modalRect.left}px`;
        transitionImg.style.top = `${modalRect.top}px`;
        transitionImg.style.width = `${modalRect.width}px`;
        transitionImg.style.height = `${modalRect.height}px`;
        transitionImg.style.transform = 'scale(1.05) translateY(-10px)';
        transitionImg.style.boxShadow = '0 20px 60px rgba(0,0,0,0.4)';
        transitionImg.style.filter = 'brightness(1.1)';
        
        // Add floating animation
        setTimeout(() => {
            transitionImg.style.transform = 'scale(1) translateY(0px)';
            transitionImg.style.filter = 'brightness(2)';
        }, 400);
    }, 50);
    
    // Update main image after transition
    setTimeout(() => {
        // Find this image in current images or add it
        let imageIndex = currentImages.findIndex(img => img.id === selectedImage.id);
        
        if (imageIndex === -1) {
            currentImages.push(selectedImage);
            imageIndex = currentImages.length - 1;
        }
        
        currentImageIndex = imageIndex;
        
        // Update the main modal image
        const modalImage = document.getElementById('modal-image');
        modalImage.src = selectedImage.urls.regular;
        modalImage.alt = selectedImage.alt_description || 'Unsplash image';
        
        updateMetadata(selectedImage);
        loadSimilarImages(selectedImage.id);
        
        // Remove transition overlay
        transitionOverlay.remove();
    }, 800);
}

// Modal control functions
function closeImageModal() {
    const modal = document.querySelector('.image-modal');
    if (modal) {
        modal.classList.add('modal-closing');
        setTimeout(() => {
            modal.remove();
            document.body.style.overflow = 'auto';
        }, 300);
    }
}

function toggleEnlarge() {
    const modalImage = document.getElementById('modal-image');
    modalImage.classList.toggle('enlarged');
}

function toggleMetadata() {
    const metadataPanel = document.getElementById('metadata-panel');
    const imageContainer = document.querySelector('.image-container');
    
    metadataPanel.classList.toggle('metadata-visible');
    imageContainer.classList.toggle('with-metadata');//moving the imge when meta is shown
}

function toggleSimilarImages() {
    const container = document.getElementById('similar-images-container');
    const button = document.querySelector('.scroll-down-btn');
    const metadataPanel = document.getElementById('metadata-panel');
    if(metadataPanel.classList.contains('metadata-visible')){
        toggleMetadata(); // Hide metadata when toggling similar images
    }
    container.classList.toggle('similar-visible');
    button.textContent = container.classList.contains('similar-visible') 
        ? '⬆️ Hide Similar Images' 
        : '⬇️ Similar Images';
}


// Utility functions
function getOrCreateGallery() {
    let gallery = document.querySelector('.gallery-grid');
    
    if (!gallery) {
        gallery = document.createElement('div');
        gallery.className = 'gallery-grid';
        gallerySection.appendChild(gallery);
    }
    
    return gallery;
}

function clearGallery() {
    const gallery = document.querySelector('.gallery-grid');
    const header = document.querySelector('.search-results-header');
    
    if (gallery) gallery.innerHTML = '';
    if (header) header.remove();
}

function showError(message) {
    const gallery = getOrCreateGallery();
    gallery.innerHTML = '';
    
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.innerHTML = `
        <div class="error-content">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <h3>Oops! Something went wrong</h3>
            <p>${message}</p>
            <button onclick="location.reload()" class="retry-btn">Try Again</button>
        </div>
    `;
    
    gallery.appendChild(errorElement);
}

function showNoResults(query) {
    const gallery = getOrCreateGallery();
    gallery.innerHTML = '';
    
    const noResultsElement = document.createElement('div');
    noResultsElement.className = 'no-results';
    noResultsElement.innerHTML = `
        <div class="no-results-content">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
                <line x1="11" y1="8" x2="11" y2="14"/>
                <line x1="8" y1="11" x2="14" y2="11"/>
            </svg>
            <h3>No images found for "${query}"</h3>
            <p>Try searching for something else or check your spelling!</p>
            <div class="suggested-searches">
                <p>Try these popular searches:</p>
                <div class="suggestion-chips">
                    <span class="chip" onclick="performSearch('nature')">nature</span>
                    <span class="chip" onclick="performSearch('landscape')">landscape</span>
                    <span class="chip" onclick="performSearch('city')">city</span>
                    <span class="chip" onclick="performSearch('abstract')">abstract</span>
                </div>
            </div>
        </div>
    `;
    
    gallery.appendChild(noResultsElement);
}

// Load more functionality
function showLoadMoreButton() {
    let loadMoreBtn = document.querySelector('.load-more-btn');
    
    if (!loadMoreBtn) {
        loadMoreBtn = document.createElement('button');
        loadMoreBtn.className = 'load-more-btn';
        loadMoreBtn.innerHTML = `
            <span>Load More Images</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6,9 12,15 18,9"/>
            </svg>
        `;
        loadMoreBtn.onclick = loadMoreImages;
        gallerySection.parentNode.appendChild(loadMoreBtn);
    }
    
    loadMoreBtn.style.display = 'block';
}

function hideLoadMoreButton() {
    const loadMoreBtn = document.querySelector('.load-more-btn');
    if (loadMoreBtn) loadMoreBtn.style.display = 'none';
}

function loadMoreImages() {
    if (currentQuery && !isLoading) {
        currentPage++;
        
        // Show loading state on button
        const loadMoreBtn = document.querySelector('.load-more-btn');
        if (loadMoreBtn) {
            loadMoreBtn.classList.add('loading');
            loadMoreBtn.innerHTML = `
                <span>Loading...</span>
                <div class="button-spinner"></div>
            `;
        }
        
        searchImages(currentQuery, currentPage).finally(() => {
            if (loadMoreBtn) {
                loadMoreBtn.classList.remove('loading');
                loadMoreBtn.innerHTML = `
                    <span>Load More Images</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="6,9 12,15 18,9"/>
                    </svg>
                `;
            }
        });
    }
}

// Infinite scroll
function handleScroll() {
    if (isLoading) return;
    
    const scrollPosition = window.innerHeight + window.scrollY;
    const documentHeight = document.documentElement.offsetHeight;
    
    if (scrollPosition >= documentHeight - 1000) {
        loadMoreImages();
    }
}

// Keyboard shortcuts
function handleKeyboard(event) {
    const modal = document.querySelector('.image-modal');
    
    if (modal) {
        switch(event.key) {
            case 'Escape':
                closeImageModal();
                break;
            case 'ArrowLeft':
                navigateImage(-1);
                break;
            case 'ArrowRight':
                navigateImage(1);
                break;
            case 'f':
            case 'F':
                toggleEnlarge();
                break;
            case 'm':
            case 'M':
                toggleMetadata();
                break;
            case 's':
            case 'S':
                if (event.ctrlKey) {
                    event.preventDefault();
                    downloadCurrentImage();
                }
                break;
        }
    } else {
        if (event.key === '/' && event.target.tagName !== 'INPUT') {
            event.preventDefault();
            searchInput.focus();
        }
    }
        notification.classList.add('notification-show');
        
        
        setTimeout(() => {
            notification.classList.remove('notification-show');
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }






























// Collection Management System

// Initialize collections from memory or create empty array
let collections = JSON.parse(sessionStorage.getItem('imageCollections')) || [];

// Save collections to session storage
function saveCollectionsToStorage() {
    sessionStorage.setItem('imageCollections', JSON.stringify(collections));
}

// Enhanced saveToCollection function with actual save logic
function saveToCollection() {
    const currentImage = currentImages[currentImageIndex];
    if (!currentImage) return;

    // Check if image is already in collections
    const existingCollection = collections.find(item => item.id === currentImage.id);
    if (existingCollection) {
        showNotification('Image already in collection!', 'warning');
        return;
    }

    // Create collection item with metadata
    const collectionItem = {
        id: currentImage.id,
        url: currentImage.url,
        title: currentImage.title || `Image ${currentImage.id}`,
        savedAt: new Date().toISOString(),
        tags: currentImage.tags || [],
        source: currentImage.source || 'Unknown'
    };

    // Add to collections
    collections.unshift(collectionItem); // Add to beginning for recent-first order
    saveCollectionsToStorage();

    // Show success notification
    showNotification('Image saved to collection!', 'success');
    
    console.log('Saved to collection:', collectionItem);
}

// Enhanced notification system
function showNotification(message, type = 'success') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.save-notification');
    existingNotifications.forEach(notif => notif.remove());

    const notification = document.createElement('div');
    notification.className = `save-notification notification-${type}`;
    
    const icon = type === 'success' 
        ? `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
             <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
           </svg>`
        : `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
             <circle cx="12" cy="12" r="10"/>
             <line x1="12" y1="8" x2="12" y2="12"/>
             <line x1="12" y1="16" x2="12.01" y2="16"/>
           </svg>`;

    notification.innerHTML = `
        <div class="notification-content">
            ${icon}
            <p>${message}</p>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => notification.classList.add('notification-show'), 10);
    
    // Auto remove
    setTimeout(() => {
        notification.classList.remove('notification-show');
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

// Collection modal functionality
function showCollections() {
    // Remove existing modal if any
    const existingModal = document.querySelector('.collection-modal');
    if (existingModal) existingModal.remove();

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'collection-modal';
    modal.innerHTML = `
        <div class="collection-modal-content">
            <div class="collection-header">
                <h2>My Collections</h2>
                <button class="close-modal" onclick="closeCollectionModal()">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </div>
            <div class="collection-stats">
                <p>${collections.length} images saved</p>
                ${collections.length > 0 ? `<button class="clear-all-btn" onclick="clearAllCollections()">Clear All</button>` : ''}
            </div>
            <div class="collection-grid">
                ${collections.length === 0 ? 
                    '<div class="empty-collection"><p>No images saved yet. Start exploring and save your favorites!</p></div>' :
                    collections.map(item => `
                        <div class="collection-item" data-id="${item.id}">
                            <div class="collection-image-container">
                                <img src="${item.url}" alt="${item.title}" loading="lazy">
                                <div class="collection-item-overlay">
                                    <button class="view-image-btn" onclick="viewCollectionImage('${item.id}')">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                            <circle cx="12" cy="12" r="3"/>
                                        </svg>
                                    </button>
                                    <button class="remove-image-btn" onclick="removeFromCollection('${item.id}')">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <line x1="18" y1="6" x2="6" y2="18"/>
                                            <line x1="6" y1="6" x2="18" y2="18"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <div class="collection-item-info">
                                <h4>${item.title}</h4>
                                <p class="saved-date">Saved ${formatDate(item.savedAt)}</p>
                                ${item.tags && item.tags.length > 0 ? 
                                    `<div class="collection-tags">${item.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>` : 
                                    ''}
                            </div>
                        </div>
                    `).join('')
                }
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    
    // Trigger animation
    setTimeout(() => modal.classList.add('modal-show'), 10);
    
    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeCollectionModal();
    });
}

// Close collection modal
function closeCollectionModal() {
    const modal = document.querySelector('.collection-modal');
    if (modal) {
        modal.classList.remove('modal-show');
        setTimeout(() => modal.remove(), 300);
    }
}

// View image from collection
function viewCollectionImage(imageId) {
    const collectionItem = collections.find(item => item.id === imageId);
    if (collectionItem) {
        // Close collection modal
        closeCollectionModal();
        
        // Find the image in currentImages or create a temporary view
        const imageIndex = currentImages.findIndex(img => img.id === imageId);
        if (imageIndex !== -1) {
            currentImageIndex = imageIndex;
            updateImageDisplay();
        } else {
            // Create a temporary full-screen view for collection images
            showFullscreenImage(collectionItem);
        }
    }
}

// Show fullscreen image viewer for collection items
function showFullscreenImage(imageItem) {
    const viewer = document.createElement('div');
    viewer.className = 'fullscreen-viewer';
    viewer.innerHTML = `
        <div class="fullscreen-content">
            <button class="close-fullscreen" onclick="closeFullscreenViewer()">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
            <img src="${imageItem.url}" alt="${imageItem.title}">
            <div class="fullscreen-info">
                <h3>${imageItem.title}</h3>
                <p>Saved ${formatDate(imageItem.savedAt)}</p>
            </div>
        </div>
    `;
    
    document.body.appendChild(viewer);
    setTimeout(() => viewer.classList.add('viewer-show'), 10);
    
    // Close on background click or escape key
    viewer.addEventListener('click', (e) => {
        if (e.target === viewer) closeFullscreenViewer();
    });
    
    document.addEventListener('keydown', function escapeHandler(e) {
        if (e.key === 'Escape') {
            closeFullscreenViewer();
            document.removeEventListener('keydown', escapeHandler);
        }
    });
}

function closeFullscreenViewer() {
    const viewer = document.querySelector('.fullscreen-viewer');
    if (viewer) {
        viewer.classList.remove('viewer-show');
        setTimeout(() => viewer.remove(), 300);
    }
}

// Remove image from collection
function removeFromCollection(imageId) {
    const index = collections.findIndex(item => item.id === imageId);
    if (index !== -1) {
        collections.splice(index, 1);
        saveCollectionsToStorage();
        
        // Refresh the collection view
        showCollections();
        
        showNotification('Image removed from collection!', 'success');
    }
}

// Clear all collections
function clearAllCollections() {
    if (confirm('Are you sure you want to remove all images from your collection? This action cannot be undone.')) {
        collections = [];
        saveCollectionsToStorage();
        showCollections(); // Refresh view
        showNotification('Collection cleared!', 'success');
    }
}

// Utility function to format dates
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

// Search within collections
function searchCollections(searchTerm) {
    const filteredCollections = collections.filter(item => 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.tags && item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
    );
    
    displayFilteredCollections(filteredCollections);
}

// Display filtered collections
function displayFilteredCollections(filteredItems) {
    const grid = document.querySelector('.collection-grid');
    if (!grid) return;
    
    grid.innerHTML = filteredItems.length === 0 ? 
        '<div class="empty-collection"><p>No images found matching your search.</p></div>' :
        filteredItems.map(item => `
            <div class="collection-item" data-id="${item.id}">
                <div class="collection-image-container">
                    <img src="${item.url}" alt="${item.title}" loading="lazy">
                    <div class="collection-item-overlay">
                        <button class="view-image-btn" onclick="viewCollectionImage('${item.id}')">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                <circle cx="12" cy="12" r="3"/>
                            </svg>
                        </button>
                        <button class="remove-image-btn" onclick="removeFromCollection('${item.id}')">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"/>
                                <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="collection-item-info">
                    <h4>${item.title}</h4>
                    <p class="saved-date">Saved ${formatDate(item.savedAt)}</p>
                    ${item.tags && item.tags.length > 0 ? 
                        `<div class="collection-tags">${item.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>` : 
                        ''}
                </div>
            </div>
        `).join('');
}

// Get collection count for display
function getCollectionCount() {
    return collections.length;
}

// Check if image is in collection
function isImageInCollection(imageId) {
    return collections.some(item => item.id === imageId);
}

// Export collection as JSON
function exportCollection() {
    if (collections.length === 0) {
        showNotification('No images to export!', 'warning');
        return;
    }
    
    const dataStr = JSON.stringify(collections, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `image-collection-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    showNotification('Collection exported!', 'success');
}

// Collection button click handler for home page
function handleCollectionButtonClick() {
    showCollections();
}

// Enhanced collection modal with search functionality
function showCollections() {
    const existingModal = document.querySelector('.collection-modal');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.className = 'collection-modal';
    modal.innerHTML = `
        <div class="collection-modal-content">
            <div class="collection-header">
                <h2>My Collections</h2>
                <button class="close-modal" onclick="closeCollectionModal()">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </div>
            
            ${collections.length > 0 ? `
                <div class="collection-controls">
                    <div class="search-container">
                        <input type="text" 
                               id="collection-search" 
                               placeholder="Search your collection..." 
                               onkeyup="handleCollectionSearch(this.value)">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="11" cy="11" r="8"/>
                            <path d="m21 21-4.35-4.35"/>
                        </svg>
                    </div>
                    <div class="collection-actions">
                        <button class="export-btn" onclick="exportCollection()">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                <polyline points="7,10 12,15 17,10"/>
                                <line x1="12" y1="15" x2="12" y2="3"/>
                            </svg>
                            Export
                        </button>
                        <button class="clear-all-btn" onclick="clearAllCollections()">Clear All</button>
                    </div>
                </div>
            ` : ''}
            
            <div class="collection-stats">
                <p>${collections.length} images saved</p>
            </div>
            
            <div class="collection-grid">
                ${collections.length === 0 ? 
                    `<div class="empty-collection">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                        </svg>
                        <h3>No images saved yet</h3>
                        <p>Start exploring and save your favorites to see them here!</p>
                    </div>` :
                    collections.map(item => `
                        <div class="collection-item" data-id="${item.id}">
                            <div class="collection-image-container">
                                <img src="${item.url}" alt="${item.title}" loading="lazy" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiI+PHJlY3QgeD0iMyIgeT0iMyIgd2lkdGg9IjE4IiBoZWlnaHQ9IjE4IiByeD0iMiIgcnk9IjIiLz48Y2lyY2xlIGN4PSI4LjUiIGN5PSI4LjUiIHI9IjEuNSIvPjxwb2x5bGluZSBwb2ludHM9Im0yMSAxNSAtMy41LTMuNS01LjUgMCIvPjwvc3ZnPg=='">
                                <div class="collection-item-overlay">
                                    <button class="view-image-btn" onclick="viewCollectionImage('${item.id}')" title="View Image">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                            <circle cx="12" cy="12" r="3"/>
                                        </svg>
                                    </button>
                                    <button class="remove-image-btn" onclick="removeFromCollection('${item.id}')" title="Remove from Collection">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <line x1="18" y1="6" x2="6" y2="18"/>
                                            <line x1="6" y1="6" x2="18" y2="18"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <div class="collection-item-info">
                                <h4>${item.title}</h4>
                                <p class="saved-date">Saved ${formatDate(item.savedAt)}</p>
                                ${item.tags && item.tags.length > 0 ? 
                                    `<div class="collection-tags">${item.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>` : 
                                    ''}
                            </div>
                        </div>
                    `).join('')
                }
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('modal-show'), 10);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeCollectionModal();
    });
}

// Handle collection search
function handleCollectionSearch(searchTerm) {
    if (searchTerm.trim() === '') {
        displayFilteredCollections(collections);
    } else {
        searchCollections(searchTerm.trim());
    }
}

// Initialize collections on page load
document.addEventListener('DOMContentLoaded', function() {
    // Update collection button if it exists
    const collectionBtn = document.querySelector('.collection-btn, #collection-btn, [data-action="collections"]');
    if (collectionBtn) {
        collectionBtn.addEventListener('click', handleCollectionButtonClick);
        
        // Update button text with count if available
        const count = getCollectionCount();
        if (count > 0) {
            const countBadge = document.createElement('span');
            countBadge.className = 'collection-count-badge';
            countBadge.textContent = count;
            collectionBtn.appendChild(countBadge);
        }
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Save to collection with 'S' key
    if (e.key.toLowerCase() === 's' && !e.ctrlKey && !e.metaKey) {
        if (!document.querySelector('.collection-modal')) { // Only if modal is not open
            e.preventDefault();
            saveToCollection();
        }
    }
    
    // Open collections with 'C' key
    if (e.key.toLowerCase() === 'c' && !e.ctrlKey && !e.metaKey) {
        if (!document.querySelector('.collection-modal')) {
            e.preventDefault();
            showCollections();
        }
    }
});





function downloadCurrentImage() {
    const currentImage = currentImages[currentImageIndex];
    if (currentImage) {
        const link = document.createElement('a');
        link.href = currentImage.urls.full;
        link.download = `unsplash-${currentImage.id}.jpg`;
        link.click();
    }
}

