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
$voiceId = "sXGypTRTJpbMumoCQjEq" # Philomel's Voice ID

if ([string]::IsNullOrEmpty($apiKey)) {
    Write-Error "Error: ELEVENLABS_API_KEY is missing from root .env!"
    Exit 1
}

$vnScript = @(
    @{ text = "Oh! A visitor... Welcome to the Riannon Institute of Alchemy... [pause]"; tag = "[cheerfully, welcoming] "; id = "vn_0" },
    @{ text = "I'm Philomel - a researcher here. I help maintain the archives and special collections."; tag = "[gently, smiling] "; id = "vn_1" },
    @{ text = "We have light novels, historical records, academy research notes, and field reports from adventurers across Lyr."; tag = "[gently, informative] "; id = "vn_2" },
    @{ text = "Feel free to browse the shelves and pick up anything that catches your eye. I'll be here if you need help!"; tag = "[warmly, cheerfully] "; id = "vn_3" }
)

$deskDialogue = @(
    @{ text = "Hello.  I'm Philomel Lapis.  I've been a member of the academy for quite some time."; tag = "[gently, smiling] "; id = "desk_0" },
    @{ text = "The Riannon Institute of Alchemy has been around for centuries and has a rich history.  Famous mages have graduated from here... including the World Famous Camielelileananu, Mirane and Chroma Lichtvog to name a few."; tag = "[thoughtfully, informative] "; id = "desk_1" },
    @{ text = "Isn't alchemy amazing?  You can make so many useful things out of what others would consider weeds or junk."; tag = "[gently, happy] "; id = "desk_2" },
    @{ text = "My wife?  Ah... yeah... she's back at Sylvan.  I miss her."; tag = "[sighs softly, sadly] "; id = "desk_3" },
    @{ text = "Inter-racial procreation?  Ah... I see you're one of those...  I think theres a book by Dr. Mizi Marion somewhere..."; tag = "[thoughtfully, slightly hesitant] "; id = "desk_4" },
    @{ text = "The four swords war?  Ah... yes, I was a member of Ayra's party.  That Ayra, the holy maiden.  I was the airship's doctor onboard the Nadesico."; tag = "[seriously, reminiscent] "; id = "desk_5" },
    @{ text = "Hazel Nutella?  I don't want to talk about her..."; tag = "[slightly annoyed, dismissive] "; id = "desk_6" },
    @{ text = "I think I consider myself a member of the Angel's Sword Guild.  I do find myself working there a lot."; tag = "[gently, with pride] "; id = "desk_7" },
    @{ text = "My favorite food?  Oh... I adore Nurenese Steak.  It's really the best.  Although prices have gone up significantly since the war..."; tag = "[cheerfully, excited] "; id = "desk_8" },
    @{ text = "Are you considering enrolling as a student here?  I would make sure to brush up on the basics first!  It's not easy to get in."; tag = "[smiling, encouragingly] "; id = "desk_9" },
    @{ text = "You want a certain potion from me?  Oh... that... well...  can we not talk about that...."; tag = "[blushing, nervously, stuttering slightly] "; id = "desk_10" },
    @{ text = "What do slime cores taste like?  Why do people always ask that?!"; tag = "[slightly annoyed, exasperated] "; id = "desk_11" }
)

$guardVoiceId = "3GOJlN3hHaCElE5bLCIF"
$guardModelId = "eleven_multilingual_v2"

$guardIntro = @(
    @{ text = "Hello.  Welcome to the Free Trade City of Mothergreen."; tag = ""; id = "guard_intro_0"; voiceId = $guardVoiceId; modelId = $guardModelId },
    @{ text = "Let me know if I can help you with anything."; tag = ""; id = "guard_intro_1"; voiceId = $guardVoiceId; modelId = $guardModelId }
)

