git checkout master
git branch -m backup  # Rename the current branch to backup
git checkout --orphan newBranch
git add -A  # Add all files and commit them
git commit -m "clean openwhyd release"
git branch -m master  # Rename the current branch to master
git push -f origin master  # Force push master branch to github
