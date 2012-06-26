#! /bin/sh
set -e
dir="${0%/*}"
[ -z "$dir" ] && dir="$PWD"
output="$dir/release/fulmo-firefox.xpi"
cd "$dir/firefox"
rm -f -- "$output" || :
zip -qr -9 -X "$output" $(find -L . -type f \! -path '*/.svn/*')
echo "Created $output" >&2
