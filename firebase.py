import os
import json
import random
import string
from datetime import datetime, date, timedelta, timezone
from dotenv import load_dotenv

import firebase_admin
from firebase_admin import credentials, firestore

load_dotenv()

db = None

def init_db():
    global db
    if firebase_admin._apps:
        # Already initialized
        db = firestore.client()
        return
        
    # Find credentials
    cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH", "serviceAccountKey.json")
    if not os.path.exists(cred_path):
        # Fallback to check other common names in root
        for name in ["credentials.json", "firebase-key.json"]:
            if os.path.exists(name):
                cred_path = name
                break
                
    if os.path.exists(cred_path):
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        print(f"[Firebase] Initialized with credentials from: {cred_path}")
    else:
        # Try default credentials or throw friendly warning
        try:
            firebase_admin.initialize_app()
            print("[Firebase] Initialized with Application Default Credentials.")
        except Exception as e:
            print("[Firebase] ERROR: Could not find firebase serviceAccountKey.json.")
            print("[Firebase] Please place your serviceAccountKey.json file in the root directory")
            print("[Firebase] or set FIREBASE_CREDENTIALS_PATH in your .env file.")
            raise e
            
    db = firestore.client()

# Initialize on import so connection is ready
try:
    init_db()
except Exception:
    pass

# Helper to convert timestamps/dates to SQLite-compatible YYYY-MM-DD HH:MM:SS strings
def to_str(val):
    if val is None:
        return None
    if hasattr(val, "strftime"):
        return val.strftime("%Y-%m-%d %H:%M:%S")
    if hasattr(val, "to_datetime"):
        return val.to_datetime().strftime("%Y-%m-%d %H:%M:%S")
    return str(val)

# Dict wrapper to act like sqlite3.Row (allowing both row["key"] and row.keys())
class FirestoreRow(dict):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
    def keys(self):
        return super().keys()

# Atomic Sequential ID Generator using a transaction
def get_next_id(collection_name):
    if not db:
        raise RuntimeError("Firestore is not initialized.")
    counter_ref = db.collection("counters").document(collection_name)
    
    @firestore.transactional
    def update_in_transaction(transaction):
        snapshot = counter_ref.get(transaction=transaction)
        if snapshot.exists:
            current = snapshot.get("current_id") or 0
            new_id = current + 1
            transaction.update(counter_ref, {"current_id": new_id})
            return new_id
        else:
            transaction.set(counter_ref, {"current_id": 1})
            return 1
            
    transaction = db.transaction()
    return update_in_transaction(transaction)

# ---------------------------------------------------------
# DEV CLEAN / DATABASE ADMIN
# ---------------------------------------------------------
def clear_db():
    if not db:
        return
    collections = [
        "users", "time_logs", "writing_submissions", "token_usage",
        "classes", "class_members", "teacher_essays", "homework",
        "homework_status", "lesson_broadcasts", "counters"
    ]
    for coll_name in collections:
        coll_ref = db.collection(coll_name)
        docs = coll_ref.list_documents()
        batch = db.batch()
        deleted = 0
        for doc in docs:
            batch.delete(doc)
            deleted += 1
            if deleted >= 400: # Firestore batch limit is 500
                batch.commit()
                batch = db.batch()
                deleted = 0
        if deleted > 0:
            batch.commit()
    print("[Firebase] All collections have been cleared.")

# ---------------------------------------------------------
# USER OPERATIONS
# ---------------------------------------------------------
def register_user(user):
    if not db: return
    user_ref = db.collection("users").document(str(user.id))
    doc = user_ref.get()
    if not doc.exists:
        user_ref.set({
            "user_id": user.id,
            "username": user.username,
            "first_name": user.first_name,
            "role": "unset",
            "api_key": None,
            "model": "gemini-2.0-flash",
            "created_at": firestore.SERVER_TIMESTAMP
        })

def set_user_role(user_id, role):
    if not db: return
    db.collection("users").document(str(user_id)).update({"role": role})

def get_user_role(user_id):
    if not db: return "unset"
    doc = db.collection("users").document(str(user_id)).get()
    if doc.exists:
        return doc.get("role") or "unset"
    return "unset"

