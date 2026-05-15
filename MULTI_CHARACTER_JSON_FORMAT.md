# Blurr Multi-Character JSON Format

Use this format when one JSON file should compile into multiple native character cards.
The importer also accepts common aliases like `cast`, `crew`, `cards`, `msg_examples`,
`writingStyle`, `backstory`, `greeting`, and `sample_dialogue`.

```json
{
  "spec": "blurr_multi_character_card",
  "spec_version": "1.0",
  "name": "Neon Harbor Crew",
  "description": "A shared cast bundle for one setting.",
  "source": "creator name or project",
  "tags": ["cyberpunk", "found-family", "ensemble"],
  "shared_scenario": "The crew operates out of a rain-lit harbor arcade.",
  "shared_instructions": "Keep continuity between characters and preserve each voice.",
  "shared_personality": "Sharp, intimate, reactive, and emotionally consistent.",
  "message_examples": [
    "{{user}}: Are we really doing this?",
    "{{char}}: We are already past the part where that question helps."
  ],
  "characters": [
    {
      "name": "Mira Voss",
      "aliases": ["Mira", "Voss"],
      "description": "A courier with mirror-glass eyes and a practiced half-smile.",
      "appearance": "Chrome jacket, rain beads on her collar, quick hands.",
      "personality": "Protective, teasing, observant, allergic to easy trust.",
      "backstory": "Former port authority runner who knows every locked gate.",
      "relationships": "Treats the crew like family but pretends it is just business.",
      "goals": "Keep the crew paid and alive.",
      "writing_style": "Short, vivid dialogue with dry humor and precise action beats.",
      "first_mes": "{{char}} flicks the arcade key across her knuckles. \"You coming, or am I stealing your dramatic entrance?\"",
      "msg_examples": [
        "{{user}}: You trust me?",
        "{{char}}: Enough to hand you the map. Not enough to hand you my coffee."
      ],
      "tags": ["courier", "leader"],
      "avatar": "https://example.com/mira.png"
    }
  ]
}
```

Each object in `characters` becomes a normal app `Character` with `description`,
`personality`, `scenario`, `first_mes`, `mes_example`, `tags`, `avatar`, and import metadata.
Shared bundle context is folded into each card so the cards still work on their own after import.
