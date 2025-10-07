import undetected_chromedriver as uc
import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

print("Demarrage Chrome non detecte...")
driver = uc.Chrome()

try:
    print("Navigation vers Seeking Alpha...")
    driver.get("https://seekingalpha.com/login")
    time.sleep(5)
    
    print(f"Titre de la page: {driver.title}")
    
    # Vérifier si on voit le message de blocage
    if "Whoops" in driver.page_source or "bottom" in driver.page_source:
        print("TOUJOURS BLOQUE - Detection active")
    else:
        print("SUCCESS - Page de login normale accessible!")
        
        # Essayer de se connecter
        try:
            email_field = WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.ID, "email"))
            )
            email_field.send_keys("info@michelvilla.com")
            
            password_field = driver.find_element(By.ID, "password")
            password_field.send_keys("Mickey69")
            
            login_button = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
            login_button.click()
            
            time.sleep(8)
            print("Connexion tentee - verifiez visuellement si ca a marche")
        except Exception as e:
            print(f"Erreur lors de la connexion: {e}")
    
    input("Appuyez sur Entree pour fermer...")
    
finally:
    driver.quit()
