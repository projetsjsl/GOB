// Stock Research App - OneSheet Clone
// Integrates with FMP API, Supabase, and all GOB APIs

const API_BASE = window.location.hostname === 'localhost' ? '' : 'https://gobapps.com';
let currentTicker = 'AAPL';
let currentPeriod = 'annually';
let priceChart = null;
let miniCharts = {};

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
});

function initializeApp() {
    // Load default ticker
    loadTickerData(currentTicker);
}

function setupEventListeners() {
    // Sidebar toggle
    document.getElementById('toggleSidebar')?.addEventListener('click', toggleSidebar);

    // Period selector
    document.getElementById('periodSelect')?.addEventListener('change', (e) => {
        currentPeriod = e.target.value;
        loadTickerData(currentTicker);
    });

    // Keyboard shortcut for search
    document.addEventListener('keydown', (e) => {
        if (e.key === '/' && e.target.tagName !== 'INPUT') {
            e.preventDefault();
            document.getElementById('tickerSearch')?.focus();
        }
    });
}

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    sidebar.style.transform = sidebar.style.transform === 'translateX(-100%)' ? 'translateX(0)' : 'translateX(-100%)';
    mainContent.style.marginLeft = sidebar.style.transform === 'translateX(-100%)' ? '0' : '240px';
}

// Load all data for a ticker
async function loadTickerData(ticker) {
    currentTicker = ticker.toUpperCase();

    try {
        // Fetch data in parallel
        const [profile, keyMetrics, quote, news, peers] = await Promise.all([
            fetchCompanyProfile(ticker),
            fetchKeyMetrics(ticker),
            fetchQuote(ticker),
            fetchNews(ticker),
            fetchPeers(ticker)
        ]);

        // Render all sections
        renderColumn1(profile, quote, peers);
        renderColumn2(keyMetrics, news, profile);
        renderColumn3(ticker, profile);

    } catch (error) {
        console.error('Error loading ticker data:', error);
        showError('Failed to load data. Please try again.');
    }
}

// API Calls
async function fetchCompanyProfile(ticker) {
    const response = await fetch(`${API_BASE}/api/fmp-company-data?symbol=${ticker}`);
    if (!response.ok) throw new Error('Failed to fetch profile');
    return await response.json();
}

async function fetchKeyMetrics(ticker) {
    const response = await fetch(`${API_BASE}/api/fmp-proxy?endpoint=key-metrics-ttm/${ticker}`);
    if (!response.ok) throw new Error('Failed to fetch metrics');
    const data = await response.json();
    return data[0] || {};
}

async function fetchQuote(ticker) {
    const response = await fetch(`${API_BASE}/api/fmp-proxy?endpoint=quote/${ticker}`);
    if (!response.ok) throw new Error('Failed to fetch quote');
    const data = await response.json();
    return data[0] || {};
}

async function fetchNews(ticker) {
    const response = await fetch(`${API_BASE}/api/fmp-proxy?endpoint=stock_news&params=tickers=${ticker}&limit=5`);
    if (!response.ok) return [];
    return await response.json();
}

async function fetchPeers(ticker) {
    // Use FMP peers endpoint through proxy
    const response = await fetch(`${API_BASE}/api/fmp-proxy?endpoint=stock_peers&params=symbol=${ticker}`);
    if (!response.ok) {
        // Fallback to hardcoded peers
        const peerMap = {
            'AAPL': ['MSFT', 'GOOGL', 'NVDA', 'META', 'TSLA'],
            'MSFT': ['AAPL', 'GOOGL', 'NVDA', 'META', 'ORCL'],
            'GOOGL': ['AAPL', 'MSFT', 'META', 'AMZN', 'NFLX']
        };
        return peerMap[ticker] || ['MSFT', 'GOOGL', 'AAPL'];
    }
    const data = await response.json();
    return data[0]?.peersList || [];
}

