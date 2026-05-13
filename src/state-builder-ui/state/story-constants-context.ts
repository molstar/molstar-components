import { createContext, useContext } from 'react';
import type { ConstantDefinition } from '../../state-builder/index.ts';

interface StoryConstantsContextValue {
  storyConstants: ConstantDefinition[];
  onStoryConstantsChange: ((c: ConstantDefinition[]) => void) | null;
}

export const StoryConstantsContext = createContext<StoryConstantsContextValue>({
  storyConstants: [],
  onStoryConstantsChange: null,
});

export const useStoryConstants = () => useContext(StoryConstantsContext);
