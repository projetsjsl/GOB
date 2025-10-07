import undetected_chromedriver as uc
import time
from selenium.webdriver.common.by import By

driver = uc.Chrome(version_main=140)

try:
    driver.get("https://seekingalpha.com/")
    time.sleep(5)
    
    # Sauvegarder le HTML pour inspection
    with open("homepage.html", "w", encoding="utf-8") as f:
        f.write(driver.page_source)
    
    # Méthode 1: Chercher tous les liens
    links = driver.find_elements(By.TAG_NAME, "a")
    for link in links:
        if link.text.strip().upper() == "LOG IN":
            print(f"Trouvé LOG IN: {link.get_attribute('href')}")
            link.click()
            time.sleep(5)
            break
    else:
        # Méthode 2: Chercher par texte partiel
        print("Méthode 1 échouée, essayons autrement...")
        all_elements = driver.find_elements(By.XPATH, "//*[contains(text(), 'LOG') or contains(text(), 'log')]")
        for el in all_elements:
            print(f"Element: {el.tag_name} - Texte: '{el.text}'")
    
    print(f"\nURL actuelle: {driver.current_url}")
    print(f"HTML sauvegardé dans homepage.html")
    
    input("\nAppuyez sur Entrée...")
    
finally:
    driver.quit()