$guardDialogue = @(
    @{ text = "Don't try to start any trouble okay?"; tag = ""; id = "guard_talk_0"; voiceId = $guardVoiceId; modelId = $guardModelId },
    @{ text = "Mothergreen exists on the intersection of the Fayto and Signum Leylines."; tag = ""; id = "guard_talk_1"; voiceId = $guardVoiceId; modelId = $guardModelId },
    @{ text = "Why are leylines important?  Well airships need them to travel... otherwise you're burning too much magical fuel."; tag = ""; id = "guard_talk_2"; voiceId = $guardVoiceId; modelId = $guardModelId },
    @{ text = "The city is run by a Mercantile collective that has its own army."; tag = ""; id = "guard_talk_3"; voiceId = $guardVoiceId; modelId = $guardModelId },
    @{ text = "Huh? Rabbitfolk? Why do you think I would dislike Rabbitfolk?"; tag = ""; id = "guard_talk_4"; voiceId = $guardVoiceId; modelId = $guardModelId },
    @{ text = "I miss going on vacation to Madeline, they have great restaurants there, but no chance I'm going there with the war and all."; tag = ""; id = "guard_talk_5"; voiceId = $guardVoiceId; modelId = $guardModelId },
    @{ text = "I hope we don't get too involved in the Dacquoise war...."; tag = ""; id = "guard_talk_6"; voiceId = $guardVoiceId; modelId = $guardModelId },
    @{ text = "Lorenz Gang?  Bunch of ruffians..."; tag = ""; id = "guard_talk_7"; voiceId = $guardVoiceId; modelId = $guardModelId },
    @{ text = "The Riannon Institute of Alchemy?  Its world famous, only the Merlin Academy of Magic in Northi is even close."; tag = ""; id = "guard_talk_8"; voiceId = $guardVoiceId; modelId = $guardModelId },
    @{ text = "My sword style?  Hah.  Aurora Blade Style obviously... Idris was a legend in Mothergreen!"; tag = ""; id = "guard_talk_9"; voiceId = $guardVoiceId; modelId = $guardModelId },
    @{ text = "Angel's Sword Guild?  Ugh... I don't want to talk about it... but they cause so many problems."; tag = ""; id = "guard_talk_10"; voiceId = $guardVoiceId; modelId = $guardModelId }
)

$queriVoiceId = "d0wb9rsT2TIbYeaf0eps"
$queriModelId = "eleven_v3"

$queriDialogue = @(
    @{ text = "Hi!  I'm Queri Lilibit. Alchemist, Transmuter, Fiend Researcher and Faerie Fencer!"; tag = "[cheerfully, enthusiastically, introducing herself] "; id = "queri_talk_0"; voiceId = $queriVoiceId; modelId = $queriModelId },
    @{ text = "I highly recommend the combat school if you're new here... it could save your life."; tag = "[earnestly, encouraging] "; id = "queri_talk_1"; voiceId = $queriVoiceId; modelId = $queriModelId },
    @{ text = "I also run an Alchemy Shop in town, you should come visit sometime!"; tag = "[cheerfully, warmly] "; id = "queri_talk_2"; voiceId = $queriVoiceId; modelId = $queriModelId },
    @{ text = "My party members, Nia and Ashe are always doing crazy things... I'm always worried about them."; tag = "[sighs fondly, worried] "; id = "queri_talk_3"; voiceId = $queriVoiceId; modelId = $queriModelId },
    @{ text = "I'm a Fiend researcher, did you know that?  I graduated from the Riannon Institute of Alchemy."; tag = "[proudly, smiling] "; id = "queri_talk_4"; voiceId = $queriVoiceId; modelId = $queriModelId },
    @{ text = "No... I don't personally know Camielelileananu...  not every Alchemist is her friend you know."; tag = "[slightly annoyed, defensive] "; id = "queri_talk_5"; voiceId = $queriVoiceId; modelId = $queriModelId },
    @{ text = "Fiends are always evil, but people forget that...  a veteran expeditioner died recently because they forgot that..."; tag = "[seriously, sadly, warning] "; id = "queri_talk_6"; voiceId = $queriVoiceId; modelId = $queriModelId },
    @{ text = "Fiends just want to deceive you... but I heard some rumors of people who were fiends that regained their sanity and state of mind."; tag = "[thoughtfully, uncertain] "; id = "queri_talk_7"; voiceId = $queriVoiceId; modelId = $queriModelId },
    @{ text = "Is such a thing possible?  Its just stories from the east...."; tag = "[quietly, pondering] "; id = "queri_talk_8"; voiceId = $queriVoiceId; modelId = $queriModelId },
    @{ text = "People who eat Astra Sporocarps can exhibit fiend-like abilities.  It changes you."; tag = "[seriously, informative, warning] "; id = "queri_talk_9"; voiceId = $queriVoiceId; modelId = $queriModelId },
    @{ text = "Don't forget to bring smoke flasks!  They're a lifesaver."; tag = "[cheerfully, enthusiastic] "; id = "queri_talk_10"; voiceId = $queriVoiceId; modelId = $queriModelId },
    @{ text = "My favorite food?  I love meat stew with berries.  But lately I've been craving Chorpa Steaks.  Have you had it?"; tag = "[excitedly, cheerfully, hungry] "; id = "queri_talk_11"; voiceId = $queriVoiceId; modelId = $queriModelId },
    @{ text = "The director?  I've never met them... I don't think anyone even knows what they look like."; tag = "[thoughtfully, mysterious] "; id = "queri_talk_12"; voiceId = $queriVoiceId; modelId = $queriModelId }
)

