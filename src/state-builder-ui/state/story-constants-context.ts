import { createContext, useContext } from 'react';
import type { ConstantDefinition } from '@molstar/state-builder';

interface StoryConstantsContextValue {
  storyConstants: ConstantDefinition[];
  onStoryConstantsChange: ((c: ConstantDefinition[]) => void) | null;
}

export const StoryConstantsContext = createContext<StoryConstantsContextValue>({
  storyConstants: [],
  onStoryConstantsChange: null,
});

export const useStoryConstants = () => useContext(StoryConstantsContext);
