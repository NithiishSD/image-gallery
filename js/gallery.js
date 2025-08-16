
// Modified JavaScript with enhanced ash effect integration and debugging
const UNSPLASH_ACCESS_KEY = 'GidKijc13BRZnzT3ZhNVXz1GVv5ER9IM147T5DoYTmk';
const UNSPLASH_API_URL = 'https://api.unsplash.com';

const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');
const gallerySection = document.querySelector('.gallery');
const suggestionButtons = document.querySelectorAll('.suggestion-button');
const themeSuggestions = document.querySelectorAll('.theme-suggestions span[data-query]');

let currentPage = 1;
let currentQuery = '';
let currentImages = [];
let currentImageIndex = 0;
let isLoading = false;

document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing gallery with ash effect');
    loadFeaturedImages();
    
    if (searchForm) {
        searchForm.addEventListener('submit', handleSearch);
    }
    
    suggestionButtons.forEach(button => {
        button.addEventListener('click', () => {
            const query = button.getAttribute('data-query');
            performSearch(query);
        });
    });
    
    themeSuggestions.forEach(span => {
        span.addEventListener('click', () => {
            const query = span.getAttribute('data-query');
            performSearch(query);
        });
    });
    
    window.addEventListener('scroll', handleScroll);
    
    document.addEventListener('keydown', handleKeyboard);
    
    setupSearchSuggestions();
});

function setupSearchSuggestions() {
    if (!searchInput) return;
    
    const suggestionsContainer = document.createElement('div');
    suggestionsContainer.className = 'search-suggestions';
    suggestionsContainer.style.display = 'none';
    searchInput.parentNode.appendChild(suggestionsContainer);
    
    const commonSearches = [
        'nature', 'landscape', 'city', 'mountains', 'ocean', 'forest', 'sunset', 
        'architecture', 'travel', 'animals', 'flowers', 'abstract', 'minimal',
        'technology', 'food', 'coffee', 'workspace', 'business', 'people'
    ];
    
    searchInput.addEventListener('focus', () => {
        if (searchInput.value.trim() === '') {
            showSuggestions(commonSearches, suggestionsContainer);
        }
    });
    
    searchInput.addEventListener('input', (e) => {
        const value = e.target.value.trim();
        if (value.length > 0) {
            const filtered = commonSearches.filter(term => 
                term.toLowerCase().includes(value.toLowerCase())
            );
            showSuggestions(filtered.slice(0, 6), suggestionsContainer);
        } else {
            showSuggestions(commonSearches, suggestionsContainer);
        }
    });
    
    searchInput.addEventListener('blur', (e) => {
        setTimeout(() => {
            suggestionsContainer.style.display = 'none';
        }, 200);
    });
}

function showSuggestions(suggestions, container) {
    if (suggestions.length === 0) {
        container.style.display = 'none';
        return;
    }
    
    container.innerHTML = suggestions.map(suggestion => 
        `<div class="suggestion-item" onclick="selectSuggestion('${suggestion}')">${suggestion}</div>`
    ).join('');
    container.style.display = 'block';
}

function selectSuggestion(suggestion) {
    searchInput.value = suggestion;
    performSearch(suggestion);
    document.querySelector('.search-suggestions').style.display = 'none';
}

function handleSearch(event) {
    event.preventDefault();
    const query = searchInput.value.trim();
    if (!query) return;
    performSearch(query);
}

function performSearch(query) {
    currentQuery = query;
    currentPage = 1;
    currentImages = [];
    
    searchInput.value = query;
    
    const suggestions = document.querySelector('.search-suggestions');
    if (suggestions) suggestions.style.display = 'none';
    
    clearGallery();
    
    showSkeletonGrid();
    
    setTimeout(() => {
        gallerySection.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    }, 100);
    
    searchImages(query, currentPage);
}

function showSkeletonGrid() {
    const gallery = getOrCreateGallery();
    gallery.innerHTML = '';
    
    for (let i = 0; i < 20; i++) {
        const skeletonItem = document.createElement('div');
        skeletonItem.className = 'gallery-item skeleton-item';
        
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
        
        setTimeout(() => {
            skeletonItem.classList.add('skeleton-animate');
        }, i * 50);
    }
}

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

async function loadFeaturedImages() {
    if (isLoading) return;
    
    isLoading = true;
    showSkeletonGrid();
    
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
        displayImages(data, true);
        
    } catch (error) {
        console.error('Error fetching featured images:', error);
        showError('Failed to load images. Please try again.');
    } finally {
        isLoading = false;
    }
}

function showSearchResults(query, totalResults) {
    const resultsHeader = document.createElement('div');
    resultsHeader.className = 'search-results-header';
    resultsHeader.innerHTML = `
        <h2>Results for "${query}"</h2>
        <p>${totalResults.toLocaleString()} images found</p>
    `;
    
    const existingHeader = document.querySelector('.search-results-header');
    if (existingHeader) {
        existingHeader.remove();
    }
    
    gallerySection.parentNode.insertBefore(resultsHeader, gallerySection);
}