$nixVoiceId = "9u86DPHmLCsRuX8nOpYt"
$nixModelId = "eleven_v3"

$nixIntro = @(
    @{ text = "Heya!  I'm Nix Ni Arlan, airship pilot and navigator for the Angel's Sword Guild."; tag = "[cheerfully, energetic, introducing herself] "; id = "nix_intro_0"; voiceId = $nixVoiceId; modelId = $nixModelId },
    @{ text = "I'm off today, but I'm trying to make some money so... I'll take you anywhere you want."; tag = "[casually, friendly, slightly sheepish] "; id = "nix_intro_1"; voiceId = $nixVoiceId; modelId = $nixModelId }
)

$nixDialogue = @(
    @{ text = "I love that feeling of the wind in your hair.  Airships are the best way to travel."; tag = "[dreamily, happily] "; id = "nix_talk_0"; voiceId = $nixVoiceId; modelId = $nixModelId },
    @{ text = "Obviously we would have to use leylines.... Magical Fuel Prices these days...."; tag = "[sighs, annoyed] "; id = "nix_talk_1"; voiceId = $nixVoiceId; modelId = $nixModelId },
    @{ text = "Our airship has upgraded engines from Sorthen, the best!"; tag = "[proudly, enthusiastic] "; id = "nix_talk_2"; voiceId = $nixVoiceId; modelId = $nixModelId },
    @{ text = "Never skimp out and buy Northi engines..."; tag = "[seriously, warning] "; id = "nix_talk_3"; voiceId = $nixVoiceId; modelId = $nixModelId },
    @{ text = "Oh! You noticed my name, Ni Arlan.  My family is famous for airship engineers and helmsman."; tag = "[pleasantly surprised, proud] "; id = "nix_talk_4"; voiceId = $nixVoiceId; modelId = $nixModelId },
    @{ text = "The funny thing though... my mom is a Cannoneer!  She fought in the battle of Sorthen."; tag = "[cheerfully, amused, proud] "; id = "nix_talk_5"; voiceId = $nixVoiceId; modelId = $nixModelId },
    @{ text = "Why do I need money? Hmm... let's just say... I have very pricey expenses."; tag = "[evasively, slightly nervous] "; id = "nix_talk_6"; voiceId = $nixVoiceId; modelId = $nixModelId },
    @{ text = "What? No!  I'm not buying Frixie Dust... geez...."; tag = "[defensively, flustered, annoyed] "; id = "nix_talk_7"; voiceId = $nixVoiceId; modelId = $nixModelId },
    @{ text = "My sister Mix is such a gearhead.  She always comes home covered in dirt and oil."; tag = "[fondly, amused] "; id = "nix_talk_8"; voiceId = $nixVoiceId; modelId = $nixModelId },
    @{ text = "I'm not really much of a fighter, but my sister can really defend herself."; tag = "[casually, admiring] "; id = "nix_talk_9"; voiceId = $nixVoiceId; modelId = $nixModelId },
    @{ text = "She's got a Divine Arms... and its quite strong."; tag = "[impressed, slightly awed] "; id = "nix_talk_10"; voiceId = $nixVoiceId; modelId = $nixModelId },
    @{ text = "I was supposed to take over the family engineering business but... I was a bit of a failure lets just say."; tag = "[sadly, self-deprecating] "; id = "nix_talk_11"; voiceId = $nixVoiceId; modelId = $nixModelId },
    @{ text = "Yeah I fought in the four swords war.  I pulled some pretty crazy maneuvers then..."; tag = "[proudly, reminiscent] "; id = "nix_talk_12"; voiceId = $nixVoiceId; modelId = $nixModelId },
    @{ text = "One time... I dove an airship straight into the mouth of a fiend to blast it with the buster cannon!  True story!"; tag = "[excitedly, animatedly, bragging] "; id = "nix_talk_13"; voiceId = $nixVoiceId; modelId = $nixModelId },
    @{ text = "Airships are romantic... they can take you anywhere you want to go..."; tag = "[softly, dreamily, wistfully] "; id = "nix_talk_14"; voiceId = $nixVoiceId; modelId = $nixModelId },
    @{ text = "Leaflit?  Oh she's my best friend, we've been friends for a while."; tag = "[warmly, happily] "; id = "nix_talk_15"; voiceId = $nixVoiceId; modelId = $nixModelId }
)

