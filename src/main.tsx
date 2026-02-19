import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Monkey-patch removeChild to prevent crashes from Google Translate/Extensions
const originalRemoveChild = Node.prototype.removeChild;
Node.prototype.removeChild = function <T extends Node>(child: T): T {
    try {
        return originalRemoveChild.call(this, child);
    } catch (error) {
        if (error instanceof DOMException && error.name === 'NotFoundError') {
            console.warn('Suppressing removeChild NotFoundError (likely Google Translate conflict):', error);
            // Return the child as if it was removed, to satisfy the signature if needed
            return child;
        }
        throw error;
    }
};

createRoot(document.getElementById("root")!).render(
    <ErrorBoundary>
        <App />
    </ErrorBoundary>
);
