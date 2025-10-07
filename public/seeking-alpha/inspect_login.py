import undetected_chromedriver as uc
import time
from selenium.webdriver.common.by import By

driver = uc.Chrome(version_main=140)

try:
    driver.get("https://seekingalpha.com/login")
    time.sleep(8)
    
    # Trouver tous les champs input
    inputs = driver.find_elements(By.TAG_NAME, "input")
    
    print(f"Trouvé {len(inputs)} champs input:")
    for i, inp in enumerate(inputs):
        print(f"{i}: type={inp.get_attribute('type')}, name={inp.get_attribute('name')}, id={inp.get_attribute('id')}, placeholder={inp.get_attribute('placeholder')}")
    
    # Sauvegarder le HTML
    with open("login_page.html", "w", encoding="utf-8") as f:
        f.write(driver.page_source)
    
    print("\nHTML sauvegardé dans login_page.html")
    input("Appuyez sur Entrée...")
    
finally:
    driver.quit()
