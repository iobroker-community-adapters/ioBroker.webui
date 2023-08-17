import observer from "./customElementsObserver.js"

observer.setCurrentLib("test");
await import('./testElement.js');
observer.finishedCurrentLib();