def get_user_config(user_id):
    if not db: return None, None
    doc = db.collection("users").document(str(user_id)).get()
    if doc.exists:
        data = doc.to_dict()
        api_key = data.get("api_key")
        model = data.get("model") or "gemini-2.5-flash"
        if api_key:
            return api_key, model
    return None, None

def update_user_config(user_id, api_key, model_id):
    if not db: return
    db.collection("users").document(str(user_id)).update({
        "api_key": api_key,
        "model": model_id
    })

def update_user_model(user_id, model_id):
    if not db: return
    db.collection("users").document(str(user_id)).update({
        "model": model_id
    })

# ---------------------------------------------------------
# CLASSES & ENROLLMENT
# ---------------------------------------------------------
def get_student_class(user_id):
    if not db: return None
    member_doc = db.collection("class_members").document(str(user_id)).get()
    if member_doc.exists:
        class_id = member_doc.get("class_id")
        class_doc = db.collection("classes").document(str(class_id)).get()
        if class_doc.exists:
            d = class_doc.to_dict()
            return FirestoreRow(d)
    return None

def join_class(user_id, code):
    if not db: return "error"
    # Find class by code
    docs = db.collection("classes").where("join_code", "==", code.upper()).limit(1).stream()
    cls = None
    for doc in docs:
        cls = doc.to_dict()
        break
    if not cls:
        return "not_found"
        
    class_id = cls["id"]
    existing = get_student_class(user_id)
    if existing:
        if existing["id"] == class_id:
            return "already_in"
        else:
            return "in_another"
            
    db.collection("class_members").document(str(user_id)).set({
        "class_id": class_id,
        "user_id": user_id,
        "joined_at": firestore.SERVER_TIMESTAMP
    })
    return "success"

def leave_class(user_id):
    if not db: return False
    doc_ref = db.collection("class_members").document(str(user_id))
    if doc_ref.get().exists:
        doc_ref.delete()
        return True
    return False

def get_teacher_classes(teacher_id):
    if not db: return []
    docs = db.collection("classes").where("teacher_id", "==", teacher_id).stream()
    classes = []
    for doc in docs:
        d = doc.to_dict()
        d["created_at"] = to_str(d.get("created_at"))
        classes.append(FirestoreRow(d))
    # Sort by created_at desc (in python to avoid index requirement warning on fresh db)
    classes.sort(key=lambda x: x.get("created_at") or "", reverse=True)
    return classes

def get_class_student_count(class_id):
    if not db: return 0
    docs = db.collection("class_members").where("class_id", "==", class_id).stream()
    return sum(1 for _ in docs)

def create_class(teacher_id, name):
    if not db: return None, None
    class_id = get_next_id("classes")
    
    # Generate unique join code
    code_chars = string.ascii_uppercase + string.digits
    while True:
        code = "".join(random.choices(code_chars, k=6))
        # Ensure unique
        existing = db.collection("classes").where("join_code", "==", code).limit(1).get()
        if not existing:
            break
            
    db.collection("classes").document(str(class_id)).set({
        "id": class_id,
        "teacher_id": teacher_id,
        "name": name,
        "join_code": code,
        "listening_goal_min": 0,
        "reading_goal_min": 0,
        "created_at": firestore.SERVER_TIMESTAMP
    })
    return class_id, code

def get_class_members(class_id):
    if not db: return []
    member_docs = db.collection("class_members").where("class_id", "==", class_id).stream()
    members = []
    for doc in member_docs:
        uid = doc.get("user_id")
        user_doc = db.collection("users").document(str(uid)).get()
        if user_doc.exists:
            d = user_doc.to_dict()
            members.append(FirestoreRow(d))
    members.sort(key=lambda x: x.get("first_name") or "")
    return members

def update_class_goals(class_id, listening_goal, reading_goal):
    if not db: return
    db.collection("classes").document(str(class_id)).update({
        "listening_goal_min": listening_goal,
        "reading_goal_min": reading_goal
    })

