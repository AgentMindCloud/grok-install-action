import { parseDocument, LineCounter, isScalar, isMap, isSeq } from 'yaml';
import type { Document, Node, Scalar } from 'yaml';

export interface LineNode<T = unknown> {
  value: T;
  line: number;
}

export interface LoadedYaml {
  at<T = unknown>(path: ReadonlyArray<string | number>): LineNode<T> | undefined;
  root: unknown;
  doc: Document.Parsed;
}

export function loadWithLines(source: string): LoadedYaml {
  const lineCounter = new LineCounter();
  const doc = parseDocument(source, { keepSourceTokens: true, lineCounter });

  const lineOf = (node: Node | null | undefined): number => {
    if (!node || !('range' in node) || !node.range) return 1;
    return lineCounter.linePos(node.range[0]).line;
  };

  return {
    doc,
    root: doc.toJS(),
    at<T>(path: ReadonlyArray<string | number>): LineNode<T> | undefined {
      const node = doc.getIn(path, true) as Node | undefined;
      if (node === undefined) return undefined;
      if (isScalar(node)) {
        return { value: (node as Scalar).value as T, line: lineOf(node) };
      }
      if (isMap(node) || isSeq(node)) {
        return { value: node.toJSON() as T, line: lineOf(node) };
      }
      return { value: node as unknown as T, line: lineOf(node) };
    },
  };
}
