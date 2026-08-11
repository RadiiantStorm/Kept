/**
 * The signature element: a physical shelf tag, notched at the top-left corner
 * with a punched hole. It carries the cost-per-month figure and appears exactly
 * once per screen. Nothing else in the app is yellow.
 */
export function ShelfTag({ value, caption }: { value: string; caption: string }) {
  return (
    <div
      className="relative bg-tag py-6 pr-5 pl-9 text-tag-ink sm:pr-8 sm:pl-11"
      style={{ clipPath: "polygon(20px 0, 100% 0, 100% 100%, 0 100%, 0 20px)" }}
    >
      <span
        aria-hidden
        className="absolute top-[30px] left-[13px] block size-[10px] rounded-full bg-page"
      />
      <p className="tag-figure num">{value}</p>
      <p className="mt-2 text-label uppercase tracking-[0.1em]">{caption}</p>
    </div>
  );
}
