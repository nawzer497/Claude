#!/bin/bash
# Double-click this file to start the website on a Mac.
# It sets your admin password the first time, then opens the site.

cd "$(dirname "$0")" || exit 1

echo ""
echo "  The Madras Diaries"
echo "  ------------------"
echo ""

if ! command -v node >/dev/null 2>&1; then
  echo "  Node.js isn't installed yet — it's what runs the website."
  echo "  Opening nodejs.org. Download the LTS version, install it,"
  echo "  then double-click this file again."
  echo ""
  open "https://nodejs.org/" 2>/dev/null
  read -r -p "  Press return to close this window. "
  exit 1
fi

if [ ! -f content/.auth.json ]; then
  echo "  First time setup."
  echo "  Choose the password you'll use to sign in to the admin."
  echo "  At least 8 characters. Nothing is shown as you type."
  echo ""
  read -r -s -p "  Password: " ADMIN_PW
  echo ""
  if ! node server.js --set-password "$ADMIN_PW"; then
    echo ""
    read -r -p "  Couldn't set the password. Press return to close. "
    exit 1
  fi
  echo ""
fi

# Give the server a moment to bind, then open a browser at it.
( sleep 2; open "http://localhost:3000/" 2>/dev/null ) &

echo "  Starting. Your browser will open in a moment."
echo "  Leave this window open while you use the site."
echo "  To stop, close this window or press Control-C."
echo ""
node server.js
