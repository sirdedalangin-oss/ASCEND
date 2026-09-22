export const gradeOptionsByStage = {
  KS1: ['Grade 1', 'Grade 2', 'Grade 3', 'Grades 1-3'],
  KS2: ['Grade 4', 'Grade 5', 'Grade 6', 'Grades 4-6', 'Grades 5-6'],
  KS3: ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grades 7-10'],
  KS4: ['Grade 11', 'Grade 12', 'Grades 11-12'],
  ALL: ['All grade levels', 'School-wide', 'Personnel-focused'],
};

export const keyStageLabels = {
  KS1: 'KS1 — Grades 1–3',
  KS2: 'KS2 — Grades 4–6',
  KS3: 'KS3 — Grades 7–10',
  KS4: 'KS4 — Grades 11–12',
  ALL: 'All key stages / School-wide',
};

export const defaultKeywordCategories = {
  literacy: 'Literacy & Reading',
  numeracy: 'Numeracy & Mathematics',
  science: 'Science',
  ict: 'ICT & Digital Innovation',
  inclusive_education: 'Inclusive Education',
  teacher_development: 'Teacher Development',
  environment: 'Environmental Education',
  learner_wellness: 'Learner Wellness & Nutrition',
  data_analytics: 'School Data Analytics',
  blended_learning: 'Blended & Home-School Learning',
  other: 'Other',
};

export function announceInnovationUpdate() {
  window.dispatchEvent(new Event('innovations:updated'));

  if ('BroadcastChannel' in window) {
    const channel = new BroadcastChannel('ascend-innovations');
    channel.postMessage('updated');
    channel.close();
  }
}
