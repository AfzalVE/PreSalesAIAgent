export default function SkillTag({ skill, active = true }) {
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium tracking-wide transition-colors duration-200 ${
      active 
        ? 'bg-brand-50 text-brand-600 border border-brand-100/50 hover:bg-brand-100/40' 
        : 'bg-neutral-100 text-neutral-400 border border-neutral-200/40'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${active ? 'bg-brand-500' : 'bg-neutral-300'}`} />
      {skill}
    </span>
  );
}
