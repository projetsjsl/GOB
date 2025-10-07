import undetected_chromedriver as uc
import time

options = uc.ChromeOptions()
# Remplacez EXTENSION_ID par l'ID réel
options.add_argument('--load-extension=C:/Users/famil/AppData/Local/Google/Chrome/User Data/Default/Extensions/EXTENSION_ID')

driver = uc.Chrome(options=options, version_main=140)

driver.get("chrome-extension://EXTENSION_ID/popup.html")
time.sleep(10)
input("Vérifiez si l'extension est chargée...")
driver.quit()
