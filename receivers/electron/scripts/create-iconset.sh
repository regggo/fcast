#!/bin/zsh
mkdir icon.iconset
sips -z 16 16     ./assets/icons/app/icon1024.png --out icon.iconset/icon_16x16.png
sips -z 32 32     ./assets/icons/app/icon1024.png --out icon.iconset/icon_16x16@2x.png
sips -z 32 32     ./assets/icons/app/icon1024.png --out icon.iconset/icon_32x32.png
sips -z 64 64     ./assets/icons/app/icon1024.png --out icon.iconset/icon_32x32@2x.png
sips -z 128 128   ./assets/icons/app/icon1024.png --out icon.iconset/icon_128x128.png
sips -z 256 256   ./assets/icons/app/icon1024.png --out icon.iconset/icon_128x128@2x.png
sips -z 256 256   ./assets/icons/app/icon1024.png --out icon.iconset/icon_256x256.png
sips -z 512 512   ./assets/icons/app/icon1024.png --out icon.iconset/icon_256x256@2x.png
sips -z 512 512   ./assets/icons/app/icon1024.png --out icon.iconset/icon_512x512.png
cp ./assets/icons/app/icon1024.png icon.iconset/icon_512x512@2x.png
iconutil -c icns icon.iconset
rm -R icon.iconset
mv icon.icns ./assets/icons/app/icon.icns
