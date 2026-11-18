#!/bin/bash
# launchd vn.tula.amia-pancake-hop-thu (KeepAlive): chạy liền, 15 giây kéo tin Messenger mới từ Pancake vào Hộp thư (cửa sổ 10 phút).
export LC_ALL=en_US.UTF-8 LANG=en_US.UTF-8 PATH="/Users/phamtunglam/.local/bin:/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin"
cd /Users/phamtunglam/project___1140/amia-os || exit 1
export PW="$(security find-generic-password -s amia-os-db-password -w)"
exec node scripts/pancake/dong-bo-hop-thu.mjs 10 --ghi --lap=15
