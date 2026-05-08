type V8CoverageSession = {
    context: any;
    trackedPages: Set<any>;
    pageListener: ((page: any) => void) | null;
};
export declare function startV8Coverage(page: any): Promise<V8CoverageSession | null>;
export declare function stopV8Coverage(session: V8CoverageSession | null, testTitle?: string): Promise<void>;
export {};
