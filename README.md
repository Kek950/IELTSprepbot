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

## User Commands

| Command | Needs API? | Description |
|---------|------------|-------------|
| `/start` | No | Start bot, check setup |
| `/setup` | No | Configure AI provider + key |
| `/settings` | No | View your configuration |
| `/tokens` | No | View your API usage |
| `/progress` | No | Practice statistics |
| `/history` | No | Past submissions |
| `/help` | No | Show help |

## Menu Buttons

- **📝 Log Practice Time** - Track listening/reading (no API needed)
- **✍️ Write Essay** - AI-assessed writing (API required)
- **📈 Token Usage** - Your API usage stats
- **⚙️ Settings** - View/change config

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
krya_bot/
├── .env                # Your Telegram bot token
├── .env.example        # Template
├── ielts_bot.py        # Bot code
├── requirements.txt    # Dependencies
├── run_bot.bat         # Windows launcher
├── .gitignore          # Excludes .env and .db
└── README.md           # This file
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
