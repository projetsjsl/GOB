#!/usr/bin/env python3
"""
Test des APIs GOB - Diagnostic rapide des endpoints critiques
Usage: python test-apis-diagnostic.py [options]

Options:
    --all       Test all APIs (default)
    --fmp       Test FMP only
    --perplexity Test Perplexity only
    --finnhub   Test Finnhub only
    --gemini    Test Gemini only
    --alpha     Test Alpha Vantage only
    --verbose   Show detailed output
"""

import requests
import os
import json
import sys
import argparse
from datetime import datetime, timedelta
from pathlib import Path

# Couleurs pour terminal
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

# Load .env file if it exists
def load_env():
    """Load environment variables from .env file"""
    env_path = Path(__file__).parent / '.env'
    if env_path.exists():
        print(f"{BLUE}ℹ️  Loading environment from .env file{RESET}")
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key.strip()] = value.strip().strip('"').strip("'")

load_env()

def test_fmp():
    """Test FMP API - Quote endpoint (le plus utilisé)"""
    print("\n🔍 Testing FMP API...")
    k = os.environ.get("FMP_API_KEY")

    if not k:
        print(f"{RED}❌ FMP_API_KEY not found{RESET}")
        return False

    try:
        # Test 1: Quote endpoint (utilisé dans fmp.js)
        r = requests.get(
            "https://financialmodelingprep.com/api/v3/quote/AAPL",
            params={"apikey": k},
            timeout=15
        )

        if r.status_code == 200:
            print(f"{GREEN}✅ FMP Quote OK{RESET}")
            print(f"   Response: {r.text[:100]}")
            return True
        elif r.status_code == 402:
            print(f"{YELLOW}⚠️  FMP 402: Endpoint restricted (upgrade needed){RESET}")
            print(f"   {r.text[:120]}")
            return False
        else:
            print(f"{RED}❌ FMP Error {r.status_code}{RESET}")
            print(f"   {r.text[:120]}")
            return False

    except Exception as e:
        print(f"{RED}❌ FMP Exception: {e}{RESET}")
        return False

def test_perplexity():
    """Test Perplexity API - Modèles utilisés dans ai-services.js"""
    print("\n🔍 Testing Perplexity API...")
    p = os.environ.get("PERPLEXITY_API_KEY")

    if not p:
        print(f"{RED}❌ PERPLEXITY_API_KEY not found{RESET}")
        return False

    # Test avec les modèles configurés dans ai-services.js
    models_to_test = [
        "sonar-reasoning-pro",  # Primary
        "sonar-pro",            # Backup2
        "sonar"                 # Backup3
    ]

    for model in models_to_test:
        try:
            r = requests.post(
                "https://api.perplexity.ai/chat/completions",
                headers={
                    "Authorization": f"Bearer {p}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": model,
                    "messages": [{"role": "user", "content": "Test"}],
                    "max_tokens": 100
                },
                timeout=30
            )

            if r.status_code == 200:
                print(f"{GREEN}✅ Perplexity {model} OK{RESET}")
                data = r.json()
                print(f"   Tokens: {data.get('usage', {}).get('total_tokens', 'N/A')}")
                return True
            elif r.status_code == 401:
                print(f"{RED}❌ Perplexity 401: Invalid API key{RESET}")
                return False
            elif r.status_code == 429:
                print(f"{YELLOW}⚠️  Perplexity 429: Rate limit, trying next model...{RESET}")
                continue
            else:
                print(f"{RED}❌ Perplexity Error {r.status_code} with {model}{RESET}")
                print(f"   {r.text[:120]}")
                continue

        except Exception as e:
            print(f"{RED}❌ Perplexity Exception with {model}: {e}{RESET}")
            continue

    return False

def test_finnhub():
    """Test Finnhub API - Endpoints implémentés dans finnhub.js"""
    print("\n🔍 Testing Finnhub API...")
    f = os.environ.get("FINNHUB_API_KEY")

    if not f:
        print(f"{RED}❌ FINNHUB_API_KEY not found{RESET}")
        return False

    try:
        # Test 1: Quote (endpoint le plus critique)
        r = requests.get(
            "https://finnhub.io/api/v1/quote",
            params={"symbol": "AAPL", "token": f},
            timeout=15
        )

        if r.status_code == 200:
            print(f"{GREEN}✅ Finnhub Quote OK{RESET}")
            print(f"   Response: {r.text[:100]}")
        elif r.status_code == 401:
            print(f"{RED}❌ Finnhub 401: Invalid API key{RESET}")
            return False
        elif r.status_code == 429:
            print(f"{YELLOW}⚠️  Finnhub 429: Rate limit exceeded{RESET}")
            return False
        else:
            print(f"{RED}❌ Finnhub Error {r.status_code}{RESET}")
            print(f"   {r.text[:120]}")
            return False

        # Test 2: Company news (comme dans votre script original)
        to_date = datetime.now().strftime("%Y-%m-%d")
        from_date = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")

        r = requests.get(
            "https://finnhub.io/api/v1/company-news",
            params={
                "symbol": "AAPL",
                "from": from_date,
                "to": to_date,
                "token": f
            },
            timeout=15
        )

        if r.status_code == 200:
            print(f"{GREEN}✅ Finnhub Company News OK{RESET}")
            news_count = len(r.json()) if r.json() else 0
            print(f"   News found: {news_count}")
            return True
        else:
            print(f"{YELLOW}⚠️  Finnhub News Error {r.status_code}{RESET}")
            return False

    except Exception as e:
        print(f"{RED}❌ Finnhub Exception: {e}{RESET}")
        return False

