#!/bin/bash
# nothing to see here, just a utility i use to create new releases ^_^

CURRENT_VERSION=$(cat arcd/config/version.go | grep APP_VERSION | cut -d '"' -f 2)

echo -n "Current version is $CURRENT_VERSION, select new version: "
read NEW_VERSION
echo "Creating version $NEW_VERSION ..."

echo "Updating arcd/config/version.go"
sed -i "s/$CURRENT_VERSION/$NEW_VERSION/g" arcd/config/version.go

echo "Updating arc/manifest.json"
sed -i "s/$CURRENT_VERSION/$NEW_VERSION/g" arc/manifest.json

git add arcd/config/version.go
git add arc/manifest.json
git commit -m "Releasing v$NEW_VERSION"
git push

git tag -a v$NEW_VERSION -m "Release v$NEW_VERSION"
git push origin v$NEW_VERSION

echo "All done, just run goreleaser now ^_^"
