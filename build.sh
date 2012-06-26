#! /bin/sh
set -e
dir="${0%/*}"
case "$dir" in
    /*) ;;
    '') dir="$PWD";;
    *)  dir="$PWD/$dir";;
esac
[ -d "$dir/release" ] || mkdir "$dir/release"
"$dir/tools/createLocaleFiles.rb"
"$dir/build-firefox.sh"
"$dir/build-chrome.sh"
