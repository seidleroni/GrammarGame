# Grammar Quiz - Design Reference

## Overview
A 20-question multiple-choice quiz teaching 3rd graders Parts of Speech.
Built as a Blazor WebAssembly standalone app (frontend only, no server).
Hosted on GitHub Pages at https://seidleroni.github.io/GrammarGame/

## Topics (9)
Common Noun, Proper Noun, Plural Noun, Compound Noun, Pronoun, Verb, Adjective, Adverb, Contraction

## Quiz Flow
```
[Start] → click "Start Quiz" → [Playing] → answer → [Feedback] → "Next" → [Playing]...
                                                                   ↓ (after Q20)
                                                              [Results] → "Play Again" → [Start]
```

## Question Selection
- 153 questions in `wwwroot/data/questions.json` (17 per topic)
- Each quiz: 2 from each topic (18) + 2 random (20), shuffled
- Choices shuffled per question via Fisher-Yates

## Score Tiers
| Score | Message |
|-------|---------|
| 18-20 | Grammar Master! |
| 14-17 | Great Job! |
| 10-13 | Keep Practicing! |
| 0-9   | Let's Try Again! |

## Project Structure
```
src/GrammarGame/
  Models/Question.cs        ← Topic enum, Question, QuizPhase, AnsweredQuestion
  Services/QuizService.cs   ← load JSON, select 20, shuffle
  Pages/Quiz.razor          ← single page state machine
  Components/
    StartScreen.razor       ← title + start button
    QuestionCard.razor      ← question display + answer feedback + confetti trigger
    AnswerButton.razor      ← individual choice button (with element ID for confetti)
    ResultsScreen.razor     ← score + tier + play again
  Layout/MainLayout.razor   ← page wrapper, centered container, footer with build info
  wwwroot/
    data/questions.json     ← 153 question bank
    css/app.css             ← kid-friendly theme
    js/confetti.js          ← particle burst animation (JS interop)
    index.html              ← host page with build info placeholder
```

## Key Decisions
- No backend server — pure client-side WASM
- No routing beyond `/` — state machine handles all transitions
- No `IQuizService` interface — single implementation
- JSON question bank — easy to edit without touching C#
- No Bootstrap — custom CSS for kid-friendly look
- JS interop for confetti — CSS-only was too limited for burst-from-button effect

## Deployment
- GitHub Actions workflow (`.github/workflows/deploy.yml`)
- Auto-deploys on every push to `master`
- Patches base href to `/GrammarGame/` for GitHub Pages
- Injects commit hash and build number into footer
- Adds `.nojekyll` and `404.html` for SPA compatibility
