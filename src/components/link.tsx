import NextLink from 'next/link';

const Link = ({
  disabled,
  className,
  children,
  ...LinkArgs
}: {
  disabled?: boolean;
  className?: string
} &
  Parameters<typeof NextLink>[number],
) =>
  <NextLink {...LinkArgs} legacyBehavior passHref>
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
        {children}
      </button>
    </a>
  </NextLink>;

export default Link;