# ---------------------------------------------------------
# TOKEN USAGE
# ---------------------------------------------------------
def track_token_usage(user_id: int, tokens_in: int, tokens_out: int, request_type: str = "assessment"):
    if not db: return
    total = tokens_in + tokens_out
    db.collection("token_usage").document().set({
        "user_id": user_id,
        "tokens_in": tokens_in,
        "tokens_out": tokens_out,
        "total_tokens": total,
        "request_type": request_type,
        "used_at": firestore.SERVER_TIMESTAMP
    })

def get_token_usage(user_id: int) -> dict:
    if not db:
        return {"total_in": 0, "total_out": 0, "total_tokens": 0, "month_tokens": 0, "week_tokens": 0, "today_tokens": 0, "total_calls": 0, "recent": []}
    
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = now - timedelta(days=7)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    docs = db.collection("token_usage").where("user_id", "==", user_id).stream()
    
    total_in = 0
    total_out = 0
    total_tokens = 0
    today_tokens = 0
    week_tokens = 0
    month_tokens = 0
    total_calls = 0
    recent_runs = []
    
    for doc in docs:
        d = doc.to_dict()
        total_calls += 1
        t_in = d.get("tokens_in", 0)
        t_out = d.get("tokens_out", 0)
        tot = d.get("total_tokens", 0)
        
        total_in += t_in
        total_out += t_out
        total_tokens += tot
        
        used_at = d.get("used_at")
        if used_at:
            if hasattr(used_at, "to_datetime"):
                used_at = used_at.to_datetime()
            if not used_at.tzinfo:
                used_at = used_at.replace(tzinfo=timezone.utc)
                
            if used_at >= today_start:
                today_tokens += tot
            if used_at >= week_start:
                week_tokens += tot
            if used_at >= month_start:
                month_tokens += tot
                
            recent_runs.append({
                "tokens": tot,
                "type": d.get("request_type", "assessment"),
                "time": used_at
            })
            
    recent_runs.sort(key=lambda x: x["time"] or datetime.min.replace(tzinfo=timezone.utc), reverse=True)
    
    recent_formatted = []
    for r in recent_runs[:5]:
        recent_formatted.append({
            "tokens": r["tokens"],
            "type": r["type"],
            "time": to_str(r["time"])
        })
        
    return {
        "total_in": total_in, "total_out": total_out,
        "total_tokens": total_tokens, "month_tokens": month_tokens,
        "week_tokens": week_tokens, "today_tokens": today_tokens,
        "total_calls": total_calls,
        "recent": recent_formatted
    }

# ---------------------------------------------------------
# PRACTICE TIME LOGS & PROGRESS
# ---------------------------------------------------------
def log_practice_time(user_id, activity, minutes):
    if not db: return
    db.collection("time_logs").document().set({
        "user_id": user_id,
        "activity": activity,
        "duration_minutes": minutes,
        "logged_at": firestore.SERVER_TIMESTAMP
    })