$mirrimeVoiceId = "GWU7g3UqEc33nEw9PJcT"
$mirrimeModelId = "eleven_v3"

$mirrimeIntro = @(
    @{ text = "Hey.  You look new around here!"; tag = "[casually, friendly, curious] "; id = "mirrime_intro_0"; voiceId = $mirrimeVoiceId; modelId = $mirrimeModelId },
    @{ text = "Do you need help?"; tag = "[warmly, offering help] "; id = "mirrime_intro_1"; voiceId = $mirrimeVoiceId; modelId = $mirrimeModelId }
)

$mirrimeDialogue = @(
    @{ text = "I'm Mirrime Wolkensang!  Goblin warrior!  I won't lose to anyone!"; tag = "[proudly, fiercely, pumped up] "; id = "mirrime_talk_0"; voiceId = $mirrimeVoiceId; modelId = $mirrimeModelId },
    @{ text = "I'm following the path of Eisen!"; tag = "[determinedly, passionately] "; id = "mirrime_talk_1"; voiceId = $mirrimeVoiceId; modelId = $mirrimeModelId },
    @{ text = "I arrived here in Mirane a little bit over a year ago. We've been through a lot..."; tag = "[reflectively, quietly] "; id = "mirrime_talk_2"; voiceId = $mirrimeVoiceId; modelId = $mirrimeModelId },
    @{ text = "Dragon Claw War... I'll never forgive them.  I'll never forgive the cultists..."; tag = "[angrily, bitterly, with pain] "; id = "mirrime_talk_3"; voiceId = $mirrimeVoiceId; modelId = $mirrimeModelId },
    @{ text = "When Sebo and Tereval died in that battle... I didn't know what to do..."; tag = "[sadly, voice breaking slightly] "; id = "mirrime_talk_4"; voiceId = $mirrimeVoiceId; modelId = $mirrimeModelId },
    @{ text = "Thats what this is here... the statue of Mirane.  The namesake of this town."; tag = "[solemnly, respectfully] "; id = "mirrime_talk_5"; voiceId = $mirrimeVoiceId; modelId = $mirrimeModelId },
    @{ text = "When an expeditioner dies, their most important item is left here at the statue.  Its so we always remember them..."; tag = "[softly, reverently, sadly] "; id = "mirrime_talk_6"; voiceId = $mirrimeVoiceId; modelId = $mirrimeModelId },
    @{ text = "Jerry?  Gah... he's so annoying man!"; tag = "[exasperated, annoyed, groaning] "; id = "mirrime_talk_7"; voiceId = $mirrimeVoiceId; modelId = $mirrimeModelId },
    @{ text = "When you get settled, lets go on an expedition together! Ehehehe!"; tag = "[excitedly, mischievously laughing] "; id = "mirrime_talk_8"; voiceId = $mirrimeVoiceId; modelId = $mirrimeModelId },
    @{ text = "Why am I in Mirane?  I hope to find an Astra Relic that will heal my people."; tag = "[seriously, with determination] "; id = "mirrime_talk_9"; voiceId = $mirrimeVoiceId; modelId = $mirrimeModelId },
    @{ text = "Goblins and Orcs are the same race... Orcs have a disease.  Our people have traded health for power for generations."; tag = "[seriously, informatively, with sadness] "; id = "mirrime_talk_10"; voiceId = $mirrimeVoiceId; modelId = $mirrimeModelId },
    @{ text = "Our people are disadvantaged in many ways... but we won't let that stop us.  It just means when we do well it means so much more!"; tag = "[passionately, defiantly, with pride] "; id = "mirrime_talk_11"; voiceId = $mirrimeVoiceId; modelId = $mirrimeModelId },
    @{ text = "Dr. Ziggy?  Yeah I know about him... I heard he tried to create a virus to kill all life in Lyr.  I hear he's out here somewhere..."; tag = "[seriously, disturbed, cautious] "; id = "mirrime_talk_12"; voiceId = $mirrimeVoiceId; modelId = $mirrimeModelId },
    @{ text = "Oh those drinks... yeah I don't want to drink any Gobbo Fuel.  Those were made by Dr. Ziggy you know..."; tag = "[disgusted, waving hand dismissively] "; id = "mirrime_talk_13"; voiceId = $mirrimeVoiceId; modelId = $mirrimeModelId },
    @{ text = "Astra poisoning feels awful... it feels like when you've stayed up for two days in a row and haven't slept."; tag = "[tiredly, grimacing] "; id = "mirrime_talk_14"; voiceId = $mirrimeVoiceId; modelId = $mirrimeModelId },
    @{ text = "My favorite food?  Chorpa Ribeye!"; tag = "[excitedly, hungrily] "; id = "mirrime_talk_15"; voiceId = $mirrimeVoiceId; modelId = $mirrimeModelId },
    @{ text = "I heard in the Heartwood theres a really good restaurant.  It's ran by the crows."; tag = "[casually, interested] "; id = "mirrime_talk_16"; voiceId = $mirrimeVoiceId; modelId = $mirrimeModelId },
    @{ text = "Helvetica?  I know a lot of Miraners are hunting her down."; tag = "[seriously, grimly] "; id = "mirrime_talk_17"; voiceId = $mirrimeVoiceId; modelId = $mirrimeModelId },
    @{ text = "A void crow told me that there was a large temple to Eisen in the Lightning Wastes... when I get strong enough I'll go."; tag = "[determinedly, dreamily] "; id = "mirrime_talk_18"; voiceId = $mirrimeVoiceId; modelId = $mirrimeModelId },
    @{ text = "Whatever you do avoid Malignance Rift..."; tag = "[seriously, warning, slightly scared] "; id = "mirrime_talk_19"; voiceId = $mirrimeVoiceId; modelId = $mirrimeModelId },
    @{ text = "Be careful around Thousand Lakes, I got attacked once by a group calling themselves, Silica Wraiths"; tag = "[cautiously, warning] "; id = "mirrime_talk_20"; voiceId = $mirrimeVoiceId; modelId = $mirrimeModelId }
)

