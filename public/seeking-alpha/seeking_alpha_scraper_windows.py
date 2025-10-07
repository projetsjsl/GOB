import os, json, time
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

def login(driver, email, password):
    driver.get("https://seekingalpha.com/login")
    time.sleep(5)
    WebDriverWait(driver, 15).until(EC.presence_of_element_located((By.ID, "email"))).send_keys(email)
    driver.find_element(By.ID, "password").send_keys(password)
    driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
    time.sleep(8)
    return True

def extract(driver, ticker):
    print(f"Extraction {ticker}...")
    driver.get(f"https://seekingalpha.com/symbol/{ticker}/virtual_analyst_report")
    time.sleep(8)
    return {"ticker": ticker, "timestamp": datetime.now().isoformat(), "raw_text": driver.find_element(By.TAG_NAME, "body").text[:5000]}

options = webdriver.ChromeOptions()
driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)

try:
    if login(driver, 'info@michelvilla.com', 'Mickey69'):
        results = [extract(driver, t) for t in ['AAPL', 'JNJ']]
        with open('stock_analysis.json', 'w') as f:
            json.dump({"last_update": datetime.now().isoformat(), "stocks": results}, f, indent=2)
        
        backup_file = f"backup/stock_analysis_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(backup_file, 'w') as f:
            json.dump({"last_update": datetime.now().isoformat(), "stocks": results}, f, indent=2)
        
        # Git push
        os.system('git add stock_analysis.json backup/')
        os.system('git commit -m "Update data"')
        os.system('git push')
        print("Termine!")
finally:
    driver.quit()
