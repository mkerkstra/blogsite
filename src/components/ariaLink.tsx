import Link from 'next/link';

export default function AriaLink(args: {
  disabled?: boolean; className?: string
} & Parameters<typeof Link>[number]
) {
  const {disabled, className, ...LinkArgs} = args;
  return (
    <Link {...LinkArgs}>
      <a
        aria-disabled={disabled ?? undefined}
        tabIndex={disabled ? -1 : undefined}
        className={className ?? undefined}
      >
        <button
          aria-disabled={disabled ?? undefined}
          tabIndex={disabled ? -1 : undefined}
        >
          {args.children}
        </button>
      </a>
    </Link>
  );
};

