namespace GrammarGame.Models;

public enum Topic
{
    CommonNoun,
    ProperNoun,
    PluralNoun,
    CompoundNoun,
    Pronoun,
    Verb,
    Adjective,
    Adverb,
    Contraction
}

public enum QuizPhase
{
    Start,
    Playing,
    Results
}

public class Question
{
    public int Id { get; set; }
    public Topic Topic { get; set; }
    public string Prompt { get; set; } = "";
    public List<string> Choices { get; set; } = [];
    public int CorrectIndex { get; set; }
    public string Explanation { get; set; } = "";
}

public class AnsweredQuestion
{
    public required Question Question { get; init; }
    public required int SelectedIndex { get; init; }
    public bool IsCorrect => SelectedIndex == Question.CorrectIndex;
}