function displayImages(images, clearExisting = false) {
    const gallery = getOrCreateGallery();
    
    if (clearExisting) {
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
        
        setTimeout(() => {
            console.log('Clearing gallery and rendering new images with ash effect');
            gallery.innerHTML = '';
            renderImages(images);
        }, skeletonItems.length * 20 + 400); // Increased delay to ensure skeleton clears
    } else {
        renderImages(images);
    }
}

function renderImages(images) {
    const gallery = getOrCreateGallery();
    
    images.forEach((image, index) => {
        const imageElement = createImageElement(image, currentImages.length - images.length + index);
        gallery.appendChild(imageElement);
        
        setTimeout(() => {
            imageElement.classList.add('image-loaded');
            console.log(`Image ${index} added with ash-loading class`);
        }, index * 100);
        
        setupImageObserver(imageElement);
    });
}

function createImageElement(image, globalIndex) {
    const imageContainer = document.createElement('div');
    imageContainer.className = 'gallery-item image-loading';
    
    const aspectRatio = image.height / image.width;
    
    const baseWidth = 280;
    
    let calculatedHeight;
    
    if (aspectRatio <= 0.5) {
        calculatedHeight = Math.max(baseWidth * aspectRatio, 160);
    } else if (aspectRatio <= 0.75) {
        calculatedHeight = baseWidth * aspectRatio;
    } else if (aspectRatio <= 1.33) {
        calculatedHeight = Math.min(baseWidth * aspectRatio, 374);
    } else if (aspectRatio <= 2) {
        calculatedHeight = Math.min(baseWidth * aspectRatio, 450);
    } else {
        calculatedHeight = Math.min(baseWidth * aspectRatio, 500);
    }
    
    calculatedHeight = Math.max(Math.round(calculatedHeight), 180);
    
    const rowHeight = 10;
    const gap = 20;
    const rowSpan = Math.ceil((calculatedHeight + gap) / rowHeight);
    
    imageContainer.style.gridRowEnd = `span ${rowSpan}`;
    
    imageContainer.innerHTML = `
        <div class="image-wrapper ash-loading" style="height: ${calculatedHeight}px;">
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
            <div class="image-overlay">
                <div class="image-info">
                    <span class="photographer">📸 ${image.user.name}</span>
                    <span class="likes">❤️ ${image.likes}</span>
                </div>
            </div>
        </div>
    `;
    
    console.log(`Created image element ${globalIndex} with ash-loading class`);
    return imageContainer;
}

function handleImageLoad(img) {
    const container = img.closest('.gallery-item');
    const wrapper = img.parentElement;
    
    console.log('Image loaded, removing ash-loading, applying forming-image');
    
    container.classList.remove('image-loading');
    container.classList.add('image-loaded');
    
    wrapper.classList.remove('ash-loading');
    wrapper.classList.add('forming-image');
    
    img.classList.add('loaded');
    wrapper.classList.add('loaded');
    
    // Remove forming-image class after ashDissolve animation (1.2s)
    setTimeout(() => {
        wrapper.classList.remove('forming-image');
        console.log('Removed forming-image class after animation');
    }, 1200);
}

function handleImageError(img) {
    const container = img.closest('.gallery-item');
    const wrapper = img.parentElement;
    
    console.log('Image error occurred');
    
    container.classList.add('image-error');
    wrapper.classList.remove('ash-loading', 'forming-image');
    
    img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0iY2VudHJhbCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzk5OTk5OSIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSIgZm9udC1zaXplPSIxNHB4Ij5JbWFnZSBub3QgZm91bmQ8L3RleHQ+PC9zdmc+';
    img.alt = 'Image failed to load';
}

function setupImageObserver(imageElement) {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const img = entry.target.querySelector('img');
            
            if (entry.isIntersecting) {
                entry.target.classList.add('in-viewport');
                
                const highResSrc = img.getAttribute('data-full-src');
                if (highResSrc && !img.classList.contains('high-res-loaded')) {
                    const highResImg = new Image();
                    highResImg.onload = () => {
                        img.src = highResSrc;
                        img.classList.add('high-res-loaded');
                        console.log('High-res image loaded');
                    };
                    highResImg.src = highResSrc;
                }
            } else {
                entry.target.classList.remove('in-viewport');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '100px'
    });
    
    observer.observe(imageElement);
}

function openImageModal(imageIndex) {
    currentImageIndex = imageIndex;
    const image = currentImages[imageIndex];
    
    if (!image) return;
    
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
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    loadSimilarImages(image.id);
    
    setTimeout(() => {
        modal.classList.add('modal-active');
    }, 10);
}

