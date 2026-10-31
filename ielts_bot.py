"""
IELTS Preparation Bot — Teacher & Student System
=================================================
ROLES (chosen on first /start, permanent):
  👨‍🏫 Teacher: create classes, assign daily essays, set weekly goals,
                give homework (class-wide OR individual with deadlines),
                track each student's progress, broadcast lessons/files,
                manually assess student essays (see AI score + add own feedback)
  👨‍🎓 Student: join class via code (/join CODE), see teacher essays for today
               (plus always get extra random essays), log practice time,
               view homework reminders, track progress vs class goals,
               AI-powered essay assessment using own Gemini API key

COMMANDS:
  /start       — open menu / role selection
  /setup       — reconfigure Gemini API key (students)
  /join CODE   — join a class (students)
  /leaveclass  — leave current class (students)
  /settings    — view current settings
  /tokens      — view API token usage (students)
  /help        — show help
  /devclean    — clear all data (only when DEV_MODE=true in .env)
"""

import os
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer
import firebase
from firebase import FirestoreRow
import json
import re
import random
import string
from datetime import datetime, date
from dotenv import load_dotenv
from telegram import Update, ReplyKeyboardMarkup, ReplyKeyboardRemove, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    Application, CommandHandler, MessageHandler, CallbackQueryHandler,
    ConversationHandler, ContextTypes, filters,
)

load_dotenv()

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ielts_bot.db")
DEFAULT_MODEL = "gemini-2.5-flash"

TASK1_PROMPTS = [
    "The chart below shows the percentage of households in different income brackets that owned computers between 1998 and 2008. Summarize the information by selecting and reporting the main features, and make comparisons where relevant.",
    "The diagram illustrates the process of recycling plastic bottles. Summarize the process by selecting and reporting the main features.",
    "The table below gives information about the underground railway systems in six cities. Summarize the information by selecting and reporting the main features, and make comparisons where relevant.",
    "The line graph shows the number of tourists visiting three different museums in London between 2000 and 2010. Summarize the information by selecting and reporting the main features.",
    "The pie charts show the main reasons why agricultural land becomes less productive and how land is affected by these problems. Summarize the information by selecting and reporting the main features.",
]

TASK2_PROMPTS = [
    "Some people believe that university students should be required to attend classes, while others believe that going to classes should be optional for students. Which point of view do you agree with?",
    "In many countries, the gap between the rich and the poor is increasing. What problems does this cause, and what solutions can you suggest?",
    "Some people think that the best way to reduce crime is to give longer prison sentences. Others believe there are better alternative ways of reducing crime. Discuss both views and give your opinion.",
    "Many people prefer to watch foreign films rather than locally produced films. Why do you think this is? Should governments give more financial support to local film industries?",
    "Some experts believe that when a country is already rich, any additional increase in economic wealth does not make its citizens happier. Do you agree or disagree?",
    "In some countries, young people are encouraged to work or travel for a year between finishing high school and starting university. Discuss the advantages and disadvantages for young people who decide to do this.",
]

GEMINI_MODELS = {
    "gemini-4.0-argon-preview": {"name": "Gemini 4.0 Argon Preview", "desc": "🧪 Frontier 4.0 Argon — experimental cognitive model", "speed": "⚡⚡⚡⚡", "quality": "⭐⭐⭐⭐⭐⭐", "default": False},
    "gemini-4.0-pro": {"name": "Gemini 4.0 Pro", "desc": "💎 Gemini 4.0 Pro — flagship multi-examiner reasoning", "speed": "⚡⚡⚡", "quality": "⭐⭐⭐⭐⭐⭐", "default": False},
    "gemini-3.5-pro": {"name": "Gemini 3.5 Pro", "desc": "🌌 Frontier Pro 3.5 — Band 9.0 benchmark master", "speed": "⚡⚡⚡", "quality": "⭐⭐⭐⭐⭐⭐", "default": False},
    "gemini-3.5-flash": {"name": "Gemini 3.5 Flash", "desc": "⚡ Next-Gen Flash 3.5 — ultra high speed & thinking", "speed": "⚡⚡⚡⚡⚡", "quality": "⭐⭐⭐⭐⭐+", "default": False},
    "gemini-3-pro-preview": {"name": "Gemini 3 Pro Preview", "desc": "🔬 Official Gemini 3 Pro — advanced rubric critique", "speed": "⚡⚡⚡", "quality": "⭐⭐⭐⭐⭐+", "default": False},
    "gemini-3-flash-preview": {"name": "Gemini 3 Flash Preview", "desc": "🔮 Official Gemini 3 Flash — fast hybrid architecture", "speed": "⚡⚡⚡⚡⚡", "quality": "⭐⭐⭐⭐⭐", "default": False},
    "gemini-3.0-pro": {"name": "Gemini 3.0 Pro", "desc": "🔬 Deep Reasoning 3.0 — advanced rubric critique", "speed": "⚡⚡⚡", "quality": "⭐⭐⭐⭐⭐+", "default": False},
    "gemini-3.0-flash": {"name": "Gemini 3.0 Flash", "desc": "🔮 Gemini 3.0 Flash — fast hybrid architecture", "speed": "⚡⚡⚡⚡⚡", "quality": "⭐⭐⭐⭐⭐", "default": False},
    "gemini-2.5-pro": {"name": "Gemini 2.5 Pro", "desc": "🏆 Deep Reasoning 2.5 — smartest Band 9 critique", "speed": "⚡⚡", "quality": "⭐⭐⭐⭐⭐+", "default": False},
    "gemini-2.5-flash": {"name": "Gemini 2.5 Flash", "desc": "🧠 Hybrid Thinking 2.5 — default recommended", "speed": "⚡⚡⚡⚡", "quality": "⭐⭐⭐⭐⭐", "default": True},
    "gemini-2.5-flash-lite": {"name": "Gemini 2.5 Flash-Lite", "desc": "💨 Flash-Lite — ultra efficient & lowest latency", "speed": "⚡⚡⚡⚡⚡", "quality": "⭐⭐⭐⭐", "default": False},
}

CHOOSE_ROLE, ENTER_API_KEY, SELECT_MODEL, CONFIRM_SETUP = range(4)
SELECT_ACTIVITY, ENTER_DURATION = range(4, 6)
SELECT_TASK, WRITE_ESSAY, SELECT_TEACHER_ESSAY = range(6, 9)
JOIN_CLASS_CODE = range(9, 10)

(REG_ROLE, REG_PHONE, REG_CHOOSE_NICK, REG_CUSTOM_NICK, REG_PASSWORD) = range(90, 95)

(ENTER_CLASS_NAME, SELECT_CLASS_FOR_ESSAY, SELECT_ESSAY_TASK_TYPE,
 ENTER_ESSAY_PROMPT, SELECT_CLASS_FOR_GOAL, ENTER_LISTENING_GOAL,
 ENTER_READING_GOAL, SELECT_CLASS_OR_STUDENT_HW, SELECT_STUDENT_FOR_HW,
 ENTER_HW_TITLE, ENTER_HW_DESC, ENTER_HW_DEADLINE,
 SELECT_CLASS_PROGRESS, SELECT_STUDENT_PROGRESS,
 SELECT_CLASS_BROADCAST, ENTER_LESSON_CONTENT,
 SELECT_CLASS_FOR_ASSESS, SELECT_STUDENT_FOR_ASSESS, SELECT_ESSAY_FOR_ASSESS,
 ENTER_MANUAL_SCORE, ENTER_MANUAL_FEEDBACK) = range(10, 31)

def init_db():
    firebase.init_db()

def register_user(user):
    firebase.register_user(user)

def set_user_role(user_id, role):
    firebase.set_user_role(user_id, role)

def get_user_role(user_id):
    return firebase.get_user_role(user_id)

def get_user_config(user_id):
    return firebase.get_user_config(user_id)

def get_student_class(user_id):
    return firebase.get_student_class(user_id)

def track_token_usage(user_id: int, tokens_in: int, tokens_out: int, request_type: str = "assessment"):
    firebase.track_token_usage(user_id, tokens_in, tokens_out, request_type)

def get_token_usage(user_id: int) -> dict:
    return firebase.get_token_usage(user_id)

def get_student_keyboard():
    return ReplyKeyboardMarkup([
        ["📝 Log Practice Time", "✍️ Write Essay"],
        ["📋 My Homework", "📊 My Progress"],
        ["🤖 Choose Model", "📈 Token Usage"],
        ["📋 View History", "⚙️ Settings"],
        ["❓ Help"]
    ], resize_keyboard=True)

def get_teacher_keyboard():
    return ReplyKeyboardMarkup([
        ["✏️ Assign Essay", "📋 Give Homework"],
        ["📊 Student Progress", "📢 Send Lesson"],
        ["📝 Assess Essays", "🏫 My Classes"],
        ["🎯 Set Goals", "⚙️ Settings"]
    ], resize_keyboard=True)

