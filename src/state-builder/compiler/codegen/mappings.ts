import { ASTNode } from '../ast/types.ts';

/**
 * Map node kind to builder method name
 */
export class NodeMethodMapper {
  static getMethodName(node: ASTNode): string {
    const kind = node.kind as string;

    // Handle discriminated unions and special cases
    switch (kind) {
      // Structure variants
      case 'structure':
        return this.getStructureMethod(node);

      // Component variants
      case 'component':
        return 'component';
      case 'component_from_uri':
        return 'componentFromUri';
      case 'component_from_source':
        return 'componentFromSource';

      // Color variants
      case 'color':
        return 'color';
      case 'color_from_uri':
        return 'colorFromUri';
      case 'color_from_source':
        return 'colorFromSource';

      // Label variants
      case 'label':
        return 'label';
      case 'label_from_uri':
        return 'labelFromUri';
      case 'label_from_source':
        return 'labelFromSource';

      // Tooltip variants
      case 'tooltip':
        return 'tooltip';
      case 'tooltip_from_uri':
        return 'tooltipFromUri';
      case 'tooltip_from_source':
        return 'tooltipFromSource';

      // Primitives
      case 'primitive':
        return this.getPrimitiveMethod(node);
      case 'primitives':
        return 'primitives';
      case 'primitives_from_uri':
        return 'primitivesFromUri';

      // Volume
      case 'volume':
        return 'volume';
      case 'volume_representation':
        return 'representation';

      // Direct mappings
      case 'download': return 'download';
      case 'parse': return 'parse';
      case 'coordinates': return 'coordinates';
      case 'representation': return 'representation';
      case 'transform': return 'transform';
      case 'instance': return 'instance';
      case 'opacity': return 'opacity';
      case 'clip': return 'clip';
      case 'focus': return 'focus';
      case 'camera': return 'camera';
      case 'canvas': return 'canvas';

      // Animation
      case 'animation': return 'animation';
      case 'interpolate': return 'interpolate';

      default:
        throw new Error(`Unknown node kind: ${kind}`);
    }
  }

  /**
   * Determine structure method based on type param
   */
  private static getStructureMethod(node: ASTNode): string {
    const type = node.getParam('type');

    switch (type) {
      case 'model': return 'modelStructure';
      case 'assembly': return 'assemblyStructure';
      case 'symmetry': return 'symmetryStructure';
      case 'symmetry_mates': return 'symmetryMatesStructure';
      default:
        console.warn(`Unknown structure type: ${type}, defaulting to modelStructure`);
        return 'modelStructure';
    }
  }

  /**
   * Determine primitive method based on kind param
   */
  private static getPrimitiveMethod(node: ASTNode): string {
    const primitiveKind = node.getParam('kind');

    switch (primitiveKind) {
      case 'mesh': return 'mesh';
      case 'lines': return 'lines';
      case 'tube': return 'tube';
      case 'arrow': return 'arrow';
      case 'distance_measurement': return 'distance';
      case 'angle_measurement': return 'angle';
      case 'label': return 'label';
      case 'ellipse': return 'ellipse';
      case 'ellipsoid': return 'ellipsoid';
      case 'box': return 'box';
      default:
        console.warn(`Unknown primitive kind: ${primitiveKind}, defaulting to mesh`);
        return 'mesh';
    }
  }

  // Check if node should return to parent (chainable)
  // These nodes modify the parent and return it for further chaining
  static isChainable(node: ASTNode): boolean {
    return [
      // Canvas/Camera (modify root)
      'camera',
      'canvas',

      // Modifiers (return parent)
      'focus',
      'transform',
      'instance',
      'color',
      'color_from_uri',
      'color_from_source',
      'opacity',
      'clip',

      // Annotations (return parent)
      'label',
      'label_from_uri',
      'label_from_source',
      'tooltip',
      'tooltip_from_uri',
      'tooltip_from_source',

      // Animation (interpolate returns Animation for chaining)
      'interpolate',
    ].includes(node.kind as string);
  }

  static needsVariable(node: ASTNode): boolean {
    return [
      'download',
      'parse',
      'coordinates',
      'structure',
      'component',
      'component_from_uri',
      'component_from_source',
      'representation',
      'volume',
      'volume_representation',
      'primitives',
      'primitives_from_uri',

      // Animation container (creates Animation builder)
      'animation',
    ].includes(node.kind as string);
  }
}