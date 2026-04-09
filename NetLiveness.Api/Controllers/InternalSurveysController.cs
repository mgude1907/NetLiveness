using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NetLiveness.Api.Data;
using NetLiveness.Api.Models;

namespace NetLiveness.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class InternalSurveysController : ControllerBase
    {
        private readonly AppDbContext _context;

        public InternalSurveysController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/InternalSurveys (Admin)
        [HttpGet]
        public async Task<ActionResult<IEnumerable<InternalSurvey>>> GetSurveys()
        {
            return await _context.Surveys.OrderByDescending(s => s.CreatedAt).ToListAsync();
        }

        // GET: api/InternalSurveys/active (Public)
        [HttpGet("active")]
        public async Task<ActionResult<IEnumerable<InternalSurvey>>> GetActiveSurveys()
        {
            return await _context.Surveys.Where(s => s.IsActive).OrderByDescending(s => s.CreatedAt).ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetSurvey(int id)
        {
            var survey = await _context.Surveys.FindAsync(id);
            if (survey == null) return NotFound();

            var questions = await _context.SurveyQuestions
                .Where(q => q.SurveyId == id)
                .OrderBy(q => q.Order)
                .ToListAsync();

            return Ok(new { Survey = survey, Questions = questions });
        }

        [HttpPost]
        public async Task<ActionResult<InternalSurvey>> PostSurvey(InternalSurvey survey)
        {
            survey.CreatedAt = DateTime.Now;
            _context.Surveys.Add(survey);
            await _context.SaveChangesAsync();
            return Ok(survey);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutSurvey(int id, InternalSurvey survey)
        {
            if (id != survey.Id) return BadRequest();
            _context.Entry(survey).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSurvey(int id)
        {
            var survey = await _context.Surveys.FindAsync(id);
            if (survey == null) return NotFound();

            _context.Surveys.Remove(survey);
            // Cascade delete questions
            var questions = _context.SurveyQuestions.Where(q => q.SurveyId == id);
            _context.SurveyQuestions.RemoveRange(questions);

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // ── Questions ──
        [HttpGet("{id}/questions")]
        public async Task<ActionResult<IEnumerable<SurveyQuestion>>> GetQuestions(int id)
        {
            return await _context.SurveyQuestions
                .Where(q => q.SurveyId == id)
                .OrderBy(q => q.Order)
                .ToListAsync();
        }

        [HttpPost("{id}/questions")]
        public async Task<ActionResult<SurveyQuestion>> PostQuestion(int id, SurveyQuestion q)
        {
            q.SurveyId = id;
            _context.SurveyQuestions.Add(q);
            await _context.SaveChangesAsync();
            return Ok(q);
        }

        [HttpPut("questions/{qid}")]
        public async Task<IActionResult> PutQuestion(int qid, SurveyQuestion q)
        {
            if (qid != q.Id) return BadRequest();
            _context.Entry(q).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("questions/{qid}")]
        public async Task<IActionResult> DeleteQuestion(int qid)
        {
            var q = await _context.SurveyQuestions.FindAsync(qid);
            if (q == null) return NotFound();
            _context.SurveyQuestions.Remove(q);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // ── Submissions ──
        [HttpPost("{id}/submit")]
        public async Task<IActionResult> SubmitSurvey(int id, [FromBody] SurveySubmission sub)
        {
            var response = new SurveyResponse
            {
                SurveyId = id,
                ParticipantName = sub.ParticipantName ?? "Anonim",
                SubmittedAt = DateTime.Now
            };

            _context.SurveyResponses.Add(response);
            await _context.SaveChangesAsync();

            foreach (var ans in sub.Answers)
            {
                _context.SurveyAnswers.Add(new SurveyAnswer
                {
                    ResponseId = response.Id,
                    QuestionId = ans.QuestionId,
                    Value = ans.Value
                });
            }

            await _context.SaveChangesAsync();
            return Ok(new { Message = "Anket başarıyla gönderildi." });
        }

        // ── Results ──
        [HttpGet("{id}/results")]
        public async Task<ActionResult> GetResults(int id)
        {
            var responses = await _context.SurveyResponses
                .Where(r => r.SurveyId == id)
                .ToListAsync();

            var responseIds = responses.Select(r => r.Id).ToList();

            var answers = await _context.SurveyAnswers
                .Where(a => responseIds.Contains(a.ResponseId))
                .ToListAsync();

            var questions = await _context.SurveyQuestions
                .Where(q => q.SurveyId == id)
                .OrderBy(q => q.Order)
                .ToListAsync();

            return Ok(new { 
                TotalResponses = responses.Count,
                Questions = questions,
                Responses = responses,
                Answers = answers
            });
        }
    }

    public class SurveySubmission
    {
        public string? ParticipantName { get; set; }
        public List<AnswerSubmission> Answers { get; set; } = new();
    }

    public class AnswerSubmission
    {
        public int QuestionId { get; set; }
        public string Value { get; set; } = "";
    }
}
