import Link from 'next/link';
import {Link as ChakraLink} from '@chakra-ui/react';

export default function AriaLink(args: {
  disabled?: boolean; className?: string
} & Parameters<typeof Link>[number],
) {
  const {disabled, className, ...LinkArgs} = args;
  return (
    <Link {...LinkArgs}>
      <ChakraLink
        disabled={disabled}
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
      </ChakraLink>
    </Link>
  );
}

