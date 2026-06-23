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
    "gemini-2.5-flash": {"name": "Gemini 2.5 Flash", "desc": "🧠 Newest thinking model — best quality, fast", "speed": "⚡⚡⚡", "quality": "⭐⭐⭐⭐⭐", "default": True},
    "gemini-2.0-flash": {"name": "Gemini 2.0 Flash", "desc": "⚡ Fast & reliable — great for quick assessments", "speed": "⚡⚡⚡⚡", "quality": "⭐⭐⭐⭐", "default": False},
    "gemini-2.5-pro": {"name": "Gemini 2.5 Pro", "desc": "🏆 Top-tier reasoning — slowest but smartest", "speed": "⚡⚡", "quality": "⭐⭐⭐⭐⭐", "default": False},
}

CHOOSE_ROLE, ENTER_API_KEY, SELECT_MODEL, CONFIRM_SETUP = range(4)
SELECT_ACTIVITY, ENTER_DURATION = range(4, 6)
SELECT_TASK, WRITE_ESSAY, SELECT_TEACHER_ESSAY = range(6, 9)
JOIN_CLASS_CODE = range(9, 10)

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
        ["📋 View History", "📈 Token Usage"],
        ["⚙️ Settings", "❓ Help"]
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
    if os.getenv("DEV_MODE", "false").lower() != "true":
        await update.message.reply_text("Dev mode is not enabled.")
        return
    firebase.clear_db()
    await update.message.reply_text("All database tables have been cleared. Send /start to begin fresh.", reply_markup=ReplyKeyboardRemove())

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    register_user(user)
    role = get_user_role(user.id)
    
    is_setup = update.message and update.message.text and update.message.text.startswith('/setup')
    
    if role == "unset":
        keyboard = [["👨‍🎓 I am a Student", "👨‍🏫 I am a Teacher"]]
        await update.message.reply_text(
            f"Welcome to IELTS Prep Bot, {user.first_name}! 🎯\n\n"
            "Please select your role. Note: This choice is permanent for your account.",
            reply_markup=ReplyKeyboardMarkup(keyboard, resize_keyboard=True, one_time_keyboard=True)
        )
        return CHOOSE_ROLE
        
    if role == "teacher":
        await update.message.reply_text("Welcome back, Teacher! 👨‍🏫\nChoose an option below:", reply_markup=get_teacher_keyboard())
        return ConversationHandler.END

    # Student logic
    api_key, model = get_user_config(user.id)
    if api_key and not is_setup:
        model_info = GEMINI_MODELS.get(model, GEMINI_MODELS[DEFAULT_MODEL])
        keyboard = []
        for model_id, info in GEMINI_MODELS.items():
            current = " ✅" if model_id == model else ""
            default_tag = " (default)" if info["default"] and model_id != model else ""
            keyboard.append([InlineKeyboardButton(f"{info['desc']}{current}{default_tag}", callback_data=f"switch_{model_id}")])
        
        await update.message.reply_text(
            f"Welcome back, {user.first_name}! 🎯\n\n🤖 Current model: {model_info['name']}\n⚡ Speed: {model_info['speed']} | ⭐ Quality: {model_info['quality']}\n\n🔄 Tap to switch model:",
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
        f"Welcome back, {query.from_user.first_name}! 🎯\n\n🤖 Current model: {model_info['name']}\n⚡ Speed: {model_info['speed']} | ⭐ Quality: {model_info['quality']}\n\n🔄 Tap to switch model:",
        reply_markup=InlineKeyboardMarkup(keyboard)
    )