def get_user_progress_data(user_id, class_id=None):
    if not db:
        return {"time_stats": {}, "weekly_stats": {}, "total_essays": 0, "avg_score": 0.0, "best_score": 0.0, "recent_scores": [], "hw_data": []}
        
    now = datetime.now(timezone.utc)
    week_start = now - timedelta(days=7)
    
    # 1. Fetch time logs
    time_docs = db.collection("time_logs").where("user_id", "==", user_id).stream()
    time_stats = {}
    weekly_stats = {}
    for doc in time_docs:
        d = doc.to_dict()
        act = d.get("activity")
        duration = d.get("duration_minutes", 0)
        logged_at = d.get("logged_at")
        
        if act:
            time_stats[act] = time_stats.get(act, 0) + duration
            if logged_at:
                if hasattr(logged_at, "to_datetime"):
                    logged_at = logged_at.to_datetime()
                if not logged_at.tzinfo:
                    logged_at = logged_at.replace(tzinfo=timezone.utc)
                if logged_at >= week_start:
                    weekly_stats[act] = weekly_stats.get(act, 0) + duration
                    
    # 2. Fetch submissions
    essay_docs = db.collection("writing_submissions").where("user_id", "==", user_id).stream()
    total_essays = 0
    scores = []
    recent = []
    
    for doc in essay_docs:
        d = doc.to_dict()
        total_essays += 1
        score = d.get("band_score")
        m_score = d.get("manual_score")
        submitted_at = d.get("submitted_at")
        
        if score is not None:
            scores.append(score)
            recent.append({
                "id": d.get("id"),
                "task_type": d.get("task_type"),
                "band_score": score,
                "manual_score": m_score,
                "submitted_at": submitted_at
            })
            
    recent.sort(key=lambda x: x["submitted_at"] or datetime.min.replace(tzinfo=timezone.utc), reverse=True)
    avg_score = sum(scores) / len(scores) if scores else None
    best_score = max(scores) if scores else None
    
    recent_formatted = []
    for r in recent:
        r_copy = r.copy()
        r_copy["submitted_at"] = to_str(r["submitted_at"])
        recent_formatted.append(FirestoreRow(r_copy))
        
    # 3. Fetch homework for progress screen if class_id provided
    hw_list = []
    if class_id:
        hw_docs = db.collection("homework").stream()
        for doc in hw_docs:
            d = doc.to_dict()
            # check scope
            if d.get("class_id") == class_id or d.get("student_id") == user_id:
                hw_id = d["id"]
                # get status
                status_doc = db.collection("homework_status").document(f"{hw_id}_{user_id}").get()
                status = status_doc.get("status") if status_doc.exists else "pending"
                hw_list.append(FirestoreRow({
                    "title": d.get("title"),
                    "deadline": to_str(d.get("deadline")),
                    "hw_status": status
                }))
        # Sort by deadline
        hw_list.sort(key=lambda x: x.get("deadline") or "")
        
    return {
        "time_stats": time_stats,
        "weekly_stats": weekly_stats,
        "total_essays": total_essays,
        "avg_score": avg_score,
        "best_score": best_score,
        "recent_scores": recent_formatted,
        "hw_data": hw_list
    }

# ---------------------------------------------------------
# WRITING ESSAYS & EVALUATIONS
# ---------------------------------------------------------
def get_today_essays(class_id, today_str):
    if not db: return []
    docs = db.collection("teacher_essays").where("class_id", "==", class_id).where("assigned_date", "==", today_str).stream()
    essays = []
    for doc in docs:
        d = doc.to_dict()
        essays.append(FirestoreRow(d))
    return essays

def add_teacher_essay(class_id, teacher_id, task_type, prompt, today_str):
    if not db: return []
    essay_id = get_next_id("teacher_essays")
    db.collection("teacher_essays").document(str(essay_id)).set({
        "id": essay_id,
        "class_id": class_id,
        "teacher_id": teacher_id,
        "task_type": task_type,
        "prompt": prompt,
        "assigned_date": today_str,
        "created_at": firestore.SERVER_TIMESTAMP
    })
    # Get all class members to return
    members = db.collection("class_members").where("class_id", "==", class_id).stream()
    return [m.get("user_id") for m in members]

def save_essay_submission(user_id, task_type, prompt, essay, band_score, feedback, tokens_used):
    if not db: return
    essay_id = get_next_id("writing_submissions")
    db.collection("writing_submissions").document(str(essay_id)).set({
        "id": essay_id,
        "user_id": user_id,
        "task_type": task_type,
        "prompt": prompt,
        "essay": essay,
        "band_score": band_score,
        "feedback": feedback, # JSON string
        "manual_score": None,
        "manual_feedback": None,
        "tokens_used": tokens_used,
        "submitted_at": firestore.SERVER_TIMESTAMP
    })

def get_student_essays(student_id):
    if not db: return []
    docs = db.collection("writing_submissions").where("user_id", "==", student_id).stream()
    essays = []
    for doc in docs:
        d = doc.to_dict()
        d["submitted_at"] = to_str(d.get("submitted_at"))
        essays.append(FirestoreRow(d))
    essays.sort(key=lambda x: x.get("submitted_at") or "", reverse=True)
    return essays

def get_essay_by_id(essay_id):
    if not db: return None
    doc = db.collection("writing_submissions").document(str(essay_id)).get()
    if doc.exists:
        d = doc.to_dict()
        d["submitted_at"] = to_str(d.get("submitted_at"))
        return FirestoreRow(d)
    return None

