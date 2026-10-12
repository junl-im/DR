param([string]$ResearchRoot=$PSScriptRoot)
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$manifest=Get-Content (Join-Path $ResearchRoot 'kit\asset-manifest.json') -Raw | ConvertFrom-Json
$wanted=@{}; foreach($entry in $manifest){$wanted[$entry.path]=$entry}
$seen=@{}; $bad=@()
foreach($part in Get-ChildItem $ResearchRoot -Filter 'Dungeon-zero-resources-*.zip'){
 $zip=[IO.Compression.ZipFile]::OpenRead($part.FullName)
 try{foreach($entry in $zip.Entries){$key=$entry.FullName.Replace('\','/');if($wanted.ContainsKey($key)){$stream=$entry.Open();$sha=[Security.Cryptography.SHA256]::Create();try{$hash=([BitConverter]::ToString($sha.ComputeHash($stream))).Replace('-','').ToLowerInvariant()}finally{$stream.Dispose();$sha.Dispose()};if($hash -ne $wanted[$key].sha256 -or $entry.Length -ne $wanted[$key].bytes){$bad+=$key};$seen[$key]=$true}}}finally{$zip.Dispose()}
}
foreach($key in $wanted.Keys){if(-not $seen.ContainsKey($key)){$bad+='missing: '+$key}}
$receipt=@{date='2026-10-12';verifiedFiles=$seen.Count;expectedFiles=$wanted.Count;failures=$bad}
$receipt | ConvertTo-Json | Set-Content (Join-Path $ResearchRoot 'archive-verification.json')
$receipt | ConvertTo-Json
if($bad.Count){exit 1}
