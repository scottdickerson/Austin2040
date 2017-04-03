taskkill /IM chrome.exe >nul
taskkill /f /im explorer.exe
"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --allow-file-access-from-files --start-fullscreen --disable-pinch --kiosk "file:///C:/musework/index.html"