async def settings(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    role = get_user_role(user.id)
    if role == "teacher":
        await update.message.reply_text("⚙️ Your Settings:\n\nRole: Teacher 👨‍🏫")
        return
    
    api_key, model = get_user_config(user.id)
    if api_key:
        model_info = GEMINI_MODELS.get(model, GEMINI_MODELS[DEFAULT_MODEL])
        masked_key = f"{api_key[:6]}...{api_key[-4:]}" if len(api_key) > 10 else "***"
        await update.message.reply_text(f"⚙️ Settings:\n🤖 Model: {model_info['name']}\n🔑 API Key: {masked_key}\nTo change, send /setup")
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
    role = get_user_role(user.id)
    if role != "student":
        await update.message.reply_text("Only students can join classes.")
        return
    if not context.args:
        await update.message.reply_text("Usage: /join CLASSCODE\nAsk your teacher for the join code.")
        return
    code = context.args[0].upper().strip()
    res = firebase.join_class(user.id, code)
    if res == "not_found":
        await update.message.reply_text(f"❌ No class found with code '{code}'. Check the code and try again.")
        return
    elif res == "already_in":
        await update.message.reply_text(f"✅ You are already in that class!")
        return
    elif res == "in_another":
        existing = get_student_class(user.id)
        await update.message.reply_text(f"⚠️ You are already in '{existing['name']}'. Use /leaveclass first.")
        return
    elif res == "success":
        cls = get_student_class(user.id)
        await update.message.reply_text(
            f"✅ Welcome to *{cls['name']}*! 🎉\n\n"
            "You'll now receive:\n"
            "• Daily essay assignments from your teacher\n"
            "• Homework reminders with deadlines\n"
            "• Lesson materials\n\n"
            "📌 Class ID: " + cls['join_code'] + "\n\n"
            "Check '✍️ Write Essay' for today's assignments!",
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
    model_info = GEMINI_MODELS.get(model, GEMINI_MODELS[DEFAULT_MODEL])
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
    feedback_text = format_feedback(assessment, task_type, word_count, model_info['name'], total_tokens)
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
    try:
        response = client.models.generate_content(
            model=model, contents=user_prompt,
            config=types.GenerateContentConfig(system_instruction=system_prompt, temperature=0.3, response_mime_type="application/json")
        )
        tok_in = response.usage_metadata.prompt_token_count if response.usage_metadata else 0
        tok_out = response.usage_metadata.candidates_token_count if response.usage_metadata else 0
        text = response.text
        start = text.find('{'); end = text.rfind('}') + 1
        if start != -1 and end != -1:
            return json.loads(text[start:end]), tok_in, tok_out
        cleaned = re.sub(r'```json\s*', '', text)
        cleaned = re.sub(r'```\s*', '', cleaned)
        start = cleaned.find('{'); end = cleaned.rfind('}') + 1
        if start != -1 and end != -1:
            return json.loads(cleaned[start:end]), tok_in, tok_out
        raise ValueError("Could not extract JSON from response")
    except Exception as e:
        return {
            "band_score": 0,
            "task_achievement": {"score": 0, "feedback": f"Assessment failed: {str(e)}"},
            "coherence_cohesion": {"score": 0, "feedback": ""},
            "lexical_resource": {"score": 0, "feedback": ""},
            "grammatical_range": {"score": 0, "feedback": ""},
            "strengths": [], "suggestions": ["Check your API key and try again."],
            "error": str(e)
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
    class_members = firebase.get_class_members(class_id)
    if not class_members:
        await update.message.reply_text("No students in this class.", reply_markup=get_teacher_keyboard())
        return ConversationHandler.END
    members = []
    for m in class_members:
        essays = firebase.get_student_essays(m["user_id"])
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
    context.user_data["as_student_id"] = student_id
    context.user_data["as_student_name"] = student_name
    essays = firebase.get_student_essays(student_id)[:10]
    if not essays:
        await update.message.reply_text(f"No essays found for {student_name}.", reply_markup=get_teacher_keyboard())
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
    text = update.message.text
    user_id = update.effective_user.id
    role = get_user_role(user_id)

    if role == "student":
        if "📊 My Progress" in text: return await progress(update, context)
        if "📋 View History" in text: return await history(update, context)
        if "📋 My Homework" in text: return await my_homework(update, context)
        if "📈 Token Usage" in text: return await token_usage(update, context)
        if "⚙️ Settings" in text: return await settings(update, context)
        if "❓ Help" in text: return await help_command(update, context)
    elif role == "teacher":
        if "🏫 My Classes" in text: return await my_classes(update, context)
        if "⚙️ Settings" in text: return await settings(update, context)
    return ConversationHandler.END


# ══════════════════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════════════════

def main():
    init_db()
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not token:
        print("Error: TELEGRAM_BOT_TOKEN not set in .env file")
        return

    application = Application.builder().token(token).build()

    # ─ Callbacks (must be registered before ConversationHandlers)
    application.add_handler(CallbackQueryHandler(switch_model_callback, pattern="^switch_"))
    application.add_handler(CallbackQueryHandler(hw_toggle_callback, pattern="^hw_toggle_"))
    application.add_handler(CommandHandler("help", help_command))
    application.add_handler(CommandHandler("settings", settings))
    application.add_handler(CommandHandler("tokens", token_usage))
    application.add_handler(CommandHandler("join", join_class_command))
    application.add_handler(CommandHandler("leaveclass", leave_class_command))
    application.add_handler(CommandHandler("devclean", devclean_command))

    # ─ Start / role selection + API key setup
    start_conv = ConversationHandler(
        entry_points=[CommandHandler("start", start), CommandHandler("setup", start)],
        states={
            CHOOSE_ROLE: [MessageHandler(filters.TEXT & ~filters.COMMAND, choose_role)],
            ENTER_API_KEY: [MessageHandler(filters.TEXT & ~filters.COMMAND, enter_api_key)],
            SELECT_MODEL: [CallbackQueryHandler(select_model, pattern="^model_")],
            CONFIRM_SETUP: [MessageHandler(filters.TEXT & ~filters.COMMAND, confirm_setup)],
        },
        fallbacks=[CommandHandler("cancel", cancel)],
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
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

    print("IELTS Prep Bot starting - Teacher & Student System")
    print("DEV_MODE:", os.getenv("DEV_MODE", "false"))
    print("Press Ctrl+C to stop")
    application.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
