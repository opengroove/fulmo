#! /bin/sh
set -e
dir="${0/*}"
[ -z "$dir" ] && dir="$PWD"
cd "$dir/firefox"
output=../fulmo-firefox.xpi
rm -f -- "$output" || :
zip -r "$output" $(find -L . -type f \! -path '*/.svn/*')
