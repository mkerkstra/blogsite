import NextLink from 'next/link';

export default function Link(args: {
  disabled?: boolean; className?: string
} & Parameters<typeof NextLink>[number],
) {
  const {disabled, className, ...LinkArgs} = args;
  return (
    <NextLink {...LinkArgs}>
      <a
        aria-disabled={disabled ?? undefined}
        tabIndex={disabled ? -1 : undefined}
        className={className}
      >
        <button
          disabled={disabled}
          aria-disabled={disabled ?? undefined}
          tabIndex={disabled ? -1 : undefined}
          className={className}
        >
          {args.children}
        </button>
      </a>
    </NextLink>
  );
}

