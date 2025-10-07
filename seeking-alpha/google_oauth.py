import undetected_chromedriver as uc
import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# Charger le profil Chrome existant où vous êtes déjà connecté à Google
options = uc.ChromeOptions()
options.add_argument(r'--user-data-dir=C:\Users\famil\AppData\Local\Google\Chrome\User Data')
options.add_argument('--profile-directory=Default')

driver = uc.Chrome(options=options, version_main=140)

try:
    driver.get("https://seekingalpha.com/")
    time.sleep(5)
    
    # Chercher le bouton "Continue with Google"
    try:
        google_btn = driver.find_element(By.XPATH, "//*[contains(text(), 'Continue with Google') or contains(text(), 'Google')]")
        print("Bouton Google trouvé, clic...")
        google_btn.click()
        time.sleep(10)
        
        print(f"URL après Google: {driver.current_url}")
        
        # Si connecté, tester d'aller sur Virtual Analyst Report
        driver.get("https://seekingalpha.com/symbol/JNJ/virtual_analyst_report")
        time.sleep(5)
        
        if "Whoops" in driver.page_source:
            print("BLOQUÉ")
        else:
            print("SUCCESS - Page accessible!")
            print(driver.title)
            
    except Exception as e:
        print(f"Erreur: {e}")
    
    input("\nVérifiez l'état de la connexion...")
    
finally:
    driver.quit()
