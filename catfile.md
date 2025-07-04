find ./api ./react -type f -exec cat {} +
find ./api -type f -exec cat {} +
find ./react -type f -exec cat {} +

git add .
git commit -m "updated"
git push

find ./src/react-app -type f -exec echo "----- {} -----" \; -exec cat {} \;

find ./react/entities \( -name "*.ts" -o -name "*.tsx" \) -type f -exec echo "----- {} -----" \; -exec cat {} +

find ./react \( -name "*.ts" -o -name "*.tsx" \) -type f -exec echo "----- {} -----" \; -exec cat {} + > files3.md

find  ./react \( -name "*.ts" -o -name "*.tsx" \) -type f -exec echo "----- {} -----" \; -exec grep -v '^\s*//' {} \; > files.md

find  ./api \( -name "*.ts" -o -name "*.tsx" \) -type f -exec echo "----- {} -----" \; -exec grep -v '^\s*//' {} \; > filesapi.md

find  ./react \( -name "*.css" \) -type f -not -path "./react/pages/LoginPageWithErrorDisplay.css" -not -path "./react-hono/react/shared/ui/codemirror-editor"  -exec echo "----- {} -----" \; -exec grep -v '^\s*//' {} \; > filescss.md


find ./react \( -name "*.ts" -o -name "*.tsx" \) -type f -not -path "./react/shared/ui/codemirror-editor/*" -not -path "./react/features/kakaologin/*" -not -path "./react/features/latex-help/*" -not -path "./react\pages\LoginPageWithErrorDisplay.tsx" -not -path "./react\pages\LoginPage.tsx" -exec echo "----- {} -----" \; -exec grep -v '^\s*//' {} \; > files.md

find ./react \( -name "*.ts" -o -name "*.tsx" \) -type f -not -path "./react/shared/ui/codemirror-editor/*" -not -path "./react/features/kakaologin/*" -not -path "./react/features/latex-help/*" -not -path "./react\pages\LoginPageWithErrorDisplay.tsx" -not -path "./react\pages\LoginPage.tsx" -exec echo "----- {} -----" \; -exec grep -v '^\s*//' {} \; > files2.md

npx wrangler d1 execute D1_DATABASE --remote --file ./drizzle_d1/0000_long
[오류출력]

find ./react \( -name "*.ts" -o -name "*.tsx" \) -type f -not -path "./react/shared/ui/codemirror-editor/*" -not -path "./react/features/kakaologin/*" -not -path "./react/features/latex-help/*" -exec npx eslint --quiet