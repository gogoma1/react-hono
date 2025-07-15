

git add .
git commit -m "updated"
git push

find ./src/react-app -type f -exec echo "----- {} -----" \; -exec cat {} \;

find ./react/entities \( -name "*.ts" -o -name "*.tsx" \) -type f -exec echo "----- {} -----" \; -exec cat {} +


find  ./react \( -name "*.ts" -o -name "*.tsx" \) -type f -exec echo "----- {} -----" \; -exec grep -v '^\s*//' {} \; > files2.md

find  ./react/features/kakaologin/* \( -name "*.ts" -o -name "*.tsx" \) -type f -exec echo "----- {} -----" \; -exec grep -v '^\s*//' {} \; > files2.md

./react/features/kakaologin/*


find  ./api/db ./api/routes/manage/problem-sets.ts \( -name "*.ts" -o -name "*.tsx" \) -type f -exec echo "----- {} -----" \; -exec grep -v '^\s*//' {} \; > filesapi.md


find  ./api \( -name "*.ts" -o -name "*.tsx" \) -type f -exec echo "----- {} -----" \; -exec grep -v '^\s*//' {} \; > filesapi.md

find  ./react \( -name "*.css" \) -type f -not -path "./react/pages/LoginPageWithErrorDisplay.css" -not -path "./react-hono/react/shared/ui/codemirror-editor" -not -path "./react/features/prompt-collection"  -exec echo "----- {} -----" \; -exec grep -v '^\s*//' {} \; > filescss.md


find ./react \( -name "*.ts" -o -name "*.tsx" \) -type f -not -path "./react/shared/ui/codemirror-editor/*" -not -path "./react/features/kakaologin/*" -not -path "./react/features/latex-help/*" -not -path "./react/pages/LoginPageWithErrorDisplay.tsx" -not -path "./react/pages/LoginPage.tsx"  -not -path "./react/features/prompt-collection" -exec echo "----- {} -----" \; -exec grep -v '^\s*//' {} \; > files.md

find ./react/entities ./react/features ./react/pages ./react/widgets \( -name "*.ts" -o -name "*.tsx" \) -type f -not -path "./react/shared/ui/codemirror-editor/*" -not -path "./react/features/kakaologin/*" -not -path "./react/features/latex-help/*" -not -path "./react/pages/LoginPageWithErrorDisplay.tsx" -not -path "./react/widgets/json-problem-importer"  -not -path "./react/pages/LoginPage.tsx" -not -path "./react/features/prompt-collection" -exec echo "----- {} -----" \; -exec grep -v '^\s*//' {} \; > files2.md

find ./react/App.tsx ./react/widgets \( -name "*.ts" -o -name "*.tsx" \) -type f -not -path "./react/shared/ui/codemirror-editor/*" -not -path "./react/features/kakaologin/*"  -not -path "./react/features/latex-help/*" -not -path "./react\pages\LoginPageWithErrorDisplay.tsx" -not -path "./react\widgets\json-problem-importer" -not -path "./react\pages\LoginPage.tsx" -exec echo "----- {} -----" \; -exec grep -v '^\s*//' {} \; > files3.md


-not -path "./react/widgets/json-problem-importer"
-not -path "./react/features/prompt-collection"
-not -path "./react/widgets/json-problem-importer" 

npx wrangler d1 execute D1_DATABASE --remote --file ./drizzle_d1/0000_long

npx wrangler d1 execute D1_DATABASE_LOG --remote --file ./drizzle_d1_log/0000_daffy_thena.sql
npx wrangler d1 execute D1_DATABASE_MARKET --remote --file ./
[오류출력]

find ./react \( -name "*.ts" -o -name "*.tsx" \) -type f -not -path "./react/shared/ui/codemirror-editor/*" -not -path "./react/features/kakaologin/*" -not -path "./react/features/latex-help/*" -exec npx eslint --quiet

npx wrangler d1 execute D1_DATABASE --remote --file ./query.sql