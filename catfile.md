find ./api ./react -type f -exec cat {} +
find ./api -type f -exec cat {} +
find ./react -type f -exec cat {} +

git add .
git commit -m "updated"
git push

find ./src/react-app -type f -exec echo "----- {} -----" \; -exec cat {} \;

find ./react/entities \( -name "*.ts" -o -name "*.tsx" \) -type f -exec echo "----- {} -----" \; -exec cat {} +

find ./api \( -name "*.ts" -o -name "*.tsx" \) -type f -exec echo "----- {} -----" \; -exec cat {} + > files2.md