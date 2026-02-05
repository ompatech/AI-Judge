import { supabase } from './supabase.ts';
import type { InputFile } from './types';

function toIsoFromMs(ms: number): string {
  return new Date(ms).toISOString();
}

export async function importJsonString(jsonText: string) {
  let data: InputFile;
  data = JSON.parse(jsonText);
  if (!Array.isArray(data)) throw new Error("Top-level JSON must be an array.");

  // queues
  const queueIds = Array.from(new Set(data.map((s) => s.queueId)));
  if (queueIds.length) {
    const { error } = await supabase
      .from("queues")
      .upsert(queueIds.map((q) => ({ queue_id: q })), { onConflict: "queue_id" });
    if (error) throw new Error(error.message);
  }

  // templates
  const templatesMap = new Map<string, { template_id: string; question_type: string; question_text: string }>();
  for (const sub of data) {
    for (const q of sub.questions ?? []) {
      const t = q.data;
      if (t?.id && !templatesMap.has(t.id)) {
        templatesMap.set(t.id, {
          template_id: t.id,
          question_type: t.questionType ?? "unknown",
          question_text: t.questionText ?? "",
        });
      }
    }
  }
  const templates = Array.from(templatesMap.values());
  if (templates.length) {
    const { error } = await supabase
      .from("question_templates")
      .upsert(templates, { onConflict: "template_id" });
    if (error) throw new Error(error.message);
  }

  // submissions
  const { error: subErr } = await supabase.from("submissions").upsert(
    data.map((s) => ({
      id: s.id,
      queue_id: s.queueId,
      submitted_at: toIsoFromMs(s.createdAt),
      raw_json: s,
    })),
    { onConflict: "id" }
  );
  if (subErr) throw new Error(subErr.message);

  // submission_questions
  const subQuestions = data.flatMap((sub) =>
    (sub.questions ?? []).map((q) => ({
      submission_id: sub.id,
      template_id: q.data.id,
      rev: q.rev ?? 1,
    }))
  );
  if (subQuestions.length) {
    const { error } = await supabase
      .from("submission_questions")
      .upsert(subQuestions, { onConflict: "submission_id,template_id" });
    if (error) throw new Error(error.message);
  }

  // answers
  const answerRows = data.flatMap((sub) =>
    Object.entries(sub.answers ?? {}).map(([templateId, a]) => ({
      submission_id: sub.id,
      template_id: templateId,
      choice: (a as any).choice ?? null,
      freeform: (a as any).freeform ?? null,
      reasoning: (a as any).reasoning ?? null,
      raw_answer: a,
    }))
  );
  if (answerRows.length) {
    const { error } = await supabase
      .from("answers")
      .upsert(answerRows, { onConflict: "submission_id,template_id" });
    if (error) throw new Error(error.message);
  }

  return {
    queues: queueIds.length,
    submissions: data.length,
    templates: templates.length,
    answers: answerRows.length,
  };
}