async def cancel(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    role = get_user_role(user_id)
    kb = get_teacher_keyboard() if role == "teacher" else get_student_keyboard()
    if role == "unset":
        kb = ReplyKeyboardRemove()
    await update.message.reply_text("Cancelled. What would you like to do?", reply_markup=kb)
    return ConversationHandler.END

async def devclean_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    firebase.clear_db()
    await update.message.reply_text("🧹 All database collections and cached records have been completely cleared.\nSend /start to begin fresh.", reply_markup=ReplyKeyboardRemove())

async def register_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    register_user(user)
    keyboard = [["👨‍🎓 I am a Student", "👨‍🏫 I am a Teacher"], ["❌ Cancel"]]
    await update.message.reply_text(
        f"🎯 *IELTS Platform Registration*\n\n"
        f"Welcome, {user.first_name}! Set up your account credentials here to access both this Telegram bot and the Web portal.\n\n"
        f"*Step 1 of 4:* Please select your role:",
        reply_markup=ReplyKeyboardMarkup(keyboard, resize_keyboard=True, one_time_keyboard=True),
        parse_mode="Markdown"
    )
    return REG_ROLE

async def reg_role_step(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = (update.message.text or "").strip()
    user = update.effective_user
    if "Cancel" in text:
        return await cancel(update, context)

    if "Student" in text:
        role = "student"
    elif "Teacher" in text:
        role = "teacher"
    else:
        await update.message.reply_text("Please choose a valid role using the buttons below:")
        return REG_ROLE

    context.user_data["reg_role"] = role
    set_user_role(user.id, role)

    from telegram import KeyboardButton
    existing_phone = firebase.get_user_phone(user.id)
    hint = f"\n(Currently linked: `{existing_phone}`)" if existing_phone else ""
    kb = ReplyKeyboardMarkup([
        [KeyboardButton("📱 Share Phone Number", request_contact=True)],
        ["❌ Cancel"]
    ], resize_keyboard=True, one_time_keyboard=True)
    
    await update.message.reply_text(
        f"✅ Selected Role: *{role.capitalize()}*\n\n"
        f"*Step 2 of 3:* Phone Number Setup 📱{hint}\n\n"
        f"Tap *📱 Share Phone Number* below, or type your phone number in international format (e.g. `+998901234567`):",
        reply_markup=kb,
        parse_mode="Markdown"
    )
    return REG_PHONE

async def reg_phone_step(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    text = (update.message.text or "").strip()
    if "Cancel" in text:
        return await cancel(update, context)

    raw_phone = ""
    if update.message.contact and update.message.contact.phone_number:
        raw_phone = update.message.contact.phone_number
    elif text:
        raw_phone = text

    clean = firebase.link_user_phone(user.id, raw_phone)
    if not clean:
        await update.message.reply_text("❌ Please enter a valid phone number with country code (e.g. `+998901234567`):")
        return REG_PHONE

    context.user_data["reg_phone"] = clean

    # Set nickname by default to Telegram username or sanitized first name
    chosen_nick = user.username or (user.first_name or "student").lower().replace(" ", "_")
    chosen_nick = chosen_nick.lstrip('@')
    context.user_data["reg_nickname"] = chosen_nick
    firebase.set_user_nickname(user.id, chosen_nick)

    # Immediately ask for Web Password right after sharing contact!
    await update.message.reply_text(
        f"✅ *Phone Number Linked:* `{clean}`\n\n"
        f"🔐 *Step 3 of 3: Set Your Web Password*\n\n"
        f"Please enter the password you want to use to log into the Web Platform:\n"
        f"_(Minimum 4 characters. Your message will be automatically deleted for your security)_",
        reply_markup=ReplyKeyboardMarkup([["❌ Cancel"]], resize_keyboard=True),
        parse_mode="Markdown"
    )
    return REG_PASSWORD

async def reg_choose_nick_step(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = (update.message.text or "").strip()
    user = update.effective_user
    if "Cancel" in text:
        return await cancel(update, context)

    if "Custom" in text:
        await update.message.reply_text(
            "👤 *Custom Nickname*\n\n"
            "Type your desired login nickname (letters, numbers, underscores; min 3 chars):\n"
            "Example: `azamat_ielts`",
            reply_markup=ReplyKeyboardMarkup([["❌ Cancel"]], resize_keyboard=True),
            parse_mode="Markdown"
        )
        return REG_CUSTOM_NICK

    chosen_nick = context.user_data.get("tg_username") or user.username or (user.first_name or "student").lower()
    chosen_nick = chosen_nick.lstrip('@')
    context.user_data["reg_nickname"] = chosen_nick
    firebase.set_user_nickname(user.id, chosen_nick)

    await update.message.reply_text(
        f"✅ Nickname set to: *@{chosen_nick}*\n\n"
        f"*Step 4 of 4:* Set your Web Password 🔐\n\n"
        f"Enter a secure password for web login (minimum 4 characters):\n"
        f"_(Your message will be automatically deleted for your security)_",
        reply_markup=ReplyKeyboardMarkup([["❌ Cancel"]], resize_keyboard=True),
        parse_mode="Markdown"
    )
    return REG_PASSWORD

async def reg_custom_nick_step(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = (update.message.text or "").strip().lstrip('@')
    user = update.effective_user
    if "Cancel" in text:
        return await cancel(update, context)

    if len(text) < 3:
        await update.message.reply_text("❌ Nickname must be at least 3 characters long. Try again:")
        return REG_CUSTOM_NICK

    context.user_data["reg_nickname"] = text
    firebase.set_user_nickname(user.id, text)

    await update.message.reply_text(
        f"✅ Nickname set to: *@{text}*\n\n"
        f"*Step 4 of 4:* Set your Web Password 🔐\n\n"
        f"Enter a secure password for web login (minimum 4 characters):\n"
        f"_(Your message will be automatically deleted for your security)_",
        reply_markup=ReplyKeyboardMarkup([["❌ Cancel"]], resize_keyboard=True),
        parse_mode="Markdown"
    )
    return REG_PASSWORD

async def reg_password_step(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = (update.message.text or "").strip()
    user = update.effective_user
    if "Cancel" in text:
        return await cancel(update, context)

    if len(text) < 4:
        await update.message.reply_text("❌ Password must be at least 4 characters long. Try again:")
        return REG_PASSWORD

    try:
        await update.message.delete()
    except Exception:
        pass

    pwd = text
    context.user_data["reg_password"] = pwd
    role = context.user_data.get("reg_role") or get_user_role(user.id) or "student"
    phone = context.user_data.get("reg_phone") or firebase.get_user_phone(user.id) or ""
    nickname = context.user_data.get("reg_nickname") or user.username or (user.first_name or "student").lower()
    nickname = nickname.lstrip('@')

    firebase.set_user_role(user.id, role)
    if phone:
        firebase.link_user_phone(user.id, phone)
    firebase.set_user_nickname(user.id, nickname)
    firebase.set_user_password(user.id, pwd)

    kb = get_teacher_keyboard() if role == "teacher" else get_student_keyboard()

    await update.message.reply_text(
        f"🎉 *Registration Complete!*\n\n"
        f"Your account credentials have been secured:\n\n"
        f"🎖 *Role:* {role.capitalize()}\n"
        f"👤 *Nickname:* `@{nickname}`\n"
        f"📱 *Phone:* `{phone}`\n"
        f"🔑 *Password:* `{pwd}`\n\n"
        f"🌐 *Web Portal:* http://localhost:10000\n"
        f"Go to the website and log in using your Nickname or Phone Number and Password!\n\n"
        f"💡 *Commands you can use anytime:*\n"
        f"• `/myinfo` — View credentials\n"
        f"• `/password <new>` — Change password\n"
        f"• `/nickname <new>` — Change nickname\n"
        f"• `/register` — Re-run setup",
        reply_markup=kb,
        parse_mode="Markdown"
    )
    return ConversationHandler.END

async def myinfo_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    uid = user.id
    user_row = firebase.get_user_by_identifier(str(uid)) or firebase.get_user_by_identifier(user.username)
    role = get_user_role(uid)
    phone = firebase.get_user_phone(uid) or (user_row.get("phone_number") if user_row else None) or "Not linked"
    nick = (user_row.get("nickname") if user_row else None) or user.username or user.first_name
    pwd = (user_row.get("password") if user_row else None) or "Not set (send /password <pwd>)"
    
    await update.message.reply_text(
        f"📋 *Your IELTS Platform Profile & Web Credentials*\n\n"
        f"🎖 *Role:* {role.capitalize()}\n"
        f"👤 *Nickname:* `@{nick}`\n"
        f"📱 *Phone:* `{phone}`\n"
        f"🔑 *Web Password:* `{pwd}`\n\n"
        f"🌐 *Web Portal:* http://localhost:10000\n"
        f"Log in using your Nickname or Phone along with your Password.\n\n"
        f"• Change Password: `/password <new_password>`\n"
        f"• Change Nickname: `/nickname <new_nickname>`\n"
        f"• Update Profile: `/register`",
        parse_mode="Markdown"
    )

async def password_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    args = context.args or []
    if not args:
        await update.message.reply_text(
            "🔐 *Change Web Password*\n\n"
            "Please provide your new password:\n"
            "`/password <your_new_password>`\n\n"
            "Example: `/password mySecurePass2026`",
            parse_mode="Markdown"
        )
        return
    new_pwd = " ".join(args).strip()
    if len(new_pwd) < 4:
        await update.message.reply_text("❌ Password must be at least 4 characters long.")
        return
    try:
        await update.message.delete()
    except Exception:
        pass
    firebase.set_user_password(user.id, new_pwd)
    await update.message.reply_text(
        f"✅ *Web Password Updated Successfully!*\n\n"
        f"🔑 Your new password is set to: `{new_pwd}`\n\n"
        f"You can now log into http://localhost:10000 using your Nickname or Phone Number.",
        parse_mode="Markdown"
    )

async def nickname_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    args = context.args or []
    if not args:
        await update.message.reply_text(
            "👤 *Change Login Nickname*\n\n"
            "Please provide your new nickname:\n"
            "`/nickname <your_new_nickname>`\n\n"
            "Example: `/nickname alex_ielts`",
            parse_mode="Markdown"
        )
        return
    new_nick = " ".join(args).strip().lstrip('@')
    if len(new_nick) < 3:
        await update.message.reply_text("❌ Nickname must be at least 3 characters long.")
        return
    firebase.set_user_nickname(user.id, new_nick)
    await update.message.reply_text(
        f"✅ *Nickname Updated Successfully!*\n\n"
        f"👤 Your login nickname is now: `@{new_nick}`\n\n"
        f"You can use `@{new_nick}` or your phone number to log into http://localhost:10000.",
        parse_mode="Markdown"
    )

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    register_user(user)
    role = get_user_role(user.id)

    # ── Fast-path 1: Deep-link register from website (?start=register or ?start=signup) ──
    args = context.args or []
    if args and (args[0].lower() in ["register", "signup"] or args[0].startswith("login_")):
        if args[0].startswith("login_"):
            raw_phone = args[0].replace("login_", "").strip()
            clean = firebase.link_user_phone(user.id, raw_phone)
            context.user_data["reg_phone"] = clean
        return await register_start(update, context)
    
    is_setup = update.message and update.message.text and update.message.text.startswith('/setup')
    
    if role == "unset":
        return await register_start(update, context)
        
    if role == "teacher":
        await update.message.reply_text("Welcome back, Teacher! 👨‍🏫\nChoose an option below:", reply_markup=get_teacher_keyboard())
        return ConversationHandler.END

    # Student logic
    api_key, model = get_user_config(user.id)
    if api_key and not is_setup:
        model_info = GEMINI_MODELS.get(model, {"name": model, "desc": f"🤖 {model}", "speed": "⚡⚡⚡⚡", "quality": "⭐⭐⭐⭐⭐", "default": False})
        keyboard = []
        for model_id, info in GEMINI_MODELS.items():
            current = " ✅" if model_id == model else ""
            default_tag = " (default)" if info["default"] and model_id != model else ""
            keyboard.append([InlineKeyboardButton(f"{info['desc']}{current}{default_tag}", callback_data=f"switch_{model_id}")])
        
        phone = firebase.get_user_phone(user.id)
        phone_hint = f"\n📱 Web Suite: Linked (`{phone}`) — log in at http://localhost:10000 with your password" if phone else "\n📱 Web Suite: Send /phone to link your web account"
        await update.message.reply_text(
            f"Welcome back, {user.first_name}! 🎯{phone_hint}\n\n🤖 Current model: {model_info['name']}\n⚡ Speed: {model_info['speed']} | ⭐ Quality: {model_info['quality']}\n\n🔄 Tap to switch model:",
            reply_markup=InlineKeyboardMarkup(keyboard)
        )
        await update.message.reply_text("Choose an option below:", reply_markup=get_student_keyboard())
        return ConversationHandler.END

    await update.message.reply_text(
        "Welcome to IELTS Prep Bot! 🎯\n\n"
        "⚠️ To get started, you need your own Google Gemini API key.\n"
        "1️⃣ Go to: https://aistudio.google.com/apikey\n"
        "2️⃣ Sign in with your Google account (must be 18+)\n"
        "3️⃣ Click 'Create API Key' and copy it (starts with 'AIza...')\n"
        "4️⃣ Paste it here\n\n"
        "🔑 Send your Gemini API key now:",
        reply_markup=ReplyKeyboardRemove()
    )
    return ENTER_API_KEY

async def choose_role(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = update.message.text
    user = update.effective_user
    if "Student" in text:
        set_user_role(user.id, "student")
        await update.message.reply_text("You are now registered as a Student! 👨‍🎓")
        return await start(update, context)
    elif "Teacher" in text:
        set_user_role(user.id, "teacher")
        await update.message.reply_text("You are now registered as a Teacher! 👨‍🏫")
        return await start(update, context)
    else:
        await update.message.reply_text("Please choose a valid role using the buttons.")
        return CHOOSE_ROLE

async def enter_api_key(update: Update, context: ContextTypes.DEFAULT_TYPE):
    api_key = update.message.text.strip()
    if len(api_key) < 20:
        await update.message.reply_text("❌ Invalid API key. Get one at: https://aistudio.google.com/apikey\nTry again or /cancel.")
        return ENTER_API_KEY
    try:
        await update.message.delete()
    except Exception:
        pass
    
    await update.message.reply_text("🔄 Validating your API key...")
    try:
        from google import genai
        client = genai.Client(api_key=api_key)
        client.models.generate_content(model=DEFAULT_MODEL, contents="Say 'ok'", config=genai.types.GenerateContentConfig(max_output_tokens=5))
    except Exception as e:
        await update.message.reply_text(f"❌ API key validation failed.\nError: {str(e)[:200]}\nSend valid key or /cancel.")
        return ENTER_API_KEY

    context.user_data["api_key"] = api_key
    keyboard = []
    for model_id, info in GEMINI_MODELS.items():
        tag = " ✅ DEFAULT" if info["default"] else ""
        keyboard.append([InlineKeyboardButton(f"{info['desc']}{tag}", callback_data=f"model_{model_id}")])
    
    await update.message.reply_text("✅ API key is valid!\n🤖 Choose a model:", reply_markup=InlineKeyboardMarkup(keyboard))
    return SELECT_MODEL

async def select_model(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    model_id = query.data.replace("model_", "")
    if model_id not in GEMINI_MODELS: model_id = DEFAULT_MODEL
    context.user_data["selected_model"] = model_id
    model_info = GEMINI_MODELS[model_id]
    api_key = context.user_data["api_key"]
    masked_key = f"{api_key[:6]}...{api_key[-4:]}" if len(api_key) > 10 else "***"
    keyboard = [["✅ Confirm & Save", "❌ Cancel"]]
    try:
        await query.message.delete()
    except Exception:
        pass
    await query.message.reply_text(
        f"📋 Setup Summary:\n🤖 Model: {model_info['name']}\n🔑 API Key: {masked_key}\nConfirm?",
        reply_markup=ReplyKeyboardMarkup(keyboard, resize_keyboard=True)
    )
    return CONFIRM_SETUP

async def confirm_setup(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = update.message.text
    if "❌" in text: return await cancel(update, context)
    user = update.effective_user
    api_key = context.user_data["api_key"]
    model_id = context.user_data.get("selected_model", DEFAULT_MODEL)
    
    firebase.update_user_config(user.id, api_key, model_id)
    
    await update.message.reply_text("✅ Setup complete! You're ready to practice! 🎯", reply_markup=get_student_keyboard())
    return ConversationHandler.END

async def model_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    api_key, current_model = get_user_config(user.id)
    if not current_model:
        current_model = DEFAULT_MODEL
    
    current_info = GEMINI_MODELS.get(current_model, {"name": current_model, "speed": "⚡⚡⚡⚡", "quality": "⭐⭐⭐⭐⭐"})

    keyboard = []
    for model_id, info in GEMINI_MODELS.items():
        is_cur = " ✅" if model_id == current_model else ""
        default_tag = " (default)" if info.get("default") and model_id != current_model else ""
        keyboard.append([InlineKeyboardButton(f"{info['desc']}{is_cur}{default_tag}", callback_data=f"switch_{model_id}")])

    await update.message.reply_text(
        f"🤖 *Choose Your Gemini AI Model*\n\n"
        f"Active Model: *{current_info.get('name', current_model)}*\n"
        f"⚡ Speed: {current_info.get('speed', '⚡⚡⚡⚡')} | ⭐ Quality: {current_info.get('quality', '⭐⭐⭐⭐⭐')}\n\n"
        f"Select any model below to immediately switch your account to higher versions (including Gemini 4.0 Argon, 4.0 Pro, 3.5 Pro & Flash):",
        reply_markup=InlineKeyboardMarkup(keyboard),
        parse_mode="Markdown"
    )

async def switch_model_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    model_id = query.data.replace("switch_", "")
    if model_id not in GEMINI_MODELS: model_id = DEFAULT_MODEL
    user_id = query.from_user.id
    
    firebase.update_user_model(user_id, model_id)
    
    model_info = GEMINI_MODELS[model_id]
    keyboard = []
    for m_id, info in GEMINI_MODELS.items():
        current = " ✅" if m_id == model_id else ""
        default_tag = " (default)" if info["default"] and m_id != model_id else ""
        keyboard.append([InlineKeyboardButton(f"{info['desc']}{current}{default_tag}", callback_data=f"switch_{m_id}")])
    
    await query.edit_message_text(
        f"✅ *AI Model Updated Successfully!*\n\n"
        f"🤖 Active Model: *{model_info['name']}*\n"
        f"⚡ Speed: {model_info['speed']} | ⭐ Quality: {model_info['quality']}\n\n"
        f"Your essays and assessments will now be evaluated with *{model_info['name']}*.\n\n"
        f"🔄 Tap below anytime to switch to another version:",
        reply_markup=InlineKeyboardMarkup(keyboard),
        parse_mode="Markdown"
    )

async def settings(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    role = get_user_role(user.id)
    if role == "teacher":
        await update.message.reply_text("⚙️ Your Settings:\n\nRole: Teacher 👨‍🏫")
        return
    
    api_key, model = get_user_config(user.id)
    if api_key:
        model_info = GEMINI_MODELS.get(model, {"name": model, "desc": f"🤖 {model}", "speed": "⚡⚡⚡⚡", "quality": "⭐⭐⭐⭐⭐", "default": False})
        masked_key = f"{api_key[:6]}...{api_key[-4:]}" if len(api_key) > 10 else "***"
        await update.message.reply_text(
            f"⚙️ *Settings:*\n\n"
            f"🤖 *Active Model:* {model_info['name']}\n"
            f"🔑 *API Key:* `{masked_key}`\n\n"
            f"• To choose higher versions of Gemini: send /model or tap '🤖 Choose Model'\n"
            f"• To reconfigure API key: send /setup\n"
            f"• To view web login info: send /myinfo",
            parse_mode="Markdown"
        )
    else:
        await update.message.reply_text("⚠️ No API key configured. Send /setup first.")

async def token_usage(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    api_key, _ = get_user_config(user.id)
    if not api_key:
        await update.message.reply_text("⚠️ No API key configured. Send /setup first.")
        return
    usage = get_token_usage(user.id)
    text = (f"📈 TOKEN USAGE\n\nToday: {usage['today_tokens']:,}\nThis Week: {usage['week_tokens']:,}\n"
            f"This Month: {usage['month_tokens']:,}\nAll Time: {usage['total_tokens']:,}\n\n"
            f"📝 API Calls: {usage['total_calls']}\nTokens In: {usage['total_in']:,}\nTokens Out: {usage['total_out']:,}\n")
    if usage["recent"]:
        text += "\n🕐 RECENT:\n"
        for entry in usage["recent"]: text += f"  📘 {entry['tokens']:,} tok — {entry['time'][:16]}\n"
    await update.message.reply_text(text)

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    role = get_user_role(user_id)
    if role == "teacher":
        msg = "👨‍🏫 Teacher Commands:\n/start - Open menu\n/help - Show this help\n\nUse the keyboard to manage classes, assign homework, essays, and monitor progress."
    else:
        msg = "👨‍🎓 Student Commands:\n/start - Open menu\n/setup - Configure Gemini API key\n/join <CODE> - Join a class\n/leaveclass - Leave current class\n/settings - View settings\n/tokens - View API usage\n/help - Show help"
    await update.message.reply_text(msg)

# ══════════════════════════════════════════════════════════════════
# STUDENT: JOIN / LEAVE CLASS
# ══════════════════════════════════════════════════════════════════

async def join_class_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    register_user(user)
    if not context.args:
        await update.message.reply_text("Usage: /join CLASSCODE\nEnter the 6-character code from the instructor.")
        return
    code = context.args[0].upper().strip()
    res = firebase.join_class(user.id, code)
    if res == "not_found":
        await update.message.reply_text(f"❌ No class found with code '{code}'. Check the code and try again.")
        return
    elif res == "already_in":
        await update.message.reply_text(f"✅ You are already enrolled in that class!")
        return
    elif res == "success":
        cls = get_student_class(user.id)
        cls_name = cls['name'] if cls else code
        await update.message.reply_text(
            f"✅ Welcome to *{cls_name}*! 🎉\n\n"
            "You are now enrolled in this cohort as a student and can receive assignments and homework.",
            parse_mode="Markdown"
        )


async def leave_class_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    existing = get_student_class(user.id)
    if not existing:
        await update.message.reply_text("You are not in any class.")
        return
    firebase.leave_class(user.id)
    await update.message.reply_text(f"✅ You have left '{existing['name']}'. Use /join CODE to join another class.")


# ══════════════════════════════════════════════════════════════════
# STUDENT: WRITE ESSAY
# ══════════════════════════════════════════════════════════════════

async def write_essay_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    register_user(user)
    api_key, model = get_user_config(user.id)
    if not api_key:
        await update.message.reply_text(
            "⚠️ You need a Gemini API key for essay assessment!\n"
            "Get one free: https://aistudio.google.com/apikey\n"
            "Send /start to set up your key."
        )
        return ConversationHandler.END

    cls = get_student_class(user.id)
    today_str = date.today().isoformat()
    today_essays = []
    if cls:
        today_essays = firebase.get_today_essays(cls["id"], today_str)

    if today_essays:
        context.user_data["today_essays"] = [dict(e) for e in today_essays]
        text = "📝 *Today's assignments from your teacher:*\n\n"
        keyboard = []
        for i, essay in enumerate(today_essays, 1):
            task_label = "Task 1 (Report)" if essay["task_type"] == "task1" else "Task 2 (Essay)"
            preview = essay["prompt"][:70] + "..." if len(essay["prompt"]) > 70 else essay["prompt"]
            text += f"*{i}. {task_label}*\n{preview}\n\n"
            keyboard.append([f"{i}. {task_label}"])
        keyboard.append(["🎲 Random Essay"])
        keyboard.append(["❌ Cancel"])
        await update.message.reply_text(
            text + "Select an assignment or get a random essay:",
            parse_mode="Markdown",
            reply_markup=ReplyKeyboardMarkup(keyboard, resize_keyboard=True)
        )
        return SELECT_TEACHER_ESSAY
    else:
        keyboard = [["📊 Task 1 (Report)", "📝 Task 2 (Essay)"], ["❌ Cancel"]]
        await update.message.reply_text(
            "Which writing task would you like to practice?\n\n"
            "📊 Task 1: Describe a chart/graph/diagram (150+ words)\n"
            "📝 Task 2: Write an essay on a given topic (250+ words)",
            reply_markup=ReplyKeyboardMarkup(keyboard, resize_keyboard=True)
        )
        return SELECT_TASK


async def select_teacher_essay(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = update.message.text
    if "❌" in text:
        return await cancel(update, context)
    today_essays = context.user_data.get("today_essays", [])
    if "🎲" in text:
        keyboard = [["📊 Task 1 (Report)", "📝 Task 2 (Essay)"], ["❌ Cancel"]]
        await update.message.reply_text(
            "Choose a task type for your random essay:",
            reply_markup=ReplyKeyboardMarkup(keyboard, resize_keyboard=True)
        )
        return SELECT_TASK
    try:
        num = int(text.split(".")[0].strip()) - 1
        if 0 <= num < len(today_essays):
            essay = today_essays[num]
            context.user_data["task_type"] = essay["task_type"]
            context.user_data["prompt"] = essay["prompt"]
            context.user_data["teacher_essay_id"] = essay["id"]
            word_count = 150 if essay["task_type"] == "task1" else 250
            task_num = essay["task_type"][-1]
            await update.message.reply_text(
                f"📝 *Writing Task {task_num} (Teacher Assigned):*\n\n{essay['prompt']}\n\n"
                f"Write your response (minimum {word_count} words). Use formal academic language.\n\n"
                "When done, paste your essay here.",
                parse_mode="Markdown",
                reply_markup=ReplyKeyboardRemove()
            )
            return WRITE_ESSAY
    except (ValueError, IndexError):
        pass
    await update.message.reply_text("Please select a valid option from the list.")
    return SELECT_TEACHER_ESSAY


async def select_task(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = update.message.text
    if "❌" in text:
        return await cancel(update, context)
    if "Task 1" in text:
        prompt = random.choice(TASK1_PROMPTS)
        task_type = "task1"
        word_count = 150
    elif "Task 2" in text:
        prompt = random.choice(TASK2_PROMPTS)
        task_type = "task2"
        word_count = 250
    else:
        await update.message.reply_text("Please select Task 1 or Task 2.")
        return SELECT_TASK
    context.user_data["task_type"] = task_type
    context.user_data["prompt"] = prompt
    context.user_data.pop("teacher_essay_id", None)
    await update.message.reply_text(
        f"📝 *Writing Task {task_type[-1]}:*\n\n{prompt}\n\n"
        f"Write your response (minimum {word_count} words). Use formal academic language.\n\n"
        "When done, paste your essay here.",
        parse_mode="Markdown",
        reply_markup=ReplyKeyboardRemove()
    )
    return WRITE_ESSAY


async def write_essay(update: Update, context: ContextTypes.DEFAULT_TYPE):
    essay = update.message.text
    user = update.effective_user
    if "task_type" not in context.user_data or "prompt" not in context.user_data:
        await update.message.reply_text("⚠️ Session lost. Please start over.", reply_markup=get_student_keyboard())
        return ConversationHandler.END
    task_type = context.user_data["task_type"]
    prompt = context.user_data["prompt"]
    word_count = len(essay.split())
    min_words = 150 if task_type == "task1" else 250
    if word_count < min_words:
        await update.message.reply_text(f"⚠️ Your response is {word_count} words. Minimum is {min_words} words.\nPlease write more and resubmit.")
        return WRITE_ESSAY
    api_key, model = get_user_config(user.id)
    if not api_key:
        await update.message.reply_text("⚠️ No API key configured. Send /setup first.")
        return ConversationHandler.END
    model_info = GEMINI_MODELS.get(model, {"name": model, "desc": f"🤖 {model}", "speed": "⚡⚡⚡⚡", "quality": "⭐⭐⭐⭐⭐", "default": False})
    await update.message.reply_text(f"🔄 Assessing with {model_info['name']}... Please wait.")
    assessment, tokens_in, tokens_out = await assess_essay(essay, task_type, prompt, api_key, model)
    if "error" in assessment:
        await update.message.reply_text(
            f"❌ Assessment failed.\n\nError: {assessment['error']}\n\nCheck your API key or try again later.",
            reply_markup=get_student_keyboard()
        )
        return ConversationHandler.END
    track_token_usage(user.id, tokens_in, tokens_out, "assessment")
    total_tokens = tokens_in + tokens_out
    firebase.save_essay_submission(user.id, task_type, prompt, essay, assessment["band_score"], json.dumps(assessment), total_tokens)
    actual_model_id = assessment.get("_model_used", model)
    actual_model_info = GEMINI_MODELS.get(actual_model_id, {"name": actual_model_id})
    feedback_text = format_feedback(assessment, task_type, word_count, actual_model_info['name'], total_tokens)
    await update.message.reply_text(feedback_text, reply_markup=get_student_keyboard())
    return ConversationHandler.END


async def assess_essay(essay: str, task_type: str, prompt: str, api_key: str, model: str = DEFAULT_MODEL):
    from google import genai
    from google.genai import types
    client = genai.Client(api_key=api_key)
    system_prompt = """You are an IELTS writing examiner. Assess the following writing task response based on IELTS criteria.
Provide your response as valid JSON with this exact format:
{
    "band_score": 6.5,
    "task_achievement": {"score": 6, "feedback": "..."},
    "coherence_cohesion": {"score": 7, "feedback": "..."},
    "lexical_resource": {"score": 6, "feedback": "..."},
    "grammatical_range": {"score": 7, "feedback": "..."},
    "strengths": ["...", "..."],
    "suggestions": ["...", "...", "..."]
}"""
    user_prompt = f"Task Type: {'Task 1 - Report' if task_type == 'task1' else 'Task 2 - Essay'}\nPrompt: {prompt}\n\nStudent's Response:\n{essay}"

    # Build fallback chain: start with user-chosen model, then fallback through official versions
    models_to_try = [model]
    for fallback in ["gemini-3-pro-preview", "gemini-3-flash-preview", "gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.5-flash-lite"]:
        if fallback not in models_to_try:
            models_to_try.append(fallback)

    last_error = None
    for attempt_model in models_to_try:
        try:
            response = client.models.generate_content(
                model=attempt_model, contents=user_prompt,
                config=types.GenerateContentConfig(system_instruction=system_prompt, temperature=0.3, response_mime_type="application/json")
            )
            tok_in = response.usage_metadata.prompt_token_count if response.usage_metadata else 0
            tok_out = response.usage_metadata.candidates_token_count if response.usage_metadata else 0
            text = response.text
            start = text.find('{'); end = text.rfind('}') + 1
            if start != -1 and end != -1:
                data = json.loads(text[start:end])
                data["_model_used"] = attempt_model
                return data, tok_in, tok_out
            cleaned = re.sub(r'```json\s*', '', text)
            cleaned = re.sub(r'```\s*', '', cleaned)
            start = cleaned.find('{'); end = cleaned.rfind('}') + 1
            if start != -1 and end != -1:
                data = json.loads(cleaned[start:end])
                data["_model_used"] = attempt_model
                return data, tok_in, tok_out
            raise ValueError("Could not extract JSON from response")
        except Exception as e:
            last_error = e
            err_msg = str(e).lower()
            # If authentication/permission error, fail immediately (fallbacks won't help invalid keys)
            if "api key" in err_msg or "permission" in err_msg or "unauthenticated" in err_msg or "403" in err_msg:
                break
            # Otherwise (404 Not Found, unsupported model, resource exhausted), continue to next fallback
            continue

    return {
        "band_score": 0,
        "task_achievement": {"score": 0, "feedback": f"Assessment failed: {str(last_error)}"},
        "coherence_cohesion": {"score": 0, "feedback": ""},
        "lexical_resource": {"score": 0, "feedback": ""},
        "grammatical_range": {"score": 0, "feedback": ""},
        "strengths": [], "suggestions": ["Check your API key and try again."],
        "error": str(last_error)
    }, 0, 0


def format_feedback(assessment: dict, task_type: str, word_count: int, model_name: str, tokens_used: int) -> str:
    band_score = assessment.get("band_score", 0)
    if band_score >= 8: level, emoji = "Excellent", "🌟"
    elif band_score >= 7: level, emoji = "Very Good", "✨"
    elif band_score >= 6: level, emoji = "Good", "👍"
    elif band_score >= 5: level, emoji = "Modest", "📝"
    else: level, emoji = "Needs Improvement", "📚"
    feedback = (
        f"\n{'=' * 40}\n📊 IELTS WRITING ASSESSMENT\n{'=' * 40}\n\n"
        f"{emoji} Overall Band Score: {band_score} ({level})\n"
        f"📝 Word Count: {word_count}\n"
        f"📋 Task Type: {'Task 1 - Report' if task_type == 'task1' else 'Task 2 - Essay'}\n"
        f"🤖 Assessed by: {model_name}\n🪙 Tokens used: {tokens_used:,}\n\n"
        f"{'─' * 40}\n📈 CRITERIA SCORES:\n{'─' * 40}\n\n"
        f"✅ Task Achievement: {assessment.get('task_achievement', {}).get('score', 'N/A')}/9\n"
        f"{assessment.get('task_achievement', {}).get('feedback', '')}\n\n"
        f"✅ Coherence & Cohesion: {assessment.get('coherence_cohesion', {}).get('score', 'N/A')}/9\n"
        f"{assessment.get('coherence_cohesion', {}).get('feedback', '')}\n\n"
        f"✅ Lexical Resource: {assessment.get('lexical_resource', {}).get('score', 'N/A')}/9\n"
        f"{assessment.get('lexical_resource', {}).get('feedback', '')}\n\n"
        f"✅ Grammatical Range: {assessment.get('grammatical_range', {}).get('score', 'N/A')}/9\n"
        f"{assessment.get('grammatical_range', {}).get('feedback', '')}\n\n"
        f"{'─' * 40}\n💪 STRENGTHS:\n{'─' * 40}\n"
    )
    for strength in assessment.get("strengths", []):
        feedback += f"• {strength}\n"
    feedback += f"\n{'─' * 40}\n🎯 SUGGESTIONS FOR IMPROVEMENT:\n{'─' * 40}\n"
    for i, suggestion in enumerate(assessment.get("suggestions", []), 1):
        feedback += f"{i}. {suggestion}\n"
    feedback += f"\n{'=' * 40}"
    return feedback


# ══════════════════════════════════════════════════════════════════
# STUDENT: TIME LOGGING
# ══════════════════════════════════════════════════════════════════

async def log_time_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    register_user(update.effective_user)
    keyboard = [["🎧 Listening", "📖 Reading"], ["❌ Cancel"]]
    await update.message.reply_text("What did you practice?", reply_markup=ReplyKeyboardMarkup(keyboard, resize_keyboard=True))
    return SELECT_ACTIVITY

async def select_activity(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = update.message.text
    if "❌" in text: return await cancel(update, context)
    if "🎧" in text or "listening" in text.lower(): context.user_data["activity"] = "listening"
    elif "📖" in text or "reading" in text.lower(): context.user_data["activity"] = "reading"
    else:
        await update.message.reply_text("Please select Listening or Reading.")
        return SELECT_ACTIVITY
    await update.message.reply_text("How many minutes did you practice? (Enter a number)", reply_markup=ReplyKeyboardRemove())
    return ENTER_DURATION

async def enter_duration(update: Update, context: ContextTypes.DEFAULT_TYPE):
    try:
        minutes = int(update.message.text)
        if minutes <= 0 or minutes > 480: raise ValueError
    except ValueError:
        await update.message.reply_text("Please enter a valid number (1–480).")
        return ENTER_DURATION
    user = update.effective_user
    activity = context.user_data["activity"]
    firebase.log_practice_time(user.id, activity, minutes)
    await update.message.reply_text(f"✅ Logged {minutes} minutes of {activity} practice!", reply_markup=get_student_keyboard())
    return ConversationHandler.END


# ══════════════════════════════════════════════════════════════════
# STUDENT: PROGRESS, HISTORY, HOMEWORK
# ══════════════════════════════════════════════════════════════════

async def progress(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    register_user(user)
    cls = get_student_class(user.id)
    class_id = cls["id"] if cls else None
    p_data = firebase.get_user_progress_data(user.id, class_id)
    time_stats = p_data["time_stats"]
    weekly = p_data["weekly_stats"]
    
    lt = time_stats.get("listening", 0)
    rt = time_stats.get("reading", 0)
    lw = weekly.get("listening", 0)
    rw = weekly.get("reading", 0)
    avg_str = f"{p_data['avg_score']:.1f}" if p_data['avg_score'] is not None else "N/A"
    best_str = f"{p_data['best_score']}" if p_data['best_score'] is not None else "N/A"

    if cls:
        lg = cls["listening_goal_min"] or 180
        rg = cls["reading_goal_min"] or 180
        goals = (f"🏫 Class: {cls['name']}\n"
                 f"🎯 Weekly Goals:\n"
                 f"   Listening: {'✅' if lw >= lg else '⬜'} {lw}/{lg} min\n"
                 f"   Reading:   {'✅' if rw >= rg else '⬜'} {rw}/{rg} min")
    else:
        goals = (f"🎯 Weekly Goals (default):\n"
                 f"   Listening: {'✅' if lw >= 180 else '⬜'} {lw}/180 min\n"
                 f"   Reading:   {'✅' if rw >= 180 else '⬜'} {rw}/180 min")

    text = (
        f"\n{'=' * 40}\n📊 YOUR IELTS PROGRESS\n{'=' * 40}\n\n"
        f"🎧 Listening: {lt} min total ({lt // 60}h {lt % 60}m)\n"
        f"   This week: {lw} min\n\n"
        f"📖 Reading: {rt} min total ({rt // 60}h {rt % 60}m)\n"
        f"   This week: {rw} min\n\n"
        f"{'─' * 40}\n✍️ WRITING:\n   Essays: {p_data['total_essays']}\n"
        f"   Avg Band: {avg_str}  |  Best: {best_str}\n\n"
        f"{'─' * 40}\n📈 RECENT SCORES:\n"
    )
    recent_scores = p_data["recent_scores"]
    if recent_scores:
        for s in recent_scores: text += f"   • Band {s['band_score']} — {s['submitted_at'][:10]}\n"
    else:
        text += "   No submissions yet\n"
    text += f"\n{'─' * 40}\n{goals}\n{'=' * 40}"
    await update.message.reply_text(text)


async def history(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    register_user(user)
    submissions = firebase.get_student_essays(user.id)[:10]
    if not submissions:
        await update.message.reply_text("📝 No writing submissions yet.\nStart practicing with '✍️ Write Essay'!")
        return
    text = f"\n{'=' * 40}\n📋 YOUR WRITING HISTORY\n{'=' * 40}\n\n"
    total_tokens = 0
    for s in submissions:
        task = "Task 1" if s["task_type"] == "task1" else "Task 2"
        tok = s["tokens_used"] or 0
        total_tokens += tok
        teacher_mark = f" | 👨‍🏫 {s['manual_score']}" if s["manual_score"] is not None else ""
        text += f"#{s['id']} | {task} | AI: {s['band_score']}{teacher_mark} | {s['submitted_at'][:10]}\n"
    text += f"\nTotal tokens: {total_tokens:,}\n{'=' * 40}"
    await update.message.reply_text(text)


async def my_homework(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    register_user(user)
    cls = get_student_class(user.id)
    class_id = cls["id"] if cls else None
    hw_list = firebase.get_student_homework(user.id, class_id)

    if not hw_list:
        await update.message.reply_text("📋 No homework assigned yet.\nCheck back after your teacher assigns tasks!")
        return

    text = f"{'=' * 40}\n📋 YOUR HOMEWORK\n{'=' * 40}\n\n"
    for hw in hw_list:
        done = hw["hw_status"] == "done"
        dl = hw["deadline"][:16] if hw["deadline"] else "No deadline"
        try:
            dl_dt = datetime.strptime(hw["deadline"], "%Y-%m-%d %H:%M:%S") if hw["deadline"] else None
            overdue = dl_dt and dl_dt < datetime.now() and not done
        except Exception:
            overdue = False
        if done: status = "✅ Done"
        elif overdue: status = "🔴 Overdue"
        else: status = "⏳ Pending"
        scope = "(Class)" if hw["class_id"] and not hw["student_id"] else "(You)"
        text += (f"{'─' * 35}\n📌 {hw['title']} {scope}\n"
                 f"   Status:   {status}\n"
                 f"   Deadline: {dl}\n"
                 f"   Task:     {hw['description'][:80]}{'...' if len(hw['description']) > 80 else ''}\n\n")
    text += "Your teacher will mark tasks as done when you complete them."
    # Split if too long
    if len(text) > 4000:
        for i in range(0, len(text), 4000):
            await update.message.reply_text(text[i:i+4000])
    else:
        await update.message.reply_text(text)
# ══════════════════════════════════════════════════════════════════
# TEACHER: MY CLASSES
# ══════════════════════════════════════════════════════════════════


async def my_classes(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    classes = firebase.get_teacher_classes(user.id)
    if not classes:
        await update.message.reply_text(
            "🏫 You have no classes yet.\n\nUse 'Create New Class ➕' to get started!",
            reply_markup=ReplyKeyboardMarkup([["🏫 Create New Class", "❌ Cancel"]], resize_keyboard=True)
        )
        return ENTER_CLASS_NAME

    text = f"{'=' * 40}\n🏫 YOUR CLASSES\n{'=' * 40}\n\n"
    for cls in classes:
        count = firebase.get_class_student_count(cls["id"])
        text += (
            f"📚 *{cls['name']}*\n"
            f"   🔑 Join Code: `{cls['join_code']}`\n"
            f"   👥 Students: {count}\n"
            f"   🎯 Goals: 🎧 {cls['listening_goal_min']}min | 📖 {cls['reading_goal_min']}min/week\n\n"
        )
    text += (
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        "📌 *How students join your class:*\n"
        "1. Student opens the bot\n"
        "2. Sends: `/join CLASSCODE`\n"
        "3. They are automatically enrolled\n\n"
        "Use '🏫 Create New Class' to add more classes."
    )
    if len(text) > 4000:
        for i in range(0, len(text), 4000):
            await update.message.reply_text(text[i:i+4000], parse_mode="Markdown")
    else:
        await update.message.reply_text(text, parse_mode="Markdown")
    return ConversationHandler.END

async def enter_class_name(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = update.message.text
    if "❌" in text: return await cancel(update, context)
    if "Create New Class" in text or "🏫" in text:
        await update.message.reply_text("📝 Enter a name for your new class:\n(e.g. 'Group A', 'IELTS Band 7', 'Morning Class')", reply_markup=ReplyKeyboardMarkup([["❌ Cancel"]], resize_keyboard=True))
        return ENTER_CLASS_NAME
    
    name = text.strip()
    if not name or len(name) < 2:
        await update.message.reply_text("Please enter a valid class name (at least 2 characters).")
        return ENTER_CLASS_NAME

    user = update.effective_user
    class_id, code = firebase.create_class(user.id, name)
    await update.message.reply_text(
        f"✅ Class *{name}* created!\n\n"
        f"🔑 *Join Code:* `{code}`\n\n"
        f"📋 *How to share with students:*\n"
        f"Tell your students to:\n"
        f"1. Open the bot\n"
        f"2. Send: `/join {code}`\n\n"
        f"They'll be automatically enrolled in your class!",
        parse_mode="Markdown",
        reply_markup=get_teacher_keyboard()
    )
    return ConversationHandler.END


# ══════════════════════════════════════════════════════════════════
# TEACHER: ASSIGN ESSAY
# ══════════════════════════════════════════════════════════════════

async def assign_essay_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    classes = firebase.get_teacher_classes(user.id)
    if not classes:
        await update.message.reply_text("❌ You have no classes. Create one with '🏫 My Classes' first.")
        return ConversationHandler.END
    context.user_data["teacher_classes"] = {cls["name"]: cls["id"] for cls in classes}
    if len(classes) == 1:
        context.user_data["selected_class_id"] = classes[0]["id"]
        context.user_data["selected_class_name"] = classes[0]["name"]
        keyboard = [["📊 Task 1 (Report)", "📝 Task 2 (Essay)"], ["❌ Cancel"]]
        await update.message.reply_text(
            f"✏️ Assigning essay for *{classes[0]['name']}*\n\nSelect task type:",
            parse_mode="Markdown",
            reply_markup=ReplyKeyboardMarkup(keyboard, resize_keyboard=True)
        )
        return SELECT_ESSAY_TASK_TYPE
    keyboard = [[cls["name"]] for cls in classes] + [["❌ Cancel"]]
    await update.message.reply_text("Which class?", reply_markup=ReplyKeyboardMarkup(keyboard, resize_keyboard=True))
    return SELECT_CLASS_FOR_ESSAY

async def assign_essay_select_class(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = update.message.text
    if "❌" in text: return await cancel(update, context)
    classes = context.user_data.get("teacher_classes", {})
    if text not in classes:
        await update.message.reply_text("Please select a class from the list.")
        return SELECT_CLASS_FOR_ESSAY
    context.user_data["selected_class_id"] = classes[text]
    context.user_data["selected_class_name"] = text
    keyboard = [["📊 Task 1 (Report)", "📝 Task 2 (Essay)"], ["❌ Cancel"]]
    await update.message.reply_text(
        f"✏️ Assigning essay for *{text}*\n\nSelect task type:",
        parse_mode="Markdown",
        reply_markup=ReplyKeyboardMarkup(keyboard, resize_keyboard=True)
    )
    return SELECT_ESSAY_TASK_TYPE

async def assign_essay_task_type(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = update.message.text
    if "❌" in text: return await cancel(update, context)
    if "Task 1" in text: context.user_data["essay_task_type"] = "task1"
    elif "Task 2" in text: context.user_data["essay_task_type"] = "task2"
    else:
        await update.message.reply_text("Please select Task 1 or Task 2.")
        return SELECT_ESSAY_TASK_TYPE
    task_num = context.user_data["essay_task_type"][-1]
    word_req = "150+" if task_num == "1" else "250+"
    await update.message.reply_text(
        f"📝 *Task {task_num} selected*\n\n"
        f"Now type the essay prompt for your students.\n"
        f"Students will need to write {word_req} words in response.\n\n"
        "Enter your essay prompt:",
        parse_mode="Markdown",
        reply_markup=ReplyKeyboardMarkup([["❌ Cancel"]], resize_keyboard=True)
    )
    return ENTER_ESSAY_PROMPT

async def assign_essay_prompt(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = update.message.text
    if "❌" in text: return await cancel(update, context)
    if len(text.strip()) < 20:
        await update.message.reply_text("Prompt is too short. Please write a full essay question.")
        return ENTER_ESSAY_PROMPT
    class_id = context.user_data["selected_class_id"]
    class_name = context.user_data["selected_class_name"]
    task_type = context.user_data["essay_task_type"]
    user = update.effective_user
    today_str = date.today().isoformat()
    member_ids = firebase.add_teacher_essay(class_id, user.id, task_type, text.strip(), today_str)
    task_label = "Task 1 (Report)" if task_type == "task1" else "Task 2 (Essay)"
    await update.message.reply_text(
        f"✅ Essay assigned to *{class_name}*!\n\n"
        f"📋 Type: {task_label}\n"
        f"📅 Date: {today_str}\n"
        f"👥 Students notified: {len(member_ids)}",
        parse_mode="Markdown",
        reply_markup=get_teacher_keyboard()
    )
    # Notify each student
    for uid in member_ids:
        try:
            await context.bot.send_message(
                chat_id=uid,
                text=f"📝 *New Essay Assignment!*\n\n"
                     f"Class: {class_name}\nType: {task_label}\n\n*Prompt:*\n{text.strip()}\n\n"
                     f"Tap '✍️ Write Essay' to respond!",
                parse_mode="Markdown"
            )
        except Exception:
            pass
    return ConversationHandler.END


# ══════════════════════════════════════════════════════════════════
# TEACHER: GIVE HOMEWORK
# ══════════════════════════════════════════════════════════════════

async def give_hw_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    classes = firebase.get_teacher_classes(user.id)
    if not classes:
        await update.message.reply_text("❌ You have no classes. Create one with '🏫 My Classes' first.")
        return ConversationHandler.END
    context.user_data["teacher_classes"] = {cls["name"]: cls["id"] for cls in classes}
    if len(classes) == 1:
        context.user_data["hw_class_id"] = classes[0]["id"]
        context.user_data["hw_class_name"] = classes[0]["name"]
        return await _ask_hw_target(update, context)
    keyboard = [[cls["name"]] for cls in classes] + [["❌ Cancel"]]
    await update.message.reply_text("Which class?", reply_markup=ReplyKeyboardMarkup(keyboard, resize_keyboard=True))
    return SELECT_CLASS_OR_STUDENT_HW

async def _ask_hw_target(update, context):
    class_name = context.user_data["hw_class_name"]
    keyboard = [["📚 Whole Class", "👤 Specific Student"], ["❌ Cancel"]]
    await update.message.reply_text(
        f"📋 Homework for *{class_name}*\n\nAssign to:",
        parse_mode="Markdown",
        reply_markup=ReplyKeyboardMarkup(keyboard, resize_keyboard=True)
    )
    return SELECT_CLASS_OR_STUDENT_HW

async def give_hw_select_class(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = update.message.text
    if "❌" in text: return await cancel(update, context)
    if "📚" in text or "Whole" in text:
        context.user_data["hw_student_id"] = None
        await update.message.reply_text("📌 Enter the homework title:", reply_markup=ReplyKeyboardMarkup([["❌ Cancel"]], resize_keyboard=True))
        return ENTER_HW_TITLE
    if "👤" in text or "Specific" in text:
        class_id = context.user_data.get("hw_class_id")
        if not class_id:
            classes = context.user_data.get("teacher_classes", {})
            if text in classes:
                context.user_data["hw_class_id"] = classes[text]
                context.user_data["hw_class_name"] = text
                return await _ask_hw_target(update, context)
            await update.message.reply_text("Please select a class from the list.")
            return SELECT_CLASS_OR_STUDENT_HW
        members = firebase.get_class_members(class_id)
        if not members:
            await update.message.reply_text("No students in this class yet.")
            return ConversationHandler.END
        context.user_data["hw_members"] = {f"{m['first_name'] or m['username'] or str(m['user_id'])}": m["user_id"] for m in members}
        keyboard = [[name] for name in context.user_data["hw_members"]] + [["❌ Cancel"]]
        await update.message.reply_text("Select a student:", reply_markup=ReplyKeyboardMarkup(keyboard, resize_keyboard=True))
        return SELECT_STUDENT_FOR_HW
    
    # Class selection
    classes = context.user_data.get("teacher_classes", {})
    if text in classes:
        context.user_data["hw_class_id"] = classes[text]
        context.user_data["hw_class_name"] = text
        return await _ask_hw_target(update, context)
    await update.message.reply_text("Please select from the list.")
    return SELECT_CLASS_OR_STUDENT_HW

async def give_hw_select_student(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = update.message.text
    if "❌" in text: return await cancel(update, context)
    members = context.user_data.get("hw_members", {})
    if text not in members:
        await update.message.reply_text("Please select a student from the list.")
        return SELECT_STUDENT_FOR_HW
    context.user_data["hw_student_id"] = members[text]
    context.user_data["hw_student_name"] = text
    await update.message.reply_text(f"👤 Assigning to *{text}*\n\n📌 Enter the homework title:", parse_mode="Markdown", reply_markup=ReplyKeyboardMarkup([["❌ Cancel"]], resize_keyboard=True))
    return ENTER_HW_TITLE

async def give_hw_title(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = update.message.text
    if "❌" in text: return await cancel(update, context)
    if len(text.strip()) < 2:
        await update.message.reply_text("Please enter a valid title.")
        return ENTER_HW_TITLE
    context.user_data["hw_title"] = text.strip()
    await update.message.reply_text("📝 Now enter the homework description / instructions:", reply_markup=ReplyKeyboardMarkup([["❌ Cancel"]], resize_keyboard=True))
    return ENTER_HW_DESC

async def give_hw_desc(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = update.message.text
    if "❌" in text: return await cancel(update, context)
    context.user_data["hw_desc"] = text.strip()
    await update.message.reply_text(
        "📅 Enter the deadline:\nFormat: DD.MM.YYYY HH:MM\n(e.g. 25.06.2025 23:59)",
        reply_markup=ReplyKeyboardMarkup([["❌ Cancel"]], resize_keyboard=True)
    )
    return ENTER_HW_DEADLINE

async def give_hw_deadline(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = update.message.text.strip()
    if "❌" in text: return await cancel(update, context)
    try:
        dl = datetime.strptime(text, "%d.%m.%Y %H:%M")
        deadline_str = dl.strftime("%Y-%m-%d %H:%M:%S")
    except ValueError:
        await update.message.reply_text("❌ Invalid format. Use DD.MM.YYYY HH:MM (e.g. 25.06.2025 23:59)")
        return ENTER_HW_DEADLINE

    user = update.effective_user
    class_id = context.user_data.get("hw_class_id")
    student_id = context.user_data.get("hw_student_id")
    title = context.user_data["hw_title"]
    desc = context.user_data["hw_desc"]
    class_name = context.user_data.get("hw_class_name", "")

    hw_id, recipients = firebase.add_homework(class_id, student_id, user.id, title, desc, deadline_str)

    target_str = context.user_data.get("hw_student_name", f"all of {class_name}") if student_id else f"all of {class_name}"
    await update.message.reply_text(
        f"✅ Homework assigned!\n\n"
        f"📌 Title: {title}\n"
        f"👥 Target: {target_str}\n"
        f"📅 Deadline: {text}\n"
        f"👤 Recipients: {len(recipients)}",
        reply_markup=get_teacher_keyboard()
    )
    # Notify recipients
    for uid in recipients:
        try:
            await context.bot.send_message(
                chat_id=uid,
                text=f"📋 *New Homework Assigned!*\n\n📌 {title}\n📅 Deadline: {text}\n\n{desc[:300]}",
                parse_mode="Markdown"
            )
        except Exception:
            pass
    return ConversationHandler.END


# ══════════════════════════════════════════════════════════════════
# TEACHER: SET GOALS
# ══════════════════════════════════════════════════════════════════

async def set_goals_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    classes = firebase.get_teacher_classes(user.id)
    if not classes:
        await update.message.reply_text("❌ No classes found. Create one first.")
        return ConversationHandler.END
    context.user_data["teacher_classes"] = {cls["name"]: cls["id"] for cls in classes}
    if len(classes) == 1:
        context.user_data["goal_class_id"] = classes[0]["id"]
        context.user_data["goal_class_name"] = classes[0]["name"]
        await update.message.reply_text(
            f"🎯 Setting goals for *{classes[0]['name']}*\n\n"
            "Enter weekly *Listening* goal in minutes:\n(e.g. 180 = 3 hours/week)",
            parse_mode="Markdown",
            reply_markup=ReplyKeyboardMarkup([["❌ Cancel"]], resize_keyboard=True)
        )
        return ENTER_LISTENING_GOAL
    keyboard = [[cls["name"]] for cls in classes] + [["❌ Cancel"]]
    await update.message.reply_text("Which class?", reply_markup=ReplyKeyboardMarkup(keyboard, resize_keyboard=True))
    return SELECT_CLASS_FOR_GOAL

async def set_goals_class(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = update.message.text
    if "❌" in text: return await cancel(update, context)
    classes = context.user_data.get("teacher_classes", {})
    if text not in classes:
        await update.message.reply_text("Please select a class.")
        return SELECT_CLASS_FOR_GOAL
    context.user_data["goal_class_id"] = classes[text]
    context.user_data["goal_class_name"] = text
    await update.message.reply_text(
        f"🎯 Setting goals for *{text}*\n\nEnter weekly *Listening* goal in minutes:",
        parse_mode="Markdown",
        reply_markup=ReplyKeyboardMarkup([["❌ Cancel"]], resize_keyboard=True)
    )
    return ENTER_LISTENING_GOAL

async def set_goals_listening(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = update.message.text
    if "❌" in text: return await cancel(update, context)
    try:
        mins = int(text)
        if mins < 0 or mins > 10000: raise ValueError
    except ValueError:
        await update.message.reply_text("Please enter a valid number of minutes.")
        return ENTER_LISTENING_GOAL
    context.user_data["listen_goal"] = mins
    await update.message.reply_text(
        f"✅ Listening goal: {mins} min/week\n\nNow enter weekly *Reading* goal in minutes:",
        parse_mode="Markdown",
        reply_markup=ReplyKeyboardMarkup([["❌ Cancel"]], resize_keyboard=True)
    )
    return ENTER_READING_GOAL

async def set_goals_reading(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = update.message.text
    if "❌" in text: return await cancel(update, context)
    try:
        mins = int(text)
        if mins < 0 or mins > 10000: raise ValueError
    except ValueError:
        await update.message.reply_text("Please enter a valid number of minutes.")
        return ENTER_READING_GOAL
    class_id = context.user_data["goal_class_id"]
    class_name = context.user_data["goal_class_name"]
    listen_goal = context.user_data["listen_goal"]
    firebase.update_class_goals(class_id, listen_goal, mins)
    await update.message.reply_text(
        f"✅ Goals set for *{class_name}*!\n\n"
        f"🎧 Listening: {listen_goal} min/week\n"
        f"📖 Reading: {mins} min/week",
        parse_mode="Markdown",
        reply_markup=get_teacher_keyboard()
    )
    return ConversationHandler.END


# ══════════════════════════════════════════════════════════════════
# TEACHER: STUDENT PROGRESS
# ══════════════════════════════════════════════════════════════════

async def class_progress_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    classes = firebase.get_teacher_classes(user.id)
    if not classes:
        await update.message.reply_text("❌ No classes yet.")
        return ConversationHandler.END
    context.user_data["teacher_classes"] = {cls["name"]: cls["id"] for cls in classes}
    if len(classes) == 1:
        context.user_data["prog_class_id"] = classes[0]["id"]
        context.user_data["prog_class_name"] = classes[0]["name"]
        return await _show_class_progress(update, context)
    keyboard = [[cls["name"]] for cls in classes] + [["❌ Cancel"]]
    await update.message.reply_text("Which class?", reply_markup=ReplyKeyboardMarkup(keyboard, resize_keyboard=True))
    return SELECT_CLASS_PROGRESS

async def class_progress_select(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = update.message.text
    if "❌" in text: return await cancel(update, context)
    classes = context.user_data.get("teacher_classes", {})
    if text not in classes:
        await update.message.reply_text("Please select a class.")
        return SELECT_CLASS_PROGRESS
    context.user_data["prog_class_id"] = classes[text]
    context.user_data["prog_class_name"] = text
    return await _show_class_progress(update, context)

async def _show_class_progress(update, context):
    class_id = context.user_data["prog_class_id"]
    class_name = context.user_data["prog_class_name"]
    members = firebase.get_class_members(class_id)
    if not members:
        await update.message.reply_text(f"🏫 *{class_name}* has no students yet.\nShare code with: /join", parse_mode="Markdown", reply_markup=get_teacher_keyboard())
        return ConversationHandler.END

    context.user_data["prog_members"] = {str(i + 1): m["user_id"] for i, m in enumerate(members)}
    context.user_data["prog_member_names"] = {str(i + 1): m["first_name"] or m["username"] or str(m["user_id"]) for i, m in enumerate(members)}

    text = f"{'=' * 40}\n📊 {class_name.upper()} — PROGRESS\n{'=' * 40}\n\n"
    text += "Type a student number for details:\n\n"
    for i, m in enumerate(members, 1):
        name = m["first_name"] or m["username"] or f"User {m['user_id']}"
        p_data = firebase.get_user_progress_data(m["user_id"])
        essays = p_data["total_essays"]
        avg = f"{p_data['avg_score']:.1f}" if p_data['avg_score'] is not None else "—"
        wk = sum(p_data["weekly_stats"].values())
        text += f"{i}. {name}\n   Essays: {essays} | Avg Band: {avg} | Week: {wk}min\n"

    if len(text) > 4000:
        for i in range(0, len(text), 4000):
            await update.message.reply_text(text[i:i+4000])
    else:
        await update.message.reply_text(text, reply_markup=ReplyKeyboardMarkup([["🔙 Back to Menu"]], resize_keyboard=True))
    return SELECT_STUDENT_PROGRESS

async def student_progress_view(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = update.message.text
    if "Back" in text or "❌" in text: return await cancel(update, context)
    members = context.user_data.get("prog_members", {})
    names = context.user_data.get("prog_member_names", {})
    num = text.strip()
    if num not in members:
        await update.message.reply_text("Please enter a valid student number.")
        return SELECT_STUDENT_PROGRESS
    student_id = members[num]
    student_name = names.get(num, "Student")

    cls_id = context.user_data.get("prog_class_id")
    p_data = firebase.get_user_progress_data(student_id, cls_id)
    time_data = p_data["time_stats"]
    week_data = p_data["weekly_stats"]
    recent_essays = p_data["recent_scores"][:5]
    hw_data = p_data["hw_data"][:5]

    lt = time_data.get("listening", 0); rt = time_data.get("reading", 0)
    lw = week_data.get("listening", 0); rw = week_data.get("reading", 0)
    avg_str = f"{p_data['avg_score']:.1f}" if p_data['avg_score'] is not None else "N/A"
    best_str = str(p_data['best_score']) if p_data['best_score'] is not None else "N/A"

    cls = get_student_class(student_id)
    lg = (cls["listening_goal_min"] or 180) if cls else 180
    rg = (cls["reading_goal_min"] or 180) if cls else 180

    result = (
        f"{'=' * 40}\n👤 {student_name.upper()}\n{'=' * 40}\n\n"
        f"⏱ TIME (This week):\n   🎧 Listening: {lw}/{lg} min {'✅' if lw >= lg else '⬜'}\n   📖 Reading:   {rw}/{rg} min {'✅' if rw >= rg else '⬜'}\n\n"
        f"✍️ WRITING:\n   Total Essays: {ws['n'] if ws else 0}\n   Avg Band: {avg_str}  |  Best: {best_str}\n\n"
        f"📈 Recent Essays:\n"
    )
    for e in recent_essays:
        task = "T1" if e["task_type"] == "task1" else "T2"
        ms = f" | 👨‍🏫{e['manual_score']}" if e["manual_score"] is not None else ""
        result += f"  #{e['id']} | {task} | AI:{e['band_score']}{ms} | {e['submitted_at'][:10]}\n"
    if not recent_essays:
        result += "  No essays yet\n"
    result += "\n📋 HOMEWORK:\n"
    for h in hw_data:
        icon = "✅" if h["hw_status"] == "done" else "❌"
        dl = h["deadline"][:10] if h["deadline"] else "—"
        result += f"  {icon} {h['title']} (due {dl})\n"
    if not hw_data:
        result += "  No homework\n"

    keyboard = [["🔙 Back to Class"], ["📝 Assess This Student's Essays"]]
    context.user_data["assess_student_id"] = student_id
    context.user_data["assess_student_name"] = student_name
    await update.message.reply_text(result, reply_markup=ReplyKeyboardMarkup(keyboard, resize_keyboard=True))
    return SELECT_STUDENT_PROGRESS
# ══════════════════════════════════════════════════════════════════
# TEACHER: SEND LESSON (BROADCAST)
# ══════════════════════════════════════════════════════════════════

async def broadcast_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    classes = firebase.get_teacher_classes(user.id)
    if not classes:
        await update.message.reply_text("❌ No classes found. Create one first.")
        return ConversationHandler.END
    context.user_data["teacher_classes"] = {cls["name"]: cls["id"] for cls in classes}
    if len(classes) == 1:
        context.user_data["bc_class_id"] = classes[0]["id"]
        context.user_data["bc_class_name"] = classes[0]["name"]
        await update.message.reply_text(
            f"📢 Sending lesson to *{classes[0]['name']}*\n\n"
            "Send your message now. You can include:\n"
            "• Text\n• A document/file\n• A photo\n• Audio\n• Video\n\n"
            "Type your message or attach a file:",
            parse_mode="Markdown",
            reply_markup=ReplyKeyboardMarkup([["❌ Cancel"]], resize_keyboard=True)
        )
        return ENTER_LESSON_CONTENT
    keyboard = [[cls["name"]] for cls in classes] + [["❌ Cancel"]]
    await update.message.reply_text("Which class?", reply_markup=ReplyKeyboardMarkup(keyboard, resize_keyboard=True))
    return SELECT_CLASS_BROADCAST

async def broadcast_class_select(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = update.message.text
    if "❌" in text: return await cancel(update, context)
    classes = context.user_data.get("teacher_classes", {})
    if text not in classes:
        await update.message.reply_text("Please select a class.")
        return SELECT_CLASS_BROADCAST
    context.user_data["bc_class_id"] = classes[text]
    context.user_data["bc_class_name"] = text
    await update.message.reply_text(
        f"📢 Sending to *{text}*\n\nSend your message (text, file, photo, audio, video):",
        parse_mode="Markdown",
        reply_markup=ReplyKeyboardMarkup([["❌ Cancel"]], resize_keyboard=True)
    )
    return ENTER_LESSON_CONTENT

async def broadcast_content(update: Update, context: ContextTypes.DEFAULT_TYPE):
    msg = update.message
    if msg.text and "❌" in msg.text: return await cancel(update, context)
    class_id = context.user_data["bc_class_id"]
    class_name = context.user_data["bc_class_name"]
    user = update.effective_user

    file_id = None
    file_type = None
    msg_text = msg.text or msg.caption or ""

    if msg.document:
        file_id = msg.document.file_id
        file_type = "document"
    elif msg.photo:
        file_id = msg.photo[-1].file_id
        file_type = "photo"
    elif msg.audio:
        file_id = msg.audio.file_id
        file_type = "audio"
    elif msg.video:
        file_id = msg.video.file_id
        file_type = "video"

    if not msg_text and not file_id:
        await update.message.reply_text("Please send a text message or attach a file.")
        return ENTER_LESSON_CONTENT

    member_ids = firebase.save_broadcast_lesson(class_id, user.id, msg_text, file_id, file_type)

    sent = 0
    header = f"📢 *Lesson from your teacher — {class_name}*\n\n"
    for uid in member_ids:
        try:
            if file_type == "photo":
                await context.bot.send_photo(chat_id=uid, photo=file_id, caption=header + msg_text, parse_mode="Markdown")
            elif file_type == "document":
                await context.bot.send_document(chat_id=uid, document=file_id, caption=header + msg_text, parse_mode="Markdown")
            elif file_type == "audio":
                await context.bot.send_audio(chat_id=uid, audio=file_id, caption=header + msg_text, parse_mode="Markdown")
            elif file_type == "video":
                await context.bot.send_video(chat_id=uid, video=file_id, caption=header + msg_text, parse_mode="Markdown")
            else:
                await context.bot.send_message(chat_id=uid, text=header + msg_text, parse_mode="Markdown")
            sent += 1
        except Exception:
            pass

    await update.message.reply_text(
        f"✅ Lesson sent to *{class_name}*!\n👥 Delivered to {sent}/{len(members)} students.",
        parse_mode="Markdown",
        reply_markup=get_teacher_keyboard()
    )
    return ConversationHandler.END


# ══════════════════════════════════════════════════════════════════
# TEACHER: ASSESS ESSAYS
# ══════════════════════════════════════════════════════════════════

async def assess_essays_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    classes = firebase.get_teacher_classes(user.id)
    if not classes:
        await update.message.reply_text("❌ No classes found. Create one first.")
        return ConversationHandler.END
    context.user_data["teacher_classes"] = {cls["name"]: cls["id"] for cls in classes}
    if len(classes) == 1:
        context.user_data["as_class_id"] = classes[0]["id"]
        context.user_data["as_class_name"] = classes[0]["name"]
        return await _assess_show_students(update, context)
    keyboard = [[cls["name"]] for cls in classes] + [["❌ Cancel"]]
    await update.message.reply_text("Which class?", reply_markup=ReplyKeyboardMarkup(keyboard, resize_keyboard=True))
    return SELECT_CLASS_FOR_ASSESS

async def assess_select_class(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = update.message.text
    if "❌" in text: return await cancel(update, context)
    classes = context.user_data.get("teacher_classes", {})
    if text not in classes:
        await update.message.reply_text("Please select a class.")
        return SELECT_CLASS_FOR_ASSESS
    context.user_data["as_class_id"] = classes[text]
    context.user_data["as_class_name"] = text
    return await _assess_show_students(update, context)

async def _assess_show_students(update, context):
    class_id = context.user_data["as_class_id"]
    class_name = context.user_data["as_class_name"]
    teacher_id = update.effective_user.id
    class_members = firebase.get_class_members(class_id, requesting_teacher_id=teacher_id)
    if not class_members:
        await update.message.reply_text("No students in this class, or access restricted.", reply_markup=get_teacher_keyboard())
        return ConversationHandler.END
    members = []
    for m in class_members:
        essays = firebase.get_student_essays(m["user_id"], class_id=class_id, requesting_teacher_id=teacher_id)
        row = m.copy()
        row["essay_count"] = len(essays)
        members.append(FirestoreRow(row))

    context.user_data["as_members"] = {str(i + 1): m["user_id"] for i, m in enumerate(members)}
    context.user_data["as_member_names"] = {str(i + 1): m["first_name"] or m["username"] or str(m["user_id"]) for i, m in enumerate(members)}
    text = f"📝 *{class_name}* — Select a student to view essays:\n\n"
    for i, m in enumerate(members, 1):
        name = m["first_name"] or m["username"] or f"User {m['user_id']}"
        text += f"{i}. {name} — {m['essay_count']} essays\n"
    await update.message.reply_text(text, parse_mode="Markdown", reply_markup=ReplyKeyboardMarkup([["❌ Cancel"]], resize_keyboard=True))
    return SELECT_STUDENT_FOR_ASSESS

async def assess_select_student(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = update.message.text.strip()
    if "❌" in text: return await cancel(update, context)
    members = context.user_data.get("as_members", {})
    names = context.user_data.get("as_member_names", {})
    if text not in members:
        await update.message.reply_text("Please enter a valid student number.")
        return SELECT_STUDENT_FOR_ASSESS
    student_id = members[text]
    student_name = names[text]
    class_id = context.user_data.get("as_class_id")
    teacher_id = update.effective_user.id
    context.user_data["as_student_id"] = student_id
    context.user_data["as_student_name"] = student_name
    essays = firebase.get_student_essays(student_id, class_id=class_id, requesting_teacher_id=teacher_id)[:10]
    if not essays:
        await update.message.reply_text(f"No essays found for {student_name} in this class.", reply_markup=get_teacher_keyboard())
        return ConversationHandler.END
    context.user_data["as_essays"] = {str(i + 1): e["id"] for i, e in enumerate(essays)}
    text_out = f"📝 Essays by *{student_name}* — enter number to assess:\n\n"
    for i, e in enumerate(essays, 1):
        task = "Task 1" if e["task_type"] == "task1" else "Task 2"
        ai_score = e["band_score"]
        teacher_score = f" | 👨‍🏫{e['manual_score']}" if e["manual_score"] is not None else " | 👨‍🏫 not assessed"
        text_out += f"{i}. #{e['id']} | {task} | AI:{ai_score}{teacher_score} | {e['submitted_at'][:10]}\n"
    await update.message.reply_text(text_out, parse_mode="Markdown", reply_markup=ReplyKeyboardMarkup([["❌ Cancel"]], resize_keyboard=True))
    return SELECT_ESSAY_FOR_ASSESS

async def assess_select_essay(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = update.message.text.strip()
    if "❌" in text: return await cancel(update, context)
    essays = context.user_data.get("as_essays", {})
    if text not in essays:
        await update.message.reply_text("Please enter a valid essay number.")
        return SELECT_ESSAY_FOR_ASSESS
    essay_id = essays[text]
    context.user_data["as_essay_id"] = essay_id
    essay_row = firebase.get_essay_by_id(essay_id)
    if not essay_row:
        await update.message.reply_text("Essay not found.")
        return ConversationHandler.END
    task = "Task 1 (Report)" if essay_row["task_type"] == "task1" else "Task 2 (Essay)"
    prompt_preview = essay_row["prompt"][:200] + "..." if len(essay_row["prompt"]) > 200 else essay_row["prompt"]
    essay_preview = essay_row["essay"][:600] + "..." if len(essay_row["essay"]) > 600 else essay_row["essay"]
    ai_fb = {}
    try:
        ai_fb = json.loads(essay_row["feedback"]) if essay_row["feedback"] else {}
    except Exception:
        pass
    preview_text = (
        f"{'=' * 35}\n📄 ESSAY #{essay_id}\n{'=' * 35}\n\n"
        f"Type: {task}\n"
        f"AI Band Score: {essay_row['band_score']}\n"
        f"Submitted: {essay_row['submitted_at'][:10]}\n\n"
        f"📌 Prompt:\n{prompt_preview}\n\n"
        f"✍️ Essay (first 600 chars):\n{essay_preview}\n\n"
        f"{'─' * 35}\n"
        f"AI Breakdown:\n"
        f"  Task Achievement: {ai_fb.get('task_achievement', {}).get('score', '—')}/9\n"
        f"  Coherence: {ai_fb.get('coherence_cohesion', {}).get('score', '—')}/9\n"
        f"  Lexical: {ai_fb.get('lexical_resource', {}).get('score', '—')}/9\n"
        f"  Grammar: {ai_fb.get('grammatical_range', {}).get('score', '—')}/9\n\n"
        f"Now enter your manual score (0-9, e.g. 6.5) or type 'skip' to skip scoring:"
    )
    if len(preview_text) > 4000:
        for i in range(0, len(preview_text), 4000):
            await update.message.reply_text(preview_text[i:i+4000])
    else:
        await update.message.reply_text(preview_text, reply_markup=ReplyKeyboardMarkup([["skip", "❌ Cancel"]], resize_keyboard=True))
    return ENTER_MANUAL_SCORE

async def assess_enter_score(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = update.message.text.strip()
    if "❌" in text: return await cancel(update, context)
    if text.lower() == "skip":
        context.user_data["as_manual_score"] = None
    else:
        try:
            score = float(text)
            if score < 0 or score > 9: raise ValueError
            context.user_data["as_manual_score"] = score
        except ValueError:
            await update.message.reply_text("Please enter a number between 0-9 (e.g. 6.5) or 'skip'.")
            return ENTER_MANUAL_SCORE
    await update.message.reply_text(
        "✍️ Now write your feedback for this essay:\n(Type your comments and suggestions for the student)",
        reply_markup=ReplyKeyboardMarkup([["❌ Cancel"]], resize_keyboard=True)
    )
    return ENTER_MANUAL_FEEDBACK

async def assess_enter_feedback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = update.message.text
    if "❌" in text: return await cancel(update, context)
    essay_id = context.user_data["as_essay_id"]
    student_id = context.user_data["as_student_id"]
    student_name = context.user_data["as_student_name"]
    manual_score = context.user_data.get("as_manual_score")
    teacher_id = update.effective_user.id
    firebase.save_manual_assessment(essay_id, manual_score, text.strip())
    score_str = str(manual_score) if manual_score is not None else "No score given"
    await update.message.reply_text(
        f"✅ Assessment saved for *{student_name}*!\n\nScore: {score_str}\nFeedback: saved.",
        parse_mode="Markdown",
        reply_markup=get_teacher_keyboard()
    )
    try:
        await context.bot.send_message(
            chat_id=student_id,
            text=f"📝 *Teacher Assessment on your Essay #{essay_id}*\n\n"
                 f"Score: {score_str}\n\n"
                 f"Feedback:\n{text.strip()[:500]}",
            parse_mode="Markdown"
        )
    except Exception:
        pass
    return ConversationHandler.END


# ══════════════════════════════════════════════════════════════════
# TEACHER: HOMEWORK STATUS (inline buttons)
# ══════════════════════════════════════════════════════════════════

async def hw_toggle_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    data = query.data
    # Format: hw_toggle_{hw_id}_{student_id}
    parts = data.split("_")
    if len(parts) != 4:
        return
    hw_id = int(parts[2])
    student_id = int(parts[3])
    new_status = firebase.update_homework_status(hw_id, student_id)
    await query.answer(f"Marked as {new_status}!", show_alert=False)


# ══════════════════════════════════════════════════════════════════
# HANDLE_MESSAGE (routes to correct handler by role)
# ══════════════════════════════════════════════════════════════════

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = (update.message.text or "").strip()
    user = update.effective_user
    user_id = user.id
    role = get_user_role(user_id)

    # Handle inline password prompt right after sharing contact
    if context.user_data.get("awaiting_password"):
        if "Cancel" in text:
            context.user_data["awaiting_password"] = False
            return await cancel(update, context)
        if len(text) < 4:
            await update.message.reply_text("❌ Password must be at least 4 characters long. Try again:")
            return

        try:
            await update.message.delete()
        except Exception:
            pass

        pwd = text
        context.user_data["awaiting_password"] = False
        phone = context.user_data.get("reg_phone") or firebase.get_user_phone(user_id) or ""
        nickname = context.user_data.get("reg_nickname") or user.username or (user.first_name or "student").lower().replace(" ", "_")
        nickname = nickname.lstrip('@')
        if not role or role == "unset":
            role = context.user_data.get("reg_role") or "student"

        firebase.set_user_role(user_id, role)
        if phone:
            firebase.link_user_phone(user_id, phone)
        firebase.set_user_nickname(user_id, nickname)
        firebase.set_user_password(user_id, pwd)

        kb = get_teacher_keyboard() if role == "teacher" else get_student_keyboard()

        await update.message.reply_text(
            f"🎉 *Account Setup Complete!*\n\n"
            f"Your web credentials are ready:\n\n"
            f"🎖 *Role:* {role.capitalize()}\n"
            f"👤 *Nickname:* `@{nickname}`\n"
            f"📱 *Phone:* `{phone}`\n"
            f"🔑 *Password:* `{pwd}`\n\n"
            f"🌐 *Web Portal:* http://localhost:10000\n"
            f"Log in with your Phone or Nickname and this Password!\n\n"
            f"💡 *Commands you can use anytime:*\n"
            f"• `/myinfo` — View credentials\n"
            f"• `/password <new>` — Change password\n"
            f"• `/nickname <new>` — Change nickname",
            reply_markup=kb,
            parse_mode="Markdown"
        )
        return

    if role == "student":
        if "📊 My Progress" in text: return await progress(update, context)
        if "📋 View History" in text: return await history(update, context)
        if "📋 My Homework" in text: return await my_homework(update, context)
        if "🤖 Choose Model" in text or "Choose Model" in text: return await model_command(update, context)
        if "📈 Token Usage" in text: return await token_usage(update, context)
        if "⚙️ Settings" in text: return await settings(update, context)
        if "❓ Help" in text: return await help_command(update, context)
    elif role == "teacher":
        if "🏫 My Classes" in text: return await my_classes(update, context)
        if "🤖 Choose Model" in text or "Choose Model" in text: return await model_command(update, context)
        if "⚙️ Settings" in text: return await settings(update, context)
    return ConversationHandler.END




# ══════════════════════════════════════════════════════════════════
# HEALTH SERVER  (keeps Render's port-scan happy on the free tier)
# ══════════════════════════════════════════════════════════════════

# ══════════════════════════════════════════════════════════════════
# PHONE LINKING & WEB LOGIN CODES
# ══════════════════════════════════════════════════════════════════

async def phone_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    args = context.args or []
    if args:
        raw = " ".join(args).strip()
        clean = firebase.link_user_phone(user.id, raw)
        if clean:
            role = get_user_role(user.id)
            if not role or role == "unset":
                role = "student"
                firebase.set_user_role(user.id, role)
            chosen_nick = user.username or (user.first_name or "student").lower().replace(" ", "_")
            chosen_nick = chosen_nick.lstrip('@')
            firebase.set_user_nickname(user.id, chosen_nick)

            context.user_data["awaiting_password"] = True
            context.user_data["reg_phone"] = clean
            context.user_data["reg_nickname"] = chosen_nick
            context.user_data["reg_role"] = role

            await update.message.reply_text(
                f"✅ *Phone Number Linked:* `{clean}`\n\n"
                f"🔐 *Please set your Web Account Password:*\n\n"
                f"Type the password you want to use to log into the Web Platform:\n"
                f"_(Minimum 4 characters. Your message will be automatically deleted for your security)_",
                reply_markup=ReplyKeyboardMarkup([["❌ Cancel"]], resize_keyboard=True),
                parse_mode="Markdown"
            )
            return

    from telegram import KeyboardButton, ReplyKeyboardMarkup
    existing_phone = firebase.get_user_phone(user.id)
    hint = f"\n(Currently linked: `{existing_phone}`)" if existing_phone else ""
    kb = ReplyKeyboardMarkup([
        [KeyboardButton("📱 Share Phone Number", request_contact=True)],
        ["❌ Cancel"]
    ], resize_keyboard=True, one_time_keyboard=True)
    await update.message.reply_text(
        f"📱 *Link Your Phone for Web Login*{hint}\n\n"
        f"Tap *📱 Share Phone Number* below to link your contact, or send it directly:\n"
        f"Example: `/phone +998901234567`",
        reply_markup=kb,
        parse_mode="Markdown"
    )

async def contact_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    contact = update.message.contact
    user = update.effective_user
    if contact and contact.phone_number:
        clean = firebase.link_user_phone(user.id, contact.phone_number)
        role = get_user_role(user.id)
        if not role or role == "unset":
            role = "student"
            firebase.set_user_role(user.id, role)
        chosen_nick = user.username or (user.first_name or "student").lower().replace(" ", "_")
        chosen_nick = chosen_nick.lstrip('@')
        firebase.set_user_nickname(user.id, chosen_nick)

        context.user_data["awaiting_password"] = True
        context.user_data["reg_phone"] = clean
        context.user_data["reg_nickname"] = chosen_nick
        context.user_data["reg_role"] = role

        await update.message.reply_text(
            f"✅ *Phone Number Linked:* `{clean}`\n\n"
            f"🔐 *Please set your Web Account Password:*\n\n"
            f"Type the password you want to use to log into the Web Platform:\n"
            f"_(Minimum 4 characters. Your message will be automatically deleted for your security)_",
            reply_markup=ReplyKeyboardMarkup([["❌ Cancel"]], resize_keyboard=True),
            parse_mode="Markdown"
        )

# ══════════════════════════════════════════════════════════════════
# HEALTH & REST API SERVER
# ══════════════════════════════════════════════════════════════════

def _start_health_server() -> None:
    """Bind an HTTP server to $PORT for health checks, static web hosting,
    and REST API endpoints powering the React companion application."""
    port = int(os.environ.get("PORT", 10000))
    dist_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "web", "dist")

    class _Handler(BaseHTTPRequestHandler):
        def _get_target_user(self, payload_or_params):
            ident = (
                payload_or_params.get("identifier") or
                payload_or_params.get("phone") or
                payload_or_params.get("phone_number") or ""
            )
            return firebase.get_user_by_identifier(ident)

        def _send_cors_headers(self):
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")

        def _send_json(self, status: int, data: dict):
            body = json.dumps(data, default=str).encode("utf-8")
            self.send_response(status)
            self._send_cors_headers()
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def do_OPTIONS(self):
            self.send_response(204)
            self._send_cors_headers()
            self.end_headers()

        def do_GET(self):
            parsed_path = self.path.split("?")[0]
            query_str = self.path.split("?")[1] if "?" in self.path else ""
            query_params = {}
            if query_str:
                import urllib.parse
                for pair in query_str.split("&"):
                    if "=" in pair:
                        k, v = pair.split("=", 1)
                        query_params[urllib.parse.unquote(k)] = urllib.parse.unquote(v)

            # 1. Health check
            if parsed_path == "/health":
                self.send_response(200)
                self._send_cors_headers()
                self.send_header("Content-Type", "text/plain")
                self.end_headers()
                self.wfile.write(b"OK")
                return

            # 2. REST API: /api/user/data?identifier=... (or ?phone=...)
            if parsed_path == "/api/user/data":
                user_row = self._get_target_user(query_params)
                if not user_row:
                    self._send_json(404, {"error": "User account not found. Please register in Telegram (@IELTSgenius_bot)."})
                    return
                uid = user_row["user_id"]
                cls = firebase.get_student_class(uid)
                dual_classes = firebase.get_user_all_classes(uid)
                progress = firebase.get_user_progress_data(uid, cls["id"] if cls else None)
                tokens = firebase.get_token_usage(uid)
                hw = firebase.get_student_homework(uid, cls["id"] if cls else None)
                submissions = firebase.get_student_submissions(uid)
                student_queue = firebase.get_teacher_review_queue(uid)
                self._send_json(200, {
                    "success": True,
                    "user": dict(user_row),
                    "class": dict(cls) if cls else None,
                    "teaching_classes": dual_classes["teaching"],
                    "enrolled_classes": dual_classes["enrolled"],
                    "progress": progress,
                    "tokens": tokens,
                    "homework": [dict(h) for h in hw],
                    "submissions": [dict(s) for s in submissions],
                    "student_queue": [dict(q) for q in student_queue]
                })
                return

            # 2b. REST API: /api/class/stats?class_id=...&phone=...
            if parsed_path == "/api/class/stats":
                class_id = query_params.get("class_id", "")
                user_row = self._get_target_user(query_params)
                uid = user_row["user_id"] if user_row else None
                stats = firebase.get_class_statistics(class_id, requesting_user_id=uid)
                self._send_json(200, {"success": True, "stats": stats})
                return

            # 2c. REST API: /api/student/mock-scores?phone=...&class_id=...
            if parsed_path == "/api/student/mock-scores":
                class_id = query_params.get("class_id", None)
                user_row = self._get_target_user(query_params)
                if not user_row:
                    self._send_json(404, {"error": "User not found."})
                    return
                scores = firebase.get_student_mock_scores(user_row["user_id"], class_id=class_id)
                self._send_json(200, {"success": True, "scores": [dict(s) for s in scores]})
                return

            # 3. Static files from web/dist
            if os.path.exists(dist_dir):
                req_path = parsed_path.lstrip("/")
                file_path = os.path.join(dist_dir, req_path)
                if not os.path.exists(file_path) or os.path.isdir(file_path):
                    file_path = os.path.join(dist_dir, "index.html")

                if os.path.exists(file_path):
                    content_type = "text/html"
                    if file_path.endswith(".js"): content_type = "application/javascript"
                    elif file_path.endswith(".css"): content_type = "text/css"
                    elif file_path.endswith(".svg"): content_type = "image/svg+xml"
                    elif file_path.endswith(".png"): content_type = "image/png"
                    elif file_path.endswith(".json"): content_type = "application/json"

                    try:
                        with open(file_path, "rb") as f:
                            data = f.read()
                        self.send_response(200)
                        self._send_cors_headers()
                        self.send_header("Content-Type", content_type)
                        self.send_header("Content-Length", str(len(data)))
                        self.end_headers()
                        self.wfile.write(data)
                        return
                    except Exception:
                        pass

            body = b"OK"
            self.send_response(200)
            self._send_cors_headers()
            self.send_header("Content-Type", "text/plain")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def do_POST(self):
            parsed_path = self.path.split("?")[0]
            content_length = int(self.headers.get("Content-Length", 0))
            post_body = self.rfile.read(content_length)
            payload = {}
            if post_body:
                try:
                    payload = json.loads(post_body.decode("utf-8"))
                except Exception:
                    pass

            # Endpoint: /api/auth/login (Nickname / Phone + Password authentication)
            if parsed_path == "/api/auth/login":
                ident = payload.get("identifier", "").strip()
                pwd = payload.get("password", "").strip()
                if not ident:
                    self._send_json(400, {"error": "Please enter your Nickname or Phone Number."})
                    return
                if not pwd:
                    self._send_json(400, {"error": "Please enter your Password."})
                    return

                valid, msg, user_data = firebase.verify_user_credentials(ident, pwd)
                if valid:
                    self._send_json(200, {
                        "success": True,
                        "user": user_data,
                        "message": msg
                    })
                else:
                    self._send_json(401, {"error": msg})
                return

            # Endpoint: /api/user/config
            if parsed_path == "/api/user/config":
                api_key = payload.get("api_key", "").strip()
                model_id = payload.get("model", "gemini-2.5-flash").strip()
                user_row = self._get_target_user(payload)
                if user_row:
                    firebase.update_user_config(user_row["user_id"], api_key, model_id)
                self._send_json(200, {"success": True})
                return

            # Endpoint: /api/practice/log
            if parsed_path == "/api/practice/log":
                act = payload.get("activity", "listening")
                mins = int(payload.get("minutes", 30))
                user_row = self._get_target_user(payload)
                if user_row:
                    firebase.log_practice_time(user_row["user_id"], act, mins)
                self._send_json(200, {"success": True, "logged": mins, "activity": act})
                return

            # Endpoint: /api/class/join
            if parsed_path == "/api/class/join":
                code = payload.get("code", "").strip().upper()
                user_row = self._get_target_user(payload)
                if not user_row:
                    self._send_json(404, {"error": "User not found."})
                    return
                res = firebase.join_class(user_row["user_id"], code)
                self._send_json(200, {"success": res == "success", "status": res})
                return

            def _send_tg_msg(target_uid, text_content):
                bot_tok = os.getenv("TELEGRAM_BOT_TOKEN")
                if not bot_tok or bot_tok == "your_token_here":
                    return False
                try:
                    import urllib.request
                    tg_payload = json.dumps({
                        "chat_id": target_uid,
                        "text": text_content,
                        "parse_mode": "Markdown"
                    }).encode("utf-8")
                    tg_req = urllib.request.Request(
                        f"https://api.telegram.org/bot{bot_tok}/sendMessage",
                        data=tg_payload,
                        headers={"Content-Type": "application/json"}
                    )
                    urllib.request.urlopen(tg_req, timeout=3)
                    return True
                except Exception:
                    return False

            # Endpoint: /api/class/create
            if parsed_path == "/api/class/create":
                name = payload.get("name", "").strip()
                listening_goal = int(payload.get("listening_goal", 180))
                reading_goal = int(payload.get("reading_goal", 180))
                user_row = self._get_target_user(payload)
                if not user_row:
                    self._send_json(404, {"error": "User not found."})
                    return
                uid = user_row["user_id"]
                class_id, code = firebase.create_class(uid, name)
                firebase.update_class_goals(class_id, listening_goal, reading_goal)
                self._send_json(200, {
                    "success": True,
                    "class": {
                        "id": str(class_id),
                        "teacher_phone": user_row.get("phone_number", ""),
                        "name": name,
                        "join_code": code,
                        "student_count": 0,
                        "listening_goal": listening_goal,
                        "reading_goal": reading_goal,
                        "created_at": "Just now"
                    }
                })
                return

            # Endpoint: /api/class/leave
            if parsed_path == "/api/class/leave":
                class_id = payload.get("class_id")
                user_row = self._get_target_user(payload)
                if not user_row:
                    self._send_json(404, {"error": "User not found."})
                    return
                uid = user_row["user_id"]
                firebase.leave_class(uid, class_id)
                self._send_json(200, {"success": True})
                return

            # Endpoint: /api/homework/assign
            if parsed_path == "/api/homework/assign":
                class_id = payload.get("class_id")
                class_name = payload.get("className") or payload.get("class_name", "Class")
                title = payload.get("title", "").strip()
                description = payload.get("description", "").strip()
                deadline = payload.get("deadline", "Tomorrow, 23:59").strip()
                task_type = payload.get("task_type", "task2")
                user_row = self._get_target_user(payload)
                if not user_row:
                    self._send_json(404, {"error": "User not found."})
                    return
                teacher_id = user_row["user_id"]
                
                # Strict Teacher Isolation: verify teacher owns cohort
                t_classes = firebase.get_teacher_classes(teacher_id)
                if not any(str(c["id"]) == str(class_id) or c.get("name") == class_name for c in t_classes):
                    self._send_json(403, {"error": "Access Denied: You do not instruct this class."})
                    return

                hw_id, recipients = firebase.add_homework(class_id, None, teacher_id, title, description, deadline)
                
                # Real-time Telegram notification to enrolled class members
                for s_uid in recipients:
                    _send_tg_msg(
                        s_uid,
                        f"📚 *New Homework Assigned*\n\n"
                        f"*Class:* {class_name}\n"
                        f"*Title:* {title}\n"
                        f"*Task:* {description}\n"
                        f"⏰ *Deadline:* {deadline}"
                    )

                self._send_json(200, {
                    "success": True,
                    "id": str(hw_id),
                    "recipients_count": len(recipients)
                })
                return

            # Endpoint: /api/essay/submit
            if parsed_path == "/api/essay/submit":
                class_id = payload.get("class_id")
                class_name = payload.get("class_name", "Personal Practice")
                task_type = payload.get("task_type", "task2")
                prompt = payload.get("prompt", "")
                essay = payload.get("essay", "")
                band_score = float(payload.get("band_score", 0.0))
                feedback = payload.get("feedback", {})
                tokens_used = int(payload.get("tokens_used", 1200))
                
                user_row = self._get_target_user(payload)
                if not user_row:
                    self._send_json(404, {"error": "User not found."})
                    return
                uid = user_row["user_id"]

                essay_id = firebase.save_essay_submission(
                    uid, task_type, prompt, essay, band_score, feedback, tokens_used, class_id=class_id
                )
                firebase.track_token_usage(uid, tokens_used // 2, tokens_used // 2, "writing_assessment")

                # If submitted for a cohort, push alert to the instructor's Telegram
                if class_id:
                    try:
                        c_doc = firebase.db.collection("classes").document(str(class_id)).get() if firebase.db else None
                        if c_doc and c_doc.exists:
                            t_id = c_doc.get("teacher_id")
                            s_name = user_row.get("first_name") or user_row.get("username") or f"Student"
                            _send_tg_msg(
                                t_id,
                                f"✍️ *New Student Essay Submitted*\n\n"
                                f"*Class:* {class_name}\n"
                                f"*Student:* {s_name}\n"
                                f"*Task:* {task_type.upper()}\n"
                                f"*Band:* {band_score}\n"
                                f"*Prompt:* {prompt[:80]}...\n\n"
                                f"Open your teacher dashboard or Telegram bot to grade and provide feedback."
                            )
                    except Exception:
                        pass

                self._send_json(200, {
                    "success": True,
                    "essay_id": str(essay_id)
                })
                return

            # Endpoint: /api/essay/review
            if parsed_path == "/api/essay/review":
                essay_id = payload.get("essay_id")
                manual_score = payload.get("manual_score")
                notes = payload.get("notes") or payload.get("manual_feedback", "")
                
                user_row = self._get_target_user(payload)
                if not user_row:
                    self._send_json(404, {"error": "User not found."})
                    return
                teacher_id = user_row["user_id"]

                essay = firebase.get_essay_by_id(essay_id)
                if not essay:
                    self._send_json(404, {"error": "Essay submission not found."})
                    return

                # Strict Teacher Isolation: Ensure student is in one of teacher's cohorts or submitted to teacher's class
                student_id = essay.get("user_id")
                t_classes = firebase.get_teacher_classes(teacher_id)
                t_cids = {str(c["id"]) for c in t_classes}
                s_classes = firebase.get_student_classes(student_id)
                s_cids = {str(c["id"]) for c in s_classes}
                essay_cid = str(essay.get("class_id") or "")

                is_authorized = (
                    str(teacher_id) == str(student_id) or
                    (essay_cid and essay_cid in t_cids) or
                    bool(t_cids.intersection(s_cids))
                )
                if not is_authorized:
                    self._send_json(403, {"error": "Access Denied: Student is not in your cohorts."})
                    return

                firebase.save_manual_assessment(essay_id, float(manual_score) if manual_score else None, notes)

                # Send Telegram notification to the student
                _send_tg_msg(
                    student_id,
                    f"🎓 *Instructor Assessment Completed*\n\n"
                    f"Your teacher evaluated your essay:\n\n"
                    f"⭐️ *Examiner Grade:* Band {manual_score}\n"
                    f"💬 *Instructor Feedback:* {notes}\n\n"
                    f"Log into the platform to review your full feedback breakdown."
                )

                self._send_json(200, {"success": True})
                return

            # Endpoint: /api/broadcast/send
            if parsed_path == "/api/broadcast/send":
                class_id = payload.get("class_id")
                message = payload.get("message", "").strip()
                
                user_row = self._get_target_user(payload)
                if not user_row:
                    self._send_json(404, {"error": "User not found."})
                    return
                teacher_id = user_row["user_id"]

                # Strict Teacher Isolation
                t_classes = firebase.get_teacher_classes(teacher_id)
                if not any(str(c["id"]) == str(class_id) for c in t_classes):
                    self._send_json(403, {"error": "Access Denied: You do not own this class."})
                    return

                recipients = firebase.save_broadcast_lesson(class_id, teacher_id, message, None, "text")
                
                for s_uid in recipients:
                    _send_tg_msg(
                        s_uid,
                        f"📢 *Instructor Announcement*\n\n{message}"
                    )

                self._send_json(200, {"success": True, "recipients_count": len(recipients)})
                return

            # Endpoint: /api/class/mock-score (Practice Month daily mock test scoring)
            if parsed_path == "/api/class/mock-score":
                class_id = payload.get("class_id")
                student_id = payload.get("student_id")
                date_str = payload.get("date", datetime.now().strftime("%Y-%m-%d"))
                listening = float(payload.get("listening", 6.5))
                reading = float(payload.get("reading", 6.5))
                writing = float(payload.get("writing", 6.5))
                speaking = float(payload.get("speaking", 6.5))
                overall = payload.get("overall")
                notes = payload.get("notes", "")

                user_row = self._get_target_user(payload)
                if not user_row:
                    self._send_json(404, {"error": "Teacher not found."})
                    return
                teacher_id = user_row["user_id"]

                # Strict Teacher Isolation
                t_classes = firebase.get_teacher_classes(teacher_id)
                if not any(str(c["id"]) == str(class_id) for c in t_classes):
                    self._send_json(403, {"error": "Access Denied: You do not instruct this class."})
                    return

                record = firebase.record_mock_score(
                    class_id=class_id,
                    student_id=student_id,
                    teacher_id=teacher_id,
                    date_str=date_str,
                    listening=listening,
                    reading=reading,
                    writing=writing,
                    speaking=speaking,
                    notes=notes,
                    overall=overall,
                    title=payload.get("title", "Practice Month Mock Exam")
                )

                # Send Telegram notification to student
                try:
                    c_doc = firebase.db.collection("classes").document(str(class_id)).get() if firebase.db else None
                    c_name = c_doc.get("name") if c_doc and c_doc.exists else "IELTS Cohort"
                    feedback_line = f"\n💬 *Teacher Feedback:* {notes}" if notes else ""
                    _send_tg_msg(
                        student_id,
                        f"📊 *Practice Month: Daily Mock Exam Score Logged*\n\n"
                        f"*Cohort:* {c_name}\n"
                        f"*Date:* {date_str}\n"
                        f"⭐️ *Overall Band: {record['overall']}*\n"
                        f"🎧 Listening: {listening} | 📖 Reading: {reading}\n"
                        f"✍️ Writing: {writing} | 🗣 Speaking: {speaking}\n"
                        f"{feedback_line}"
                    )
                except Exception:
                    pass

                self._send_json(200, {"success": True, "record": record})
                return

            # Endpoint: /api/student/mock-score (Individual Mock Tracker)
            if parsed_path == "/api/student/mock-score":
                user_row = self._get_target_user(payload)
                if not user_row:
                    self._send_json(404, {"error": "User not found."})
                    return

                title = payload.get("title", "IELTS Mock Exam")
                date_str = payload.get("date", datetime.now().strftime("%Y-%m-%d"))
                listening = float(payload.get("listening", 6.5))
                reading = float(payload.get("reading", 6.5))
                writing = float(payload.get("writing", 6.5))
                speaking = float(payload.get("speaking", 6.5))
                overall = payload.get("overall")
                notes = payload.get("notes", "")
                class_id = payload.get("class_id", "self")

                record = firebase.record_mock_score(
                    class_id=class_id,
                    student_id=user_row["user_id"],
                    teacher_id="self",
                    date_str=date_str,
                    listening=listening,
                    reading=reading,
                    writing=writing,
                    speaking=speaking,
                    notes=notes,
                    overall=overall,
                    title=title
                )
                self._send_json(200, {"success": True, "record": record})
                return

            # Endpoint: /api/student/mock-score/delete
            if parsed_path == "/api/student/mock-score/delete":
                user_row = self._get_target_user(payload)
                if not user_row:
                    self._send_json(404, {"error": "User not found."})
                    return

                mock_id = payload.get("mock_id")
                if not mock_id:
                    self._send_json(400, {"error": "mock_id is required."})
                    return

                firebase.delete_mock_score(mock_id, student_id=user_row["user_id"])
                self._send_json(200, {"success": True})
                return

            self._send_json(404, {"error": "Endpoint not found."})

        def log_message(self, *args):
            pass

    server = HTTPServer(("0.0.0.0", port), _Handler)
    print(f"[web/api] Server listening on 0.0.0.0:{port}")
    server.serve_forever()


# ══════════════════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════════════════

def main():
    # ── Bind port FIRST so Render's port-scan never times out ──────
    threading.Thread(target=_start_health_server, daemon=True).start()

    init_db()

    token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not token or token == "your_token_here":
        port = os.getenv("PORT", "10000")
        print("\n" + "=" * 60)
        print("💡 IELTS Preparation Web Platform & Backend Server is ACTIVE!")
        print(f"👉 Local Web Access: http://localhost:{port}")
        print("👉 Backend API:       http://localhost:{port}/api")
        print("⚠️ Notice: TELEGRAM_BOT_TOKEN is not configured or is a placeholder.")
        print("   Configure your live bot token in .env to activate the Telegram bot companion.")
        print("   The web companion remains 100% functional with Firebase Firestore synchronization.")
        print("=" * 60 + "\n")
        try:
            import time
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\nShutting down server gracefully...")
        return

    application = Application.builder().token(token).build()

    # ─ Callbacks (must be registered before ConversationHandlers)
    application.add_handler(CallbackQueryHandler(switch_model_callback, pattern="^switch_"))
    application.add_handler(CallbackQueryHandler(hw_toggle_callback, pattern="^hw_toggle_"))
    application.add_handler(CommandHandler("model", model_command))
    application.add_handler(CommandHandler("models", model_command))
    application.add_handler(MessageHandler(filters.Regex(r"^🤖 Choose Model"), model_command))
    application.add_handler(CommandHandler("help", help_command))
    application.add_handler(CommandHandler("settings", settings))
    application.add_handler(CommandHandler("tokens", token_usage))
    application.add_handler(CommandHandler("myinfo", myinfo_command))
    application.add_handler(CommandHandler("password", password_command))
    application.add_handler(CommandHandler("nickname", nickname_command))
    application.add_handler(CommandHandler("join", join_class_command))
    application.add_handler(CommandHandler("leaveclass", leave_class_command))
    application.add_handler(CommandHandler("phone", phone_command))
    application.add_handler(CommandHandler("devclean", devclean_command))
    application.add_handler(CommandHandler("clean", devclean_command))
    application.add_handler(CommandHandler("cleandb", devclean_command))

    # ─ Start / role selection + API key setup & Telegram Registration
    start_conv = ConversationHandler(
        entry_points=[
            CommandHandler("start", start),
            CommandHandler("setup", start),
            CommandHandler("register", register_start)
        ],
        states={
            REG_ROLE: [MessageHandler(filters.TEXT & ~filters.COMMAND, reg_role_step)],
            REG_PHONE: [
                MessageHandler(filters.CONTACT, reg_phone_step),
                MessageHandler(filters.TEXT & ~filters.COMMAND, reg_phone_step)
            ],
            REG_CHOOSE_NICK: [MessageHandler(filters.TEXT & ~filters.COMMAND, reg_choose_nick_step)],
            REG_CUSTOM_NICK: [MessageHandler(filters.TEXT & ~filters.COMMAND, reg_custom_nick_step)],
            REG_PASSWORD: [MessageHandler(filters.TEXT & ~filters.COMMAND, reg_password_step)],
            CHOOSE_ROLE: [MessageHandler(filters.TEXT & ~filters.COMMAND, choose_role)],
            ENTER_API_KEY: [MessageHandler(filters.TEXT & ~filters.COMMAND, enter_api_key)],
            SELECT_MODEL: [CallbackQueryHandler(select_model, pattern="^model_")],
            CONFIRM_SETUP: [MessageHandler(filters.TEXT & ~filters.COMMAND, confirm_setup)],
        },
        fallbacks=[
            CommandHandler("cancel", cancel),
            MessageHandler(filters.Regex(r"^(❌ Cancel|Cancel)$"), cancel)
        ],
        allow_reentry=True,
    )

    # ─ Log practice time
    time_conv = ConversationHandler(
        entry_points=[MessageHandler(filters.Regex("📝 Log Practice Time"), log_time_start)],
        states={
            SELECT_ACTIVITY: [MessageHandler(filters.TEXT & ~filters.COMMAND, select_activity)],
            ENTER_DURATION: [MessageHandler(filters.TEXT & ~filters.COMMAND, enter_duration)],
        },
        fallbacks=[CommandHandler("cancel", cancel)],
    )

    # ─ Write essay (student)
    essay_conv = ConversationHandler(
        entry_points=[MessageHandler(filters.Regex("✍️ Write Essay"), write_essay_start)],
        states={
            SELECT_TEACHER_ESSAY: [MessageHandler(filters.TEXT & ~filters.COMMAND, select_teacher_essay)],
            SELECT_TASK: [MessageHandler(filters.TEXT & ~filters.COMMAND, select_task)],
            WRITE_ESSAY: [MessageHandler(filters.TEXT & ~filters.COMMAND, write_essay)],
        },
        fallbacks=[CommandHandler("cancel", cancel)],
    )

    # ─ Teacher: My Classes / Create class
    classes_conv = ConversationHandler(
        entry_points=[MessageHandler(filters.Regex("🏫 My Classes"), my_classes)],
        states={
            ENTER_CLASS_NAME: [MessageHandler(filters.TEXT & ~filters.COMMAND, enter_class_name)],
        },
        fallbacks=[CommandHandler("cancel", cancel)],
        allow_reentry=True,
    )

    # ─ Teacher: Assign essay
    assign_essay_conv = ConversationHandler(
        entry_points=[MessageHandler(filters.Regex("✏️ Assign Essay"), assign_essay_start)],
        states={
            SELECT_CLASS_FOR_ESSAY: [MessageHandler(filters.TEXT & ~filters.COMMAND, assign_essay_select_class)],
            SELECT_ESSAY_TASK_TYPE: [MessageHandler(filters.TEXT & ~filters.COMMAND, assign_essay_task_type)],
            ENTER_ESSAY_PROMPT: [MessageHandler(filters.TEXT & ~filters.COMMAND, assign_essay_prompt)],
        },
        fallbacks=[CommandHandler("cancel", cancel)],
        allow_reentry=True,
    )

    # ─ Teacher: Give homework
    hw_conv = ConversationHandler(
        entry_points=[MessageHandler(filters.Regex("📋 Give Homework"), give_hw_start)],
        states={
            SELECT_CLASS_OR_STUDENT_HW: [MessageHandler(filters.TEXT & ~filters.COMMAND, give_hw_select_class)],
            SELECT_STUDENT_FOR_HW: [MessageHandler(filters.TEXT & ~filters.COMMAND, give_hw_select_student)],
            ENTER_HW_TITLE: [MessageHandler(filters.TEXT & ~filters.COMMAND, give_hw_title)],
            ENTER_HW_DESC: [MessageHandler(filters.TEXT & ~filters.COMMAND, give_hw_desc)],
            ENTER_HW_DEADLINE: [MessageHandler(filters.TEXT & ~filters.COMMAND, give_hw_deadline)],
        },
        fallbacks=[CommandHandler("cancel", cancel)],
        allow_reentry=True,
    )

    # ─ Teacher: Set goals
    goals_conv = ConversationHandler(
        entry_points=[MessageHandler(filters.Regex("🎯 Set Goals"), set_goals_start)],
        states={
            SELECT_CLASS_FOR_GOAL: [MessageHandler(filters.TEXT & ~filters.COMMAND, set_goals_class)],
            ENTER_LISTENING_GOAL: [MessageHandler(filters.TEXT & ~filters.COMMAND, set_goals_listening)],
            ENTER_READING_GOAL: [MessageHandler(filters.TEXT & ~filters.COMMAND, set_goals_reading)],
        },
        fallbacks=[CommandHandler("cancel", cancel)],
        allow_reentry=True,
    )

    # ─ Teacher: Student progress
    progress_conv = ConversationHandler(
        entry_points=[MessageHandler(filters.Regex("📊 Student Progress"), class_progress_start)],
        states={
            SELECT_CLASS_PROGRESS: [MessageHandler(filters.TEXT & ~filters.COMMAND, class_progress_select)],
            SELECT_STUDENT_PROGRESS: [MessageHandler(filters.TEXT & ~filters.COMMAND, student_progress_view)],
        },
        fallbacks=[CommandHandler("cancel", cancel)],
        allow_reentry=True,
    )

    # ─ Teacher: Send lesson
    broadcast_conv = ConversationHandler(
        entry_points=[MessageHandler(filters.Regex("📢 Send Lesson"), broadcast_start)],
        states={
            SELECT_CLASS_BROADCAST: [MessageHandler(filters.TEXT & ~filters.COMMAND, broadcast_class_select)],
            ENTER_LESSON_CONTENT: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, broadcast_content),
                MessageHandler(filters.Document.ALL, broadcast_content),
                MessageHandler(filters.PHOTO, broadcast_content),
                MessageHandler(filters.AUDIO, broadcast_content),
                MessageHandler(filters.VIDEO, broadcast_content),
            ],
        },
        fallbacks=[CommandHandler("cancel", cancel)],
        allow_reentry=True,
    )

    # ─ Teacher: Assess essays
    assess_conv = ConversationHandler(
        entry_points=[MessageHandler(filters.Regex("📝 Assess Essays"), assess_essays_start)],
        states={
            SELECT_CLASS_FOR_ASSESS: [MessageHandler(filters.TEXT & ~filters.COMMAND, assess_select_class)],
            SELECT_STUDENT_FOR_ASSESS: [MessageHandler(filters.TEXT & ~filters.COMMAND, assess_select_student)],
            SELECT_ESSAY_FOR_ASSESS: [MessageHandler(filters.TEXT & ~filters.COMMAND, assess_select_essay)],
            ENTER_MANUAL_SCORE: [MessageHandler(filters.TEXT & ~filters.COMMAND, assess_enter_score)],
            ENTER_MANUAL_FEEDBACK: [MessageHandler(filters.TEXT & ~filters.COMMAND, assess_enter_feedback)],
        },
        fallbacks=[CommandHandler("cancel", cancel)],
        allow_reentry=True,
    )

    # Register all handlers
    application.add_handler(start_conv)
    application.add_handler(time_conv)
    application.add_handler(essay_conv)
    application.add_handler(classes_conv)
    application.add_handler(assign_essay_conv)
    application.add_handler(hw_conv)
    application.add_handler(goals_conv)
    application.add_handler(progress_conv)
    application.add_handler(broadcast_conv)
    application.add_handler(assess_conv)
    application.add_handler(MessageHandler(filters.CONTACT, contact_handler))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

    print("IELTS Prep Bot starting - Teacher & Student System")
    print("DEV_MODE:", os.getenv("DEV_MODE", "false"))
    print("Press Ctrl+C to stop")
    # Health server thread (started above) owns $PORT — no conflict.
    # Bot uses long-polling which works perfectly on Render's free tier.
    application.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
