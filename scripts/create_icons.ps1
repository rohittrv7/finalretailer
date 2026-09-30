Add-Type -AssemblyName System.Drawing

$buildDir = "build"
$publicDir = "renderer/public"

if (!(Test-Path $buildDir)) { New-Item -ItemType Directory -Force -Path $buildDir }
if (!(Test-Path $publicDir)) { New-Item -ItemType Directory -Force -Path $publicDir }

$srcPath = "C:\Users\rohit\.gemini\antigravity-ide\brain\79191589-9529-408d-a168-94a6f19e849b\retail_pos_icon_1790748537392.jpg"
$src = [System.Drawing.Bitmap]::new($srcPath)

# 1. 512x512 PNG
$bmp512 = New-Object System.Drawing.Bitmap 512, 512
$g512 = [System.Drawing.Graphics]::FromImage($bmp512)
$g512.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g512.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g512.DrawImage($src, 0, 0, 512, 512)
$bmp512.Save("build/icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bmp512.Save("renderer/public/icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$g512.Dispose()
$bmp512.Dispose()

# 2. 256x256 PNG for ICO
$bmp256 = New-Object System.Drawing.Bitmap 256, 256
$g256 = [System.Drawing.Graphics]::FromImage($bmp256)
$g256.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g256.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g256.DrawImage($src, 0, 0, 256, 256)

$ms = New-Object System.IO.MemoryStream
$bmp256.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
$pngBytes = $ms.ToArray()

# Build valid 256x256 ICO file with PNG container (Vista+ standard supported by Windows & electron-builder)
$icoMs = New-Object System.IO.MemoryStream
$bw = New-Object System.IO.BinaryWriter($icoMs)
$bw.Write([uint16]0) # Reserved
$bw.Write([uint16]1) # Type 1 = Icon
$bw.Write([uint16]1) # 1 image count
$bw.Write([byte]0)   # 256 width (0 = 256)
$bw.Write([byte]0)   # 256 height (0 = 256)
$bw.Write([byte]0)   # Colors
$bw.Write([byte]0)   # Reserved
$bw.Write([uint16]1) # Color planes
$bw.Write([uint16]32) # Bits per pixel
$bw.Write([uint32]$pngBytes.Length) # Image data size
$bw.Write([uint32]22) # Offset of image data
$bw.Write($pngBytes)

[System.IO.File]::WriteAllBytes("build/icon.ico", $icoMs.ToArray())
[System.IO.File]::WriteAllBytes("renderer/public/favicon.ico", $icoMs.ToArray())

$bw.Dispose()
$icoMs.Dispose()
$ms.Dispose()
$g256.Dispose()
$bmp256.Dispose()
$src.Dispose()

Write-Host "Icons generated successfully!"
