import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { manuscript_file_url, learning_focus, key_stage, grade_levels } = body;

    if (!manuscript_file_url) {
      return Response.json({ error: 'Manuscript file URL is required' }, { status: 400 });
    }

    const prompt = `You are an expert evaluator for the Department of Education (DepEd) Bulacan Schools Division Office's Innovation-to-Scale System, part of Project ASCEND (Assessment of Scalable Education Novelties and Development).

CONTEXT:
- SDO Bulacan's 2030 vision: Central Luzon's innovation hub for public education, developing and scaling new approaches that strengthen teaching and help every learner succeed.
- You are evaluating an educational innovation manuscript focused on Key Stage 1 (Grades 1-3).
- The innovation addresses either NUMERACY or LITERACY learning.

EVALUATION CRITERIA (score each from 0 to 100):
1. RELEVANCE AND RESPONSIVENESS (Weight: 20%) — How well the innovation addresses identified learning gaps, responds to the needs of KS1 learners, and aligns with the DepEd curriculum and strategic priorities.
2. INNOVATIVENESS (Weight: 20%) — The degree of novelty, creativity, and originality of the approach compared to existing conventional practices.
3. EFFECTIVENESS AND IMPACT (Weight: 25%) — Evidence that the innovation improves learner outcomes in numeracy and/or literacy, with measurable results, data, or documented evidence.
4. SCALABILITY AND REPLICABILITY (Weight: 20%) — The potential for the innovation to be implemented across multiple schools, districts, and contexts with consistency and reasonable resource requirements.
5. SUSTAINABILITY (Weight: 10%) — The likelihood of long-term maintenance, institutional support, and continued impact beyond initial implementation.
6. QUALITY OF DOCUMENTATION (Weight: 5%) — Clarity, completeness, rigor, and professionalism of the manuscript documentation.

INSTRUCTIONS:
- Read the attached manuscript carefully.
- Extract the title of the innovation from the document.
- Determine whether the primary learning focus is "numeracy" or "literacy" based on the content.
- Provide a concise summary (2-3 sentences).
- Score each criterion from 0 to 100 with a brief justification (1-2 sentences each).
- Provide an overall recommendation (2-3 sentences) on whether this innovation should be validated and scaled.
- List 3-5 key strengths.
- List 3-5 areas for improvement.
- Be rigorous, fair, and evidence-based. Do not inflate scores.`;

    const responseSchema = {
      type: "object",
      properties: {
        detected_title: { type: "string", description: "The title of the innovation extracted from the manuscript" },
        summary: { type: "string" },
        detected_learning_focus: { type: "string", enum: ["numeracy", "literacy"] },
        relevance_score: { type: "number" },
        innovativeness_score: { type: "number" },
        effectiveness_score: { type: "number" },
        scalability_score: { type: "number" },
        sustainability_score: { type: "number" },
        documentation_score: { type: "number" },
        relevance_justification: { type: "string" },
        innovativeness_justification: { type: "string" },
        effectiveness_justification: { type: "string" },
        scalability_justification: { type: "string" },
        sustainability_justification: { type: "string" },
        documentation_justification: { type: "string" },
        recommendation: { type: "string" },
        strengths: { type: "array", items: { type: "string" } },
        areas_for_improvement: { type: "array", items: { type: "string" } }
      },
      required: ["detected_title", "summary", "detected_learning_focus", "relevance_score", "innovativeness_score", "effectiveness_score", "scalability_score", "sustainability_score", "documentation_score", "relevance_justification", "innovativeness_justification", "effectiveness_justification", "scalability_justification", "sustainability_justification", "documentation_justification", "recommendation", "strengths", "areas_for_improvement"]
    };

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      file_urls: [manuscript_file_url],
      response_json_schema: responseSchema,
      model: "claude_sonnet_4_6"
    });

    const relevance = Math.round(Number(result.relevance_score) || 0);
    const innovativeness = Math.round(Number(result.innovativeness_score) || 0);
    const effectiveness = Math.round(Number(result.effectiveness_score) || 0);
    const scalability = Math.round(Number(result.scalability_score) || 0);
    const sustainability = Math.round(Number(result.sustainability_score) || 0);
    const documentation = Math.round(Number(result.documentation_score) || 0);

    const total =
      relevance * 0.20 +
      innovativeness * 0.20 +
      effectiveness * 0.25 +
      scalability * 0.20 +
      sustainability * 0.10 +
      documentation * 0.05;

    const is_scalable = total >= 75;

    const analysisText = [
      `RELEVANCE & RESPONSIVENESS (Score: ${relevance}/100, Weight: 20%)\n${result.relevance_justification || ''}`,
      `INNOVATIVENESS (Score: ${innovativeness}/100, Weight: 20%)\n${result.innovativeness_justification || ''}`,
      `EFFECTIVENESS & IMPACT (Score: ${effectiveness}/100, Weight: 25%)\n${result.effectiveness_justification || ''}`,
      `SCALABILITY & REPLICABILITY (Score: ${scalability}/100, Weight: 20%)\n${result.scalability_justification || ''}`,
      `SUSTAINABILITY (Score: ${sustainability}/100, Weight: 10%)\n${result.sustainability_justification || ''}`,
      `QUALITY OF DOCUMENTATION (Score: ${documentation}/100, Weight: 5%)\n${result.documentation_justification || ''}`
    ].join('\n\n');

    return Response.json({
      detected_title: result.detected_title || 'Untitled Innovation',
      summary: result.summary || '',
      detected_learning_focus: result.detected_learning_focus || learning_focus || 'numeracy',
      relevance_score: relevance,
      innovativeness_score: innovativeness,
      effectiveness_score: effectiveness,
      scalability_score: scalability,
      sustainability_score: sustainability,
      documentation_score: documentation,
      total_score: Math.round(total * 100) / 100,
      is_scalable,
      ai_analysis: analysisText,
      recommendation: result.recommendation || '',
      strengths: result.strengths || [],
      areas_for_improvement: result.areas_for_improvement || []
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
