"""
IELTS Preparation Platform — Unified All-in-One Launcher
Runs both the Telegram Bot and the React Web Application concurrently
using a shared Firebase Firestore backend.
"""

import os
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

import time
import signal
import subprocess
import webbrowser
import threading
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
WEB_DIR = ROOT_DIR / "web"
DIST_DIR = WEB_DIR / "dist"

def ensure_frontend_build():
    """Ensure web/dist is built and up-to-date with latest changes in web/src."""
    index_file = DIST_DIR / "index.html"
    needs_build = not index_file.exists()
    
    if not needs_build:
        dist_mtime = index_file.stat().st_mtime
        src_dir = WEB_DIR / "src"
        if src_dir.exists():
            for f in src_dir.rglob("*"):
                if f.is_file() and f.stat().st_mtime > dist_mtime:
                    needs_build = True
                    break

    if needs_build:
        print("📦 Compiling latest React web application assets...")
        npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
        try:
            subprocess.run([npm_cmd, "run", "build"], cwd=str(WEB_DIR), check=True)
            print("✅ Web assets built successfully!")
        except Exception as e:
            print(f"⚠️ Notice: Could not build frontend automatically ({e}). Ensure Node.js & npm are installed.")

def open_browser(url, delay=1.5):
    """Open user's default browser after the server has initialized."""
    def _open():
        time.sleep(delay)
        print(f"\n🌐 Opening IELTS Platform in your default browser: {url}\n")
        try:
            webbrowser.open(url)
        except Exception:
            pass
    threading.Thread(target=_open, daemon=True).start()

def main():
    os.chdir(str(ROOT_DIR))
    sys.path.insert(0, str(ROOT_DIR))

    print("=" * 66)
    print("      IELTS Preparation Platform — Unified System Launcher        ")
    print("  Telegram Bot + React Web Suite + Shared Firebase Backend        ")
    print("=" * 66)

    # 1. Ensure frontend production bundle exists
    ensure_frontend_build()

    port = os.getenv("PORT", "10000")
    web_url = f"http://localhost:{port}"

    # 2. Schedule browser opening
    open_browser(web_url, delay=1.2)

    # 3. Check for --dev flag to optionally launch Vite alongside
    is_dev = "--dev" in sys.argv
    vite_proc = None

    if is_dev:
        npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
        print("⚡ Dev mode enabled: Launching Vite Dev Server on http://localhost:5173 ...")
        try:
            vite_proc = subprocess.Popen([npm_cmd, "run", "dev"], cwd=str(WEB_DIR))
        except Exception as e:
            print(f"⚠️ Could not start Vite dev server: {e}")

    # 4. Run ielts_bot.py which hosts both the Web Server & Telegram Bot
    try:
        from ielts_bot import main as start_bot_and_server
        start_bot_and_server()
    except KeyboardInterrupt:
        print("\n🛑 Shutting down IELTS Preparation Platform...")
    finally:
        if vite_proc:
            try:
                vite_proc.terminate()
            except Exception:
                pass

if __name__ == "__main__":
    main()
