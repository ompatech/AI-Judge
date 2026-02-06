import { supabase } from "../lib/supabase";

export type EvalTask = {
  submissionId: string;
  templateId: string;
  judgeId: string;
};

export async function buildQueueEvalTasks(queueId: string): Promise<EvalTask[]> {
  // submissions in queue
  const { data: subs, error: subErr } = await supabase
    .from("submissions")
    .select("id")
    .eq("queue_id", queueId);

  if (subErr) throw new Error(subErr.message);
  const subIds = (subs ?? []).map((s: any) => s.id);
  if (subIds.length === 0) return [];

  // templates in queue (via submission_questions)
  const { data: sq, error: sqErr } = await supabase
    .from("submission_questions")
    .select("template_id")
    .in("submission_id", subIds);

  if (sqErr) throw new Error(sqErr.message);
  const templateIds = Array.from(new Set((sq ?? []).map((r: any) => r.template_id)));
  if (templateIds.length === 0) return [];

  // assignments for queue
  const { data: asg, error: aErr } = await supabase
    .from("judge_assignments")
    .select("template_id, judge_id")
    .eq("queue_id", queueId);

  if (aErr) throw new Error(aErr.message);

  // map template -> judgeIds
  const map = new Map<string, string[]>();
  for (const row of asg ?? []) {
    const t = (row as any).template_id as string;
    const j = (row as any).judge_id as string;
    map.set(t, [...(map.get(t) ?? []), j]);
  }

  const tasks: EvalTask[] = [];
  for (const subId of subIds) {
    for (const tId of templateIds) {
      const judgeIds = map.get(tId) ?? [];
      for (const judgeId of judgeIds) {
        tasks.push({ submissionId: subId, templateId: tId, judgeId });
      }
    }
  }

  return tasks;
}

export async function callEvaluateFunction(task: EvalTask) {
  const { data, error } = await supabase.functions.invoke("evaluate", {
    body: task,
  });
  if (error) throw new Error(error.message);
  return data;
}
