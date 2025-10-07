import undetected_chromedriver as uc
import time
from selenium.webdriver.common.by import By

# Charger VOTRE profil Chrome où vous êtes déjà connecté
options = uc.ChromeOptions()
options.add_argument(r'--user-data-dir=C:\Users\famil\AppData\Local\Google\Chrome\User Data')
options.add_argument('--profile-directory=Default')

driver = uc.Chrome(options=options, version_main=140)

try:
    # Aller directement au rapport
    print("Accès au Virtual Analyst Report...")
    driver.get("https://seekingalpha.com/symbol/JNJ/virtual_analyst_report")
    time.sleep(8)
    
    if "Whoops" in driver.page_source or "bottom" in driver.page_source:
        print("BLOQUÉ - Anti-bot actif")
    elif "Login" in driver.page_source or "Sign" in driver.page_source:
        print("PAS CONNECTÉ - Session expirée")
    else:
        print("SUCCESS - Page chargée!")
        
        # Extraire le texte
        body_text = driver.find_element(By.TAG_NAME, "body").text
        print(f"\nPremiers 500 caractères:\n{body_text[:500]}")
        
        # Sauvegarder
        with open("jnj_report.txt", "w", encoding="utf-8") as f:
            f.write(body_text)
        
        print("\nRapport sauvegardé dans jnj_report.txt")
    
    input("\nVérifiez la fenêtre Chrome...")
    
finally:
    driver.quit()