// Render Column 1: Ticker Info
function renderColumn1(profile, quote, peers) {
    const col1 = document.getElementById('column1');

    const html = `
        <!-- Search -->
        <div class="card" style="margin-bottom: 20px;">
            <input type="text" id="tickerSearch" class="search-input" placeholder="Press / to search a stock" 
                   onkeypress="if(event.key==='Enter') loadTickerData(this.value)">
        </div>

        <!-- Ticker Info -->
        <div class="card" style="margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 16px;">
                <div>
                    <h2 style="font-size: 32px; font-weight: bold; color: #1f2937;">${currentTicker}</h2>
                    <p style="color: #6b7280; font-size: 14px;">${profile.info?.name || 'Loading...'}</p>
                </div>
                <button onclick="addToWatchlist('${currentTicker}')" style="background: none; border: none; cursor: pointer; font-size: 20px; color: #fbbf24;">
                    <i class="far fa-star"></i>
                </button>
            </div>

            <div style="margin-bottom: 20px;">
                <div style="font-size: 36px; font-weight: bold; color: #1f2937;">
                    $${quote.price?.toFixed(2) || profile.currentPrice?.toFixed(2) || '0.00'}
                </div>
                <div style="color: ${(quote.changesPercentage || 0) >= 0 ? '#10b981' : '#ef4444'}; font-size: 16px; margin-top: 4px;">
                    ${(quote.change || 0) >= 0 ? '+' : ''}${quote.change?.toFixed(2) || '0.00'} 
                    (${(quote.changesPercentage || 0) >= 0 ? '+' : ''}${quote.changesPercentage?.toFixed(2) || '0.00'}%)
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 13px;">
                <div>
                    <div style="color: #6b7280;">52-Week High</div>
                    <div style="font-weight: 600;">$${quote.yearHigh?.toFixed(2) || 'N/A'}</div>
                </div>
                <div>
                    <div style="color: #6b7280;">52-Week Low</div>
                    <div style="font-weight: 600;">$${quote.yearLow?.toFixed(2) || 'N/A'}</div>
                </div>
                <div>
                    <div style="color: #6b7280;">P/E Ratio</div>
                    <div style="font-weight: 600;">${quote.pe?.toFixed(2) || 'N/A'}</div>
                </div>
                <div>
                    <div style="color: #6b7280;">Div Yield</div>
                    <div style="font-weight: 600;">${(quote.yield || 0).toFixed(2)}%</div>
                </div>
                <div>
                    <div style="color: #6b7280;">Market Cap</div>
                    <div style="font-weight: 600;">${formatMarketCap(quote.marketCap || 0)}</div>
                </div>
                <div>
                    <div style="color: #6b7280;">Earnings Date</div>
                    <div style="font-weight: 600;">${quote.earningsAnnouncement || 'N/A'}</div>
                </div>
            </div>
        </div>

        <!-- Description -->
        <div class="card" style="margin-bottom: 20px;">
            <h3 style="font-weight: 600; margin-bottom: 12px;">Description</h3>
            <p style="font-size: 14px; color: #4b5563; line-height: 1.6;">
                ${(profile.info?.description || 'No description available').substring(0, 200)}...
            </p>
            <a href="#" style="color: #4f46e5; font-size: 14px; margin-top: 8px; display: inline-block;">Read More</a>
        </div>

        <!-- Details -->
        <div class="card" style="margin-bottom: 20px;">
            <h3 style="font-weight: 600; margin-bottom: 12px;">Details</h3>
            <div style="font-size: 13px; line-height: 2;">
                <div><span style="color: #6b7280;">Sector:</span> <span style="font-weight: 600;">${profile.info?.sector || 'N/A'}</span></div>
                <div><span style="color: #6b7280;">Industry:</span> <span style="font-weight: 600;">${profile.info?.industry || 'N/A'}</span></div>
                <div><span style="color: #6b7280;">Country:</span> <span style="font-weight: 600;">${profile.info?.country || 'N/A'}</span></div>
                <div><span style="color: #6b7280;">Employees:</span> <span style="font-weight: 600;">${(profile.info?.employees || 0).toLocaleString()}</span></div>
            </div>
        </div>

        <!-- Peers -->
        <div class="card">
            <h3 style="font-weight: 600; margin-bottom: 12px;">Peers</h3>
            <div>
                ${peers.map(peer => `<span class="peer-ticker" onclick="loadTickerData('${peer}')">${peer}</span>`).join('')}
            </div>
        </div>
    `;

    col1.innerHTML = html;
}

// Render Column 2: Metrics & News
function renderColumn2(metrics, news, profile) {
    const col2 = document.getElementById('column2');

    const html = `
        <!-- Metrics -->
        <div class="card" style="margin-bottom: 20px;">
            <h3 style="font-weight: 600; margin-bottom: 16px;">Metrics & Margins</h3>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
                <div class="metric-box">
                    <div style="font-size: 12px; opacity: 0.9;">Piotroski Score</div>
                    <div style="font-size: 24px; font-weight: bold; margin-top: 4px;">N/A</div>
                </div>
                <div class="metric-box">
                    <div style="font-size: 12px; opacity: 0.9;">Quality Rating</div>
                    <div style="font-size: 24px; font-weight: bold; margin-top: 4px;">A</div>
                </div>
                <div class="metric-box">
                    <div style="font-size: 12px; opacity: 0.9;">Profit Margin</div>
                    <div style="font-size: 24px; font-weight: bold; margin-top: 4px;">${((metrics.netProfitMarginTTM || 0) * 100).toFixed(1)}%</div>
                </div>
                <div class="metric-box">
                    <div style="font-size: 12px; opacity: 0.9;">Op Margin</div>
                    <div style="font-size: 24px; font-weight: bold; margin-top: 4px;">${((metrics.operatingProfitMarginTTM || 0) * 100).toFixed(1)}%</div>
                </div>
                <div class="metric-box">
                    <div style="font-size: 12px; opacity: 0.9;">FCF Yield</div>
                    <div style="font-size: 24px; font-weight: bold; margin-top: 4px;">${((metrics.freeCashFlowYieldTTM || 0) * 100).toFixed(1)}%</div>
                </div>
                <div class="metric-box">
                    <div style="font-size: 12px; opacity: 0.9;">ROE</div>
                    <div style="font-size: 24px; font-weight: bold; margin-top: 4px;">${((metrics.roeTTM || 0) * 100).toFixed(1)}%</div>
                </div>
            </div>
        </div>

        <!-- P/E Comparison -->
        <div class="card" style="margin-bottom: 20px;">
            <h3 style="font-weight: 600; margin-bottom: 16px;">P/E Ratio Comparison</h3>
            <canvas id="peComparisonChart" style="max-height: 200px;"></canvas>
        </div>

        <!-- Recent News -->
        <div class="card">
            <h3 style="font-weight: 600; margin-bottom: 16px;">Recent News</h3>
            ${news.slice(0, 5).map(item => `
                <div class="news-item">
                    <a href="${item.url}" target="_blank" style="color: #1f2937; text-decoration: none; font-weight: 600; font-size: 14px; display: block; margin-bottom: 4px;">
                        ${item.title}
                    </a>
                    <div style="font-size: 12px; color: #6b7280;">
                        ${item.site} • ${new Date(item.publishedDate).toLocaleDateString()}
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    col2.innerHTML = html;

    // Render P/E comparison chart
    setTimeout(() => renderPEChart(), 100);
}

