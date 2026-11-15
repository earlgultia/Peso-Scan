$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$Public = Join-Path $PSScriptRoot '..\public'

function New-RoundedPath([single]$X, [single]$Y, [single]$Width, [single]$Height, [single]$Radius) {
  $Path = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $D = $Radius * 2
  $Path.AddArc($X, $Y, $D, $D, 180, 90)
  $Path.AddArc($X + $Width - $D, $Y, $D, $D, 270, 90)
  $Path.AddArc($X + $Width - $D, $Y + $Height - $D, $D, $D, 0, 90)
  $Path.AddArc($X, $Y + $Height - $D, $D, $D, 90, 90)
  $Path.CloseFigure()
  return $Path
}

function Write-PesoIcon([int]$Size, [string]$FileName, [bool]$Maskable = $false) {
  $Bitmap = [System.Drawing.Bitmap]::new($Size, $Size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $Graphics = [System.Drawing.Graphics]::FromImage($Bitmap)
  $Graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $Graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $Graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $Graphics.ScaleTransform($Size / 128.0, $Size / 128.0)

  $Background = if ($Maskable) { [System.Drawing.RectangleF]::new(0, 0, 128, 128) } else { New-RoundedPath 0 0 128 128 32 }
  $BackgroundBrush = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
    [System.Drawing.PointF]::new(16, 14), [System.Drawing.PointF]::new(112, 116),
    [System.Drawing.Color]::FromArgb(255, 22, 57, 76), [System.Drawing.Color]::FromArgb(255, 9, 23, 36))
  if ($Maskable) { $Graphics.FillRectangle($BackgroundBrush, $Background) } else { $Graphics.FillPath($BackgroundBrush, $Background) }

  $Cyan = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(255, 103, 216, 237), 5)
  $Cyan.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $Cyan.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $Cyan.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
  foreach ($Points in @(
    @(@(28,45),@(28,34),@(41,34)), @(@(100,45),@(100,34),@(87,34)),
    @(@(28,83),@(28,94),@(41,94)), @(@(100,83),@(100,94),@(87,94))
  )) {
    $P = [System.Drawing.PointF[]]@($Points | ForEach-Object { [System.Drawing.PointF]::new($_[0], $_[1]) })
    $Graphics.DrawLines($Cyan, $P)
  }

  $NotePath = New-RoundedPath 35 42 58 44 9
  $NoteBrush = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
    [System.Drawing.PointF]::new(30, 38), [System.Drawing.PointF]::new(99, 91),
    [System.Drawing.Color]::FromArgb(255, 167, 241, 226), [System.Drawing.Color]::FromArgb(255, 88, 200, 232))
  $Graphics.FillPath($NoteBrush, $NotePath)
  $Inner = New-RoundedPath 40 47 48 34 5
  $InnerPen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(133, 16, 50, 69), 2)
  $Graphics.DrawPath($InnerPen, $Inner)
  $Graphics.FillEllipse([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(31, 16, 50, 69)), 52, 52, 24, 24)

  $SymbolPen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(255, 16, 50, 69), 4.5)
  $SymbolPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $SymbolPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $SymbolPen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
  $Symbol = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $Symbol.AddLine(57, 79, 57, 47)
  $Symbol.AddLine(57, 47, 68, 47)
  $Symbol.AddBezier(68, 47, 82, 47, 82, 64, 68, 64)
  $Symbol.AddLine(68, 64, 57, 64)
  $Graphics.DrawPath($SymbolPen, $Symbol)
  $Graphics.DrawLine($SymbolPen, 52, 70, 75, 70)
  $Graphics.DrawLine($SymbolPen, 52, 76, 75, 76)

  $Graphics.FillEllipse([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 98, 221, 180)), 88, 84, 22, 22)
  $BadgePen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(255, 9, 23, 36), 4)
  $Graphics.DrawEllipse($BadgePen, 88, 84, 22, 22)
  $CheckPen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(255, 9, 35, 30), 2.5)
  $CheckPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $CheckPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $Graphics.DrawLines($CheckPen, [System.Drawing.PointF[]]@(
    [System.Drawing.PointF]::new(94.5, 95), [System.Drawing.PointF]::new(97.5, 98), [System.Drawing.PointF]::new(103.5, 92)))

  $Path = Join-Path $Public $FileName
  $Bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  $Graphics.Dispose(); $Bitmap.Dispose(); $BackgroundBrush.Dispose(); $Cyan.Dispose()
  $NoteBrush.Dispose(); $NotePath.Dispose(); $Inner.Dispose(); $InnerPen.Dispose(); $Symbol.Dispose()
  $SymbolPen.Dispose(); $BadgePen.Dispose(); $CheckPen.Dispose()
  Write-Output "Wrote $Path ($Size x $Size)"
}

Write-PesoIcon 192 'icon-192.png'
Write-PesoIcon 512 'icon-512.png'
Write-PesoIcon 512 'icon-512-maskable.png' $true
Write-PesoIcon 180 'apple-touch-icon.png'
