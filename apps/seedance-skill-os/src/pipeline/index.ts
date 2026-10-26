import { compileBrief } from './brief'
import { detectSeedKind } from './detect'
import { buildInterviewQuestions } from './interview'
import { compilePrompt } from './prompt'
import { compileShots } from './shots'
import type { DirectorPackage, InterviewQuestion } from './types'

export * from './types'
export * from './seeds'
export * from './delay'
export * from './troubleshoot'
export { detectSeedKind, buildInterviewQuestions, compileBrief, compileShots, compilePrompt }

export function runDirectorCompile(
  idea: string,
  answers: Record<string, string>,
  exampleId?: string | null
): DirectorPackage {
  const seedKind = detectSeedKind(idea, exampleId)
  const brief = compileBrief(idea, seedKind, answers)
  const shots = compileShots(brief, seedKind)
  const prompt = compilePrompt(brief, shots)
  return { idea, seedKind, answers, brief, shots, prompt }
}

export function interviewForIdea(idea: string, exampleId?: string | null): InterviewQuestion[] {
  const kind = detectSeedKind(idea, exampleId)
  return buildInterviewQuestions(kind)
}

export function defaultAnswers(questions: InterviewQuestion[]): Record<string, string> {
  return Object.fromEntries(questions.map((q) => [q.id, q.choices[0]]))
}

export function validateShotCount(shots: { number: number }[]): boolean {
  return shots.length >= 3 && shots.length <= 5
}
