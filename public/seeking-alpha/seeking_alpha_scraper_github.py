import os
import json
import time
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service

def setup_driver():
    chrome_options = Options()
    chrome_options.add_argument('--headless=new')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--disable-gpu')
    chrome_options.add_argument('--disable-software-rasterizer')
    chrome_options.add_argument('--disable-blink-features=AutomationControlled')
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    chrome_options.add_experimental_option('useAutomationExtension', False)
    chrome_options.add_argument('--remote-debugging-port=9222')
    
    service = Service('/usr/bin/chromedriver')
    driver = webdriver.Chrome(service=service, options=chrome_options)
    driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
    return driver

def extract_stock_data_simple(ticker):
    return {
        "ticker": ticker,
        "timestamp": datetime.now().isoformat(),
        "price": "DEMO",
        "change": "DEMO"
    }

def main():
    tickers = os.environ.get('TICKERS', 'AAPL').split(',')
    print(f"Mode demo - Tickers: {', '.join(tickers)}")
    
    results = [extract_stock_data_simple(t.strip()) for t in tickers]
    
    with open('stock_analysis.json', 'w') as f:
        json.dump({"last_update": datetime.now().isoformat(), "stocks": results}, f, indent=2)
    
    backup_file = f"backup/stock_analysis_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(backup_file, 'w') as f:
        json.dump({"last_update": datetime.now().isoformat(), "stocks": results}, f, indent=2)
    
    print(f"Fichiers crees - {len(results)} tickers")

if __name__ == "__main__":
    main()