def save_manual_assessment(essay_id, manual_score, manual_feedback):
    if not db: return
    db.collection("writing_submissions").document(str(essay_id)).update({
        "manual_score": manual_score,
        "manual_feedback": manual_feedback
    })

# ---------------------------------------------------------
# HOMEWORK OPERATIONS
# ---------------------------------------------------------
def get_student_homework(user_id, class_id=None):
    if not db: return []
    docs = db.collection("homework").stream()
    homework_list = []
    for doc in docs:
        d = doc.to_dict()
        if (class_id and d.get("class_id") == class_id) or d.get("student_id") == user_id:
            hw_id = d["id"]
            # get status
            status_doc = db.collection("homework_status").document(f"{hw_id}_{user_id}").get()
            status = status_doc.get("status") if status_doc.exists else "pending"
            
            d_formatted = d.copy()
            d_formatted["hw_status"] = status
            d_formatted["deadline"] = to_str(d.get("deadline"))
            homework_list.append(FirestoreRow(d_formatted))
            
    homework_list.sort(key=lambda x: x.get("deadline") or "")
    return homework_list

def add_homework(class_id, student_id, teacher_id, title, description, deadline_str):
    if not db: return 0, []
    hw_id = get_next_id("homework")
    
    # Store deadline as datetime or string
    # Parse deadline_str (format YYYY-MM-DD HH:MM:SS)
    try:
        deadline_dt = datetime.strptime(deadline_str, "%Y-%m-%d %H:%M:%S")
    except ValueError:
        deadline_dt = deadline_str
        
    db.collection("homework").document(str(hw_id)).set({
        "id": hw_id,
        "class_id": class_id,
        "student_id": student_id,
        "teacher_id": teacher_id,
        "title": title,
        "description": description,
        "deadline": deadline_dt,
        "created_at": firestore.SERVER_TIMESTAMP
    })
    
    recipients = []
    if student_id:
        recipients = [student_id]
        db.collection("homework_status").document(f"{hw_id}_{student_id}").set({
            "homework_id": hw_id,
            "student_id": student_id,
            "status": "pending",
            "updated_at": firestore.SERVER_TIMESTAMP
        })
    else:
        members = db.collection("class_members").where("class_id", "==", class_id).stream()
        recipients = [m.get("user_id") for m in members]
        for uid in recipients:
            db.collection("homework_status").document(f"{hw_id}_{uid}").set({
                "homework_id": hw_id,
                "student_id": uid,
                "status": "pending",
                "updated_at": firestore.SERVER_TIMESTAMP
            })
            
    return hw_id, recipients

def get_homework_status(hw_id, student_id):
    if not db: return "pending"
    doc = db.collection("homework_status").document(f"{hw_id}_{student_id}").get()
    if doc.exists:
        return doc.get("status") or "pending"
    return "pending"

def update_homework_status(hw_id, student_id, status=None):
    if not db: return "pending"
    doc_ref = db.collection("homework_status").document(f"{hw_id}_{student_id}")
    doc = doc_ref.get()
    
    new_status = status
    if not new_status:
        # Toggle behavior
        current = doc.get("status") if doc.exists else "pending"
        new_status = "done" if current == "pending" else "pending"
        
    doc_ref.set({
        "homework_id": hw_id,
        "student_id": student_id,
        "status": new_status,
        "updated_at": firestore.SERVER_TIMESTAMP
    })
    return new_status

# ---------------------------------------------------------
# BROADCASTS
# ---------------------------------------------------------
def save_broadcast_lesson(class_id, teacher_id, message_text, file_id, file_type):
    if not db: return []
    broadcast_id = get_next_id("lesson_broadcasts")
    db.collection("lesson_broadcasts").document(str(broadcast_id)).set({
        "id": broadcast_id,
        "class_id": class_id,
        "teacher_id": teacher_id,
        "message_text": message_text,
        "file_id": file_id,
        "file_type": file_type,
        "sent_at": firestore.SERVER_TIMESTAMP
    })
    members = db.collection("class_members").where("class_id", "==", class_id).stream()
    return [m.get("user_id") for m in members]
