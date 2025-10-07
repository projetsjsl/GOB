import undetected_chromedriver as uc
import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

driver = uc.Chrome(version_main=140)

try:
    print("Chargement de la page d'accueil...")
    driver.get("https://seekingalpha.com/")
    time.sleep(5)
    
    print("Recherche du bouton LOG IN...")
    # Chercher le bouton contenant "LOG IN"
    login_button = driver.find_element(By.XPATH, "//a[contains(text(), 'LOG IN')] | //button[contains(text(), 'LOG IN')]")
    
    print("Clic sur LOG IN...")
    login_button.click()
    time.sleep(5)
    
    print(f"Page actuelle: {driver.current_url}")
    print(f"Titre: {driver.title}")
    
    # Vérifier si on voit le formulaire de login
    if "Whoops" in driver.page_source or "bottom" in driver.page_source:
        print("\nBLOQUE - Detection anti-bot active")
    else:
        print("\nSUCCESS - Page de login chargee")
        
        # Essayer de se connecter
        try:
            email_field = WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.ID, "email"))
            )
            print("Champ email trouve!")
            email_field.send_keys("info@michelvilla.com")
            
            password_field = driver.find_element(By.ID, "password")
            password_field.send_keys("Mickey69")
            
            print("Tentative de connexion...")
            login_submit = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
            login_submit.click()
            
            time.sleep(10)
            print(f"\nApres connexion - URL: {driver.current_url}")
            
        except Exception as e:
            print(f"Erreur login: {e}")
    
    input("\nAppuyez sur Entree pour fermer...")
    
finally:
    driver.quit()
