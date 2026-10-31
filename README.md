# IELTS Preparation Bot

A Telegram bot for IELTS preparation where **each user provides their own AI API key**.

## Quick Start

### 1. Get Telegram Bot Token
1. Open Telegram, search `@BotFather`
2. Send `/newbot`, follow instructions
3. Copy the token

### 2. Configure
Edit `.env` file:
```
TELEGRAM_BOT_TOKEN=*** ```

### 3. Run
Double-click `run_bot.bat` or:
```bash
pip install -r requirements.txt
python ielts_bot.py
```

## How It Works

```
User starts bot → /start
        ↓
Bot says: "Setup your AI provider"
        ↓
User sends /setup
        ↓
User picks: OpenAI / Gemini / Claude / Mistral / Cohere
        ↓
User enters their own API key
        ↓
Bot saves key for that user only
        ↓
User can now write essays and get AI feedback
```

**Each user has their own:**
- API key (stored per user)
- Token usage tracking
- Assessment history

## Web Companion & Dual-Role Classroom

The project includes a full React + Vite web companion platform (`web/`) synchronized with the Telegram bot via phone numbers.

### Dual-Role Architecture
Users are not artificially locked to a single role. A user can simultaneously:
- **Instruct & Teach cohorts**: Create classes, generate join codes, assign homework, and review student essays in the **Teacher Review Hub**.
- **Attend cohorts as a Student**: Join other instructors' classes via invite code, submit homework, and receive Cambridge rubric feedback.

### Single Password Authentication & Telegram Sync
- **In Telegram**:
  - `/start` or `📱 Share Phone Number` registers your profile and prompts for your permanent web password.
  - Set custom nickname or use your Telegram username.
- **On Web**:
  - Sign in using your Nickname or Phone Number + your chosen password.
  - Live Web Deployment: **https://kek950.github.io/IELTSprepbot/**

### Quick Launchers
- **`run_all.bat`**: Single-click launcher starting both the Telegram bot and the Web companion.
- **`run_bot.bat`**: Starts the Telegram bot and background REST API server.
- **`start_termux.sh`**: 24/7 background launcher for Android/Termux.

## User Commands

| Command | Needs API? | Description |
|---------|------------|-------------|
| `/start` | No | Start bot, register & set web password |
| `/phone` | No | Link contact / update phone number |
| `/password` | No | Update / reset your web password |
| `/nickname` | No | Set or change your public nickname |
| `/setup` | No | Configure AI provider + key |
| `/settings` | No | View your configuration |
| `/tokens` | No | View your API usage |
| `/progress` | No | Practice statistics |
| `/history` | No | Past submissions |
| `/createclass` | No | Create class (as Instructor) |
| `/joinclass` | No | Join class (as Student) |
| `/help` | No | Show help |

## Menu Buttons

- **📝 Log Practice Time** - Track listening/reading (no API needed)
- **✍️ Write Essay** - AI-assessed writing (API required)
- **📈 Token Usage** - Your API usage stats
- **⚙️ Settings** - View/change config

### Supported Google Gemini Models

Users can choose between multiple Gemini models or configure a custom model identifier:
- **`gemini-2.5-flash`** (Default): Hybrid thinking model with reasoning budget; fast with high evaluation precision.
- **`gemini-2.5-pro`**: Deep reasoning model for rigorous Cambridge rubric Band 8.5/9.0 lexical and stylistic critique.
- **`gemini-2.5-flash-lite`**: Ultra-efficient lightweight model with lowest latency and highest throughput.
- **`gemini-2.0-flash`**: High-speed workhorse model for rapid drafting assessments.
- **`gemini-2.0-flash-lite`**: Compact inference engine for fast grammar scanning.
- **`gemini-3.0-flash-preview`**: Next-generation Gemini 3 architecture preview with multimodal discourse analysis.
- **Custom Model ID**: Direct support for entering any experimental or fine-tuned model identifier (`gemini-3.0-pro-preview`, etc.).

## Getting API Keys (for users)

### Google Gemini (Free) - Recommended
1. Go to https://aistudio.google.com/app/apikey
2. Sign in with Google
3. Click "Create API Key"
4. Copy and send to bot

### OpenAI (Paid)
1. Go to https://platform.openai.com
2. Add billing, create key
3. Copy and send to bot

### Anthropic Claude (Paid)
1. Go to https://console.anthropic.com
2. Add billing, create key
3. Copy and send to bot

### Mistral (Free tier)
1. Go to https://console.mistral.ai
2. Create account, create key
3. Copy and send to bot

### Cohere (Free tier)
1. Go to https://dashboard.cohere.com
2. Create account, create key
3. Copy and send to bot

## Token Tracking

Each user can view their usage with `/tokens`:
- Tokens used today
- Tokens used this month
- Total tokens all-time
- Number of API calls
- Breakdown by provider

## Files

```
IELTSprepbot-main/
├── .env                # Your Telegram bot token
├── .env.example        # Template
├── ielts_bot.py        # Bot code & web server
├── firebase.py         # Firestore backend
├── requirements.txt    # Dependencies
├── run_bot.bat         # Bot Windows launcher
├── run_website.bat     # React + Vite web companion launcher
├── web/                # React + Vite application
│   ├── src/            # Components, data, simulator & studio
│   └── dist/           # Production build
└── README.md           # Documentation
```

## FAQ

**Q: Do I need to provide API keys for all users?**
A: No. Each user brings their own key. You only need the Telegram bot token.

**Q: Can users see each other's API keys?**
A: No. Each user's key is isolated and only used for their assessments.

**Q: What if a user doesn't have an API key?**
A: They can still log practice time, but can't use AI writing assessment.

**Q: How do users get API keys?**
A: The bot shows instructions when they run `/setup`. Free options: Gemini, Mistral, Cohere.
