find ./api ./react -type f -exec cat {} +
find ./api -type f -exec cat {} +
find ./react -type f -exec cat {} +

git add .
git commit -m "updated"
git push

find ./src/react-app -type f -exec echo "----- {} -----" \; -exec cat {} \;

find ./react/entities \( -name "*.ts" -o -name "*.tsx" \) -type f -exec echo "----- {} -----" \; -exec cat {} +

find ./react \( -name "*.ts" -o -name "*.tsx" \) -type f -exec echo "----- {} -----" \; -exec cat {} + > files3.md

find  ./api \( -name "*.ts" -o -name "*.tsx" \) -type f -exec echo "----- {} -----" \; -exec grep -v '^\s*//' {} \; > filesapi.md

find  ./react \( -name "*.ts" -o -name "*.tsx" \) -type f -exec echo "----- {} -----" \; -exec grep -v '^\s*//' {} \; > files.md

find  ./react \( -name "*.css" \) -type f -exec echo "----- {} -----" \; -exec grep -v '^\s*//' {} \; > filescss.md

find  ./react/shared/ui/codemirror-editor -type f -exec echo "----- {} -----" \; -exec grep -v '^\s*//' {} \; > files-codemirror.md