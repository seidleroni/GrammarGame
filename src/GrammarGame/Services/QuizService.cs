using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using GrammarGame.Models;

namespace GrammarGame.Services;

public class QuizService
{
    private readonly HttpClient _http;
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        Converters = { new JsonStringEnumConverter() }
    };
    private List<Question>? _allQuestions;

    public QuizService(HttpClient http)
    {
        _http = http;
    }

    public async Task<List<Question>> LoadQuestionsAsync()
    {
        _allQuestions ??= await _http.GetFromJsonAsync<List<Question>>("data/questions.json", JsonOptions) ?? [];
        return _allQuestions;
    }

    public async Task<List<Question>> GenerateQuizAsync()
    {
        var all = await LoadQuestionsAsync();
        var rng = new Random();
        var selected = new List<Question>();

        // Pick 2 from each of the 9 topics
        foreach (Topic topic in Enum.GetValues<Topic>())
        {
            var topicQuestions = all.Where(q => q.Topic == topic).ToList();
            var picked = topicQuestions.OrderBy(_ => rng.Next()).Take(2);
            selected.AddRange(picked);
        }

        // Pick 2 more from remaining questions
        var remaining = all.Except(selected).OrderBy(_ => rng.Next()).Take(2);
        selected.AddRange(remaining);

        // Shuffle order
        Shuffle(selected, rng);

        // Shuffle choices for each question (preserving correct answer tracking)
        foreach (var q in selected)
            ShuffleChoices(q, rng);

        return selected;
    }

    private static void Shuffle<T>(List<T> list, Random rng)
    {
        for (int i = list.Count - 1; i > 0; i--)
        {
            int j = rng.Next(i + 1);
            (list[i], list[j]) = (list[j], list[i]);
        }
    }

    private static void ShuffleChoices(Question q, Random rng)
    {
        var correctText = q.Choices[q.CorrectIndex];
        Shuffle(q.Choices, rng);
        q.CorrectIndex = q.Choices.IndexOf(correctText);
    }
}
