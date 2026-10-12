# Outbound Lead Generator (MERN Stack)

Autonomous B2B lead generation and personalized cold outreach system built for marketing agencies helping SaaS startups acquire customers.

---

## 🚀 Features

- **Campaign Input Interface**: Configure SaaS product value proposition, target geography, industry sector, and desired lead count (with one-click presets for EdTech, HealthTech, and HRTech).
- **AI-Powered Lead Discovery**: Automatically identifies real organizations in the target country and industry, collecting official website URLs, contact email addresses, company descriptions, and source directory links.
- **Hyper-Personalized Outreach Engine**: Drafts high-converting cold email subject lines, contextual bodies (hook, value proposition, ROI), and low-friction Calls to Action (CTAs).
- **Lead Storage & Management (MongoDB / Mongoose)**: Stores leads with status tracking (`Not Contacted` / `Contacted`), search, and status filters. Features an automatic embedded document store fallback if a local MongoDB daemon is not running.
- **One-Click Export**: Instant CSV / Excel export with the exact 10 required columns matching agency specifications.
- **Email Outreach Workflow**: Review, edit, and dispatch outreach emails with delivery logging, timestamp recording, and mailto client integration.

---

## 🛠️ Tech Stack (MERN)

- **Frontend**: React 18, Vite, Lucide Icons, Glassmorphic Design System (Vanilla CSS tokens)
- **Backend**: Node.js, Express.js, CORS, Dotenv
- **Database**: MongoDB with Mongoose ODM (+ automated resilient JSON fallback)
- **AI / LLM Integration**: OpenRouter API (`openai/gpt-4o-mini`, `meta-llama/llama-3.3-70b-instruct`)

---

## 📦 Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### 1. Install Dependencies
```bash
# In the root folder
npm install

# In the server folder
cd server && npm install

# In the client folder
cd ../client && npm install
cd ..
```

### 2. Configure Environment Variables
Copy `server/.env.example` to `server/.env` and add your own OpenRouter API key:
```env
PORT=5000
OPENROUTER_API_KEY=your_openrouter_api_key_here
MONGODB_URI=mongodb://localhost:27017/outbound_leads
MODEL=openai/gpt-4o-mini
```

### 3. Run the Application
You can run the full application in a single step:
```bash
# Starts both Express backend and React frontend
node server/server.js
```
The application will be live at **http://localhost:5000**.

Alternatively, for frontend hot-reloading:
```bash
# Terminal 1: Backend
cd server && node server.js

# Terminal 2: Frontend
cd client && npm run dev
```

---

## 📊 CSV Export Format
The exported CSV strictly complies with the challenge specification:
1. `Organization Name`
2. `Website`
3. `Country`
4. `Industry`
5. `Contact Email`
6. `Description`
7. `Source URL`
8. `Email Subject`
9. `Email Body`
10. `Status`
