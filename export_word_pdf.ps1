$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$renderDirectory = Join-Path $projectRoot 'loom_script_render'
$inputPath = Join-Path $projectRoot 'SOP_Sentinel_Loom_Tutorial_Script.docx'
$outputPath = Join-Path $renderDirectory 'SOP_Sentinel_Loom_Tutorial_Script.pdf'
New-Item -ItemType Directory -Force -Path $renderDirectory | Out-Null
$word = New-Object -ComObject Word.Application
$word.Visible = $false
try {
    $document = $word.Documents.Open($inputPath, $false, $true)
    try {
        $document.ExportAsFixedFormat($outputPath, 17)
    }
    finally {
        $document.Close($false)
    }
}
finally {
    $word.Quit()
}
Write-Output $outputPath
