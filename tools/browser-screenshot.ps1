# Windows equivalent of the skill screenshot helper: save bytes, emit only path.
param([string]$OutputPath)
$body=@{action='screenshot';args=@{format='jpeg';quality=75};session='vgallery-review'}|ConvertTo-Json -Depth 4
$result=Invoke-RestMethod -Uri 'http://127.0.0.1:10086/command' -Method Post -ContentType 'application/json' -Body $body
if(-not $result.ok){throw ($result.error|ConvertTo-Json -Compress)}
[IO.File]::WriteAllBytes($OutputPath,[Convert]::FromBase64String($result.data.data))
Write-Output $OutputPath
