#!/bin/bash

echo "🧪 TEST RAPIDE DES APIs - gob.vercel.app"
echo ""

echo "1️⃣ Test Status API..."
curl -s "https://gob.vercel.app/api/status" | head -5
echo ""
echo ""

echo "2️⃣ Test Gemini Key..."
curl -s "https://gob.vercel.app/api/gemini-key" | head -5
echo ""
echo ""

echo "3️⃣ Test Emma IA..."
curl -s -X POST "https://gob.vercel.app/api/gemini/chat" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Dis juste bonjour"}]}' | head -10
echo ""

