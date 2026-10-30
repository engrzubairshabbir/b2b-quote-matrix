@echo off
cd /d "%~dp0"
title Deploy B2B App to Shopify
echo =====================================================================
echo  Deploying B2B App Extension to Shopify Store
echo  Store: consultways-b2b-dev.myshopify.com
echo =====================================================================
echo.
node .\node_modules\@shopify\cli\bin\run.js app deploy --config b2b-quote-bulk-discounts --allow-updates
echo.
echo =====================================================================
echo  Done! Now refresh the Theme Editor.
echo =====================================================================
pause
