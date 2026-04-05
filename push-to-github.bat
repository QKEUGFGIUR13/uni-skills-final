@echo off
echo ========================================
echo   UniSkills - Push to GitHub
echo ========================================
echo.
echo Repository: https://github.com/QKEUGFGIUR13/uni-skills-1.git
echo Branch: main
echo.
echo You will be prompted for your GitHub credentials:
echo   Username: QKEUGFGIUR13
echo   Password: Use your Personal Access Token (NOT your password)
echo.
echo Get your token from: https://github.com/settings/tokens
echo.
pause
echo.
echo Pushing to GitHub...
git push -u origin main
echo.
if %errorlevel% equ 0 (
    echo ========================================
    echo   SUCCESS! Code pushed to GitHub
    echo ========================================
    echo.
    echo View your repository at:
    echo https://github.com/QKEUGFGIUR13/uni-skills-1
) else (
    echo ========================================
    echo   FAILED! Please check your credentials
    echo ========================================
)
echo.
pause
