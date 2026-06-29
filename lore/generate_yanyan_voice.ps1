# Generate Yanyan Itia voice lines — ElevenLabs V3 (Enhanced Brackets)
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
$voiceId = "ORhWnpKGENvrqiTXzAct"  # Yanyan Itia's Voice ID

if ([string]::IsNullOrEmpty($apiKey)) {
    Write-Error "Error: ELEVENLABS_API_KEY is missing from root .env!"
    Exit 1
}

$introLines = @(
    @{ text = "Ah... hello... I'm sorry I just.  I don't feel like it anymore..."; tag = "[sadly, defeated, quiet sigh] "; id = "yanyan_intro_0" }
)

$talkLines = @(
    @{ text = "I'm Yanyan Itia... I'm an expeditioner... but I'm taking a break."; tag = "[quietly, subdued] "; id = "yanyan_talk_0" },
    @{ text = "I wonder what Camielelileananu would do..."; tag = "[softly, wondering, wistful] "; id = "yanyan_talk_1" },
    @{ text = "I wonder how Selle is... I wish she were here with me now..."; tag = "[sadly, longing] "; id = "yanyan_talk_2" },
    @{ text = "I'm sorry... its just... the Astra Line took something precious from me."; tag = "[apologetically, voice breaking] "; id = "yanyan_talk_3" },
    @{ text = "I miss him so much..."; tag = "[tearfully, aching] "; id = "yanyan_talk_4" },
    @{ text = "He was my hero, you know?"; tag = "[softly, fondly, with pain] "; id = "yanyan_talk_5" },
    @{ text = "I heard there are new expeditioners arriving every day now... be careful out there, okay?"; tag = "[gently, concerned, caring] "; id = "yanyan_talk_6" },
    @{ text = "Bioalchemistry can be painful... but it's a powerful skill."; tag = "[quietly, reflective] "; id = "yanyan_talk_7" }
)

$allLines = $introLines + $talkLines
$voiceDir = "h:\Git\angelssword-clio\lore\assets\voice"

Write-Host "Generating Yanyan Itia voice lines ($($allLines.Count) total)..."
Write-Host "Voice ID: $voiceId"
Write-Host "Model: eleven_v3 (Enhanced Brackets)"
Write-Host ""

$generatedCount = 0
$skippedCount = 0

foreach ($line in $allLines) {
    $outputFile = Join-Path $voiceDir "$($line.id).mp3"
    
    if (Test-Path $outputFile) {
        Write-Host "  Skipped (exists): $($line.id).mp3"
        $skippedCount++
        continue
    }
    
    $cleanText = $line.text -replace '\*\*', ''
    $payloadText = $line.tag + $cleanText
    
    $logText = $cleanText.SubString(0, [System.Math]::Min(60, $cleanText.Length))
    Write-Host "  Generating: `"$logText`"..."
    
    $url = "https://api.elevenlabs.io/v1/text-to-speech/$voiceId"
    $headers = @{
        "xi-api-key" = $apiKey
        "Content-Type" = "application/json"
    }
    
    $body = @{
        text = $payloadText
        model_id = "eleven_v3"
        voice_settings = @{
            stability = 0.8
            similarity_boost = 0.85
        }
    } | ConvertTo-Json -Depth 5
    
    try {
        $utf8Body = [System.Text.Encoding]::UTF8.GetBytes($body)
        Invoke-WebRequest -Uri $url -Method Post -Headers $headers -Body $utf8Body -OutFile $outputFile -ContentType "application/json; charset=utf-8"
        
        $generatedCount++
        Write-Host "  Saved: $($line.id).mp3"
        
        Start-Sleep -Milliseconds 500
    }
    catch {
        Write-Error "Failed to generate voice for $($line.id): $_"
        break
    }
}

Write-Host ""
Write-Host "Done! Generated: $generatedCount, Skipped: $skippedCount"
