#!/data/data/com.termux/files/usr/bin/bash
set -e

echo "=========================================================="
echo " IELTS Prep Platform: Termux Server Launcher"
echo "=========================================================="

# 1. Acquire wake lock so Android doesn't sleep or kill the process
termux-wake-lock

# 2. Terminate any previous local instances to prevent getUpdates polling conflict
pkill -9 -f "ielts_bot.py" 2>/dev/null || true
sleep 1

# 3. Check if core dependencies are installed
if ! python -c "import telegram, dotenv, firebase_admin, google.genai" 2>/dev/null; then
    echo "[*] Missing dependencies detected. Installing requirements..."
    pip install -r requirements.txt
else
    echo "[*] All Python dependencies verified."
fi

# 4. Display local IP address for phone/browser access
LOCAL_IP=$(ifconfig 2>/dev/null | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*' | grep -v '127.0.0.1' | head -n 1)
if [ -z "$LOCAL_IP" ]; then
    LOCAL_IP="192.168.0.103"
fi

echo "=========================================================="
echo " 🚀 Telegram Bot is STARTING"
echo " 🌐 Web Platform URL: http://$LOCAL_IP:10000"
echo "=========================================================="

python ielts_bot.py
