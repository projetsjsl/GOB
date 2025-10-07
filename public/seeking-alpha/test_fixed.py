import undetected_chromedriver as uc
import time
from selenium.webdriver.common.by import By

options = uc.ChromeOptions()
options.add_argument('--start-maximized')

driver = uc.Chrome(options=options, version_main=140)

driver.get("https://seekingalpha.com/login")
time.sleep(10)

print(f"Page: {driver.title}")
input("Appuyez sur Entree...")
driver.quit()
