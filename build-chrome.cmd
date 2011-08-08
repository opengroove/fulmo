@echo off
setlocal
set D=%~dp0
REM set CHROME=C:\usr\apps\GoogleChrome\12.0.742.122\chrome.exe
REM set CHROME_OPTS=--user-data-dir=C:\usr\apps\GoogleChrome\12.0.742.122\profile
if not exist "%CHROME%" set CHROME=chrome.exe
"%CHROME%" %CHROME_OPTS% --pack-extension="%D%chrome" --pack-extension-key="%D%fulmo.pem"
endlocal
