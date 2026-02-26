const tones = {
  blue: {
    card: "border-blue-200 bg-blue-50",
    text: "text-blue-600",
    value: "text-blue-900",
    icon: "bg-blue-100 text-blue-700",
  },
  green: {
    card: "border-green-200 bg-green-50",
    text: "text-green-600",
    value: "text-green-800",
    icon: "bg-green-100 text-green-600",
  },
  amber: {
    card: "border-amber-200 bg-amber-50",
    text: "text-amber-700",
    value: "text-amber-800",
    icon: "bg-amber-100 text-amber-700",
  },
  violet: {
    card: "border-purple-200 bg-purple-50",
    text: "text-purple-700",
    value: "text-violet-900",
    icon: "bg-purple-100 text-purple-700",
  },
};

export default function StatCard({ title, value, tone = "blue", icon }) {
  const style = tones[tone] ?? tones.blue;

  return (
    <article
      className={`rounded-xl border p-4 ${style.card}`}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className={`text-sm font-medium ${style.text}`}>{title}</p>
          <p className={`mt-1 text-3xl font-bold ${style.value}`}>{value}</p>
        </div>
        <span
          className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-lg ${style.icon}`}
          aria-hidden="true"
        >
          {icon}
        </span>
      </div>
    </article>
  );
}