$voiceDir = "h:\Git\angelssword-clio\lore\assets\voice"
if (-not (Test-Path $voiceDir)) {
    New-Item -ItemType Directory -Force -Path $voiceDir | Out-Null
}

$allLines = $vnScript + $deskDialogue + $guardIntro + $guardDialogue + $queriDialogue + $nixIntro + $nixDialogue + $mirrimeIntro + $mirrimeDialogue
$generatedCount = 0
$skippedCount = 0

foreach ($line in $allLines) {
    $outputFile = Join-Path $voiceDir "$($line.id).mp3"
    
    if (Test-Path $outputFile) {
        $skippedCount++
        continue
    }
    
    $cleanText = $line.text
    $cleanText = $cleanText -replace '\*\*', ''
    
    $payloadText = $line.tag + $cleanText
    
    $logText = $cleanText.SubString(0, [System.Math]::Min(50, $cleanText.Length))
    Write-Host "Generating voice for: `"$logText`"..."
    
    $lineVoiceId = if ($line.voiceId) { $line.voiceId } else { $voiceId }
    $url = "https://api.elevenlabs.io/v1/text-to-speech/$lineVoiceId"
    $headers = @{
        "xi-api-key" = $apiKey
        "Content-Type" = "application/json"
    }
    
    $lineModelId = if ($line.modelId) { $line.modelId } else { "eleven_v3" }
    $body = @{
        text = $payloadText
        model_id = $lineModelId
        voice_settings = @{
            stability = 0.8
            similarity_boost = 0.85
        }
    } | ConvertTo-Json -Depth 5
    
    try {
        $utf8Body = [System.Text.Encoding]::UTF8.GetBytes($body)
        $response = Invoke-WebRequest -Uri $url -Method Post -Headers $headers -Body $utf8Body -OutFile $outputFile -ContentType "application/json; charset=utf-8"
        
        $generatedCount++
        Write-Host "Saved: assets/voice/$($line.id).mp3"
        
        # Pause to avoid rate limits
        Start-Sleep -Milliseconds 500
    }
    catch {
        Write-Error "Failed to generate voice for $($line.id) : $_"
        break
    }
}

Write-Host "Generated: $generatedCount files, Skipped: $skippedCount files."
