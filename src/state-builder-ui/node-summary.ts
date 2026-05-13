// src/state-builder-ui/node-summary.ts
import type { UINode } from '../state-builder/index.ts';
import { formatSelectorPreview, isConstantRef } from '../state-builder/index.ts';
import type { ConstantRef } from '../state-builder/index.ts';

function truncateUrl(url: string, maxLen = 50): string {
  try {
    const u = new URL(url);
    const path = u.pathname.split('/').pop() ?? '';
    const display = `${u.hostname}/…/${path}`;
    return display.length > maxLen ? display.slice(0, maxLen) + '…' : display;
  } catch {
    return url.length > maxLen ? url.slice(0, maxLen) + '…' : url;
  }
}

function truncateText(text: string, maxLen = 40): string {
  return text.length > maxLen ? text.slice(0, maxLen) + '…' : text;
}

function vec3String(v: unknown): string {
  if (Array.isArray(v) && v.length === 3) {
    return v.map((n: unknown) => (typeof n === 'number' ? n.toFixed(1) : '?')).join(', ');
  }
  return '?';
}

/** Returns a one-line human-readable summary of a node's key params, or null if unconfigured. */
export function getNodeSummary(node: UINode): string | null {
  const p = node.params;

  switch (node.kind as string) {
    case 'download': {
      const url = p.url as string | undefined;
      return url ? truncateUrl(url) : null;
    }
    case 'parse': {
      const fmt = p.format as string | undefined;
      return fmt ?? null;
    }
    case 'structure': {
      const type = p.type as string | undefined;
      if (!type) return null;
      if (type === 'assembly' && p.assembly_id) return `assembly ${p.assembly_id}`;
      return type;
    }
    case 'component': {
      const sel = p.selector;
      if (!sel) return null;
      return formatSelectorPreview(sel);
    }
    case 'component_from_uri':
    case 'label_from_uri':
    case 'tooltip_from_uri':
    case 'color_from_uri':
    case 'primitives_from_uri': {
      const uri = p.uri as string | undefined;
      return uri ? truncateUrl(uri) : null;
    }
    case 'component_from_source':
    case 'label_from_source':
    case 'tooltip_from_source':
    case 'color_from_source': {
      const cat = p.category_name as string | undefined;
      const field = p.field_name as string | undefined;
      if (!cat && !field) return null;
      return [cat, field].filter(Boolean).join(' · ');
    }
    case 'representation': {
      const type = p.type as string | undefined;
      return type ?? null;
    }
    case 'color': {
      const theme = node.custom?.molstar_color_theme_name as string | undefined;
      const sel = (p as Record<string, unknown>).selector;
      const selSuffix = sel ? ` (${formatSelectorPreview(sel)})` : '';
      if (theme) return theme + selSuffix;
      const color = p.color;
      if (isConstantRef(color)) {
        const ref = color as ConstantRef;
        return `${ref.constantName}.${ref.entryKey}` + selSuffix;
      }
      if (typeof color === 'number') {
        return '#' + color.toString(16).padStart(6, '0') + selSuffix;
      }
      if (typeof color === 'string') return color + selSuffix;
      return sel ? `color${selSuffix}` : null;
    }
    case 'opacity': {
      const val = p.opacity as number | undefined;
      return val != null ? String(val) : null;
    }
    case 'label': {
      const text = p.text as string | undefined;
      return text ? `"${truncateText(text)}"` : null;
    }
    case 'tooltip': {
      const content = p.content as string | undefined;
      return content ? truncateText(content) : null;
    }
    case 'canvas': {
      const bg = p.background_color;
      if (typeof bg === 'number') return '#' + bg.toString(16).padStart(6, '0');
      return null;
    }
    case 'camera': {
      const pos = p.position;
      return pos ? `[${vec3String(pos)}]` : null;
    }
    case 'focus': {
      const dir = p.direction;
      return dir ? `direction set` : 'default';
    }
    case 'transform': {
      const hasMatrix = p.rotation != null || p.translation != null;
      return hasMatrix ? 'transform set' : null;
    }
    case 'instance': {
      const pos = p.position;
      return pos ? `[${vec3String(pos)}]` : null;
    }
    case 'volume': {
      const id = p.source_id as string | undefined;
      return id ?? null;
    }
    case 'volume_representation': {
      const type = p.type as string | undefined;
      return type ?? null;
    }
    case 'clip': {
      const type = p.type as string | undefined;
      return type ?? null;
    }
    case 'primitives': {
      const count = node.children?.length ?? 0;
      return count > 0 ? `${count} primitive${count !== 1 ? 's' : ''}` : null;
    }
    case 'animation': {
      const steps = node.children?.length ?? 0;
      return steps > 0 ? `${steps} step${steps !== 1 ? 's' : ''}` : null;
    }
    case 'interpolate': {
      const prop = p.property as string | undefined;
      const ref = p.target_ref as string | undefined;
      if (!prop) return null;
      return ref ? `${prop} → ${ref}` : prop;
    }
    case 'coordinates': {
      const idx = p.block_index as number | undefined;
      return idx != null ? `block ${idx}` : null;
    }
    default:
      return null;
  }
}
