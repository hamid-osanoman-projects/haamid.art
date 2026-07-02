[void][System.Reflection.Assembly]::LoadWithPartialName("System.Drawing")

# Ensure public folder exists
New-Item -ItemType Directory -Force -Path "public"

# Generate 192x192 Icon
$bmp192 = New-Object System.Drawing.Bitmap(192, 192)
$g192 = [System.Drawing.Graphics]::FromImage($bmp192)
$color = [System.Drawing.ColorTranslator]::FromHtml("#7F77DD")
$brush = New-Object System.Drawing.SolidBrush($color)
$g192.FillRectangle($brush, 0, 0, 192, 192)

# Text configurations
$font192 = New-Object System.Drawing.Font("Segoe UI", 90, [System.Drawing.FontStyle]::Bold)
$whiteBrush = [System.Drawing.Brushes]::White
# Centered placement calculations
$g192.DrawString("V", $font192, $whiteBrush, 45, 10)
$bmp192.Save("public/vibe-icon-192.png", [System.Drawing.Imaging.ImageFormat]::Png)

$g192.Dispose()
$bmp192.Dispose()

# Generate 512x512 Icon
$bmp512 = New-Object System.Drawing.Bitmap(512, 512)
$g512 = [System.Drawing.Graphics]::FromImage($bmp512)
$g512.FillRectangle($brush, 0, 0, 512, 512)

$font512 = New-Object System.Drawing.Font("Segoe UI", 250, [System.Drawing.FontStyle]::Bold)
$g512.DrawString("V", $font512, $whiteBrush, 120, 45)
$bmp512.Save("public/vibe-icon-512.png", [System.Drawing.Imaging.ImageFormat]::Png)

$g512.Dispose()
$bmp512.Dispose()

Write-Host "PWA launcher icons successfully created under public/"
