export default function DashboardFrame({ children }) {
  return (
    <section className="mx-auto w-full max-w-[1320px] rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="p-4 md:p-5">{children}</div>
    </section>
  );
}

