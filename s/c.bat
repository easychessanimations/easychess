echo off

if [%1] == [] GOTO EmptyCommitMessage

git add -- wasm/board.js
git add -- wasm/board.wasm
git add -- resources/conf/versioninfo.json
git add -- backup/backup.txt

git commit -m "WASM / Version Info / Backup"

git add .

git commit -m %1

GOTO Finish

:EmptyCommitMessage

echo Empty Commit Message

:Finish
