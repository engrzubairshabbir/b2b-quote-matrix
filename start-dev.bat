@echo off
cd /d "%~dp0"
title B2B Quote Dev Server
echo =====================================================================
echo  B2B Quote and Bulk Discounts Dev Server
echo  Store: consultways-b2b-dev.myshopify.com
echo =====================================================================
echo.
node .\node_modules\@shopify\cli\bin\run.js app dev --config b2b-quote-bulk-discounts
pause

