// Unsplash API Configuration
const UNSPLASH_ACCESS_KEY = 'YOUR_UNSPLASH_ACCESS_KEY'; // Replace with your actual API key
const UNSPLASH_API_URL = 'https://api.unsplash.com';

// DOM Elements
const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');
const gallerySection = document.querySelector('.gallery');
const suggestionButtons = document.querySelectorAll('.suggestion-button');
const themeSuggestions = document.querySelectorAll('.theme-suggestions span[data-query]');

// State management
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
});

// Handle search form submission
function handleSearch(event) {
    event.preventDefault();
    const query = searchInput.value.trim();
    if (!query) return;
    performSearch(query);
}

// Unified search function
function performSearch(query) {
    currentQuery = query;
    currentPage = 1;
    currentImages = [];
    
    // Update search input
    searchInput.value = query;
    
    // Clear existing gallery
    clearGallery();
    
    // Show loading state
    showLoading();
    
    // Search for images
    searchImages(query, currentPage);
}

// Search images from Unsplash
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
        
        hideLoading();
        
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
        hideLoading();
        showError('Failed to load images. Please try again.');
    } finally {
        isLoading = false;
    }
}

// Load featured images for initial page load
async function loadFeaturedImages() {
    if (isLoading) return;
    
    isLoading = true;
    showLoading();
    
    try {
        const response = await fetch(
            `${UNSPLASH_API_URL}/photos?page=1&per_page=30&order_by=popular`,
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
        hideLoading();
        displayImages(data, true);
        
    } catch (error) {
        console.error('Error fetching featured images:', error);
        hideLoading();
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

// Display images in masonry layout
function displayImages(images, clearExisting = false) {
    const gallery = getOrCreateGallery();
    
    if (clearExisting) {
        gallery.innerHTML = '';
    }
    
    images.forEach((image, index) => {
        const imageElement = createImageElement(image, currentImages.length - images.length + index);
        gallery.appendChild(imageElement);
    });
}

// Create image element for masonry grid
function createImageElement(image, globalIndex) {
    const imageContainer = document.createElement('div');
    imageContainer.className = 'gallery-item';
    
    // Calculate dynamic height based on image aspect ratio
    const aspectRatio = image.height / image.width;
    const baseWidth = 300; // Base width for calculation
    let calculatedHeight;
    
    // Create different height categories for better masonry effect
    if (aspectRatio <= 0.6) {
        // Wide images (landscape)
        calculatedHeight = Math.max(baseWidth * aspectRatio, 180);
    } else if (aspectRatio <= 1.0) {
        // Square-ish images
        calculatedHeight = baseWidth * aspectRatio;
    } else if (aspectRatio <= 1.5) {
        // Tall images (portrait)
        calculatedHeight = Math.min(baseWidth * aspectRatio, 450);
    } else {
        // Very tall images
        calculatedHeight = Math.min(baseWidth * aspectRatio, 500);
    }
    
    // Add some randomness to avoid too uniform grid (optional)
    const randomVariation = (Math.random() - 0.5) * 20; // ±10px variation
    calculatedHeight = Math.max(calculatedHeight + randomVariation, 150);
    
    imageContainer.innerHTML = `
        <div class="image-wrapper" style="height: ${Math.round(calculatedHeight)}px;">
            <img 
                src="${image.urls.small}" 
                alt="${image.alt_description || 'Unsplash image'}"
                loading="lazy"
                data-index="${globalIndex}"
                data-aspect-ratio="${aspectRatio.toFixed(3)}"
                onclick="openImageModal(${globalIndex})"
                onload="adjustImageHeight(this, ${aspectRatio})"
            />
        </div>
    `;
    
    return imageContainer;
}

// Adjust image height after loading (fine-tuning)
function adjustImageHeight(img, aspectRatio) {
    const wrapper = img.parentElement;
    const container = wrapper.parentElement;
    const actualWidth = img.offsetWidth;
    
    // Recalculate height based on actual rendered width
    const idealHeight = actualWidth * aspectRatio;
    
    // Calculate grid row span for masonry effect
    const rowHeight = 10; // Should match CSS grid-auto-rows
    const rowSpan = Math.ceil((idealHeight + 10) / rowHeight); // +10 for gap
    
    // Apply the new height and grid positioning
    wrapper.style.transition = 'height 0.3s ease';
    wrapper.style.height = `${Math.round(idealHeight)}px`;
    container.style.gridRowEnd = `span ${rowSpan}`;
    
    // Remove transition after animation
    setTimeout(() => {
        wrapper.style.transition = '';
    }, 300);
}

// Enhanced display function with better masonry positioning
function displayImages(images, clearExisting = false) {
    const gallery = getOrCreateGallery();
    
    if (clearExisting) {
        gallery.innerHTML = '';
    }
    
    images.forEach((image, index) => {
        const imageElement = createImageElement(image, currentImages.length - images.length + index);
        gallery.appendChild(imageElement);
        
        // Pre-calculate grid position for better layout
        setTimeout(() => {
            const img = imageElement.querySelector('img');
            if (img.complete) {
                adjustImageHeight(img, image.height / image.width);
            }
        }, 100);
    });
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
    document.body.style.overflow = 'hidden';
    
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
    
    if (newIndex < 0 || newIndex >= currentImages.length) return;
    
    const modalImage = document.getElementById('modal-image');
    const metadataPanel = document.getElementById('metadata-panel');
    
    // Apply water blur effect
    modalImage.classList.add('water-blur-transition');
    
    setTimeout(() => {
        currentImageIndex = newIndex;
        const newImage = currentImages[currentImageIndex];
        
        // Update image
        modalImage.src = newImage.urls.regular;
        modalImage.alt = newImage.alt_description || 'Unsplash image';
        
        // Update metadata
        updateMetadata(newImage);
        
        // Remove blur effect
        modalImage.classList.remove('water-blur-transition');
        
        // Load new similar images
        loadSimilarImages(newImage.id);
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
            `${UNSPLASH_API_URL}/photos/${imageId}/related?per_page=20`,
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
            transitionImg.style.filter = 'brightness(1)';
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
    imageContainer.classList.toggle('with-metadata');
}

function toggleSimilarImages() {
    const container = document.getElementById('similar-images-container');
    const button = document.querySelector('.scroll-down-btn');
    
    container.classList.toggle('similar-visible');
    button.textContent = container.classList.contains('similar-visible') 
        ? '⬆️ Hide Similar Images' 
        : '⬇️ Similar Images';
}

function saveToCollection() {
    // Show collection selection modal or implement save functionality
    const currentImage = currentImages[currentImageIndex];
    if (currentImage) {
        // Create temporary notification
        const notification = document.createElement('div');
        notification.className = 'save-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                </svg>
                <p>Image saved to collection!</p>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('notification-show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('notification-show');
            setTimeout(() => notification.remove(), 300);
        }, 2000);
        
        console.log('Save to collection:', currentImage.id);
        // Implement your collection save logic here
    }
}

function downloadCurrentImage() {
    const currentImage = currentImages[currentImageIndex];
    if (currentImage) {
        const link = document.createElement('a');
        link.href = currentImage.urls.full;
        link.download = `unsplash-${currentImage.id}.jpg`;
        link.click();
    }
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

function showLoading() {
    const gallery = getOrCreateGallery();
    
    const existingLoader = document.querySelector('.loading-indicator');
    if (existingLoader) existingLoader.remove();
    
    const loader = document.createElement('div');
    loader.className = 'loading-indicator';
    loader.innerHTML = `
        <div class="spinner"></div>
        <p>Loading images...</p>
    `;
    
    gallery.appendChild(loader);
}

function hideLoading() {
    const loader = document.querySelector('.loading-indicator');
    if (loader) loader.remove();
}

function showError(message) {
    const gallery = getOrCreateGallery();
    
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.innerHTML = `
        <p>❌ ${message}</p>
        <button onclick="location.reload()">Try Again</button>
    `;
    
    gallery.appendChild(errorElement);
}

function showNoResults(query) {
    const gallery = getOrCreateGallery();
    
    const noResultsElement = document.createElement('div');
    noResultsElement.className = 'no-results';
    noResultsElement.innerHTML = `
        <h3>No images found for "${query}"</h3>
        <p>Try searching for something else!</p>
    `;
    
    gallery.appendChild(noResultsElement);
}

// Load more functionality
function showLoadMoreButton() {
    let loadMoreBtn = document.querySelector('.load-more-btn');
    
    if (!loadMoreBtn) {
        loadMoreBtn = document.createElement('button');
        loadMoreBtn.className = 'load-more-btn';
        loadMoreBtn.textContent = 'Load More Images';
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
        searchImages(currentQuery, currentPage);
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
}
