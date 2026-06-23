$envFile = Join-Path $PSScriptRoot ".env"
if (Test-Path $envFile) {
    Get-Content $envFile | Foreach-Object {
        $parts = $_ -split "="
        if ($parts.Length -ge 2) {
            $key = $parts[0].Trim()
            $val = $parts[1].Trim().Trim("'").Trim('"')
            [System.Environment]::SetEnvironmentVariable($key, $val)
        }
    }
}

$apiKey = [System.Environment]::GetEnvironmentVariable("ELEVENLABS_API_KEY")
$voiceId = [System.Environment]::GetEnvironmentVariable("ELEVENLABS_VOICE_ID")

if ([string]::IsNullOrEmpty($apiKey) -or [string]::IsNullOrEmpty($voiceId)) {
    Write-Error "Error: ELEVENLABS_API_KEY or ELEVENLABS_VOICE_ID is missing from .env!"
    Exit 1
}

# Function to get custom personality voice tags based on Queri's introverted/competent character
function Get-VoiceTag ($expression, $index) {
    if ($index -eq 1) { return "[softly, nervously] " } # Intro greeting
    if ($index -eq 2) { return "[gently, cheerfully] " } # Welcome details
    if ($index -eq 3) { return "[seriously, confidently] " } # Combat Rule 1
    if ($index -eq 120) { return "[softly, smiling] " } # Farewell

    switch ($expression) {
        "cheerful" { return "[gently, cheerfully] " }
        "thumbsup" { return "[gently, happy] " }
        "normal"   { return "[gently] " }
        "focused"  { return "[seriously, confidently] " }
        "thoughtful" { return "[thoughtfully] " }
        "surprised"  { return "[startled, gasp] " }
        "smug"       { return "[softly, proudly] " }
        "defeated"   { return "[sighs, softly] " }
        default    { return "[gently] " }
    }
}

$slidesFile = Join-Path $PSScriptRoot "slides.js"
$lines = Get-Content -Path $slidesFile -Encoding utf8

$slides = @()
$currentSlide = @{ type="dialogue"; text=$null; section=$null; expression="normal" }
$inSlide = $false
$inHotspots = $false

foreach ($line in $lines) {
    $trimmed = $line.Trim()
    
    if ($trimmed.Contains("hotspots: [")) {
        $inHotspots = $true
    }
    if ($trimmed -eq "]" -or $trimmed -eq "]," -or $trimmed.StartsWith("]")) {
        $inHotspots = $false
    }
    
    if ($trimmed -eq "{" -or $trimmed.StartsWith("{")) {
        if ($inHotspots) {
            continue
        }
        if ($inSlide) {
            $slides += $currentSlide
        }
        $currentSlide = @{ type="dialogue"; text=$null; section=$null; expression="normal" }
        $inSlide = $true
        continue
    }
    
    if ($trimmed -eq "}," -or $trimmed -eq "}") {
        if ($inHotspots) {
            continue
        }
        if ($inSlide) {
            $slides += $currentSlide
            $inSlide = $false
        }
        continue
    }
    
    if ($inSlide) {
        if ($trimmed -match '^type:\s*"([^"]+)"') {
            $currentSlide.type = $Matches[1]
        }
        # Regex matches double-quoted strings and supports escaped double quotes (\")
        elseif ($trimmed -match '^text:\s*"((?:[^"\\]|\\.)*)"') {
            $currentSlide.text = $Matches[1]
        }
        elseif ($trimmed -match '^section:\s*"([^"]+)"') {
            $currentSlide.section = $Matches[1]
        }
        elseif ($trimmed -match '^expression:\s*"([^"]+)"') {
            $currentSlide.expression = $Matches[1]
        }
    }
}

$voiceDir = Join-Path $PSScriptRoot "assets\voice"
if (-not (Test-Path $voiceDir)) {
    New-Item -ItemType Directory -Force -Path $voiceDir | Out-Null
}

Write-Host "Starting voice generation for $($slides.Count) slides using PowerShell..."

$generatedCount = 0
$skippedCount = 0

for ($i=0; $i -lt $slides.Count; $i++) {
    $slide = $slides[$i]
    $outputFile = Join-Path $voiceDir "slide_$i.mp3"
    
    if ($slide.type -eq "video" -or [string]::IsNullOrEmpty($slide.text)) {
        continue
    }
    
    if (Test-Path $outputFile) {
        $skippedCount++
        continue
    }
    
    # Clean text payload (replace escaped quotes with normal ones, remove bold markers)
    $cleanText = $slide.text -replace '\\"', '"'
    $cleanText = $cleanText -replace '\*\*', ''
    $cleanText = $cleanText -replace '#', 'Number '
    $cleanText = $cleanText -replace '\(2 x Toughness\) \+ Armor Block Value', '2 times Toughness plus Armor Block Value'
    
    # Get personality tag based on index and expression, prepending it to payload
    $voiceTag = Get-VoiceTag $slide.expression $i
    $payloadText = $voiceTag + $cleanText
    
    $logText = $cleanText.SubString(0, [System.Math]::Min(50, $cleanText.Length))
    Write-Host "[$($i + 1)/$($slides.Count)] Generating voice for: `"$logText`"..."
    
    $url = "https://api.elevenlabs.io/v1/text-to-speech/$voiceId"
    $headers = @{
        "xi-api-key" = $apiKey
        "Content-Type" = "application/json"
    }
    
    $body = @{
        text = $payloadText
        model_id = "eleven_v3"
        voice_settings = @{
            stability = 0.5
            similarity_boost = 0.75
        }
    } | ConvertTo-Json -Depth 5
    
    try {
        $utf8Body = [System.Text.Encoding]::UTF8.GetBytes($body)
        $response = Invoke-WebRequest -Uri $url -Method Post -Headers $headers -Body $utf8Body -OutFile $outputFile -ContentType "application/json; charset=utf-8"
        
        $generatedCount++
        Write-Host "Saved: assets\voice\slide_$i.mp3"
        
        # Pause to avoid rate limits
        Start-Sleep -Milliseconds 500
    }
    catch {
        Write-Error "Failed to generate slide $i : $_"
        Write-Host "Stopping to prevent quota waste."
        break
    }
}

Write-Host "----------------------------------"
Write-Host "Voice generation complete!"
Write-Host "Generated: $generatedCount files."
Write-Host "Skipped (already exist): $skippedCount files."
