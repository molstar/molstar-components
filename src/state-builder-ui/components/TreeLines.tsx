interface TreeLinesProps {
  depth: number;
  isLast: boolean;
}

/**
 * Renders the tree connection lines for nested operations
 */
export function TreeLines({ depth, isLast }: TreeLinesProps) {
  if (depth === 0) return null;

  return (
    <>
      {/* Vertical line from parent */}
      <div
        className='absolute left-0 top-0 w-px bg-gray-300'
        style={{ height: isLast ? '20px' : '100%', left: '-20px' }}
      />
      {/* Horizontal line to item */}
      <div className='absolute left-0 top-5 h-px bg-gray-300' style={{ width: '16px', left: '-20px' }} />
    </>
  );
}
