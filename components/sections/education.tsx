import EducationTimeline from "@/components/animations/education-timeline";
import { education, educationPeriodLabel } from "@/data/portfolio";

/** Education background as a pinned horizontal timeline. */
export default function Education() {
  const items = education.map((entry) => ({
    id: entry.id,
    period: entry.period,
    title: entry.school,
    detail: entry.detail,
  }));

  return <EducationTimeline items={items} title="Education" periodLabel={educationPeriodLabel} />;
}
