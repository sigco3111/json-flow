
import { HierarchyNode } from '../types';

/**
 * Recursively transforms a JSON object or array into a hierarchical node structure.
 * @param json The JSON data to transform.
 * @param name The name of the current node (e.g., the object key or array index).
 * @returns A HierarchyNode object representing the transformed JSON.
 */
export const transformJsonToHierarchy = (json: any, name: string = 'root'): HierarchyNode => {
  if (typeof json !== 'object' || json === null) {
    return { name, value: String(json) };
  }

  if (Array.isArray(json)) {
    // If the array is empty, represent it as a node with a value, not as having no children.
    if (json.length === 0) {
      return { name, value: '[]' };
    }
    return {
      name,
      children: json.map((item, index) => transformJsonToHierarchy(item, `[${index}]`))
    };
  }

  const keys = Object.keys(json);
  // If the object is empty, represent it as a node with a value.
  if (keys.length === 0) {
    return { name, value: '{}' };
  }

  return {
    name,
    children: keys.map(key => transformJsonToHierarchy(json[key], key))
  };
};
