#!/data/data/com.termux/files/usr/bin/bash
set -e

echo "=========================================================="
echo " IELTS Prep Platform: Termux Server Launcher"
echo "=========================================================="

# 1. Acquire wake lock so Android doesn't sleep or kill the process
termux-wake-lock

# 2. Install Python & dependencies if not already installed
if ! command -v python &> /dev/null; then
    echo "[*] Installing Python and core packages..."
    pkg update -y
    pkg install -y python clang libffi openssl
fi

# 3. Install Python requirements
echo "[*] Verifying Python requirements..."
pip install --upgrade pip -q
pip install -r requirements.txt -q

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