function navigateImage(direction) {
    const newIndex = currentImageIndex + direction;
    
    if (newIndex < 0 || newIndex >= currentImages.length) return;
    
    const modalImage = document.getElementById('modal-image');
    const metadataPanel = document.getElementById('metadata-panel');
    
    modalImage.classList.add('water-blur-transition');
    
    setTimeout(() => {
        currentImageIndex = newIndex;
        const newImage = currentImages[currentImageIndex];
        
        modalImage.src = newImage.urls.regular;
        modalImage.alt = newImage.alt_description || 'Unsplash image';
        
        updateMetadata(newImage);
        
        modalImage.classList.remove('water-blur-transition');
        
        loadSimilarImages(newImage.id);
    }, 300);
}

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
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const similarImagesContainer = document.getElementById('similar-images-container');
        const similarImagesScroll = similarImagesContainer.querySelector('.similar-images-scroll');
        
        similarImagesScroll.innerHTML = data.results.map((image, index) => `
            <div class="similar-image-item" onclick="openImageModal(${currentImages.length + index})">
                <img src="${image.urls.thumb}" alt="${image.alt_description || 'Related image'}" loading="lazy"/>
            </div>
        `).join('');
        
        data.results.forEach(image => {
            if (!currentImages.some(img => img.id === image.id)) {
                currentImages.push(image);
            }
        });
        
    } catch (error) {
        console.error('Error fetching similar images:', error);
    }
}

function toggleSimilarImages() {
    const similarSection = document.querySelector('.similar-images-section');
    similarSection.classList.toggle('similar-visible');
}

function toggleMetadata() {
    const metadataPanel = document.getElementById('metadata-panel');
    const imageContainer = document.querySelector('.image-container');
    
    metadataPanel.classList.toggle('metadata-visible');
    imageContainer.classList.toggle('with-metadata');
}

function toggleEnlarge() {
    const modalImage = document.getElementById('modal-image');
    modalImage.classList.toggle('enlarged');
}

function closeImageModal() {
    const modal = document.querySelector('.image-modal');
    if (!modal) return;
    
    modal.classList.add('modal-closing');
    
    setTimeout(() => {
        modal.remove();
        document.body.style.overflow = '';
    }, 300);
}

function saveToCollection() {
    const notification = document.createElement('div');
    notification.className = 'save-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 13l4 4L19 7"/>
            </svg>
            <p>Image saved to collection!</p>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('notification-show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('notification-show');
        setTimeout(() => {
            notification.remove();
        }, 400);
    }, 2000);
}

function downloadCurrentImage() {
    const image = currentImages[currentImageIndex];
    if (!image) return;
    
    window.open(image.links.download, '_blank');
}

function showLoadMoreButton() {
    let loadMoreButton = document.querySelector('.load-more-btn');
    
    if (!loadMoreButton) {
        loadMoreButton = document.createElement('button');
        loadMoreButton.className = 'load-more-btn';
        loadMoreButton.innerHTML = 'Load More';
        loadMoreButton.addEventListener('click', () => {
            currentPage++;
            loadMoreButton.classList.add('loading');
            loadMoreButton.innerHTML = `
                <span>Loading</span>
                <span class="button-spinner"></span>
            `;
            searchImages(currentQuery, currentPage);
        });
        
        gallerySection.appendChild(loadMoreButton);
    }
}

function hideLoadMoreButton() {
    const loadMoreButton = document.querySelector('.load-more-btn');
    if (loadMoreButton) {
        loadMoreButton.remove();
    }
}

function handleScroll() {
    const loadMoreButton = document.querySelector('.load-more-btn');
    if (!loadMoreButton || isLoading) return;
    
    const rect = loadMoreButton.getBoundingClientRect();
    if (rect.top <= window.innerHeight && rect.bottom >= 0) {
        loadMoreButton.click();
    }
}

function handleKeyboard(event) {
    if (!document.querySelector('.image-modal')) return;
    
    switch (event.key) {
        case 'ArrowLeft':
            navigateImage(-1);
            break;
        case 'ArrowRight':
            navigateImage(1);
            break;
        case 'Escape':
            closeImageModal();
            break;
    }
}

function showError(message) {
    clearGallery();
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <div class="error-content">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <h3>Error</h3>
            <p>${message}</p>
            <button class="retry-btn" onclick="performSearch(currentQuery || 'featured')">Retry</button>
        </div>
    `;
    
    gallerySection.appendChild(errorDiv);
}

function showNoResults(query) {
    clearGallery();
    
    const noResultsDiv = document.createElement('div');
    noResultsDiv.className = 'no-results';
    noResultsDiv.innerHTML = `
        <div class="no-results-content">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <h3>No Results Found</h3>
            <p>No images found for "${query}". Try a different search term.</p>
            <div class="suggestion-chips">
                <button class="chip" onclick="performSearch('nature')">Nature</button>
                <button class="chip" onclick="performSearch('city')">City</button>
                <button class="chip" onclick="performSearch('abstract')">Abstract</button>
                <button class="chip" onclick="performSearch('landscape')">Landscape</button>
            </div>
        </div>
    `;
    
    gallerySection.appendChild(noResultsDiv);
}

function clearGallery() {
    const gallery = getOrCreateGallery();
    gallery.innerHTML = '';
    
    const resultsHeader = document.querySelector('.search-results-header');
    if (resultsHeader) {
        resultsHeader.remove();
    }
    
    hideLoadMoreButton();
}

function getOrCreateGallery() {
    let gallery = document.querySelector('.gallery');
    if (!gallery) {
        gallery = document.createElement('section');
        gallery.className = 'gallery';
        document.querySelector('main').appendChild(gallery);
    }
    return gallery;
}

