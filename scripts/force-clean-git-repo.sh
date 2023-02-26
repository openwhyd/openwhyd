git checkout main
git branch -m backup  # Rename the current branch to backup
git checkout --orphan newBranch
git add -A  # Add all files and commit them
git commit -m "clean openwhyd release"
git branch -m main  # Rename the current branch to main
git push -f origin main  # Force push main branch to github
