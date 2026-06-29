# Generate Kathelyne Van Dodenrijk voice lines — ElevenLabs V3 (Enhanced Brackets)
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
$voiceId = "0xaoAofc8uENyatFCPlS"  # Kathelyne's Voice ID

if ([string]::IsNullOrEmpty($apiKey)) {
    Write-Error "Error: ELEVENLABS_API_KEY is missing from root .env!"
    Exit 1
}

$introLines = @(
    @{ text = "Out of my way LOSER, I'm Kathelyne Van Dodenrijk.  The HELL do you want?!"; tag = "[aggressively, shouting, condescending] "; id = "kathelyne_intro_0" }
)

$talkLines = @(
    @{ text = "That stupid c... I mean... DIRECTOR.  I will defeat her next time just you wait."; tag = "[angrily, catching herself, seething] "; id = "kathelyne_talk_0" },
    @{ text = "When I defeat the director, I will RULE Mirane! Waaaahahahaha!"; tag = "[maniacally laughing, villainous] "; id = "kathelyne_talk_1" },
    @{ text = "Necromancy isn't even that hard, are you an idiot?!"; tag = "[condescendingly, annoyed, mocking] "; id = "kathelyne_talk_2" },
    @{ text = "So this guy fell into my Zombie trap and died... I think his name was Flonase or something."; tag = "[smugly, dismissively, unbothered] "; id = "kathelyne_talk_3" },
    @{ text = "Yeah I killed that guy from Full Mental Alchemist, he shouldn't have sucked at soccer."; tag = "[smugly, casually, unapologetic] "; id = "kathelyne_talk_4" },
    @{ text = "That SHOPKEEPER! GAH!!!!!  You know she's going to eat your souls right?!"; tag = "[furiously, screaming, warning] "; id = "kathelyne_talk_5" },
    @{ text = "Being a zombie is cooler than being alive, so you should just be okay with it."; tag = "[matter-of-factly, nonchalant] "; id = "kathelyne_talk_6" },
    @{ text = "Come visit the BONE ZONE and die for me!"; tag = "[cheerfully, enthusiastically, sinister] "; id = "kathelyne_talk_7" },
    @{ text = "If the 725 election wasn't so rigged I'd be the ruler of that stupid fort."; tag = "[bitterly, angrily, ranting] "; id = "kathelyne_talk_8" },
    @{ text = "They stuffed the ballots!"; tag = "[shouting, outraged] "; id = "kathelyne_talk_9" },
    @{ text = "Nyanari Fumo?  Yeah she's basically my best friend."; tag = "[warmly, proudly, rare softness] "; id = "kathelyne_talk_10" },
    @{ text = "Now don't get me even STARTED on ISHARA.  Ishara is such a freakin' loser!"; tag = "[furiously, ranting, worked up] "; id = "kathelyne_talk_11" },
    @{ text = "If Ishara wasn't in my way... we could make Mirane great again."; tag = "[smugly, scheming, determined] "; id = "kathelyne_talk_12" },
    @{ text = "[annoyed] Arguing about this and that, who died whose fault it is... [bored] boring!!! Have you tried asking the real question? [maniacally] Is dying even BAD?!"; tag = ""; id = "kathelyne_talk_13" }
)

$allLines = $introLines + $talkLines
$voiceDir = "h:\Git\angelssword-clio\lore\assets\voice"

Write-Host "Generating Kathelyne Van Dodenrijk voice lines ($($allLines.Count) total)..."
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
