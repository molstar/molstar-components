import { forwardRef } from "react";
import type { ForwardRefExoticComponent, JSX, RefAttributes } from "react";
import { UIBuilderProvider } from "./state-builder-ui/provider.tsx";
import { UIBuilder } from "./state-builder-ui/UIBuilder.tsx";
import type {
  UIBuilderProviderProps,
  UIBuilderHandle,
  UIBuilderSnapshot,
} from "./state-builder-ui/provider.tsx";

export type { UIBuilderHandle, UIBuilderSnapshot };

/**
 * Props for MolViewStateBuilder.
 * Extends all UIBuilderProvider props minus `children` (handled internally).
 */
export interface MolViewStateBuilderProps
  extends Omit<UIBuilderProviderProps, "children"> {
  /**
   * Height of the builder panel.
   * @defaultValue "600px"
   */
  height?: string;
  /**
   * Additional CSS class names applied to the wrapper div.
   */
  className?: string;
}

/**
 * MolViewStateBuilder — visual MVS node tree builder.
 *
 * Wraps `UIBuilderProvider` and `UIBuilder` from state-builder-ui.
 * The `plugin` prop is optional; when null (default), camera capture and
 * structure-metadata-driven selectors are disabled until Phase 2 wires
 * the Molstar PluginUIContext into this component.
 *
 * @example
 * ```tsx
 * const ref = useRef<UIBuilderHandle>(null);
 *
 * <MolViewStateBuilder
 *   ref={ref}
 *   height="500px"
 *   onCodeGenerated={(code) => console.log(code)}
 * />
 * ```
 */
export const MolViewStateBuilder: ForwardRefExoticComponent<
  MolViewStateBuilderProps & RefAttributes<UIBuilderHandle>
> = forwardRef<UIBuilderHandle, MolViewStateBuilderProps>(function MolViewStateBuilder(
  { height = "600px", className, ...providerProps },
  ref,
): JSX.Element {
  return (
    <div style={{ height, overflow: "auto" }} className={className}>
      <UIBuilderProvider ref={ref} {...providerProps}>
        <UIBuilder />
      </UIBuilderProvider>
    </div>
  );
});

MolViewStateBuilder.displayName = "MolViewStateBuilder";