def test_gemini(verbose=False):
    """Test Google Gemini API - Used for Emma AI"""
    print("\n🔍 Testing Gemini API...")
    k = os.environ.get("GEMINI_API_KEY")

    if not k:
        print(f"{RED}❌ GEMINI_API_KEY not found{RESET}")
        return False

    try:
        r = requests.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key={k}",
            headers={"Content-Type": "application/json"},
            json={
                "contents": [{
                    "parts": [{"text": "Say 'OK' if you're working"}]
                }]
            },
            timeout=30
        )

        if r.status_code == 200:
            print(f"{GREEN}✅ Gemini API OK{RESET}")
            if verbose:
                data = r.json()
                print(f"   Response: {data.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', 'N/A')[:50]}")
            return True
        elif r.status_code == 400:
            print(f"{RED}❌ Gemini 400: Invalid API key or request{RESET}")
            if verbose:
                print(f"   {r.text[:120]}")
            return False
        else:
            print(f"{RED}❌ Gemini Error {r.status_code}{RESET}")
            if verbose:
                print(f"   {r.text[:120]}")
            return False

    except Exception as e:
        print(f"{RED}❌ Gemini Exception: {e}{RESET}")
        return False

def test_alpha_vantage(verbose=False):
    """Test Alpha Vantage API - Fallback for market data"""
    print("\n🔍 Testing Alpha Vantage API...")
    k = os.environ.get("ALPHA_VANTAGE_API_KEY")

    if not k:
        print(f"{RED}❌ ALPHA_VANTAGE_API_KEY not found{RESET}")
        return False

    try:
        r = requests.get(
            "https://www.alphavantage.co/query",
            params={
                "function": "GLOBAL_QUOTE",
                "symbol": "AAPL",
                "apikey": k
            },
            timeout=15
        )

        if r.status_code == 200:
            data = r.json()
            if "Global Quote" in data and data["Global Quote"]:
                print(f"{GREEN}✅ Alpha Vantage OK{RESET}")
                if verbose:
                    print(f"   Price: {data['Global Quote'].get('05. price', 'N/A')}")
                return True
            elif "Note" in data:
                print(f"{YELLOW}⚠️  Alpha Vantage: Rate limit exceeded{RESET}")
                if verbose:
                    print(f"   {data['Note'][:120]}")
                return False
            else:
                print(f"{RED}❌ Alpha Vantage: Unexpected response{RESET}")
                if verbose:
                    print(f"   {r.text[:120]}")
                return False
        else:
            print(f"{RED}❌ Alpha Vantage Error {r.status_code}{RESET}")
            if verbose:
                print(f"   {r.text[:120]}")
            return False

    except Exception as e:
        print(f"{RED}❌ Alpha Vantage Exception: {e}{RESET}")
        return False

def main():
    """Run all API tests"""
    parser = argparse.ArgumentParser(description='GOB API Diagnostic Tool')
    parser.add_argument('--all', action='store_true', default=True, help='Test all APIs (default)')
    parser.add_argument('--fmp', action='store_true', help='Test FMP only')
    parser.add_argument('--perplexity', action='store_true', help='Test Perplexity only')
    parser.add_argument('--finnhub', action='store_true', help='Test Finnhub only')
    parser.add_argument('--gemini', action='store_true', help='Test Gemini only')
    parser.add_argument('--alpha', action='store_true', help='Test Alpha Vantage only')
    parser.add_argument('--verbose', '-v', action='store_true', help='Show detailed output')

    args = parser.parse_args()

    # If any specific API is selected, disable --all
    if args.fmp or args.perplexity or args.finnhub or args.gemini or args.alpha:
        args.all = False

    print("=" * 60)
    print("🧪 GOB API Diagnostic Tool")
    print("=" * 60)

    results = {}

    if args.all or args.fmp:
        results["FMP"] = test_fmp()

    if args.all or args.perplexity:
        results["Perplexity"] = test_perplexity()

    if args.all or args.finnhub:
        results["Finnhub"] = test_finnhub()

    if args.all or args.gemini:
        results["Gemini"] = test_gemini(args.verbose)

    if args.all or args.alpha:
        results["Alpha Vantage"] = test_alpha_vantage(args.verbose)

    print("\n" + "=" * 60)
    print("📊 RESULTS SUMMARY")
    print("=" * 60)

    for api, status in results.items():
        status_icon = f"{GREEN}✅" if status else f"{RED}❌"
        print(f"{status_icon} {api}: {'OK' if status else 'FAILED'}{RESET}")

    all_pass = all(results.values())
    print("\n" + "=" * 60)
    if all_pass:
        print(f"{GREEN}🎉 All tested APIs operational!{RESET}")
    else:
        print(f"{RED}⚠️  Some APIs failed - check logs above{RESET}")
        print(f"\n{YELLOW}💡 Tip: Use --verbose for more details{RESET}")
    print("=" * 60)

    return all_pass

if __name__ == "__main__":
    import sys
    success = main()
    sys.exit(0 if success else 1)
