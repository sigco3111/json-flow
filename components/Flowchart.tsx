
import React, { useRef, useEffect, useMemo, useState, useImperativeHandle, forwardRef } from 'react';
import { HierarchyNode } from '../types';

// Let TypeScript know that d3 is available globally from the CDN
declare const d3: any;

type LayoutType = 'horizontal' | 'vertical' | 'radial';

interface FlowchartProps {
  data: HierarchyNode;
  searchQuery: string;
  layout: LayoutType;
}

export interface FlowchartRef {
  exportSvg: () => void;
  exportPng: () => void;
}

const Flowchart = forwardRef<FlowchartRef, FlowchartProps>(({ data, searchQuery, layout }, ref) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const prevLayoutRef = useRef<LayoutType>(layout);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [d3Root, setD3Root] = useState<any>(null);

  useImperativeHandle(ref, () => ({
    exportSvg,
    exportPng,
  }));

  const getEmbeddedCss = (): string => {
    return Array.from(document.styleSheets)
      .map(sheet => {
        try {
          // Attempt to read rules from the stylesheet
          return Array.from(sheet.cssRules).map(rule => rule.cssText).join('\n');
        } catch (e) {
          // If we can't access due to CORS, embed a link to it
          if (sheet.href) {
            return `@import url(${sheet.href});`;
          }
          return '';
        }
      }).join('\n');
  };

  const triggerDownload = (href: string, filename: string) => {
      const link = document.createElement('a');
      link.href = href;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  }

  const exportSvg = () => {
    if (!svgRef.current || !gRef.current) return;
    
    const bbox = gRef.current.getBBox();
    const padding = 20;

    // Clone the SVG to avoid modifying the live one
    const svgClone = svgRef.current.cloneNode(true) as SVGSVGElement;
    const gClone = svgClone.querySelector('g');

    if (gClone) {
        const currentTransform = gClone.getAttribute('transform') || '';
        // Translate the group so the top-left of its content is at (padding, padding)
        const newTransform = `translate(${-bbox.x + padding}, ${-bbox.y + padding}) ${currentTransform}`;
        gClone.setAttribute('transform', newTransform);
    }
    
    // Set SVG dimensions to content size
    svgClone.setAttribute('width', (bbox.width + padding * 2).toString());
    svgClone.setAttribute('height', (bbox.height + padding * 2).toString());
    svgClone.removeAttribute('viewBox'); // Not needed if we transform the group
    svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

    // Embed all styles
    const style = document.createElement('style');
    style.textContent = getEmbeddedCss();
    svgClone.prepend(style);

    // Serialize and download
    const svgXml = new XMLSerializer().serializeToString(svgClone);
    const blob = new Blob([svgXml], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    triggerDownload(url, 'flowchart.svg');
    URL.revokeObjectURL(url);
  };

  const exportPng = () => {
    if (!svgRef.current || !gRef.current) return;
    
    const bbox = gRef.current.getBBox();
    const padding = 50;

    const exportWidth = bbox.width + padding * 2;
    const exportHeight = bbox.height + padding * 2;
    
    // Create a viewBox that frames the entire content with padding
    const viewBox = `${bbox.x - padding} ${bbox.y - padding} ${exportWidth} ${exportHeight}`;

    // Clone the SVG for export
    const svgClone = svgRef.current.cloneNode(true) as SVGSVGElement;
    
    // Set attributes for proper rendering in the Image object
    svgClone.setAttribute('width', exportWidth.toString());
    svgClone.setAttribute('height', exportHeight.toString());
    svgClone.setAttribute('viewBox', viewBox);
    svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

    // Embed styles
    const style = document.createElement('style');
    style.textContent = getEmbeddedCss();
    svgClone.prepend(style);
    
    const svgXml = new XMLSerializer().serializeToString(svgClone);
    const blob = new Blob([svgXml], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    // Create a canvas to render the PNG
    const canvas = document.createElement('canvas');
    canvas.width = exportWidth;
    canvas.height = exportHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const img = new Image();
    img.onload = () => {
        // Fill background
        ctx.fillStyle = '#1f2937'; // bg-gray-800
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw the SVG content onto the canvas
        ctx.drawImage(img, 0, 0);

        // Trigger download
        const pngUrl = canvas.toDataURL('image/png');
        triggerDownload(pngUrl, 'flowchart.png');

        // Cleanup
        URL.revokeObjectURL(url);
    };

    img.onerror = (e) => {
        console.error("Failed to load SVG image for PNG conversion.", e);
        URL.revokeObjectURL(url);
    }

    img.src = url;
  };


  useEffect(() => {
    if (data) {
      const root = d3.hierarchy(data, (d: HierarchyNode) => d.children);
      root.x0 = 0;
      root.y0 = 0;
      if (root.children) {
        root.children.forEach((child: any) => {
          if (child.children) {
            child._children = child.children;
            child.children = null;
          }
        });
      }
      setD3Root(root);
    }
  }, [data]);

  useEffect(() => {
    const svgElement = svgRef.current;
    if (!svgElement) return;
    const resizeObserver = new ResizeObserver(entries => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });
    resizeObserver.observe(svgElement);
    return () => resizeObserver.unobserve(svgElement);
  }, []);

  const { links, descendants, highlightedNodes, directMatches, linkGenerator, getNodeTransform, getTextProps } = useMemo(() => {
    if (!d3Root || dimensions.width === 0 || dimensions.height === 0) {
      return { links: [], descendants: [], highlightedNodes: new Set(), directMatches: new Set(), linkGenerator: () => '', getNodeTransform: () => '', getTextProps: () => ({}) };
    }
    
    const treeLayout = d3.tree();
    
    let margin, width, layoutHeight;
    let linkGen: any;
    let nodeTransform: (node: any) => string;
    let textProps: (node: any) => object;

    if (layout === 'vertical') {
        margin = { top: 80, right: 40, bottom: 80, left: 40 };
        width = dimensions.width - margin.left - margin.right;
        const visibleNodesForHeight = d3Root.descendants().filter((d: any) => !d.parent || d.parent.children);
        layoutHeight = Math.max(dimensions.height - margin.top - margin.bottom, visibleNodesForHeight.length * 25);
        treeLayout.size([width, layoutHeight]);
        linkGen = d3.linkVertical().x((d: any) => d.x).y((d: any) => d.y);
        nodeTransform = (node: any) => `translate(${node.x},${node.y})`;
        textProps = (node: any) => ({
            dy: "0.32em",
            y: node.children || node._children ? -12 : 12,
            textAnchor: "middle",
        });
    } else if (layout === 'radial') {
        margin = { top: 40, right: 40, bottom: 40, left: 40 };
        width = dimensions.width - margin.left - margin.right;
        const height = dimensions.height - margin.top - margin.bottom;
        const radius = Math.min(width, height) / 2;
        treeLayout.size([2 * Math.PI, radius]).separation((a: any, b: any) => (a.parent === b.parent ? 1 : 2) / a.depth);
        linkGen = d3.linkRadial().angle((d: any) => d.x).radius((d: any) => d.y);
        nodeTransform = (node: any) => `rotate(${(node.x * 180 / Math.PI) - 90}) translate(${node.y},0)`;
        textProps = (node: any) => ({
            dy: "0.32em",
            x: node.x >= Math.PI ? -10 : 10,
            textAnchor: node.x >= Math.PI ? 'end' : 'start',
            transform: `rotate(${node.x >= Math.PI ? 180 : 0})`,
        });
    } else { // horizontal
        margin = { top: 40, right: 250, bottom: 40, left: 80 };
        width = dimensions.width - margin.left - margin.right;
        const visibleNodesForHeight = d3Root.descendants().filter((d: any) => !d.parent || d.parent.children);
        layoutHeight = Math.max(dimensions.height - margin.top - margin.bottom, visibleNodesForHeight.length * 25);
        treeLayout.size([layoutHeight, width]);
        linkGen = d3.linkHorizontal().x((d: any) => d.y).y((d: any) => d.x);
        nodeTransform = (node: any) => `translate(${node.y},${node.x})`;
        textProps = (node: any) => ({
            dy: "0.32em",
            x: node.children || node._children ? -12 : 12,
            textAnchor: node.children || node._children ? 'end' : 'start',
        });
    }

    const tree = treeLayout(d3Root);
    const allDescendants = tree.descendants();
    const visibleDescendants = allDescendants.filter((d: any) => !d.parent || d.parent.children);
    const visibleNodeSet = new Set(visibleDescendants);
    const visibleLinks = tree.links().filter((l: any) => visibleNodeSet.has(l.source) && visibleNodeSet.has(l.target));

    const normalizedQuery = searchQuery.trim().toLowerCase();
    const newHighlightedNodes = new Set<any>();
    const newDirectMatches = new Set<any>();

    if (normalizedQuery) {
        allDescendants.forEach(node => {
            const nodeName = String(node.data.name).toLowerCase();
            const nodeValue = node.data.value !== undefined && node.data.value !== null ? String(node.data.value).toLowerCase() : '';
            if (nodeName.includes(normalizedQuery) || nodeValue.includes(normalizedQuery)) {
                newDirectMatches.add(node);
                node.ancestors().forEach((ancestor: any) => newHighlightedNodes.add(ancestor));
            }
        });
    }

    return { 
      links: visibleLinks, 
      descendants: visibleDescendants, 
      highlightedNodes: newHighlightedNodes,
      directMatches: newDirectMatches,
      linkGenerator: linkGen,
      getNodeTransform: nodeTransform,
      getTextProps: textProps,
    };
  }, [d3Root, dimensions, searchQuery, layout]);

  const handleNodeClick = (node: any) => {
    if (node.children || node._children) {
      if (node.children) {
        node._children = node.children;
        node.children = null;
      } else {
        node.children = node._children;
        node._children = null;
      }
      setD3Root(Object.assign(Object.create(Object.getPrototypeOf(d3Root)), d3Root));
    }
  };

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    const g = d3.select(gRef.current);
    if (!svg.node() || !g.node() || dimensions.height === 0) return;
    
    const layoutChanged = prevLayoutRef.current !== layout;
    prevLayoutRef.current = layout;

    const zoom = d3.zoom().scaleExtent([0.1, 4]).on('zoom', (event: any) => {
        g.attr('transform', event.transform);
    });
    
    svg.call(zoom);
    
    const isInitialTransform = d3.zoomTransform(svg.node()).k === 1 && d3.zoomTransform(svg.node()).x === 0;

    if (isInitialTransform || layoutChanged) {
        let initialTransform;
        if (layout === 'radial') {
            initialTransform = d3.zoomIdentity.translate(dimensions.width / 2, dimensions.height / 2);
        } else if (layout === 'vertical') {
            initialTransform = d3.zoomIdentity.translate(dimensions.width / 2, 80);
        } else { // horizontal
            initialTransform = d3.zoomIdentity.translate(80, dimensions.height / 2);
        }
        svg.call(zoom.transform, initialTransform);
    }
  }, [dimensions, layout]);

  const getCircleClass = (node: any) => {
    if (node._children) return 'fill-amber-400';
    if (node.children) return 'fill-cyan-400';
    return 'fill-pink-500';
  };

  return (
    <div className="w-full h-full bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
      <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing">
        <g ref={gRef}>
          {links.map((link: any, i) => {
            const isLinkHighlighted = highlightedNodes.has(link.source) && highlightedNodes.has(link.target);
            return (
              <path
                key={`link-${i}`}
                className={`fill-none transition-all duration-300 ${isLinkHighlighted ? 'stroke-amber-500' : 'stroke-gray-600'}`}
                strokeWidth={isLinkHighlighted ? 2.5 : 1.5}
                d={linkGenerator(link)}
              />
            );
          })}
          {descendants.map((node: any, i) => {
            const isDirectMatch = directMatches.has(node);
            const isOnHighlightedPath = highlightedNodes.has(node);
            const canToggle = node.children || node._children;
            const textProps = getTextProps(node);

            return (
              <g 
                key={`node-${i}`}
                transform={getNodeTransform(node)}
                onClick={() => handleNodeClick(node)}
                style={{ cursor: canToggle ? 'pointer' : 'default' }}
                className="transition-all duration-300"
              >
                <circle
                  r={isDirectMatch ? 7 : 5}
                  className={`${getCircleClass(node)} transition-all duration-300`}
                  strokeWidth={isOnHighlightedPath ? 2.5 : 2}
                  stroke={isOnHighlightedPath ? '#f59e0b' : '#1F2937'}
                />
                <text
                  {...textProps}
                  className={`text-sm font-sans pointer-events-none transition-colors duration-300 ${isDirectMatch ? 'font-bold fill-amber-300' : 'fill-gray-300'}`}
                  paintOrder="stroke"
                  stroke="#111827"
                  strokeWidth="3px"
                  strokeLinejoin="round"
                >
                  {node.data.name}
                  {node.data.value !== undefined && (
                    <tspan className={`font-mono italic ${isDirectMatch ? 'fill-amber-400' : 'fill-gray-400'}`}>
                      : {String(node.data.value)}
                    </tspan>
                  )}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
});

export default Flowchart;
