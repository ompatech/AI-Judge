import { supabase } from "../lib/supabase";

export type ResultRow = {
  id: string;
  verdict: "pass" | "fail" | "inconclusive";
  judge_reasoning: string;
  created_at: string;

  submission_id: string;
  template_id: string;
  judge_id: string;

  // joined
  judges?: { name: string; model: string } | null;
  question_templates?: { question_text: string; question_type: string } | null;
  submissions?: { queue_id: string } | null;
};

export async function fetchResults(filters: {
  queueId?: string;
  judgeId?: string;
  templateId?: string;
  verdict?: string;
}) {
  let q = supabase
    .from("evaluations")
    .select(
      `
      id, verdict, judge_reasoning, created_at,
      submission_id, template_id, judge_id,
      judges(name, model),
      question_templates(question_text, question_type),
      submissions(queue_id)
    `
    )
    .order("created_at", { ascending: false })
    .limit(500);

  if (filters.judgeId) q = q.eq("judge_id", filters.judgeId);
  if (filters.templateId) q = q.eq("template_id", filters.templateId);
  if (filters.verdict) q = q.eq("verdict", filters.verdict);

  // queue filter goes through joined submissions.queue_id
  if (filters.queueId) q = q.eq("submissions.queue_id", filters.queueId);

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as ResultRow[];
}
