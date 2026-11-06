export default function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  id,
}) {
  return (
    <div className={`section-heading section-heading--${align}`}>
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h2 id={id}>{title}</h2>
      {description && <p>{description}</p>}
    </div>
  )
}
