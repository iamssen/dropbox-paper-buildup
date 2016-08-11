export function observe(next: (pathname: string) => void) {
  setInterval(() => {
    next(window.location.pathname);
  }, 5000);
}