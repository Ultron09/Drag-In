// API Keys and endpoints (you'll need to register for these services)
const LINKEDIN_ACCESS_TOKEN = 'YOUR_LINKEDIN_ACCESS_TOKEN';
const NEWS_API_KEY = 'd3b160d9d11d4997afb26b91b943471a';
document.addEventListener("DOMContentLoaded", function () {
    // Retrieve username from localStorage
    const username = localStorage.getItem("username");

    // If user is not logged in, redirect to login page
    if (!username) {
        alert("You are not logged in!");
        window.location.href = "index.html"; // Redirect to login page
    } else {
        // Display username in the profile section
        document.querySelector(".profile-info h3").textContent = username;
    }

    // Logout Functionality
    document.querySelector(".logout").addEventListener("click", function () {
        localStorage.removeItem("username"); // Remove stored username
        window.location.href = "index.html"; // Redirect to login page
    });
});

class FeedManager {
    constructor() {
        this.posts = [];
        this.loading = false;
    }

    async initialize() {
        this.showLoader();
        await Promise.all([
            this.getLinkedInPosts(),
            this.getEconomicTimesPosts(),
            this.getIndustryInsights()
        ]);
        this.hideLoader();
        this.renderPosts();
    }

    showLoader() {
        const content = document.querySelector('.content');
        content.innerHTML = `
            <div class="loader">
                <div class="loader-ring"></div>
                <p>Fetching latest posts...</p>
            </div>
        `;
        this.loading = true;
    }

    hideLoader() {
        this.loading = false;
    }

    async getLinkedInPosts() {
        try {
            const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
                headers: {
                    'Authorization': `Bearer ${LINKEDIN_ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            this.processLinkedInPosts(data);
        } catch (error) {
            console.error('LinkedIn API Error:', error);
        }
    }

    async getEconomicTimesPosts() {
        try {
            const response = await fetch(`https://newsapi.org/v2/everything?q=tesla&from=2025-02-13&sortBy=publishedAt&apiKey=d3b160d9d11d4997afb26b91b943471a`);
            const data = await response.json();
            this.processNewsPosts(data.articles, 'Economic Times');
        } catch (error) {
            console.error('Economic Times API Error:', error);
        }
    }

    async getIndustryInsights() {
        try {
            const response = await fetch(`https://newsapi.org/v2/top-headlines?sources=techcrunch&apiKey=d3b160d9d11d4997afb26b91b943471a`);
            const data = await response.json();
            this.processNewsPosts(data.articles, 'Industry Insights');
        } catch (error) {
            console.error('Industry News API Error:', error);
        }
    }

    processLinkedInPosts(data) {
        // Process LinkedIn posts and add to this.posts
        const processed = data.elements.map(post => ({
            type: 'linkedin',
            title: post.author,
            content: post.message,
            timestamp: new Date(post.created.time),
            author: post.author,
            link: post.linkedInUrl,
            image: post.image || 'default-post-image.jpg'
        }));
        this.posts.push(...processed);
    }

    processNewsPosts(articles, source) {
        const processed = articles.map(article => ({
            type: source.toLowerCase().replace(/\s+/g, '-'),
            title: article.title,
            content: article.description,
            timestamp: new Date(article.publishedAt),
            author: article.author || source,
            link: article.url,
            image: article.urlToImage || 'default-post-image.jpg'
        }));
        this.posts.push(...processed);
    }

    renderPosts() {
        const postsContainer = document.querySelector('.posts-grid');
        postsContainer.innerHTML = '';

        // Sort posts by timestamp
        this.posts.sort((a, b) => b.timestamp - a.timestamp);

        this.posts.forEach(post => {
            const postElement = this.createPostElement(post);
            postsContainer.appendChild(postElement);
        });
    }

    createPostElement(post) {
        const postDiv = document.createElement('div');
        postDiv.className = `post-card ${post.type}`;
        
        postDiv.innerHTML = `
            <div class="post-image" style="background-image: url('${post.image}')">
                <div class="post-source ${post.type}-badge">${post.type}</div>
            </div>
            <div class="post-content">
                <h3>${post.title}</h3>
                <p>${post.content}</p>
                <div class="post-meta">
                    <span><i class="fas fa-user"></i> ${post.author}</span>
                    <span><i class="fas fa-clock"></i> ${this.getTimeAgo(post.timestamp)}</span>
                </div>
                <a href="${post.link}" target="_blank" class="read-more">Read More</a>
            </div>
        `;

        return postDiv;
    }

    getTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";
        
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutes ago";
        
        return Math.floor(seconds) + " seconds ago";
    }
}

// Initialize feed manager when document loads
document.addEventListener('DOMContentLoaded', () => {
    const feedManager = new FeedManager();
    feedManager.initialize();

    // Refresh posts every 5 minutes
    setInterval(() => feedManager.initialize(), 300000);
}); 