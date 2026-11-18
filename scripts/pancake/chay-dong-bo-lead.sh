#!/bin/bash
# launchd vn.tula.amia-pancake-lead gọi mỗi 10 phút: kéo hội thoại Pancake 30 phút gần nhất → lead (chồng cửa sổ để không sót khi máy chậm/ngủ).
export LC_ALL=en_US.UTF-8 LANG=en_US.UTF-8 PATH="/Users/phamtunglam/.local/bin:/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin"
cd /Users/phamtunglam/project___1140/amia-os || exit 1
export PW="$(security find-generic-password -s amia-os-db-password -w)"
node scripts/pancake/dong-bo-lead.mjs "${1:-30}" --ghi
