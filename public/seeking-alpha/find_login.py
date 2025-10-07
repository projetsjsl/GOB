import undetected_chromedriver as uc
import time
from selenium.webdriver.common.by import By

driver = uc.Chrome(version_main=140)

try:
    driver.get("https://seekingalpha.com/")
    time.sleep(5)
    
    # Chercher tous les liens contenant "login"
    links = driver.find_elements(By.TAG_NAME, "a")
    
    print("Liens contenant 'login' ou 'sign in':")
    for link in links:
        href = link.get_attribute("href")
        text = link.text.strip()
        if href and ("login" in href.lower() or "signin" in href.lower() or text.lower() in ["login", "sign in", "log in"]):
            print(f"Texte: '{text}' -> URL: {href}")
    
    # Chercher des boutons
    buttons = driver.find_elements(By.TAG_NAME, "button")
    print(f"\nTrouvé {len(buttons)} boutons")
    for i, btn in enumerate(buttons):
        text = btn.text.strip()
        if text and ("login" in text.lower() or "sign" in text.lower()):
            print(f"Bouton {i}: '{text}'")
    
    input("\nAppuyez sur Entrée...")
    
finally:
    driver.quit()
