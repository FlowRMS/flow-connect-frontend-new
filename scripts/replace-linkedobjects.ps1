$filePath = "c:\Users\ksubh\Desktop\Subhans projects\flow crm  curtis mock\flow-crm\components\QuotesContent.tsx"
$content = Get-Content $filePath
$part1 = $content[0..7482]
$replacement = @(
    "",
    "            {/* Linked Objects Tab */}",
    "            {detailTab === 'linkedObjects' && <LinkedObjectsTab />}"
)
$part2 = $content[7703..($content.Length-1)]
$newContent = $part1 + $replacement + $part2
$newContent | Set-Content $filePath -Encoding UTF8
Write-Host "Done. New line count:" $newContent.Length
