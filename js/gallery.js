
class SearchHandler {
    constructor() {
        this.searchInput = document.getElementById('searchInput');
        this.searchForm = document.getElementById('searchForm');
        this.suggestionsContainer = null;
        this.currentSuggestions = [];
        this.selectedIndex = -1;
        this.debounceTimer = null;
        
        // Sample suggestions - replace with your actual data source
        this.suggestions = [
            'Nature photography',
            'Abstract art',
            'Portrait photography',
            'Cityscape',
            'Travel photos',
            'Food photography',
            'Architecture',
            'Wildlife photography',
            'Sunset landscapes',
            'Ocean waves',
            'Mountain views',
            'Street photography',
            'Black and white',
            'Vintage style',
            'Modern art',
            'Digital art',
            'Watercolor paintings',
            'Oil paintings',
            'Minimalist design',
            'Urban exploration',
            'Macro photography',
            'Night photography',
            'Golden hour',
            'Storm clouds',
            'Forest scenes'
        ];
        
        this.init();
    }
    
    init() {
        if (!this.searchInput || !this.searchForm) {
            console.error('Search elements not found');
            return;
        }
        
        this.createSuggestionsContainer();
        this.bindEvents();
    }
    
    createSuggestionsContainer() {
        this.suggestionsContainer = document.createElement('div');
        this.suggestionsContainer.className = 'search-suggestions';
        this.suggestionsContainer.setAttribute('role', 'listbox');
        this.suggestionsContainer.setAttribute('aria-label', 'Search suggestions');
        
        // Insert after search form
        this.searchForm.parentNode.insertBefore(
            this.suggestionsContainer, 
            this.searchForm.nextSibling
        );
    }
    
    bindEvents() {
        // Input events
        this.searchInput.addEventListener('input', (e) => {
            this.handleInput(e.target.value);
        });
        
        this.searchInput.addEventListener('focus', (e) => {
            if (e.target.value.trim()) {
                this.handleInput(e.target.value);
            }
        });
        
        // Keyboard navigation
        this.searchInput.addEventListener('keydown', (e) => {
            this.handleKeydown(e);
        });
        
        // Form submission
        this.searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSearch(this.searchInput.value);
        });
        
        // Click outside to close suggestions
        document.addEventListener('click', (e) => {
            if (!this.searchForm.contains(e.target)) {
                this.hideSuggestions();
            }
        });
    }
    
    handleInput(value) {
        clearTimeout(this.debounceTimer);
        
        if (!value.trim()) {
            this.hideSuggestions();
            return;
        }
        
        // Debounce the search to avoid too many requests
        this.debounceTimer = setTimeout(() => {
            this.getSuggestions(value);
        }, 150);
    }
    
    getSuggestions(query) {
        const lowerQuery = query.toLowerCase();
        
        // Filter suggestions based on query
        this.currentSuggestions = this.suggestions
            .filter(suggestion => 
                suggestion.toLowerCase().includes(lowerQuery)
            )
            .slice(0, 8); // Limit to 8 suggestions
        
        this.displaySuggestions();
    }
    
    displaySuggestions() {
        if (this.currentSuggestions.length === 0) {
            this.hideSuggestions();
            return;
        }
        
        const suggestionsHTML = this.currentSuggestions
            .map((suggestion, index) => 
                `<div class="suggestion-item" 
                     data-index="${index}" 
                     role="option" 
                     aria-selected="false">
                    <span class="suggestion-icon">🔍</span>
                    <span class="suggestion-text">${this.highlightMatch(suggestion)}</span>
                </div>`
            )
            .join('');
        
        this.suggestionsContainer.innerHTML = suggestionsHTML;
        this.suggestionsContainer.classList.add('show');
        
        // Add click events to suggestions
        this.suggestionsContainer.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const index = parseInt(e.currentTarget.dataset.index);
                this.selectSuggestion(index);
            });
        });
        
        this.selectedIndex = -1;
    }
    
    highlightMatch(text) {
        const query = this.searchInput.value.trim();
        if (!query) return text;
        
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }
    
    hideSuggestions() {
        this.suggestionsContainer.classList.remove('show');
        this.selectedIndex = -1;
    }
    
    handleKeydown(e) {
        if (!this.suggestionsContainer.classList.contains('show')) {
            return;
        }
        
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.navigateSuggestions(1);
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.navigateSuggestions(-1);
                break;
            case 'Enter':
                e.preventDefault();
                if (this.selectedIndex >= 0) {
                    this.selectSuggestion(this.selectedIndex);
                } else {
                    this.handleSearch(this.searchInput.value);
                }
                break;
            case 'Escape':
                this.hideSuggestions();
                this.searchInput.blur();
                break;
        }
    }
    
    navigateSuggestions(direction) {
        const suggestions = this.suggestionsContainer.querySelectorAll('.suggestion-item');
        if (suggestions.length === 0) return;
        
        // Remove current selection
        if (this.selectedIndex >= 0) {
            suggestions[this.selectedIndex].classList.remove('selected');
            suggestions[this.selectedIndex].setAttribute('aria-selected', 'false');
        }
        
        // Calculate new index
        this.selectedIndex += direction;
        if (this.selectedIndex >= suggestions.length) {
            this.selectedIndex = 0;
        } else if (this.selectedIndex < 0) {
            this.selectedIndex = suggestions.length - 1;
        }
        
        // Add new selection
        suggestions[this.selectedIndex].classList.add('selected');
        suggestions[this.selectedIndex].setAttribute('aria-selected', 'true');
        suggestions[this.selectedIndex].scrollIntoView({ block: 'nearest' });
    }
    
    selectSuggestion(index) {
        if (index >= 0 && index < this.currentSuggestions.length) {
            const selectedSuggestion = this.currentSuggestions[index];
            this.searchInput.value = selectedSuggestion;
            this.hideSuggestions();
            this.handleSearch(selectedSuggestion);
        }
    }
    
    handleSearch(query) {
        if (!query.trim()) return;
        
        console.log('Searching for:', query);
        
        // Add your search logic here
        // For example, filter gallery items, make API calls, etc.
        this.performSearch(query);
    }
    
    performSearch(query) {
        // Example search implementation
        // Replace this with your actual search logic
        
        // Show search results or filter gallery
        console.log(`Performing search for: "${query}"`);
        
        // You might want to:
        // 1. Filter existing gallery items
        // 2. Make an API call to fetch search results
        // 3. Update the gallery display
        // 4. Show loading states
        
        // Example: Dispatch a custom event that other parts of your app can listen to
        document.dispatchEvent(new CustomEvent('searchPerformed', {
            detail: { query: query }
        }));
    }
}

// Initialize search functionality when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new SearchHandler();
});

// Also initialize immediately if DOM is already loaded
if (document.readyState !== 'loading') {
    new SearchHandler();
}
