# Code Walkthrough

This guide walks through the Grammar Quiz codebase file by file. If you're new to Blazor or want to understand how the app fits together, read this in order — each section builds on the previous one.

## Reading Order

Start here and follow the arrows:

```
Program.cs → Models/Question.cs → Services/QuizService.cs → Pages/Quiz.razor
                                                                  ↓
                          ResultsScreen ← QuestionCard ← StartScreen
                                              ↓
                                         AnswerButton
```

---

## 1. Entry Point: `Program.cs`

**File:** `src/GrammarGame/Program.cs`

This is where the app boots up. Blazor WASM apps run entirely in the browser via WebAssembly — there's no server.

```csharp
var builder = WebAssemblyHostBuilder.CreateDefault(args);
builder.RootComponents.Add<App>("#app");          // Mount the app in index.html's <div id="app">
builder.RootComponents.Add<HeadOutlet>("head::after"); // Allow components to set <title>

builder.Services.AddScoped(sp => new HttpClient { ... }); // For fetching questions.json
builder.Services.AddScoped<QuizService>();                 // Our quiz logic service

await builder.Build().RunAsync();
```

**Key concept: Dependency Injection.** `AddScoped<QuizService>()` registers the service so any component can request it with `@inject QuizService QuizService`. In Blazor WASM, "scoped" means one instance per browser tab.

---

## 2. Data Models: `Models/Question.cs`

**File:** `src/GrammarGame/Models/Question.cs`

Defines the data shapes used throughout the app. Read this first so the rest makes sense.

### Topic enum
```csharp
public enum Topic
{
    CommonNoun, ProperNoun, PluralNoun, CompoundNoun,
    Pronoun, Verb, Adjective, Adverb, Contraction
}
```
The 9 parts of speech we quiz on. Used to tag each question and to ensure balanced selection.

### QuizPhase enum
```csharp
public enum QuizPhase { Start, Playing, Results }
```
The three states of the quiz UI. The `Quiz.razor` page uses this as a state machine.

### Question class
```csharp
public class Question
{
    public int Id { get; set; }
    public Topic Topic { get; set; }
    public string Prompt { get; set; } = "";
    public List<string> Choices { get; set; } = [];
    public int CorrectIndex { get; set; }    // Index into Choices
    public string Explanation { get; set; } = "";
}
```
Maps directly to the JSON in `wwwroot/data/questions.json`. The `CorrectIndex` points to the correct answer in the `Choices` array. When choices get shuffled, `CorrectIndex` is updated to match.

### AnsweredQuestion class
```csharp
public class AnsweredQuestion
{
    public required Question Question { get; init; }
    public required int SelectedIndex { get; init; }
    public bool IsCorrect => SelectedIndex == Question.CorrectIndex;
}
```
Tracks what the user picked. `IsCorrect` is computed — no stored state to get out of sync.

---

## 3. Quiz Logic: `Services/QuizService.cs`

**File:** `src/GrammarGame/Services/QuizService.cs`

This is the brain of the app. It loads questions from JSON, selects a balanced set of 20, and shuffles them.

