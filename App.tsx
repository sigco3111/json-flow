import React, { useState, useMemo, useRef, useEffect } from 'react';
import Flowchart, { FlowchartRef } from './components/Flowchart';
import { HierarchyNode } from './types';
import { transformJsonToHierarchy } from './utils/jsonTransformer';

const defaultJson = `{
  "projectName": "JSON 순서도 시각화 도구",
  "version": "1.0.0",
  "description": "JSON 데이터를 대화형 순서도로 시각화합니다.",
  "dependencies": {
    "react": "^18.0.0",
    "d3": "^7.0.0",
    "tailwindcss": "^3.0.0"
  },
  "features": [
    "JSON 파싱",
    "D3 트리 레이아웃",
    "React SVG 렌더링",
    "이동 및 확대/축소"
  ],
  "isPublished": true,
  "config": {
    "theme": "dark",
    "zoom": {
      "min": 0.1,
      "max": 4
    },
    "nodes": null
  }
}`;

const Header: React.FC = () => (
    <header className="p-4 border-b border-gray-700/50 flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-tr from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
        </div>
        <div>
            <h1 className="text-xl font-bold text-gray-100">JSON 순서도 시각화 도구</h1>
            <p className="text-sm text-gray-400">JSON을 붙여넣거나 파일을 불러와 구조를 즉시 시각화하고 검색하세요.</p>
        </div>
    </header>
);

const App: React.FC = () => {
    const [jsonInput, setJsonInput] = useState<string>(defaultJson);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [layout, setLayout] = useState<'horizontal' | 'vertical' | 'radial'>('horizontal');
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const flowchartRef = useRef<FlowchartRef>(null);
    const exportMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
                setIsExportMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const data: HierarchyNode | null = useMemo(() => {
        if (!jsonInput.trim()) {
            setError(null);
            return null;
        }
        try {
            const parsed = JSON.parse(jsonInput);
            const transformed = transformJsonToHierarchy(parsed);
            setError(null);
            return transformed;
        } catch (e) {
            if (e instanceof Error) {
                setError(`잘못된 JSON: ${e.message}`);
            } else {
                setError('JSON을 파싱하는 동안 알 수 없는 오류가 발생했습니다.');
            }
            return null;
        }
    }, [jsonInput]);

    const handleLoadFileClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result;
            if (typeof content === 'string') {
                setJsonInput(content);
            } else {
                setError("파일을 텍스트로 읽을 수 없습니다.");
            }
        };
        reader.onerror = () => {
            setError("파일을 읽는 중 오류가 발생했습니다.");
        };
        reader.readAsText(file);

        if (event.target) {
          event.target.value = "";
        }
    };

    const handleExport = (type: 'svg' | 'png') => {
        if (type === 'svg') {
            flowchartRef.current?.exportSvg();
        } else {
            flowchartRef.current?.exportPng();
        }
        setIsExportMenuOpen(false);
    };

    return (
        <div className="h-screen w-screen bg-gray-900 text-white flex flex-col font-sans">
            <Header />
            <main className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 overflow-hidden">
                <div className="flex flex-col h-full overflow-hidden">
                    <div className="flex-shrink-0 mb-2 flex justify-between items-center gap-4">
                        <div className="flex items-center gap-3 flex-grow min-w-0">
                            <label htmlFor="json-input" className="font-semibold text-gray-300 flex-shrink-0">
                                JSON 입력
                            </label>
                             <div className="relative flex-grow min-w-0">
                                <input
                                    type="search"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="키 또는 값 검색..."
                                    className="w-full bg-gray-700/80 border border-gray-600 rounded-md py-1 pl-8 pr-3 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500 transition-colors"
                                    aria-label="순서도에서 키 또는 값 검색"
                                />
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>
                         <div className="flex-shrink-0 flex items-center gap-3">
                             <div className="relative">
                                <select
                                    id="layout-select"
                                    value={layout}
                                    onChange={(e) => setLayout(e.target.value as any)}
                                    className="text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 pl-3 pr-8 py-1 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500 appearance-none cursor-pointer"
                                    aria-label="레이아웃 옵션 선택"
                                >
                                    <option value="horizontal">수평</option>
                                    <option value="vertical">수직</option>
                                    <option value="radial">방사형</option>
                                </select>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                                </svg>
                            </div>
                            <div className="relative" ref={exportMenuRef}>
                                <button
                                    type="button"
                                    onClick={() => setIsExportMenuOpen(prev => !prev)}
                                    className="text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500 flex items-center gap-1.5"
                                    aria-haspopup="true"
                                    aria-expanded={isExportMenuOpen}
                                >
                                    내보내기
                                     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                {isExportMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-40 bg-gray-700 border border-gray-600 rounded-md shadow-lg z-10">
                                        <button onClick={() => handleExport('svg')} className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-600 rounded-t-md transition-colors">SVG로 저장</button>
                                        <button onClick={() => handleExport('png')} className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-600 rounded-b-md transition-colors">PNG로 저장</button>
                                    </div>
                                )}
                            </div>
                             <button
                                type="button"
                                onClick={handleLoadFileClick}
                                className="text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500"
                                aria-label="파일에서 JSON 불러오기"
                            >
                                파일 불러오기
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept=".json,application/json"
                                className="hidden"
                                aria-hidden="true"
                            />
                            {error && <div className="text-red-400 text-sm font-medium animate-pulse">{error}</div>}
                         </div>
                    </div>
                    <textarea
                        id="json-input"
                        value={jsonInput}
                        onChange={(e) => setJsonInput(e.target.value)}
                        placeholder="JSON을 여기에 붙여넣으세요..."
                        className={`w-full flex-grow bg-gray-800 border ${error ? 'border-red-500/50' : 'border-gray-700'} rounded-lg p-4 font-mono text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors duration-200 resize-none`}
                    />
                </div>
                <div className="h-full overflow-hidden">
                    {data ? (
                        <Flowchart ref={flowchartRef} data={data} searchQuery={searchQuery} layout={layout} />
                    ) : (
                        <div className="w-full h-full bg-gray-800 rounded-lg border border-gray-700 flex items-center justify-center">
                            <div className="text-center text-gray-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V7a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <p className="mt-2">
                                    {error ? '차트를 보려면 JSON을 수정해주세요' : '시각화가 여기에 표시됩니다'}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default App;