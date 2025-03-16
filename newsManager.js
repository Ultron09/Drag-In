class NewsManager {
    constructor() {
        this.apiBaseUrl = 'https://newsapi.org/v2/top-headlines?sources=techcrunch&apiKey=';
        this.newsApiKey = 'd3b160d9d11d4997afb26b91b943471a';
        this.finnhubApiKey = 'cudibcpr01qigebqv2h0cudibcpr01qigebqv2hg';
        this.currentCategory = 'business';
        this.updateInterval = 60000; // 1 minute
        this.stockSymbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'META', 'TSLA'];
        this.isLoading = false;
        this.initialize();
    }

    async initialize() {
        console.log('Initializing NewsManager...');
        this.updateDebugInfo('Initializing...');
        this.setupEventListeners();
        await this.loadNews();
        await this.loadStockTicker();
        this.startAutoRefresh();
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const category = btn.dataset.category;
                console.log('Category clicked:', category);
                this.switchCategory(category);
            });
        });

        document.querySelector('.refresh-btn').addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Manual refresh triggered');
            this.refreshNews();
        });
    }

    async switchCategory(category) {
        console.log(`Switching to category: ${category}`);
        this.updateDebugInfo(`Switching to ${category}`);
        
        // Update active button
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.category === category) {
                btn.classList.add('active');
            }
        });

        this.currentCategory = category;
        await this.loadNews();
    }

    async loadNews() {
        if (this.isLoading) {
            console.log('Already loading news, skipping...');
            return;
        }

        this.isLoading = true;
        this.showLoader();
        this.updateDebugInfo(`Loading ${this.currentCategory} news...`);

        try {
            const news = await this.fetchNews();
            console.log(`Received ${news.length} news items`);
            this.renderNews(news);
            this.updateLastRefreshed();
            this.updateDebugInfo(`Loaded ${news.length} ${this.currentCategory} news items`);
        } catch (error) {
            console.error('Error loading news:', error);
            this.showError(`Failed to load ${this.currentCategory} news: ${error.message}`);
            this.updateDebugInfo(`Error: ${error.message}`);
        } finally {
            this.isLoading = false;
            this.hideLoader();
        }
    }

    async fetchNews() {
        try {
            console.log(`Fetching ${this.currentCategory} news...`);
            const response = await fetch(`https://newsapi.org/v2/top-headlines?sources=techcrunch&apiKey=d3b160d9d11d4997afb26b91b943471a`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('News data received:', data);
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            return data.articles || data;
        } catch (error) {
            console.error('Error fetching news:', error);
            this.showError(`Failed to fetch ${this.currentCategory} news: ${error.message}`);
            throw error;
        }
    }

    renderNews(news) {
        const newsGrid = document.getElementById('newsGrid');
        if (!newsGrid) {
            console.error('News grid element not found!');
            return;
        }

        newsGrid.innerHTML = '';
        news.forEach(article => {
            const card = this.createNewsCard(article);
            newsGrid.appendChild(card);
        });
    }

    createNewsCard(article) {
        const card = document.createElement('div');
        card.className = 'news-card';
        
        // Ensure all properties exist to prevent undefined errors
        const title = article.title || 'No title';
        const description = article.description || 'No description available';
        const source = article.source?.name || 'Unknown Source';
        const imageUrl = article.urlToImage || 'https://via.placeholder.com/300x200?text=No+Image';
        const date = article.publishedAt ? this.formatDate(article.publishedAt) : 'Recent';

        card.innerHTML = `
            <img src="${imageUrl}" class="news-image" alt="News" onerror="this.src='https://via.placeholder.com/300x200?text=Error+Loading+Image'">
            <div class="news-content">
                <span class="news-tag">${this.currentCategory}</span>
                <h3 class="news-title">${title}</h3>
                <p class="news-excerpt">${description}</p>
                <div class="news-meta">
                    <span>${source}</span>
                    <span>${date}</span>
                </div>
            </div>
        `;
        return card;
    }

    async loadStockTicker() {
        try {
            console.log('Loading stock ticker...');
            const quotes = await this.fetchStockQuotes();
            this.renderStockTicker(quotes);
        } catch (error) {
            console.error('Error loading stock ticker:', error);
            this.showError('Failed to load stock quotes');
        }
    }

    async fetchStockQuotes() {
        console.log('Fetching stock quotes...');
        const response = await fetch(`${this.apiBaseUrl}/stocks`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Stock data received:', data);
        return data;
    }

    renderStockTicker(quotes) {
        const tickerContent = document.querySelector('.ticker-content');
        if (!tickerContent) {
            console.error('Ticker content element not found');
            return;
        }

        tickerContent.innerHTML = quotes.map(quote => {
            const changePercent = ((quote.c - quote.pc) / quote.pc * 100).toFixed(2);
            const isUp = quote.c > quote.pc;
            
            return `
                <div class="ticker-item ${isUp ? 'up' : 'down'}">
                    <span class="ticker-symbol">${quote.symbol}</span>
                    <span class="ticker-price">$${quote.c.toFixed(2)}</span>
                    <span class="ticker-change">${isUp ? '▲' : '▼'} ${changePercent}%</span>
                </div>
            `;
        }).join('');
    }

    startAutoRefresh() {
        setInterval(() => {
            this.loadNews();
            this.loadStockTicker();
        }, this.updateInterval);
    }

    showLoader() {
        document.querySelector('.news-loader').style.display = 'flex';
        document.getElementById('newsGrid').style.display = 'none';
    }

    hideLoader() {
        document.querySelector('.news-loader').style.display = 'none';
        document.getElementById('newsGrid').style.display = 'grid';
    }

    updateLastRefreshed() {
        const timeElement = document.querySelector('.last-updated');
        timeElement.textContent = `Last updated: Just now`;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleTimeString();
    }

    showError(message) {
        console.error(message);
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-notification';
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    updateDebugInfo(status) {
        const categorySpan = document.getElementById('current-category');
        const statusSpan = document.getElementById('loading-status');
        if (categorySpan) categorySpan.textContent = this.currentCategory;
        if (statusSpan) statusSpan.textContent = status;
    }
}

// Initialize news manager when document loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('Document loaded, initializing NewsManager...');
    window.newsManager = new NewsManager();
}); 