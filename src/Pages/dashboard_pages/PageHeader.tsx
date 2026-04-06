type PageHeaderProps = {
  title: string;
  subtitle?: string;
  /** Tighter spacing and smaller type for data-heavy pages on small screens. */
  dense?: boolean;
};

export default function PageHeader({ title, subtitle, dense }: PageHeaderProps) {
  return (
    <header className={dense ? "mb-3 sm:mb-4" : "mb-8"}>
      <h1
        className={
          dense
            ? "text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl"
            : "text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl"
        }
      >
        {title}
      </h1>
      {subtitle ? (
        <p
          className={
            dense
              ? "mt-1 max-w-2xl text-xs leading-relaxed text-slate-600 dark:text-slate-400 sm:text-sm"
              : "mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400"
          }
        >
          {subtitle}
        </p>
      ) : null}
    </header>
  );
}