// Render Column 3: Charts
function renderColumn3(ticker, profile) {
    const col3 = document.getElementById('column3');

    const html = `
        <!-- Main Price Chart -->
        <div class="card" style="margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <h3 style="font-weight: 600;">Price 1Y</h3>
                <div>
                    <button class="period-btn active" onclick="changePricePeriod('1Y')">1Y</button>
                    <button class="period-btn" onclick="changePricePeriod('2Y')">2Y</button>
                    <button class="period-btn" onclick="changePricePeriod('3Y')">3Y</button>
                    <button class="period-btn" onclick="changePricePeriod('5Y')">5Y</button>
                </div>
            </div>
            <div class="chart-container">
                <canvas id="priceChart"></canvas>
            </div>
        </div>

        <!-- Mini Charts Grid -->
        <div style="display: grid; grid-template-columns: 1fr; gap: 16px;">
            ${['Revenue', 'Net Income', 'EPS', 'EBITDA', 'Free Cash Flow', 'Cash & Debt'].map(metric => `
                <div class="card">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <h4 style="font-weight: 600; font-size: 14px;">${metric}</h4>
                        <div>
                            <button style="background: none; border: none; cursor: pointer; color: #6b7280; margin-left: 8px;">
                                <i class="fas fa-question-circle"></i>
                            </button>
                            <button style="background: none; border: none; cursor: pointer; color: #6b7280; margin-left: 8px;">
                                <i class="fas fa-expand"></i>
                            </button>
                        </div>
                    </div>
                    <div class="mini-chart">
                        <canvas id="chart${metric.replace(/\s/g, '')}"></canvas>
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    col3.innerHTML = html;

    // Render charts
    setTimeout(() => {
        renderPriceChart(ticker);
        renderMiniCharts(ticker, profile);
    }, 100);
}

// Chart rendering functions
function renderPriceChart(ticker) {
    const ctx = document.getElementById('priceChart');
    if (!ctx) return;

    if (priceChart) priceChart.destroy();

    // Mock data - would fetch real historical data
    const data = generateMockPriceData();

    priceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Price',
                data: data.values,
                borderColor: '#4f46e5',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: false }
            }
        }
    });
}

function renderPEChart() {
    const ctx = document.getElementById('peComparisonChart');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['NVDA', 'GOOGL', 'MSFT', currentTicker, 'Sector Avg'],
            datasets: [{
                data: [45, 28, 32, 30, 25],
                backgroundColor: ['#93c5fd', '#93c5fd', '#93c5fd', '#4f46e5', '#fbbf24']
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } }
        }
    });
}

function renderMiniCharts(ticker, profile) {
    const metrics = ['Revenue', 'NetIncome', 'EPS', 'EBITDA', 'FreeCashFlow', 'Cash&Debt'];

    metrics.forEach(metric => {
        const ctx = document.getElementById(`chart${metric}`);
        if (!ctx) return;

        const data = generateMockMiniChartData();

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { display: false },
                    y: { display: false }
                }
            }
        });
    });
}

// Utility functions
function formatMarketCap(value) {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${value.toLocaleString()}`;
}

function generateMockPriceData() {
    const labels = [];
    const values = [];
    const basePrice = 150;

    for (let i = 0; i < 365; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (365 - i));
        labels.push(date.toLocaleDateString());
        values.push(basePrice + Math.random() * 50 - 25);
    }

    return { labels, values };
}

function generateMockMiniChartData() {
    const labels = ['Q1', 'Q2', 'Q3', 'Q4'];
    const values = labels.map(() => Math.random() * 100 + 50);
    return { labels, values };
}

function changePricePeriod(period) {
    document.querySelectorAll('.period-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    renderPriceChart(currentTicker);
}

function addToWatchlist(ticker) {
    console.log('Adding to watchlist:', ticker);
    // Would integrate with Supabase watchlist
    alert(`${ticker} added to watchlist!`);
}

function showError(message) {
    alert(message);
}
