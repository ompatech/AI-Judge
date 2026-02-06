import { supabase } from "../lib/supabase";

export type TemplateRow = {
  template_id: string;
  question_type: string;
  question_text: string;
  created_at: string;
};

// Fetch distinct question templates that appear in a queue.
// MVP approach: submissions -> submission_questions -> question_templates
export async function listTemplatesForQueue(queueId: string): Promise<TemplateRow[]> {
  // 1) submissions in queue
  const { data: subs, error: subErr } = await supabase
    .from("submissions")
    .select("id")
    .eq("queue_id", queueId);

  if (subErr) throw new Error(subErr.message);

  const subIds = (subs ?? []).map((s: any) => s.id);
  if (subIds.length === 0) return [];

  // 2) submission_questions for those submissions
  const { data: sq, error: sqErr } = await supabase
    .from("submission_questions")
    .select("template_id")
    .in("submission_id", subIds);

  if (sqErr) throw new Error(sqErr.message);

  const templateIds = Array.from(new Set((sq ?? []).map((r: any) => r.template_id)));
  if (templateIds.length === 0) return [];

  // 3) templates
  const { data: templates, error: tErr } = await supabase
    .from("question_templates")
    .select("*")
    .in("template_id", templateIds)
    .order("template_id", { ascending: true });

  if (tErr) throw new Error(tErr.message);
  return (templates ?? []) as TemplateRow[];
}
