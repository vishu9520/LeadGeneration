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

## 🤖 How the AI Lead Generation Works

The AI layer is implemented in `server/services/openRouterService.js` and uses the
OpenRouter chat-completions API. The selected model is controlled by the `MODEL`
environment variable and defaults to `openai/gpt-4o-mini`.

### 1. Campaign parameters are sent to the model

When a campaign is submitted, the backend sends the following information in a
structured prompt:

- SaaS product description or value proposition
- Target country or geography
- Target industry
- Requested number of leads

The requested count is protected by a server-side limit of 1–20 leads.

### 2. The model researches and structures prospects

The prompt instructs the model to identify organizations that match the selected
country and industry and that could benefit from the product. For every prospect,
the model is asked to return:

- Organization name
- Official website
- Country and industry
- Public contact or inquiry email
- Short organization description
- Source URL

The model is also instructed to create a personalized cold-email subject, email
body, and call to action for each organization. The email prompt asks it to
include a relevant hook, explain the product's value, describe expected business
relevance or ROI, and finish with a low-friction CTA.

### 3. The response is required to be JSON

The backend requests a JSON response so it can process the result automatically.
It also includes defensive parsing for common model formatting variations, such as
Markdown code fences or wrapper properties such as `leads` and `results`.

Each returned record is normalized before storage. Missing fields receive safe
defaults, and every lead is assigned the initial status `Not Contacted` together
with the campaign parameters that produced it.

### 4. Leads are saved and displayed

After normalization, the backend saves the records to MongoDB when available. If
MongoDB is not running, the embedded JSON document store is used instead. The
frontend then displays the generated leads so they can be reviewed, edited,
filtered, exported, or marked as contacted.

### AI limitations and responsible use

The model generates prospect information from its learned knowledge and the
instructions in the prompt; the application does not currently connect to a
dedicated live search, business-directory, LinkedIn, or email-verification API.
Therefore, websites, organizations, and contact emails must be checked by a
person before outreach. A generated or fallback email address is not proof that
the mailbox exists.

The current outreach endpoint records an email as dispatched and updates the lead
status, but it does not deliver a real email through SMTP, Gmail, SendGrid, or
another provider. A production deployment should add a verified data source,
email verification, consent/compliance checks, rate limiting, and a real email
delivery provider.

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
