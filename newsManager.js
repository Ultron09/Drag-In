class NewsManager {
    constructor() {
        this.apiBaseUrl = 'http://localhost:3000/api';
        this.newsApiKey = null;  // Will be assigned dynamically
        this.finnhubApiKey = null;
        this.currentCategory = 'business';
        this.updateInterval = 60000; // 1 minute
        this.isLoading = false;
        this.refreshIntervalId = null;
    }

    async initialize() {
        console.log('Initializing NewsManager...');
        
        // Fetch API keys before making requests
        await this.fetchApiKeys();
        
        this.setupEventListeners();
        
        await this.loadNews();
        await this.loadStockTicker();
        
        this.startAutoRefresh();
    }

    async fetchApiKeys() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/keys`);
            if (!response.ok) throw new Error('Failed to fetch API keys');
            const { newsApiKey, finnhubApiKey } = await response.json();
            this.newsApiKey = newsApiKey;
            this.finnhubApiKey = finnhubApiKey;
        } catch (error) {
            console.error('Error fetching API keys:', error);
        }
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                const category = btn.dataset.category;
                console.log(`Switching category to: ${category}`);
                await this.switchCategory(category);
            });
        });

        const refreshBtn = document.querySelector('.refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                console.log('Manual refresh triggered');
                await this.loadNews();
            });
        } else {
            console.error("Refresh button not found!");
        }
    }

    async switchCategory(category) {
        this.currentCategory = category;

        document.querySelectorAll('.category-btn').forEach(btn => 
            btn.classList.toggle('active', btn.dataset.category === category)
        );

        await this.loadNews();
    }

    async loadNews() {
        if (this.isLoading) return;
        this.isLoading = true;
        this.toggleLoader(true);

        try {
            const news = await this.fetchFinanceNews();
            this.renderNews(news);
            this.updateLastRefreshed();
        } catch (error) {
            this.showError(`Failed to load ${this.currentCategory} news.`);
        } finally {
            this.isLoading = false;
            this.toggleLoader(false);
        }
    }

    async fetchFinanceNews() {
        try {
            console.log("Fetching financial news...");
            const response = await fetch('http://localhost:3000/api/finance-news');
            if (!response.ok) throw new Error('Failed to fetch finance news');
    
            const news = await response.json();
            this.renderNews(news);
        } catch (error) {
            console.error('Error fetching finance news:', error);
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

        const title = article.title || 'No title';
        const description = article.description || 'No description available';
        const source = article.source?.name || 'Unknown Source';
        const imageUrl = article.urlToImage || 'https://via.placeholder.com/300x200?text=No+Image';
        const date = article.publishedAt ? this.formatDate(article.publishedAt) : 'Recent';

        card.innerHTML = `
            <img src="${imageUrl}" class="news-image" alt="News">
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
            this.showError('Failed to load stock quotes');
        }
    }

    async fetchStockQuotes() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/stocks`);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching stock quotes:', error);
            throw error;
        }
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
        if (this.refreshIntervalId) clearInterval(this.refreshIntervalId);
        this.refreshIntervalId = setInterval(() => {
            this.loadNews();
            this.loadStockTicker();
        }, this.updateInterval);
    }

    toggleLoader(isLoading) {
        document.querySelector('.news-loader').style.display = isLoading ? 'flex' : 'none';
        document.getElementById('newsGrid').style.display = isLoading ? 'none' : 'grid';
    }

    updateLastRefreshed() {
        const timeElement = document.querySelector('.last-updated');
        if (timeElement) timeElement.textContent = `Last updated: Just now`;
    }

    showError(message) {
        console.error(message);
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-notification';
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        setTimeout(() => errorDiv.remove(), 5000);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleTimeString();
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    window.newsManager = new NewsManager();
    await window.newsManager.initialize();
});
