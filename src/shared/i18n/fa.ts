/*
 * Persian UI labels. The exercise catalog and plan text stay English (that is
 * the data); these maps translate the small, closed vocabularies shown as
 * labels. Unknown values fall back to the original string.
 */

const catalogTerms: Record<string, string> = {
  // body parts
  waist: "شکم و پهلو",
  back: "پشت",
  chest: "سینه",
  "upper legs": "ران",
  "upper arms": "بازو",
  shoulders: "سرشانه",
  "lower arms": "ساعد",
  "lower legs": "ساق پا",
  cardio: "هوازی",
  neck: "گردن",
  // equipment
  "body weight": "وزن بدن",
  cable: "سیم‌کش",
  "leverage machine": "دستگاه اهرمی",
  assisted: "کمکی",
  "medicine ball": "توپ طبی",
  barbell: "هالتر",
  rope: "طناب",
  "stability ball": "توپ تعادل",
  dumbbell: "دمبل",
  "ez barbell": "هالتر EZ",
  kettlebell: "کتل‌بل",
  "olympic barbell": "هالتر المپیکی",
  weighted: "با وزنه",
  "bosu ball": "توپ بوسو",
  "sled machine": "دستگاه سورتمه",
  "smith machine": "دستگاه اسمیت",
  "wheel roller": "چرخ شکم",
  "trap bar": "هالتر شش‌ضلعی",
  band: "کش",
  hammer: "پتک",
  "stationary bike": "دوچرخه ثابت",
  "upper body ergometer": "ارگومتر دست",
  "elliptical machine": "الپتیکال",
  "skierg machine": "اسکی‌ارگ",
  roller: "فوم رولر",
  "stepmill machine": "دستگاه پله",
  tire: "لاستیک",
  "resistance band": "کش مقاومتی",
  // target and secondary muscles
  abs: "شکم",
  abdominals: "شکم",
  "lower abs": "پایین شکم",
  obliques: "مورب شکم",
  core: "مرکز بدن",
  lats: "زیربغل",
  "latissimus dorsi": "زیربغل",
  pectorals: "سینه",
  "upper chest": "بالای سینه",
  hamstrings: "پشت ران",
  quads: "جلو ران",
  quadriceps: "جلو ران",
  triceps: "پشت بازو",
  biceps: "جلو بازو",
  brachialis: "بازویی",
  "upper back": "بالای پشت",
  "lower back": "پایین کمر",
  rhomboids: "متوازی‌الاضلاع",
  glutes: "سرینی",
  delts: "سرشانه",
  deltoids: "سرشانه",
  "rear deltoids": "سرشانه خلفی",
  "rotator cuff": "روتاتور کاف",
  "serratus anterior": "دندانه‌ای قدامی",
  forearms: "ساعد",
  wrists: "مچ دست",
  "wrist extensors": "بازکننده‌های مچ",
  "wrist flexors": "خم‌کننده‌های مچ",
  "grip muscles": "عضلات گرفتن",
  hands: "دست",
  calves: "ساق پا",
  soleus: "نعلی",
  shins: "جلو ساق",
  ankles: "مچ پا",
  "ankle stabilizers": "پایدارکننده‌های مچ پا",
  feet: "کف پا",
  traps: "ذوزنقه",
  trapezius: "ذوزنقه",
  adductors: "نزدیک‌کننده‌های ران",
  "inner thighs": "داخل ران",
  groin: "کشاله ران",
  abductors: "دورکننده‌های ران",
  "hip flexors": "خم‌کننده‌های لگن",
  spine: "ستون فقرات",
  "cardiovascular system": "قلبی‌عروقی",
  "levator scapulae": "بالابرنده کتف",
  sternocleidomastoid: "جناغی‌چنبری‌پستانی",
};

/** Body part, equipment or muscle from the catalog, in Persian when known. */
export function faTerm(term: string): string {
  return catalogTerms[term] ?? term;
}

/** Plans, sessions and exercises carry an optional Persian name. */
export function faName(x: { name: string; nameFa?: string }): string {
  return x.nameFa ?? x.name;
}

export const sessionKindFa: Record<string, string> = {
  training: "تمرین",
  corrective: "اصلاحی",
  conditioning: "آمادگی",
  menu: "منو",
};

export const blockTypeFa: Record<string, string> = {
  straight: "ساده",
  superset: "سوپرست",
  compound: "ست ترکیبی",
  circuit: "سیرکویت",
};

export const planSourceFa: Record<string, string> = {
  coach: "مربی",
  ai: "هوش مصنوعی",
  self: "شخصی",
};

export const workoutStatusFa: Record<string, string> = {
  active: "در حال انجام",
  done: "تمام‌شده",
  abandoned: "رهاشده",
};
