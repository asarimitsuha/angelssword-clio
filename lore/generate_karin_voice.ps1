# Generate Karin Wi Vanian voice lines — ElevenLabs V3 (Enhanced Brackets)
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
$voiceId = "BilDomFSt2fDfm9Yz8Bp"  # Karin Wi Vanian's Voice ID

if ([string]::IsNullOrEmpty($apiKey)) {
    Write-Error "Error: ELEVENLABS_API_KEY is missing from root .env!"
    Exit 1
}

$introLines = @(
    @{ text = "[cheerfully] Uisu~ Karin here! Whats up?"; tag = ""; id = "karin_intro_0" }
)

$talkLines = @(
    @{ text = "[warmly] Me and Mylene go way back. [happy] I was happy to be reunited with her again after so long."; tag = ""; id = "karin_talk_0" },
    @{ text = "[bitter] Yeah that Ayra idiot from the Angel's Sword guild made me lose her... [determined] but I won't lose her again."; tag = ""; id = "karin_talk_1" },
    @{ text = "Wi Vanian... yes. The famous saboteur house of Sorthen. [casually] Endo is my dad."; tag = ""; id = "karin_talk_2" },
    @{ text = "[fondly] Enrin? Yeah, my big sis. [sighs] I wonder what she's up to right now... she's at the Angel's Sword Guild."; tag = ""; id = "karin_talk_3" },
    @{ text = "[quietly] There was a lot of drama around my sis because of the civil war. We share the same dad, but her mom..."; tag = ""; id = "karin_talk_4" },
    @{ text = "[sighs] Yeah my dad is kind of very strict."; tag = ""; id = "karin_talk_5" },
    @{ text = "The Director? [softly] Ah... I just want a safe place for me and Mylene thats all."; tag = ""; id = "karin_talk_6" },
    @{ text = "[worried] I know the director won't let anything serious happen to Mylene... [hesitant] I think..."; tag = ""; id = "karin_talk_7" },
    @{ text = "[cold] But if she gets hurt on one of your stupid expansion projects, [shouting] I'LL KILL YOU."; tag = ""; id = "karin_talk_8" },
    @{ text = "[cheerfully] My favorite food? [excited] Fried Chicken."; tag = ""; id = "karin_talk_9" },
    @{ text = "[nostalgic] Me and Mylene were friends since we were kids. I used to play over at the D'Escaido house when my sister was working there."; tag = ""; id = "karin_talk_10" },
    @{ text = "[fondly] The head of the house at the time was named Kyrie, she was great... [sadly] she's gone now... rest in peace."; tag = ""; id = "karin_talk_11" },
    @{ text = "The head of the house now is named Rodoreamon D'Escaido. She wasn't originally a D'Escaido but she inhereted the name, just like Mylene."; tag = ""; id = "karin_talk_12" },
    @{ text = "[playfully] Red Halo? Yeah I used to be a member. Maybe I still am a member? [laughs] Wouldn't you like to know?"; tag = ""; id = "karin_talk_13" },
    @{ text = "[coldly] Ange? I won't talk about her."; tag = ""; id = "karin_talk_14" },
    @{ text = "[proud] We demonfolk can surpass the limits of Divine Release. It can go all the way up to form 3."; tag = ""; id = "karin_talk_15" },
    @{ text = "[confident] We Vanians are well known for our mastery of Divine Release."; tag = ""; id = "karin_talk_16" },
    @{ text = "[solemn] Kyrie could reach the third form when she was alive, [sadly] but we all saw what it does to you."; tag = ""; id = "karin_talk_17" }
)

$allLines = $introLines + $talkLines
$voiceDir = "h:\Git\angelssword-clio\lore\assets\voice"

Write-Host "Generating Karin Wi Vanian voice lines ($($allLines.Count) total)..."
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
