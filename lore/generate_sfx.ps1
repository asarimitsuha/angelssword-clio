$rootEnvFile = "h:\Git\angelssword-clio\.env"
if (Test-Path $rootEnvFile) {
    Get-Content $rootEnvFile | Foreach-Object {
        $parts = $_ -split "="
        if ($parts.Length -ge 2) {
            $key = $parts[0].Trim()
            $val = $parts[1].Trim().Trim("'").Trim('"')
            [System.Environment]::SetEnvironmentVariable($key, $val)
        }
    }
}

$apiKey = [System.Environment]::GetEnvironmentVariable("ELEVENLABS_API_KEY")

if ([string]::IsNullOrEmpty($apiKey)) {
    Write-Error "Error: ELEVENLABS_API_KEY is missing from root .env!"
    Exit 1
}

$sfxList = @(
    @{ text = "loud shuffling quick footsteps on dry wooden floorboards, rapid slide and squeak steps"; duration = 1.2; id = "footsteps" },
    @{ text = "Opening a heavy leatherbound book, pages rustling, paper sound"; duration = 1.5; id = "book_open" },
    @{ text = "Closing a heavy leatherbound book shut, paper rustling, soft thud"; duration = 1.5; id = "book_close" },
    @{ text = "Unrolling an old parchment scroll, paper unfurling and crackling"; duration = 1.5; id = "scroll_open" },
    @{ text = "Rolling up a parchment scroll, paper curling and light snap"; duration = 1.2; id = "scroll_close" },
    @{ text = "Picking up a heavy glass jar with a metallic lid from a wooden shelf, ceramic clink and scrape"; duration = 1.5; id = "jar_pickup" },
    @{ text = "Setting down a heavy glass jar on a wooden shelf, ceramic thud and gentle settle"; duration = 1.2; id = "jar_putback" }
)

$sfxDir = "h:\Git\angelssword-clio\lore\assets\sfx"
if (-not (Test-Path $sfxDir)) {
    New-Item -ItemType Directory -Force -Path $sfxDir | Out-Null
}

$generatedCount = 0
$skippedCount = 0

foreach ($sfx in $sfxList) {
    $outputFile = Join-Path $sfxDir "$($sfx.id).mp3"
    
    if (Test-Path $outputFile) {
        $skippedCount++
        continue
    }
    
    Write-Host "Generating sound effect for: `"$($sfx.id)`"..."
    
    $url = "https://api.api.elevenlabs.io/v1/sound-generation" # Fallback if direct domain has issues, wait, search results say https://api.elevenlabs.io/v1/sound-generation
    $url = "https://api.elevenlabs.io/v1/sound-generation"
    
    $headers = @{
        "xi-api-key" = $apiKey
        "Content-Type" = "application/json"
    }
    
    $body = @{
        text = $sfx.text
        duration_seconds = $sfx.duration
        prompt_influence = 0.5
    } | ConvertTo-Json -Depth 5
    
    try {
        $utf8Body = [System.Text.Encoding]::UTF8.GetBytes($body)
        $response = Invoke-WebRequest -Uri $url -Method Post -Headers $headers -Body $utf8Body -OutFile $outputFile -ContentType "application/json; charset=utf-8"
        
        $generatedCount++
        Write-Host "Saved: assets/sfx/$($sfx.id).mp3"
        
        # Pause to avoid rate limits
        Start-Sleep -Milliseconds 1000
    }
    catch {
        Write-Error "Failed to generate sfx for $($sfx.id) : $_"
        break
    }
}

Write-Host "Generated: $generatedCount files, Skipped: $skippedCount files."
