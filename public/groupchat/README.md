# 🤖 JSLAI RobotWeb Ultimate v5.0

Professional AI browser automation with full customization, multi-provider support, and advanced LLM integration.

## ✨ Features

### 🎯 Core
- **Multi-Provider**: Simulation, Browserbase, Browserless, Steel
- **Advanced LLM**: Claude AI with smart planning
- **10 Simulated Sites**: Google, Booking, GitHub, Amazon, LinkedIn, YouTube, Twitter, Reddit, Wikipedia, IMDb

### ⚙️ Admin Panel
- **7 Themes**: Dark, Light, Midnight, Forest, Ocean, Sunset, Cyberpunk
- **LLM Settings**: Model selection, tokens, custom instructions
- **Provider Management**: Status, testing, configuration
- **Connection Testing**: Test all providers at once

### ⚡ Workflows
- **8 Pre-built**: Hotel search, GitHub repos, Amazon products, LinkedIn jobs, YouTube videos, Web research, Social monitoring, Price tracking
- **Custom Variables**: Dynamic task generation
- **Category Filtering**: Travel, Shopping, Development, Career, Research, Social, Media

### 🔬 Expert Mode
- Detailed execution logs
- Memory/CPU metrics
- Debug information
- Real-time performance stats

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run locally
npm run dev

# 3. Or deploy to Vercel
vercel --prod
```

**Works immediately in Simulation mode (FREE)!**

## 📁 Project Structure

```
jslai-robotweb/
├── app/
│   ├── api/
│   │   ├── simulate/route.ts   # 10 simulated sites
│   │   ├── browser/route.ts    # Real browser (3 providers)
│   │   ├── config/route.ts     # Provider detection
│   │   ├── admin/route.ts      # Settings, themes
│   │   ├── test/route.ts       # Connectivity tests
│   │   └── workflows/route.ts  # Pre-built automations
│   ├── page.tsx                # Full UI with Admin
│   ├── layout.tsx
│   └── globals.css             # Theme system
├── package.json
├── next.config.js
├── tsconfig.json
└── vercel.json
```

## 🔧 Environment Variables (Optional)

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Claude AI for smart planning |
| `BROWSERBASE_API_KEY` | Browserbase cloud browser |
| `BROWSERBASE_PROJECT_ID` | Browserbase project |
| `BROWSERLESS_API_KEY` | Browserless alternative |
| `STEEL_API_KEY` | Steel AI-optimized browser |

## 🎨 Themes

- **Dark** (default): Deep blacks with cyan/purple accents
- **Light**: Clean white with blue accents
- **Midnight**: Navy blues with violet highlights
- **Forest**: Deep greens with emerald accents
- **Ocean**: Ocean blues with teal highlights
- **Sunset**: Warm reds with orange accents
- **Cyberpunk**: Neon pink/cyan on black

## 📋 Example Tasks

### Simulation Mode (FREE)
- `Hotels in Paris on Booking` → 5 hotels with prices
- `React projects on GitHub` → 4 repos with stars
- `iPhone 15 on Amazon` → 4 products with prices
- `Developer jobs on LinkedIn` → 4 job listings
- `JavaScript tutorial on YouTube` → 4 videos

### Real Browser Mode (requires provider)
- Any web automation task
- Real screenshots
- Live debugging
- Data extraction

## 🧪 Testing

1. Go to Admin → Test tab
2. Click "Test All"
3. View results for each provider

## 📊 Stats v5.0

- **16 files** total
- **6 API routes**
- **10 simulated sites**
- **8 workflows**
- **7 themes**
- **4 providers**

---

**JSLAI RobotWeb Ultimate** - The most advanced AI browser automation platform
