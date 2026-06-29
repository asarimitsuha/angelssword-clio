# Generate Kinen Arima voice lines — ElevenLabs V3 (Enhanced Brackets)
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
$voiceId = "16A45zDIELaRobXp1PPW"  # Kinen Arima's Voice ID

if ([string]::IsNullOrEmpty($apiKey)) {
    Write-Error "Error: ELEVENLABS_API_KEY is missing from root .env!"
    Exit 1
}

$introLines = @(
    @{ text = "Knight of her highness Cherry, Kinen Arima at your service."; tag = "[proudly, elegant, confident] "; id = "kinen_intro_0" }
)

$talkLines = @(
    @{ text = "I served in the Madeline Cavalry under Captain Athena.  She is my mentor."; tag = "[proudly, respectfully] "; id = "kinen_talk_0" },
    @{ text = "I'm a horsegirl, did you know that?"; tag = "[cheerfully, playfully] "; id = "kinen_talk_1" },
    @{ text = "Why the.... long face?"; tag = "[smugly, holding back laughter] "; id = "kinen_talk_2" },
    @{ text = "Prince Casimir... the traitor wants to bring Slavery back to Nuren.  We won't allow it."; tag = "[seriously, angrily, determined] "; id = "kinen_talk_3" },
    @{ text = "Tanya Itia is my partner from Madeline, have you met her yet?"; tag = "[warmly, cheerfully] "; id = "kinen_talk_4" },
    @{ text = "Tanya's last name is Itia... but I've never seen her steal anything.  Isn't that weird?"; tag = "[smugly, teasing, amused] "; id = "kinen_talk_5" },
    @{ text = "Have you ever seen Centaur P.P.?"; tag = "[smugly, mischievously, holding back laughter] "; id = "kinen_talk_6" },
    @{ text = "Did I mention that I am a horsefolk?  I ride a horse though.... funny huh?"; tag = "[cheerfully, amused at herself] "; id = "kinen_talk_7" },
    @{ text = "My favorite food?  Obviously... carrots, right?"; tag = "[smugly, winking] "; id = "kinen_talk_8" },
    @{ text = "I'm always Anglin' and Scheming."; tag = "[smugly, playfully devious] "; id = "kinen_talk_9" },
    @{ text = "My father is a Centaur, but I have this body."; tag = "[casually, matter-of-fact] "; id = "kinen_talk_10" },
    @{ text = "Nurenese barbeque is the best, try it next time."; tag = "[enthusiastically, recommending] "; id = "kinen_talk_11" },
    @{ text = "Captain Yasha?  So cool...."; tag = "[admiringly, starry-eyed] "; id = "kinen_talk_12" },
    @{ text = "Helene?  She's from Nuren I think?  Hmm... probably. heh."; tag = "[smugly, evasively amused] "; id = "kinen_talk_13" },
    @{ text = "Pecorine?  Yeah I know her.  Her sister is the Governor of Madeline, Fontina Caramello."; tag = "[casually, informative] "; id = "kinen_talk_14" },
    @{ text = "Why am I here?  To search for artifacts that will help Princess Cherry."; tag = "[seriously, dutifully] "; id = "kinen_talk_15" },
    @{ text = "Princess Cherry will become Queen."; tag = "[confidently, proudly, with conviction] "; id = "kinen_talk_16" }
)

$allLines = $introLines + $talkLines
$voiceDir = "h:\Git\angelssword-clio\lore\assets\voice"

Write-Host "Generating Kinen Arima voice lines ($($allLines.Count) total)..."
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
