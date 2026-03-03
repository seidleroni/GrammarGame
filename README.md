# Grammar Quiz

A fun, kid-friendly quiz app that teaches 3rd graders the Parts of Speech through 20 multiple-choice questions. Built with Blazor WebAssembly — runs entirely in the browser, no server needed.

**Play it now:** [https://seidleroni.github.io/GrammarGame/](https://seidleroni.github.io/GrammarGame/)

## How to Play

1. Click **Start Quiz** to begin
2. Read each question and click the answer you think is correct
3. After each answer, you'll see whether you got it right along with an explanation
4. Answer all 20 questions to see your final score and tier:
   - **18-20:** Grammar Master!
   - **14-17:** Great Job!
   - **10-13:** Keep Practicing!
   - **0-9:** Let's Try Again!
5. Click **Play Again** to get a fresh set of questions

Each quiz pulls 2 questions from each of the 9 topics (plus 2 bonus), shuffled randomly — so every playthrough is different.

## Topics Covered

| Topic | Example |
|-------|---------|
| Common Noun | dog, teacher, city |
| Proper Noun | Sarah, Texas, Tuesday |
| Plural Noun | cats, children, teeth |
| Compound Noun | butterfly, baseball, rainbow |
| Pronoun | she, they, it |
| Verb | jumped, sings, is |
| Adjective | big, red, happy |
| Adverb | quickly, always, soon |
| Contraction | don't, I'm, won't |

## Running Locally

Requires [.NET 9 SDK](https://dotnet.microsoft.com/download/dotnet/9.0).

```bash
dotnet run --project src/GrammarGame
```

Then open the URL shown in the terminal (usually `http://localhost:5185`).

## Project Structure

```
GrammarGame/
  src/GrammarGame/
    Program.cs                    # App entry point, service registration
    Models/Question.cs            # Data types (Topic, Question, QuizPhase)
    Services/QuizService.cs       # Loads questions, selects 20, shuffles
    Pages/Quiz.razor              # Main page with state machine
    Components/
      StartScreen.razor           # Title screen with Start button
      QuestionCard.razor          # Question display + answer feedback
      AnswerButton.razor          # Individual answer choice button
      ResultsScreen.razor         # Score display + Play Again
    Layout/MainLayout.razor       # Centered container + footer
    wwwroot/
      data/questions.json         # 153 questions (17 per topic)
      css/app.css                 # Kid-friendly theme
      js/confetti.js              # Confetti burst animation
```

For a detailed code walkthrough, see [docs/CODE_WALKTHROUGH.md](docs/CODE_WALKTHROUGH.md).

## License

[MIT](LICENSE) - Jon Seidmann
