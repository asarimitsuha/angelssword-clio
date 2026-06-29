# Generate Aniela voice lines — ElevenLabs V3 (Enhanced Brackets)
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
$voiceId = "nyDp10lRkLp56vzeKxvQ"  # Aniela's Voice ID

if ([string]::IsNullOrEmpty($apiKey)) {
    Write-Error "Error: ELEVENLABS_API_KEY is missing from root .env!"
    Exit 1
}

$introLines = @(
    @{ text = "Hello there.  Welcome to the Mirane Expedition Alliance."; tag = "[warmly, professional] "; id = "aniela_intro_0" },
    @{ text = "We coordinate and manage the expeditions into the Astra Line."; tag = "[informative, steady] "; id = "aniela_intro_1" },
    @{ text = "I'm Aniela.  How can I help you?"; tag = "[gently, smiling] "; id = "aniela_intro_2" }
)

$talkLines = @(
    @{ text = "The MEA is the official administrative body for the Town of Mirane and the Mirane Expedition, we've grown a lot in the last year."; tag = "[proudly, informative] "; id = "aniela_talk_0" },
    @{ text = "People come here from all over... for various reasons.  We have researchers, treasure hunters.... explorers... all sorts of people."; tag = "[thoughtfully, reminiscent] "; id = "aniela_talk_1" },
    @{ text = "The Astra Line is a dangerous place... always be prepared with enough food and supplies."; tag = "[seriously, concerned] "; id = "aniela_talk_2" },
    @{ text = "I've been working here since the beginning... 'roped into it' you could say.  But I'm glad to be useful."; tag = "[softly, humble] "; id = "aniela_talk_3" },
    @{ text = "My favorite food?  Honestly anything imported... I'm tired of Chorpa Steaks... although I could really do for some Sorthenese Stew..."; tag = "[lighthearted, wistful] "; id = "aniela_talk_4" },
    @{ text = "Me? Go on expeditions?  Ah... I don't think I'm quite cut out for that."; tag = "[nervously, self-deprecating] "; id = "aniela_talk_5" },
    @{ text = "The Director?  Ah... I owe them a lot.  I'm just happy to have a home here."; tag = "[gratefully, softly] "; id = "aniela_talk_6" },
    @{ text = "Don't try anything funny... last year someone tried a terrorist attack and they were executed instantly... the director has 'ways'..."; tag = "[seriously, warning tone] "; id = "aniela_talk_7" },
    @{ text = "M.E.A. Staff?  Ah theres not too many of us but we're growing,  Theres me, Ravas and Karin among others."; tag = "[warmly, conversational] "; id = "aniela_talk_8" },
    @{ text = "The staff are a bunch of misfits to be honest... but everyone does their best."; tag = "[fondly, chuckling softly] "; id = "aniela_talk_9" },
    @{ text = "Karin?  Ah.  She's nice.  Don't get between her and Mylene though."; tag = "[amused, cautioning] "; id = "aniela_talk_10" },
    @{ text = "If you need any supplies you can ask Pecorine or any of the other merchants in town to try to procure it for you."; tag = "[helpfully, informative] "; id = "aniela_talk_11" },
    @{ text = "If you need something smithed you should ask Fidget Tangan.  Hard to say if she has time though."; tag = "[thoughtfully, slightly amused] "; id = "aniela_talk_12" },
    @{ text = "Crimson?  How do you know about her?"; tag = "[surprised, suspicious] "; id = "aniela_talk_13" },
    @{ text = "Last year we had the world famous Alchemist, Camielelileananu in town... it was quite a treat.  She's so cool."; tag = "[excitedly, admiringly] "; id = "aniela_talk_14" },
    @{ text = "My eyes?  Ah... it's just like this.  Don't worry too much about it."; tag = "[softly, deflecting] "; id = "aniela_talk_15" },
    @{ text = "Don't forget to drink lots of water and get a lot of rest."; tag = "[caringly, motherly] "; id = "aniela_talk_16" },
    @{ text = "If you remember anything... just remember to be safe.  Come back home to me, okay?"; tag = "[warmly, emotionally] "; id = "aniela_talk_17" },
    @{ text = "Everytime an expeditioner dies... it really breaks my heart.  I wish the director would do more to prevent it."; tag = "[sadly, frustrated] "; id = "aniela_talk_18" },
    @{ text = "I respect the director's wishes but... I disagree on the methodology."; tag = "[firmly, conflicted] "; id = "aniela_talk_19" },
    @{ text = "I think it would be great for morale if we hosted a big concert like the Starlight Festival, but not just for idols."; tag = "[excitedly, hopeful] "; id = "aniela_talk_20" },
    @{ text = "Princess Cherry of Madeline is always helping us out so much.  I don't mind the propaganda."; tag = "[appreciatively, slightly amused] "; id = "aniela_talk_21" }
)

$registrationLines = @(
    @{ text = "Oh?  Looking to sign up?"; tag = "[playfully, curious] "; id = "aniela_registration_0" }
)

$allLines = $introLines + $talkLines + $registrationLines
$voiceDir = "h:\Git\angelssword-clio\lore\assets\voice"

Write-Host "Generating Aniela voice lines ($($allLines.Count) total)..."
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