### Loading questions
```csharp
public async Task<List<Question>> LoadQuestionsAsync()
{
    _allQuestions ??= await _http.GetFromJsonAsync<List<Question>>(
        "data/questions.json", JsonOptions) ?? [];
    return _allQuestions;
}
```
- Fetches questions via HTTP (even though it's a local file — Blazor WASM uses HTTP for all static assets)
- `??=` means "only load once, then cache" — subsequent calls return the cached list
- `JsonOptions` configures case-insensitive matching (`correctIndex` in JSON maps to `CorrectIndex` in C#) and enum string conversion (`"Verb"` maps to `Topic.Verb`)

### Selecting 20 questions
```csharp
// Pick 2 from each of the 9 topics (= 18)
foreach (Topic topic in Enum.GetValues<Topic>())
{
    var topicQuestions = all.Where(q => q.Topic == topic).ToList();
    var picked = topicQuestions.OrderBy(_ => rng.Next()).Take(2);
    selected.AddRange(picked);
}

// Pick 2 more from the remaining pool (= 20)
var remaining = all.Except(selected).OrderBy(_ => rng.Next()).Take(2);
selected.AddRange(remaining);
```
This guarantees every topic appears at least twice. The 2 bonus questions add variety.

### Shuffling with Fisher-Yates
```csharp
private static void Shuffle<T>(List<T> list, Random rng)
{
    for (int i = list.Count - 1; i > 0; i--)
    {
        int j = rng.Next(i + 1);
        (list[i], list[j]) = (list[j], list[i]);
    }
}
```
The [Fisher-Yates shuffle](https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle) is the standard way to randomly reorder a list with uniform probability. Used for both question order and answer choice order.

### Shuffling choices without losing the answer
```csharp
private static void ShuffleChoices(Question q, Random rng)
{
    var correctText = q.Choices[q.CorrectIndex]; // Save the answer text
    Shuffle(q.Choices, rng);                      // Shuffle the choices
    q.CorrectIndex = q.Choices.IndexOf(correctText); // Find where it landed
}
```
The correct answer's position in the array changes after shuffling, so we update `CorrectIndex` to point to its new location.

---

## 4. The Main Page: `Pages/Quiz.razor`

**File:** `src/GrammarGame/Pages/Quiz.razor`

This is the single page of the app. It implements a state machine with three phases.

### State machine (the template)
```razor
@switch (phase)
{
    case QuizPhase.Start:
        <StartScreen OnStart="StartQuiz" />
        break;

    case QuizPhase.Playing:
        <QuestionCard ... OnAnswered="RecordAnswer" OnNext="NextQuestion" />
        break;

    case QuizPhase.Results:
        <ResultsScreen Score="@answers.Count(a => a.IsCorrect)" ... />
        break;
}
```
Only one component renders at a time. The `phase` variable controls which one.

### Transitions (the code)
- **Start → Playing:** `StartQuiz()` calls `QuizService.GenerateQuizAsync()`, then sets `phase = QuizPhase.Playing`
- **Playing → Playing:** `NextQuestion()` increments `currentIndex` and calls `questionCard.Reset()`
- **Playing → Results:** `NextQuestion()` detects we're past question 20 and sets `phase = QuizPhase.Results`
- **Results → Start:** `ResetQuiz()` sets `phase = QuizPhase.Start`

### The `@ref` pattern
```razor
<QuestionCard @ref="questionCard" ... />
```
```csharp
private QuestionCard? questionCard;
```
`@ref` gives the parent a reference to the child component, allowing it to call `questionCard.Reset()` directly. This is how we clear the feedback state when advancing to the next question.

---

## 5. Components

### `StartScreen.razor`

The simplest component — just a title, description, and button.

```razor
<button class="btn-start" @onclick="OnStart">Start Quiz</button>

@code {
    [Parameter, EditorRequired]
    public EventCallback OnStart { get; set; }
}
```
**Key concept: EventCallback.** The parent (`Quiz.razor`) passes a method reference as a parameter. When the button is clicked, it calls back up to the parent. This is how child-to-parent communication works in Blazor.

### `AnswerButton.razor`

Renders a single answer choice. The interesting part is the conditional CSS class:

```csharp
private string StateClass => (ShowFeedback, Index) switch
{
    _ when !ShowFeedback => "",           // Not answered yet: neutral
    _ when Index == CorrectIndex => "correct",  // This is the right answer: green
    _ when Index == SelectedIndex => "wrong",   // User picked this wrong one: red
    _ => "dimmed"                                // Other wrong answers: faded
};
```

The button also has `id="answer-btn-@Index"` so the confetti JavaScript can find the correct button's position on screen.

### `QuestionCard.razor`

The most complex component. It manages the feedback sub-state within the Playing phase.

**Flow:**
1. User clicks an AnswerButton → `HandleAnswer(index)` fires
2. `HandleAnswer` records the selection, determines correctness, shows feedback
3. If correct, triggers confetti via JS interop: `await JS.InvokeVoidAsync("confetti.burst", ...)`
4. User clicks "Next Question" → `OnNext` callback fires up to `Quiz.razor`
5. Parent calls `questionCard.Reset()` which clears feedback state

**JS Interop:**
```csharp
@inject IJSRuntime JS
...
await JS.InvokeVoidAsync("confetti.burst", $"answer-btn-{Question.CorrectIndex}");
```
This calls the JavaScript `window.confetti.burst()` function, passing the HTML element ID of the correct answer button. Blazor's `IJSRuntime` is the bridge between C# and browser JavaScript.

### `ResultsScreen.razor`

Displays the score and a tier message using a switch expression:

```csharp
private string TierMessage => Score switch
{
    >= 18 => "Grammar Master!",
    >= 14 => "Great Job!",
    >= 10 => "Keep Practicing!",
    _ => "Let's Try Again!"
};
```

---

## 6. Layout & Styling

### `Layout/MainLayout.razor`

Wraps everything in a flexbox column so the footer sticks to the bottom of the viewport:

```razor
<div class="page-wrapper">
    <main class="quiz-container">
        @Body
    </main>
    <footer class="site-footer">...</footer>
</div>
```

The footer also displays a build label (commit hash + build number) on deployed builds. It reads this from `window.buildInfo` via JS interop in `OnAfterRenderAsync` — hidden in local dev where the values are "dev"/"local".

### `wwwroot/css/app.css`

All styling in one file. The design priorities:
- **Kid-friendly:** Large fonts (18px base), big touch targets (56px min button height), 16px border radius
- **Clear feedback:** Green for correct, red for wrong, dimmed for other choices
- **Simple layout:** Single column, max-width 600px, centered
- **No overflow:** `box-sizing: border-box` globally, `overflow-x: hidden` on body

### `wwwroot/index.html`

The single HTML page that hosts the Blazor app. Key lines:
- `<div id="app">` — Blazor mounts here
- `window.buildInfo = { commit: "dev", build: "local" }` — Placeholders replaced by the CI workflow with the real commit SHA and build number
- `<script src="_framework/blazor.webassembly.js">` — Loads the Blazor runtime
- `<script src="js/confetti.js">` — Loads our confetti animation

---

## 7. Confetti: `wwwroot/js/confetti.js`

Pure JavaScript particle system. When a correct answer is selected, Blazor calls `confetti.burst(elementId)`.

**How it works:**
1. `burst()` finds the button element and gets its screen position
2. Fires 3 waves (60, 40, 30 particles) with staggered delays for a sustained effect
3. Each particle gets:
   - Random shape (circle, rectangle, star, or streamer)
   - Random color from a palette of 15
   - Random launch angle with upward bias
   - Physics simulation: velocity, gravity, air drag, spin
   - Fade-out in the last 30% of its lifetime
4. Each particle runs its own `requestAnimationFrame` loop until it fades, then removes itself from the DOM

---

## 8. Question Bank: `wwwroot/data/questions.json`

153 questions, 17 per topic. Each question follows this format:

```json
{
    "id": 1,
    "topic": "CommonNoun",
    "prompt": "Which word is a common noun? \"The dog ran across the park.\"",
    "choices": ["ran", "the", "dog", "across"],
    "correctIndex": 2,
    "explanation": "'Dog' is a common noun because it names a general animal."
}
```

To add more questions, just append to this file. The `QuizService` will automatically include them in the selection pool.

---

## 9. Deployment: `.github/workflows/deploy.yml`

GitHub Actions workflow that runs on every push to `master`:
1. Checks out code
2. Runs `dotnet publish` (compiles C# to WebAssembly)
3. Patches the `<base href>` for GitHub Pages subdirectory hosting
4. Injects the short commit SHA and build number (`github.run_number`) into `window.buildInfo` in `index.html`
5. Adds `.nojekyll` (tells GitHub Pages not to process files with Jekyll)
6. Copies `index.html` to `404.html` (so client-side routing works on direct URL access)
7. Deploys to GitHub Pages

---

## Data Flow Summary

```
questions.json → QuizService.LoadQuestionsAsync() → cache
                 QuizService.GenerateQuizAsync()   → select 20, shuffle
                                                        ↓
Quiz.razor (state machine) ←→ QuestionCard ←→ AnswerButton
         ↓                          ↓               ↓
    RecordAnswer()           HandleAnswer()     OnClick()
    NextQuestion()           confetti.burst()
         ↓
    ResultsScreen (score + tier)
```
