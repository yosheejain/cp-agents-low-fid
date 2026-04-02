cd ~/repositories/cp-agents-low-fid
git pull origin main
cp low-fid-cp-agents/dist/index.html ~/public_html/index.html
cp low-fid-cp-agents/dist/.htaccess ~/public_html/.htaccess
cp -R low-fid-cp-agents/dist/assets ~/public_html/
cp low-fid-cp-agents/api/auth.php ~/public_html/api/auth.php
cp low-fid-cp-agents/api/chat.php ~/public_html/api/chat.php
cp low-fid-cp-agents/api/conversations.php ~/public_html/api/conversations.php
cp low-fid-cp-agents/api/users.php ~/public_html/api/users.php
cp low-fid-cp-agents/prompts/system_prompt.txt ~/public_html/prompts/system_prompt.txt
cp low-fid-cp-agents/prompts/opening_message.txt ~/public_html/prompts/opening_message.txt
cp low-fid-cp-agents/prompts/.htaccess ~/public_html/prompts/.htaccess
mkdir -p ~/public_html/prompts/roles
cp -R low-fid-cp-agents/prompts/roles ~/public_html/prompts/
echo "Deploy complete."
