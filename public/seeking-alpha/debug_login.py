import os, json, time
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

print("Demarrage Chrome...")
options = webdriver.ChromeOptions()
# Pas de headless pour voir ce qui se passe
driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)

try:
    print("Navigation vers Seeking Alpha...")
    driver.get("https://seekingalpha.com/login")
    print(f"Page chargee: {driver.title}")
    print("Attendez 10 secondes pour voir la page...")
    time.sleep(10)
    
    # Sauvegarder une capture de la page
    driver.save_screenshot("debug_login_page.png")
    print("Screenshot sauvegarde dans debug_login_page.png")
    
    # Essayer de trouver le champ email
    try:
        email_field = driver.find_element(By.ID, "email")
        print("Champ email trouve!")
    except:
        print("Champ email NOT FOUND. Essayons d'autres selecteurs...")
        # Chercher tous les input de type email
        email_inputs = driver.find_elements(By.CSS_SELECTOR, "input[type='email']")
        print(f"Trouve {len(email_inputs)} input type=email")
        
        # Chercher par name
        name_inputs = driver.find_elements(By.CSS_SELECTOR, "input[name*='email']")
        print(f"Trouve {len(name_inputs)} input avec 'email' dans le name")
    
    input("Appuyez sur Entree pour fermer...")
    
finally:
    driver.quit()
